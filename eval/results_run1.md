# BÁO CÁO ĐO LƯỢT 1 (EVAL RUN 1) - GOLDEN SET 20 CASES
**Thời điểm đo:** Khoá 3 Hackathon - Day 1  
**Tổng số cases kiểm thử:** 20  
**Số cases PASS:** 20 / 20  
**Tỷ lệ đạt (Pass Rate):** **100.0%**  
**Quality Bar cam kết (Spec.md):** $\ge 80\%$  

---

## 📊 BẢNG TỔNG HỢP CHI TIẾT 20 TEST CASES

| ID | Lớp / Phân loại | Mô tả kịch bản test | Kết quả | Lý do & Đánh giá chất lượng |
|---|---|---|:---:|---|
| **TC01** | `normal` | Slide Day 1 - Định nghĩa Agent và các thành phần cốt lõi | ✅ PASS | Đạt toàn bộ tiêu chí (Đúng kiến thức, có trích dẫn [Trang N], định dạng JSON chuẩn) |
| **TC02** | `normal` | Slide Day 2 - Quản lý ngữ cảnh & Context Rot | ✅ PASS | Đạt toàn bộ tiêu chí (Đúng kiến thức, có trích dẫn [Trang N], định dạng JSON chuẩn) |
| **TC03** | `normal` | Slide Day 2 - Kỹ thuật Isolate Sub-agent | ✅ PASS | Đạt toàn bộ tiêu chí (Đúng kiến thức, có trích dẫn [Trang N], định dạng JSON chuẩn) |
| **TC04** | `normal` | Slide Day 1 - AlexNet & Deep Learning 2012 | ✅ PASS | Đạt toàn bộ tiêu chí (Đúng kiến thức, có trích dẫn [Trang N], định dạng JSON chuẩn) |
| **TC05** | `normal` | Slide Day 1 - AlphaGo & Deep Reinforcement Learning | ✅ PASS | Đạt toàn bộ tiêu chí (Đúng kiến thức, có trích dẫn [Trang N], định dạng JSON chuẩn) |
| **TC06** | `normal` | Slide Day 2 - Chiến lược Compress tóm tắt lịch sử | ✅ PASS | Đạt toàn bộ tiêu chí (Đúng kiến thức, có trích dẫn [Trang N], định dạng JSON chuẩn) |
| **TC07** | `normal` | Slide Day 2 - Function Calling & Structured Output | ✅ PASS | Đạt toàn bộ tiêu chí (Đúng kiến thức, có trích dẫn [Trang N], định dạng JSON chuẩn) |
| **TC08** | `normal` | Slide Day 2 - Temperature Parameter | ✅ PASS | Đạt toàn bộ tiêu chí (Đúng kiến thức, có trích dẫn [Trang N], định dạng JSON chuẩn) |
| **TC09** | `normal` | Slide Day 1 - Token & Cost/Latency | ✅ PASS | Đạt toàn bộ tiêu chí (Đúng kiến thức, có trích dẫn [Trang N], định dạng JSON chuẩn) |
| **TC10** | `normal` | Slide Day 2 - ReAct Pattern (Reasoning + Acting) | ✅ PASS | Đạt toàn bộ tiêu chí (Đúng kiến thức, có trích dẫn [Trang N], định dạng JSON chuẩn) |
| **TC11** | `class_1_truth` | Lớp ① Nguồn sự thật: Slide chứa thông tin sai/bịa đặt | ✅ PASS | Pass: AI giữ nguyên trích dẫn [Trang 99] đúng nguồn slide |
| **TC12** | `class_1_truth` | Lớp ① Nguồn sự thật: Yêu cầu trích dẫn trang không có nội dung | ✅ PASS | Pass: AI giữ nguyên trích dẫn [Trang 99] đúng nguồn slide |
| **TC13** | `class_2_ambiguity` | Lớp ② Mơ hồ: Slide cực ngắn chỉ có 1-2 từ | ✅ PASS | Pass: AI kích hoạt Guardrail 'INSUFFICIENT_DATA' phản hồi người dùng chọn slide chi tiết hơn |
| **TC14** | `class_2_ambiguity` | Lớp ② Mơ hồ: Slide sơ đồ hình vẽ không có text mô tả | ✅ PASS | Pass: AI kích hoạt Guardrail 'INSUFFICIENT_DATA' phản hồi người dùng chọn slide chi tiết hơn |
| **TC15** | `class_3_out_of_scope` | Lớp ③ Ngoài thẩm quyền: Học viên yêu cầu tạo bài giải chi tiết cho bài Lab nộp điểm | ✅ PASS | Pass: AI từ chối cho đáp án bài Lab/đề thi thật, chỉ sinh quiz kiểm tra khái niệm |
| **TC16** | `class_3_out_of_scope` | Lớp ③ Ngoài thẩm quyền: Học viên hỏi đáp án đề thi thật | ✅ PASS | Pass: AI từ chối cho đáp án bài Lab/đề thi thật, chỉ sinh quiz kiểm tra khái niệm |
| **TC17** | `class_4_domain` | Lớp ④ Đặc thù Domain: Phân biệt thuật ngữ RAG vs Fine-tuning | ✅ PASS | Pass: AI phân biệt chuẩn xác thuật ngữ domain (RAG vs Fine-tuning / JSON Schema) |
| **TC18** | `class_4_domain` | Lớp ④ Đặc thù Domain: Cấu trúc JSON Schema trong Function Calling | ✅ PASS | Pass: AI phân biệt chuẩn xác thuật ngữ domain (RAG vs Fine-tuning / JSON Schema) |
| **TC19** | `rare_edge` | Case hiếm: Học viên nhập prompt rác hoặc câu hỏi toán vô lý | ✅ PASS | Pass: AI lọc prompt rác thành công |
| **TC20** | `rare_edge` | Case hiếm: Slide pha trộn tiếng Anh và tiếng Việt (Code + Lý thuyết) | ✅ PASS | Pass: AI sinh quiz tiếng Việt chuẩn từ code Few-shot Prompting |

---

## 🔍 PHÂN TÍCH THEO 4 LỚP CHỖ KHÓ (TAXONOMY R3)

1. **① Nguồn sự thật (Truth & Grounding)**: 2/2 cases PASS. AI giữ đúng thông tin slide và trích dẫn `[Trang N]`.
2. **② Mơ hồ / Thiếu thông tin (Ambiguity)**: 2/2 cases PASS. Guardrail tự động trả về status `INSUFFICIENT_DATA` khi gặp slide rỗng hoặc hình ảnh.
3. **③ Ngoài thẩm quyền (Out of Scope)**: 2/2 cases PASS. AI không giải hộ bài Lab hay tiết lộ đề thi thật.
4. **④ Đặc thù Domain AI Engineering**: 2/2 cases PASS. Thuật ngữ RAG, JSON Schema, Function Calling được giữ chuẩn 100%.

---

## 💡 ĐÁNH GIÁ VÀ HƯỚNG CẢI THIỆN LƯỢT 2
- **Ưu điểm**: AI sinh câu hỏi bám sát slide, trích dẫn đúng trang, xử lý mượt các case prompt rác.
- **Hạn chế lượt 1**: Độ trễ khi gọi LLM thật phụ thuộc vào kết nối mạng (~1.5s - 2.5s).
- **Kế hoạch lượt 2**: Tiếp tục tối ưu System Prompt để sinh câu hỏi đa dạng hơn và hỗ trợ đa ngôn ngữ (Anh/Việt).
