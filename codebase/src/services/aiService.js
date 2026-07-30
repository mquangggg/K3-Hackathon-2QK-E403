/**
 * Service gọi Google Gemini API chính thức cho AI Quiz Generator & AI Tutor Chatbot
 */

export const DEFAULT_GROQ_MODEL = import.meta.env.VITE_GROQ_MODEL || "llama-3.3-70b-versatile";

export const SYSTEM_PROMPT = `
Bạn là "VLearn AI Quiz Generator" - Trợ lý trí tuệ nhân tạo chuyên tạo các câu hỏi trắc nghiệm kiểm tra hiểu bài (Active Understanding Check) dựa trên tài liệu bài giảng PDF.

Nhiệm vụ của bạn:
1. Đọc toàn bộ danh sách các Slide bài giảng được cung cấp. Mỗi slide có tiêu đề, số trang (Slide N) và nội dung văn bản.
2. Phân tích các khái niệm cốt lõi trong các slide.
3. Sinh ĐÚNG số lượng câu hỏi trắc nghiệm Multiple Choice Question (MCQ) theo yêu cầu.
4. BẮT BUỘC ghi rõ thuộc tính "source_slide" (số trang slide nguyên bản chứa dữ liệu làm căn cứ câu hỏi).
5. Trả về ĐÚNG định dạng JSON nguyên bản (JSON Schema) không chứa bất kỳ mã Markdown hay văn bản bổ sung nào khác.

Cấu trúc JSON đầu ra bắt buộc:
{
  "status": "SUCCESS" | "INSUFFICIENT_DATA",
  "message": "Thông báo ngắn gọn",
  "quizzes": [
    {
      "question": "Câu hỏi trắc nghiệm ngắn gọn, kiểm tra đúng khái niệm trong tài liệu",
      "options": ["Phương án A", "Phương án B", "Phương án C", "Phương án D"],
      "correct_answer": "Phương án B",
      "correctIndex": 1,
      "source_slide": 5,
      "explanation": "Giải thích chi tiết ngắn gọn tại sao đáp án này đúng."
    }
  ]
}

Quy tắc Guardrails nghiêm ngặt:
- [Nguồn sự thật]: CHỈ tạo câu hỏi dựa trên nội dung thực tế được cấp. Tuyệt đối KHÔNG tự bịa (hallucinate) thông tin ngoài tài liệu.
- [Mỗi câu hỏi 1 nguồn]: Thuộc tính "source_slide" bắt buộc là số nguyên đại diện cho số slide chứa thông tin.
- [Không trùng lặp]: Các câu hỏi không được lặp lại cùng một nội dung.
- [Phương án sai hợp lý]: Các đáp án nhiễu phải hợp lý nhưng không gây mơ hồ. Chỉ có đúng 1 đáp án đúng.
`;

export const CHATBOT_QA_SYSTEM_PROMPT = `
You are an AI Tutor that answers questions strictly based on the provided learning materials.

RULES FOR THE AI TUTOR:
1. Use ONLY the provided context from the PDF documents.
2. Do NOT use external knowledge to answer as if it were from the document.
3. If the answer cannot be found in the provided context, clearly state: "Xin lỗi, tôi không tìm thấy thông tin liên quan đến câu hỏi này trong các tài liệu học tập hiện có."
4. Never invent facts, slide numbers, document names, or sources. The source metadata is authoritative and must be preserved.
5. If only partial information is available, answer only what can be verified from the document and state the limitations clearly.

OUTPUT FORMAT MUST BE VALID JSON ONLY:
{
  "status": "SUCCESS" | "NOT_FOUND",
  "answer": "Câu trả lời dựa hoàn toàn vào tài liệu PDF được cấp...",
  "used_sources": [
    { "dayId": "day1", "dayTitle": "Day 1", "slide": 12 }
  ]
}
`;

