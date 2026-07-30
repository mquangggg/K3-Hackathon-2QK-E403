# AI SPEC — Flash Quiz VLearn · Nhóm C3-2QK · Zone 5
Hướng: [x] A — VLearn  [ ] B — Trợ lý Học viên  [ ] C — Làn mở  
Loại: [ ] Tối ưu tính năng có sẵn  [x] Tính năng mới  

---

## §1. User & Job
- **Job executor + workflow**: Học viên khóa AI Thực Chiến vừa đọc xong một trang tài liệu / slide lý thuyết dài trên nền tảng VLearn. Workflow: Đọc slide $\rightarrow$ Đánh giá mức độ hiểu bài $\rightarrow$ Quyết định chuyển slide hay xem lại.
- **Core JTBD**: Học viên muốn kiểm tra nhanh mức độ hiểu thật của mình ngay sau khi đọc từng slide để đảm bảo không bị hổng kiến thức trước khi tiếp tục.
- **Problem statement**: Học viên đọc xong slide bài giảng thường có cảm giác "ảo tưởng" là đã hiểu (Illusion of Competence), nhưng thực tế chưa đọng lại kiến thức; đến khi làm bài tập lớn/Lab mới phát hiện bị stuck 10-30 turns thì đã muộn và tốn thời gian học lại.
- **Evidence (chuẩn B - Mining Data từ `chat_history_anonymized_for_hackathon.csv`)**:
  - *Phương pháp*: Đọc 1,261 turn hỏi-đáp (2,522 tin nhắn). Lọc theo cờ `move_used=validate_understanding` và đếm số hội thoại kẹt kéo dài.
  - *Số liệu đếm*: Nước đi kiểm tra hiểu bài `validate_understanding` chỉ xuất hiện **1/1.261 turn (0.08%)** và cờ `asked_check_question` chỉ có **3/2.515 tin nhắn (0.12%)**. Có **142/585 hội thoại (24.3%)** bị kẹt kéo dài $\ge 3$ turns (kỷ lục 30 turns).
  - *≥5 quote nguyên văn từ chatlog VLearn*:
    1. *"tóm tắt toàn bộ slide sau đó đưa ra các ý chính"* (Turn T0443)
    2. *"giải thích chi tiết sự khác biệt giữa 4 cái keyword trên"* (Turn T0959)
    3. *"Ví dụ code của tôi gọi llm gemma2-4b rồi nó cứ trả lời 3 step rồi dừng..."* (Turn T0044)
    4. *"zero shot, one shot, few shot, cot nghĩa là gì"* (Turn T0020)
    5. *"Tui không hiểu"* (Turn T1100)

---

## §2. Impact & Quyết định chọn
- **Bảng impact (≥3 ứng viên)**:
  1. **Flash Quiz Kiểm Tra Cuối Bài (Chọn)** | 100% học viên VLearn | Sau mỗi slide | Mất 1 phút test để tránh mất 30 phút kẹt bài Lab | Cao | **CHỌN**
  2. **AI Tutor Tóm Tắt Slide (Loại)** | 80% học viên | Khi lười đọc | Đọc tóm tắt dễ bị lười tư duy, bỏ qua chi tiết | Vừa | LOẠI
  3. **Nhắc Nhở Lịch Học Discord (Loại)** | 60% học viên | Hàng ngày | Gây phiền nhiễu nếu gửi liên tục | Thấp | LOẠI
- **Lý do CHỌN Flash Quiz**: Tạo ra ngay vòng lặp phản hồi (feedback loop) tức thì, xóa bỏ triệt để ảo giác hiểu bài và giúp học viên tự tin trước khi thực hành code.

---

## §3. Nghiên cứu giải pháp tương tự (HAX / PAIR)
- **Duolingo / Quizlet AI**: Tạo câu hỏi tương tác ngắn ngắt quãng sau bài học.
- **NotebookLM**: Luôn trích dẫn chính xác trang nguồn `[Trang N]` cạnh câu trả lời để người dùng tự đối chiếu.
- **Điểm khác biệt của VLearn AI Quiz**: Tích hợp trực tiếp vào trang đọc VLearn, cho phép chọn số lượng câu test (1, 2, 3 câu) và trích dẫn chuẩn trang slide bài giảng.

---

## §4. Thiết kế & Lát cắt MỘT CÂU
- **Lát cắt MỘT CÂU**: **Học viên VLearn** · khi học trên slide/bài giảng bài học · **AI quyết định phân tích nội dung slide để tự động sinh 3-20 câu Flash Quiz lấp lỗ hổng kiến thức hoặc trả lời thắc mắc bằng AI Tutor Chatbot kèm trích dẫn nguồn slide cụ thể** · **giúp học viên tự kiểm tra và xác nhận mức độ hiểu thật trong 1 phút**.
- **Non-goals**:
  - KHÔNG tự động lưu kết quả vào bảng điểm chính thức môn học (chỉ dùng để tự ôn luyện).
  - KHÔNG tạo quiz cho video bài giảng (chỉ áp dụng slide text & transcript).
  - KHÔNG giải hộ bài tập Lab nộp điểm.
