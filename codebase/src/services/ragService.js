import { loadPdfFromUrl } from './pdfService';

// Bộ nhớ cache lưu toàn bộ mảng trang Slide của tất cả bài giảng
const slidesCache = {};

/**
 * Tải và đánh chỉ mục (Index) toàn bộ slide của tất cả các bài giảng
 */
export async function indexAllCourseSlides(courseData = []) {
  for (const course of courseData) {
    if (!slidesCache[course.id] && course.pdfUrl) {
      try {
        const parsedSlides = await loadPdfFromUrl(course.pdfUrl, course.fileName);
        slidesCache[course.id] = parsedSlides.map((slide, idx) => ({
          dayId: course.id,
          dayNumber: course.id === 'day1' ? 1 : (course.id === 'day2' ? 2 : 1),
          dayTitle: course.title.split('—')[0].trim(),
          fileName: course.fileName,
          slideNum: slide.originalPage || (idx + 1),
          title: slide.title,
          content: slide.contentText || (slide.contentLines ? slide.contentLines.join(' ') : slide.title)
        }));
      } catch (err) {
        console.warn(`Lỗi index bài giảng ${course.id}:`, err);
      }
    }
  }
  return slidesCache;
}

/**
 * Nhận diện Ý định (Intent Detection) và Phạm vi (Scope Extraction) từ câu hỏi của người dùng
 */
export function detectUserIntent(query = '', currentContext = null) {
  const normalizedQuery = query.toLowerCase().trim();

  // 1. Intent = QUIZ
  if (normalizedQuery.includes('làm quiz') || normalizedQuery.includes('tạo quiz') || normalizedQuery.includes('sinh quiz') || normalizedQuery.includes('test kiến thức')) {
    let numQuestions = 5; // Mặc định 5 câu
    const countMatch = normalizedQuery.match(/(\d+)\s*(?:câu|question|quiz)/i) || normalizedQuery.match(/(?:tạo|sinh|làm)\s*(\d+)/i);
    if (countMatch) {
      numQuestions = Math.max(1, Math.min(30, parseInt(countMatch[1], 10)));
    }
    return { intent: 'QUIZ', numQuestions };
  }

  // 2. Intent = SUMMARY
  const summaryKeywords = ['tóm tắt', 'summary', 'tổng hợp', 'nội dung chính', 'tóm lược', 'tổng quan'];
  const isSummary = summaryKeywords.some(kw => normalizedQuery.includes(kw));

  if (isSummary) {
    // Xác định số Day (Day 1, Day 2...)
    let dayNumber = null;
    let dayId = null;
    const dayMatch = normalizedQuery.match(/day\s*(\d+)/i) || normalizedQuery.match(/bài\s*(\d+)/i) || normalizedQuery.match(/buổi\s*(\d+)/i);
    if (dayMatch) {
      dayNumber = parseInt(dayMatch[1], 10);
      dayId = `day${dayNumber}`;
    }

    // Case 0: SUMMARY CURRENT_SLIDE (VD: "tóm tắt slide này", "tóm tắt trang hiện tại")
    if (normalizedQuery.includes('này') || normalizedQuery.includes('hiện tại') || normalizedQuery.includes('đang xem')) {
      if (currentContext && currentContext.slideNum) {
        return {
          intent: 'SUMMARY',
          scope: 'SPECIFIC_SLIDE',
          dayNumber: currentContext.dayNumber || 1,
          dayId: currentContext.dayId || 'day1',
          slideNum: currentContext.slideNum
        };
      }
    }

    // Case 4: SUMMARY SLIDE_RANGE (VD: "Tóm tắt Day 1 từ Slide 5 đến Slide 10")
    const rangeMatch = normalizedQuery.match(/(?:từ|from)\s*(?:slide|trang)?\s*(\d+)\s*(?:đến|tới|to)\s*(?:slide|trang)?\s*(\d+)/i);
    if (rangeMatch) {
      const startSlide = parseInt(rangeMatch[1], 10);
      const endSlide = parseInt(rangeMatch[2], 10);
      return {
        intent: 'SUMMARY',
        scope: 'SLIDE_RANGE',
        dayNumber: dayNumber || 1,
        dayId: dayId || 'day1',
        startSlide: Math.min(startSlide, endSlide),
        endSlide: Math.max(startSlide, endSlide)
      };
    }

    // Case 3: SUMMARY SPECIFIC_SLIDE (VD: "Tóm tắt Slide 10 Day 1")
    const singleSlideMatch = normalizedQuery.match(/slide\s*(\d+)/i) || normalizedQuery.match(/trang\s*(\d+)/i);
    if (singleSlideMatch) {
      const slideNum = parseInt(singleSlideMatch[1], 10);
      return {
        intent: 'SUMMARY',
        scope: 'SPECIFIC_SLIDE',
        dayNumber: dayNumber || 1,
        dayId: dayId || 'day1',
        slideNum
      };
    }

    // Case 2: SUMMARY SPECIFIC_DAY (VD: "Tóm tắt Day 1" hoặc "Tóm tắt slide Day 1")
    if (dayNumber) {
      return {
        intent: 'SUMMARY',
        scope: 'SPECIFIC_DAY',
        dayNumber,
        dayId: dayId || 'day1'
      };
    }

    // Mặc định tóm tắt bài giảng đang xem nếu không chỉ định Day
    return {
      intent: 'SUMMARY',
      scope: 'SPECIFIC_DAY',
      dayNumber: 1,
      dayId: 'day1'
    };
  }

  // 3. Intent = QA (Default)
  return { intent: 'QA' };
}

