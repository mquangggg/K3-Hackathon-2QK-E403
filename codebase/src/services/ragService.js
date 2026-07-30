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
        slidesCache[course.id] = parsedSlides.map(slide => ({
          dayId: course.id,
          dayTitle: course.title.split('—')[0].trim(),
          fileName: course.fileName,
          slideNum: slide.originalPage || slide.pageNum,
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
 * Tìm kiếm RAG (Retrieval) các slide liên quan nhất đến câu hỏi của học viên
 * @param {string} query - Câu hỏi của học viên
 * @param {Array} currentLoadedSlides - Các slide của bài giảng đang mở
 * @param {Array} courseData - Danh mục tất cả bài giảng
 * @param {number} topK - Số lượng slide liên quan tối đa cần lấy (mặc định 4)
 */
export async function retrieveRelevantSlides(query = '', currentLoadedSlides = [], courseData = [], topK = 4) {
  if (!query.trim()) return [];

  // Đảm bảo cache bài giảng đã sẵn sàng
  await indexAllCourseSlides(courseData);

  // Tập hợp tất cả các slide từ tất cả bài giảng
  let allSlideChunks = [];
  
  Object.keys(slidesCache).forEach(dayId => {
    allSlideChunks = allSlideChunks.concat(slidesCache[dayId]);
  });

  // Nếu cache rỗng, fallback sang mảng slide đang xem
  if (allSlideChunks.length === 0 && currentLoadedSlides.length > 0) {
    allSlideChunks = currentLoadedSlides.map(s => ({
      dayId: 'day1',
      dayTitle: 'Day 1',
      fileName: 'd1-slide-hackathon.pdf',
      slideNum: s.originalPage || s.pageNum,
      title: s.title,
      content: s.contentText || (s.contentLines ? s.contentLines.join(' ') : s.title)
    }));
  }

  // Tách từ khóa trong câu hỏi
  const keywords = query.toLowerCase()
    .replace(/[^\w\sàáảãạăắằẳẵặâấầẩẫậèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵđ]/g, ' ')
    .split(/\s+/)
    .filter(k => k.length > 1);

  if (keywords.length === 0) return [];

  // Tính điểm độ liên quan (Relevance Scoring) cho từng slide
  const scoredSlides = allSlideChunks.map(chunk => {
    const textToSearch = `${chunk.title} ${chunk.content}`.toLowerCase();
    let score = 0;

    keywords.forEach(kw => {
      if (textToSearch.includes(kw)) {
        score += 2;
        // Điểm thưởng nếu xuất hiện trong tiêu đề slide
        if (chunk.title.toLowerCase().includes(kw)) score += 3;
      }
    });

    // Điểm thưởng cho khớp cả cụm từ khóa (Phrase match)
    if (textToSearch.includes(query.toLowerCase())) {
      score += 10;
    }

    return { chunk, score };
  });

  // Lọc các slide có điểm liên quan > 0 và sắp xếp giảm dần theo điểm
  const relevantResults = scoredSlides
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map(item => item.chunk);

  return relevantResults;
}