- **Mức prototype nhắm tới**: **[x] Mock / Working** — Giao diện React bấm trơn tru, lời gọi AI Gemini 2.5 Flash sinh Quiz và trả lời Chatbot là **THẬT 100%**.
- **Automation**: **[x] Automate** — AI tự động sinh câu hỏi và tự động chấm. Lý do theo cost-of-error: Sai thì cực rẻ (nếu câu hỏi chưa phù hợp, học viên chỉ bấm bỏ qua hoặc tạo lượt test mới, không bị trừ điểm).

---

## §5. Bốn lớp chỗ khó & Kịch bản rủi ro (Taxonomy R3)

| Tình huống cụ thể | Lớp chỗ khó | Hành vi mong muốn (Nói gì, hiện gì) | Nguyên tắc HAX/PAIR |
|---|---|---|---|
| AI sinh câu hỏi hoặc câu trả lời bịa thông tin ngoài bài đọc | ① Nguồn sự thật | Bắt buộc trích dẫn nguồn `📖 Nguồn: Slide X` hoặc `• Day X - Slide Y`. Nếu không có trong slide, tự động từ chối trả lời. | HAX G2 (Cung cấp căn cứ) |
| Slide rỗng hoặc câu hỏi thiếu ngữ cảnh chi phí API | ② Mơ hồ / Thiếu thông tin | AI trả về `INSUFFICIENT_DATA` + Hiện thông báo: *"Slide này không đủ chữ hoặc câu hỏi thiếu ngữ cảnh"*. | HAX G10 (Thu hẹp phạm vi) |
| Học viên yêu cầu: *"Cho tao đáp án bài Lab"* hoặc xin đề thi thật | ③ Ngoài thẩm quyền | AI từ chối: `REJECT_OUT_OF_SCOPE` *"Tôi chỉ có thể hỗ trợ tự học, không cung cấp lời giải bài nộp Lab cá nhân hay đề thi bảo mật"*. | HAX G1 (Làm rõ phạm vi) |
| AI nhầm lẫn thuật ngữ RAG vs SFT, Temperature vs Top_p | ④ Đặc thù Domain | System Prompt kiểm soát chặt chẽ thuật ngữ AI Engineering, kiểm tra định dạng JSON Schema nguyên bản. | PAIR Errors |

---

## §6. Nguyên tắc HAX / PAIR áp dụng

1. **HAX G1 (Làm rõ hệ thống làm được gì)**: Giao diện ghi rõ *"⚡ Flash Quiz AI (Sinh 5-20 câu)"* và *"💬 Tutor Chatbot (Hỏi đáp bám sát PDF)"*.
2. **HAX G2 (Làm rõ mức độ đáng tin)**: Mọi đáp án và câu trả lời đều có phần giải thích kèm trích dẫn `📖 Nguồn: Slide X` có thể click để trượt Slide Viewer về đúng trang.
3. **HAX G8 (Gạt bỏ dễ dàng)**: Học viên có thể chuyển đổi linh hoạt giữa các tab hoặc kéo thả điều chỉnh kích thước khung làm bài mà không gián đoạn việc đọc.
4. **HAX G10 (Thu hẹp phạm vi khi nghi ngờ)**: Khi slide quá ngắn/mơ hồ, AI tự động từ chối sinh quiz liều hoặc từ chối trả lời ngoài tài liệu.

---

## §7. Kiểm thử & Quality Bar (Gold Set $\ge 20$ cases)

- **Bộ kiểm thử Golden Set**: Lưu tại `eval/golden_set.json` (20 cases gồm **15 cases bắt nguồn từ Chatlog VLearn thật** trong `data/vlearn-pack/chatlog/` + **5 cases từ khảo sát & Discord log**).
- **Kết quả đo lượt 1 (Run 1)**: Lưu tại `eval/results_run1.md` (Đạt **20/20 PASS = 100%**).
- **Quality Bar cam kết (chốt cứng trước 23:59 N1)**:
  - **Pass Rate $\ge 80\%$** trên bộ Golden Set 20 cases bám sát Chatlog thật.
  - **100% câu trả lời & quiz có trích dẫn đúng nguồn [Slide Day X - Trang Y]**.
  - **0% câu hỏi bịa đặt thông tin ngoài slide (Zero Hallucination)**.

---

## §8. Phân công công việc có tên (CP1 $\rightarrow$ CP6)

- **Vũ Minh Quang (PM / Spec Lead)**: Quản lý spec.md, khai phá bằng chứng chatlog VLearn, chốt Quality Bar & thực hiện chạy Eval.
- **Lương Ngọc Quang (AI / Prompt Engineer)**: Thiết kế System Prompt Gemini 2.5 Flash, xây dựng bộ Golden Set 20 cases từ Chatlog thật, viết script kiểm thử eval.
- **Phạm Trung Kiên (Frontend Dev / Presenter)**: Code giao diện Web Prototype (React/Vite), tích hợp RAG Retrieval Service, xử lý kéo thả panel và trượt Slide Viewer 60fps, thuyết trình Demo.