/**
 * Xử lý RAG Retrieval thông minh dựa trên Intent & Scope (Metadata Filtering vs Semantic Top-K Search)
 */
export async function processSmartRetrieval(query = '', currentLoadedSlides = [], courseData = [], currentContext = null) {
  const intentResult = detectUserIntent(query, currentContext);

  if (intentResult.intent === 'QUIZ') {
    return {
      intent: 'QUIZ',
      numQuestions: intentResult.numQuestions || 5,
      retrievedChunks: []
    };
  }

  // Đảm bảo cache toàn bộ slide các bài giảng đã sẵn sàng
  await indexAllCourseSlides(courseData);

  // Tập hợp tất cả slide đã index
  let allSlides = [];
  Object.keys(slidesCache).forEach(dId => {
    allSlides = allSlides.concat(slidesCache[dId]);
  });

  if (allSlides.length === 0 && currentLoadedSlides.length > 0) {
    allSlides = currentLoadedSlides.map((s, idx) => ({
      dayId: 'day1',
      dayNumber: 1,
      dayTitle: 'Day 1',
      fileName: 'd1-slide-hackathon.pdf',
      slideNum: s.originalPage || (idx + 1),
      title: s.title,
      content: s.contentText || (s.contentLines ? s.contentLines.join(' ') : s.title)
    }));
  }

  // --- XỬ LÝ INTENT = SUMMARY (LỌC TRỰC TIẾP THEO METADATA, KHÔNG DÙNG TOP-K SEMANTIC SEARCH) ---
  if (intentResult.intent === 'SUMMARY') {
    const targetDayId = intentResult.dayId || 'day1';
    let targetDaySlides = allSlides.filter(s => s.dayId === targetDayId);

    // Fallback nếu không lọc được theo dayId
    if (targetDaySlides.length === 0) {
      targetDaySlides = allSlides;
    }

    // Sắp xếp các slide theo thứ tự tăng dần từ 1 đến N
    targetDaySlides.sort((a, b) => a.slideNum - b.slideNum);

    let filteredChunks = [];

    if (intentResult.scope === 'SPECIFIC_SLIDE') {
      // Case 3: Chỉ lấy đúng 1 slide
      filteredChunks = targetDaySlides.filter(s => s.slideNum === intentResult.slideNum);
      if (filteredChunks.length === 0 && targetDaySlides.length > 0) {
        filteredChunks = [targetDaySlides[0]];
      }
    } else if (intentResult.scope === 'SLIDE_RANGE') {
      // Case 4: Lấy toàn bộ các slide thuộc khoảng từ start đến end
      filteredChunks = targetDaySlides.filter(
        s => s.slideNum >= intentResult.startSlide && s.slideNum <= intentResult.endSlide
      );
    } else {
      // Case 2: SPECIFIC_DAY -> Lấy TOÀN BỘ slide thuộc Day đó (Từ Slide 1 đến Slide N)
      filteredChunks = targetDaySlides;
    }

    return {
      intent: 'SUMMARY',
      scope: intentResult.scope,
      requestedDayId: targetDayId,
      retrievedChunks: filteredChunks
    };
  }

  // --- XỬ LÝ INTENT = QA (DÙNG SEMANTIC SEARCH TOP-K RETRIEVAL) ---
  const keywords = query.toLowerCase()
    .replace(/[^\w\sàáảãạăắằẳẵặâấầẩẫậèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵđ]/g, ' ')
    .split(/\s+/)
    .filter(k => k.length > 1);

  if (keywords.length === 0) {
    return {
      intent: 'QA',
      retrievedChunks: []
    };
  }

  const scoredSlides = allSlides.map(chunk => {
    const textToSearch = `${chunk.title} ${chunk.content}`.toLowerCase();
    let score = 0;

    keywords.forEach(kw => {
      if (textToSearch.includes(kw)) {
        score += 2;
        if (chunk.title.toLowerCase().includes(kw)) score += 3;
      }
    });

    if (textToSearch.includes(query.toLowerCase())) {
      score += 10;
    }

    return { chunk, score };
  });

  const topKChunks = scoredSlides
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .map(item => item.chunk);

  return {
    intent: 'QA',
    retrievedChunks: topKChunks
  };
}
