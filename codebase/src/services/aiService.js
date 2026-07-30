/**
 * Service gọi LLM thật (Google Gemini API / Groq API) để sinh Quiz từ slide bài học
 */

// Cấu trúc System Prompt chuẩn hóa cho Quiz Generator Agent
export const SYSTEM_PROMPT = `
Bạn là "VLearn AI Quiz Generator" - Trợ lý trí tuệ nhân tạo chuyên tạo các câu hỏi trắc nghiệm kiểm tra mức độ hiểu bài (Active Understanding Check) cho học viên khóa học AI Thực Chiến.

Nhiệm vụ của bạn:
1. Đọc kỹ nội dung Slide bài giảng và tiêu đề được cung cấp.
2. Phân tích 1-3 khái niệm cốt lõi hoặc hiểu lầm (misconceptions) dễ gặp trong Slide đó.
3. Tạo đúng số lượng câu hỏi trắc nghiệm theo yêu cầu.
4. Trả về ĐÚNG định dạng JSON nguyên bản (JSON Schema) không chứa thêm bất kỳ lời dẫn hay mã markdown nào khác ngoài JSON.

Cấu trúc JSON bắt buộc:
{
  "status": "SUCCESS" | "INSUFFICIENT_DATA" | "REJECTED",
  "message": "Thông báo ngắn gọn",
  "quizzes": [
    {
      "question": "Câu hỏi trắc nghiệm ngắn gọn, đi thẳng vào bản chất khái niệm",
      "options": ["Phương án A", "Phương án B", "Phương án C", "Phương án D"],
      "correctIndex": 0, // Chỉ số 0, 1, 2, hoặc 3 của đáp án đúng
      "explanation": "Giải thích chi tiết tại sao đúng/sai và ghi rõ [Trang N] trích dẫn từ slide"
    }
  ]
}

Quy tắc Guardrails & 4 lớp chỗ khó:
- [Lớp 1 - Nguồn sự thật]: Giải thích BẮT BUỘC trỏ đúng [Trang N] được cấp. Không tự bịa thông tin ngoài slide.
- [Lớp 2 - Mơ hồ/Thiếu dữ liệu]: Nếu Slide quá ngắn (< 5 từ), chỉ chứa hình ảnh hoặc rác, hãy trả về status = "INSUFFICIENT_DATA" và message hướng dẫn học viên chọn slide khác.
- [Lớp 3 - Ngoài thẩm quyền]: Nếu slide là bài tập nộp điểm, KHÔNG tự giải bài hộ, chỉ đặt câu hỏi kiểm tra khái niệm liên quan.
- [Lớp 4 - Thuật ngữ Domain]: Đảm bảo chính xác 100% thuật ngữ AI (RAG, ReAct, Context Rot, Function Calling, Temperature, Token Economics...).
`;

/**
 * Gọi API Gemini để sinh Quiz thật
 */
export async function generateQuizFromAI({ slideTitle, slideContent, pageNumber, numQuestions = 1, apiKey = "" }) {
  // Lấy API key từ env hoặc từ biến truyền vào
  const GEMINI_KEY = apiKey || import.meta.env.VITE_GEMINI_API_KEY || "";

  if (!GEMINI_KEY) {
    // Nếu chưa cấu hình API Key, sử dụng hàm sinh fallback linh hoạt kèm cảnh báo
    console.warn("Chưa tìm thấy VITE_GEMINI_API_KEY. Vui lòng cung cấp API Key để gọi Gemini AI thật.");
  }

  const userPrompt = `
Nội dung bài giảng được cung cấp:
- Tiêu đề: ${slideTitle}
- Số trang: Trang ${pageNumber}
- Nội dung Slide: "${slideContent}"

Yêu cầu: Hãy sinh đúng ${numQuestions} câu hỏi trắc nghiệm kiểm tra mức độ hiểu bài.
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
      throw new Error("Không nhận được phản hồi text từ Gemini API.");
    }

    // Parse JSON từ kết quả AI
    const parsedJSON = JSON.parse(rawText);
    return parsedJSON;

  } catch (error) {
    console.error("Lỗi khi gọi AI thật:", error);
    // Trả về kết quả error cấu trúc để UI xử lý êm đẹp
    return {
      status: "ERROR",
      message: `Lỗi kết nối AI: ${error.message}`,
      quizzes: null
    };
  }
}