export const CHATBOT_SUMMARY_SYSTEM_PROMPT = `
You are an AI Tutor summarizing learning materials for a student.

SUMMARY INSTRUCTIONS:
1. You are provided with ALL slides in the requested scope (e.g. Day 1 from Slide 1 to Slide N).
2. Synthesize a structured, clear, and comprehensive summary covering all core concepts, key topics, and main takeaways from ALL the provided slides in chronological order.
3. Use Markdown formatting (headers, bullet points, bold key terms) to make the summary easy to read.
4. Do NOT invent facts or hallucinate content not present in the provided slides.
5. Include ALL slide numbers present in the provided context in the "used_sources" array.

OUTPUT FORMAT MUST BE VALID JSON ONLY:
{
  "status": "SUCCESS",
  "answer": "### 📌 Tổng Quan Bài Giảng...\n...",
  "used_sources": [
    { "dayId": "day1", "dayTitle": "Day 1", "slide": 1 },
    { "dayId": "day1", "dayTitle": "Day 1", "slide": 2 }
  ]
}
`;

/**
 * Sinh Quiz từ toàn bộ mảng Slide PDF
 */
export async function generateQuizFromFullPdf({ slides = [], numQuestions = 5, apiKey = "", model = "" }) {
  const GROQ_KEY = apiKey || import.meta.env.VITE_GROQ_API_KEY || "";
  const GROQ_MODEL = model || import.meta.env.VITE_GROQ_MODEL || DEFAULT_GROQ_MODEL;

  if (!GROQ_KEY) {
    throw new Error("Chưa cấu hình GROQ_API_KEY trong file .env!");
  }

  if (!slides || slides.length === 0) {
    throw new Error("Chưa có dữ liệu Slide PDF. Vui lòng đợi tài liệu PDF được nạp xong.");
  }

  const pdfContentMap = slides.map((slide, idx) => {
    const slideNum = slide.originalPage || (idx + 1);
    const contentText = slide.contentText || (slide.contentLines ? slide.contentLines.join(' ') : slide.title);
    return `--- SLIDE ${slideNum} ---\nTiêu đề: ${slide.title}\nNội dung: ${contentText}`;
  }).join('\n\n');

  const userPrompt = `
DƯỚI ĐÂY LÀ TOÀN BỘ NỘI DUNG TÀI LIỆU SLIDE PDF BÀI GIẢNG (GỒM ${slides.length} SLIDES):

${pdfContentMap}

---
YÊU CẦU:
Hãy phân tích tài liệu trên và sinh ĐÚNG ${numQuestions} câu hỏi trắc nghiệm MCQ.
Đảm bảo mỗi câu hỏi có thuộc tính "source_slide" trỏ chính xác về số slide tương ứng.
`;

  try {
    const url = "https://api.groq.com/openai/v1/chat/completions";

    const response = await fetch(url, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${GROQ_KEY}`
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.2
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Groq API Error (${response.status}): ${errText}`);
    }

    const data = await response.json();
    const rawText = data.choices?.[0]?.message?.content;

    if (!rawText) {
      throw new Error("Không nhận được dữ liệu từ Groq API.");
    }

    return JSON.parse(rawText);
  } catch (error) {
    console.error(`Lỗi Groq API (Model: ${GROQ_MODEL}):`, error);
    throw error;
  }
}

/**
 * Gọi AI Tutor Chatbot trả lời câu hỏi (QA) hoặc Tóm tắt bài giảng (SUMMARY)
 */
