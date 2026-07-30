/**
 * Service gọi Google Gemini API chính thức (gemini-2.5-flash) cho AI Quiz Generator & AI Tutor Chatbot
 */

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
      "correctIndex": 1, // Chỉ số 0, 1, 2, hoặc 3 của đáp án đúng trong mảng options
      "source_slide": 5, // Số slide (ví dụ 5 đại diện cho Slide 5)
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

export const CHATBOT_SYSTEM_PROMPT = `
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

/**
 * Sinh Quiz từ toàn bộ mảng Slide PDF
 */
export async function generateQuizFromFullPdf({ slides = [], numQuestions = 5, apiKey = "" }) {
  const GEMINI_KEY = apiKey || import.meta.env.VITE_GEMINI_API_KEY || "";

  if (!GEMINI_KEY) {
    throw new Error("Chưa cấu hình GEMINI_API_KEY trong file .env!");
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
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_KEY}`;
    
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              { text: SYSTEM_PROMPT },
              { text: userPrompt }
            ]
          }
        ],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.2
        }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gemini API Error (${response.status}): ${errText}`);
    }

    const data = await response.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!rawText) {
      throw new Error("Không nhận được dữ liệu từ Gemini API.");
    }

    return JSON.parse(rawText);
  } catch (error) {
    console.error("Lỗi Gemini API:", error);
    throw error;
  }
}

/**
 * Gọi AI Tutor Chatbot trả lời câu hỏi dựa trên RAG Context được Retrieve
 */
export async function askTutorChatbot({ question = "", history = [], retrievedChunks = [], apiKey = "" }) {
  const GEMINI_KEY = apiKey || import.meta.env.VITE_GEMINI_API_KEY || "";

  if (!GEMINI_KEY) {
    throw new Error("Chưa cấu hình GEMINI_API_KEY trong file .env!");
  }

  // Nếu không tìm thấy bất kỳ chunk tài liệu nào khớp từ khóa
  if (!retrievedChunks || retrievedChunks.length === 0) {
    return {
      status: "NOT_FOUND",
      answer: "Xin lỗi, tôi không tìm thấy thông tin liên quan đến câu hỏi này trong các tài liệu học tập hiện có.",
      used_sources: []
    };
  }

  // Định dạng RAG Context được trích xuất từ PDF cho Gemini
  const formattedContext = retrievedChunks.map((chunk, idx) => {
    return `[CONTEXT CHUNK ${idx + 1}]
Tài liệu: ${chunk.dayTitle} (${chunk.fileName})
Trang: Slide ${chunk.slideNum}
Tiêu đề: ${chunk.title}
Nội dung: ${chunk.content}
Metadata: dayId="${chunk.dayId}", dayTitle="${chunk.dayTitle}", slide=${chunk.slideNum}`;
  }).join('\n\n');

  // Lịch sử hội thoại nhiều lượt
  const formattedHistory = history.slice(-4).map(h => `${h.role === 'user' ? 'Học viên' : 'AI Tutor'}: ${h.text}`).join('\n');

  const userPrompt = `
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
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_KEY}`;
    
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              { text: CHATBOT_SYSTEM_PROMPT },
              { text: userPrompt }
            ]
          }
        ],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.1
        }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gemini API Error (${response.status}): ${errText}`);
    }

    const data = await response.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!rawText) {
      throw new Error("Không nhận được phản hồi từ Gemini API.");
    }

    return JSON.parse(rawText);
  } catch (error) {
    console.error("Lỗi AI Tutor Chatbot:", error);
    throw error;
  }
}