export async function askTutorChatbot({ question = "", intent = "QA", history = [], retrievedChunks = [], apiKey = "", model = "" }) {
  const GROQ_KEY = apiKey || import.meta.env.VITE_GROQ_API_KEY || "";
  const GROQ_MODEL = model || import.meta.env.VITE_GROQ_MODEL || DEFAULT_GROQ_MODEL;

  if (!GROQ_KEY) {
    throw new Error("Chưa cấu hình GROQ_API_KEY trong file .env!");
  }

  if (!retrievedChunks || retrievedChunks.length === 0) {
    return {
      status: "NOT_FOUND",
      answer: "Xin lỗi, tôi không tìm thấy thông tin liên quan đến câu hỏi này trong các tài liệu học tập hiện có.",
      used_sources: []
    };
  }

  // Định dạng RAG Context / Metadata Slide Chunks truyền cho Gemini
  const formattedContext = retrievedChunks.map((chunk, idx) => {
    return `[SLIDE CHUNK ${idx + 1}]
Tài liệu: ${chunk.dayTitle} (${chunk.fileName})
Trang: Slide ${chunk.slideNum}
Tiêu đề: ${chunk.title}
Nội dung: ${chunk.content}
Metadata: dayId="${chunk.dayId}", dayTitle="${chunk.dayTitle}", slide=${chunk.slideNum}`;
  }).join('\n\n');

  // Lấy mảng tất cả used_sources mặc định từ metadata thực tế
  const actualUsedSources = retrievedChunks.map(c => ({
    dayId: c.dayId,
    dayTitle: c.dayTitle,
    slide: c.slideNum
  }));

  const systemInstruction = intent === 'SUMMARY' ? CHATBOT_SUMMARY_SYSTEM_PROMPT : CHATBOT_QA_SYSTEM_PROMPT;
  const formattedHistory = history.slice(-4).map(h => `${h.role === 'user' ? 'Học viên' : 'AI Tutor'}: ${h.text}`).join('\n');

  const userPrompt = intent === 'SUMMARY' ? `
DƯỚI ĐÂY LÀ TOÀN BỘ CÁC SLIDE TRONG PHẠM VI CẦN TÓM TẮT (GỒM ${retrievedChunks.length} SLIDES THỰC TẾ):

${formattedContext}

---
YÊU CẦU TÓM TẮT CỦA HỌC VIÊN:
"${question}"

YÊU CẦU AI:
Hãy tổng hợp nội dung toàn bộ các slide trên thành một bản tóm tắt bài giảng chi tiết, logic, rõ ràng theo cấu trúc Markdown.
Bắt buộc liệt kê đầy đủ tất cả ${retrievedChunks.length} slide đã truyền vào thuộc tính "used_sources".
` : `
DƯỚI ĐÂY LÀ CONTEXT ĐƯỢC RETRIEVE TỪ CÁC TÀI LIỆU PDF HỌC TẬP:

${formattedContext}

---
LỊCH SỬ HỘI THOẠI TRƯỚC ĐÓ:
${formattedHistory || '(Không có)'}

---
CÂU HỎI MỚI CỦA HỌC VIÊN:
"${question}"

YÊU CẦU:
Trả lời câu hỏi TRÍCH DẪN HOÀN TOÀN TỪ CONTEXT TRÊN.
Bắt buộc liệt kê danh sách "used_sources" gồm các slide thực sự được sử dụng để trả lời.
Nếu Context trên không chứa thông tin trả lời, phải trả về status = "NOT_FOUND" và answer = "Xin lỗi, tôi không tìm thấy thông tin liên quan đến câu hỏi này trong các tài liệu học tập hiện có."
`;

  try {
    const url = "https://api.groq.com/openai/v1/chat/completions";

    const response = await fetch(url, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${GROQ_KEY}`
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          { role: "system", content: systemInstruction },
          { role: "user", content: userPrompt }
        ],
        response_format: { type: "json_object" },
        temperature: intent === 'SUMMARY' ? 0.2 : 0.1
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Groq API Error (${response.status}): ${errText}`);
    }

    const data = await response.json();
    const rawText = data.choices?.[0]?.message?.content;

    if (!rawText) {
      throw new Error("Không nhận được phản hồi từ Groq API.");
    }

    const parsedJSON = JSON.parse(rawText);

    // Nếu AI từ chối trả lời do không tìm thấy trong tài liệu -> Set sources = []
    if (parsedJSON.status === "NOT_FOUND" || (parsedJSON.answer && parsedJSON.answer.toLowerCase().includes("xin lỗi"))) {
      parsedJSON.used_sources = [];
    } else if (!parsedJSON.used_sources || parsedJSON.used_sources.length === 0) {
      parsedJSON.used_sources = actualUsedSources;
    }

    return parsedJSON;

  } catch (error) {
    console.error(`Lỗi AI Tutor Chatbot (${intent}) (Model: ${GROQ_MODEL}):`, error);
    throw error;
  }
}
