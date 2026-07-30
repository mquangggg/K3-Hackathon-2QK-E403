# AI SPEC — Flash Quiz VLearn · Nhóm [Tên Nhóm] · Zone [X]
Hướng: [x] A — VLearn  [ ] B — Trợ lý Học viên  [ ] C — Làn mở
Loại: [ ] Tối ưu tính năng có sẵn  [x] Tính năng mới

## §1. User & Job
- Job executor + workflow: Học viên vừa đọc xong một trang tài liệu lý thuyết dài trên nền tảng VLearn. Workflow: Đọc tài liệu -> Đánh giá mức độ hiểu -> Quyết định đọc tiếp hay đọc lại.
- Core JTBD: Học viên muốn đánh giá nhanh mức độ hiểu bài ngay sau khi đọc tài liệu để đảm bảo không bị hổng kiến thức trước khi đi tiếp.
- Problem statement: Học viên đọc xong tài liệu thường có cảm giác "ảo tưởng" là đã hiểu, nhưng thực tế kiến thức chưa đọng lại; khi làm bài tập lớn cuối tuần mới phát hiện sai sót cơ bản thì đã muộn và tốn thời gian học lại.
- Evidence (chuẩn B - Mining Data):
  - Phương pháp: Đọc 1261 tin nhắn học viên trong file `chat_history_anonymized_for_hackathon.csv`. Lọc các từ khóa như "tóm tắt", "nghĩa là gì", "không hiểu".
  - Số liệu mining: Phát hiện 140 lượt chat (chiếm ~11.1%) học viên đọc xong slide nhưng bị ngợp, yêu cầu AI tóm tắt hoặc giảng lại các định nghĩa cơ bản.
  - ≥5 quote/ví dụ nguyên văn + nguồn:
    1. "tóm tắt toàn bộ slide sau đó đưa ra các ý chính" (Data VLearn)
    2. "giải thích chi tiết sự khác biệt giữa 4 cái keyword trên, trả lời cho một sinh viên se chưa hiểu gì về ai" (Data VLearn)
    3. "tôi đọc hết slide rồi mà khi quay lại trang chủ nó vẫn báo là tôi chưa học, có nghĩa là sao?" (Data VLearn)
    4. "zero shot, one shot, few shot, cot nghĩa là gì" (Data VLearn)
    5. "tui không hiểu" (Data VLearn)

## §2. Impact & quyết định chọn
- Bảng impact:
  - Flash Quiz cuối bài | 100% người dùng VLearn | Cuối mỗi bài đọc | Mất 5 phút làm test để tránh mất 30 phút ôn lại | Cao | Chọn
  - AI Tutor tóm tắt bài | 80% người dùng | Khi lười đọc | Đọc tóm tắt dễ bị sót ý chính | Vừa | Loại
  - Nhắc nhở học tập | 60% người dùng | Hàng ngày | Gây phiền nhiễu | Thấp | Loại
- Ứng viên CHỌN + vì sao: Flash Quiz. Vì nó trực tiếp tạo ra vòng lặp phản hồi (feedback loop) ngay lập tức, khắc phục triệt để ảo giác hiểu bài.

## §4. Thiết kế
- Lát cắt MỘT CÂU: Một học viên đọc xong mục tài liệu · bấm "Test nhanh" · AI tự động sinh 1-2 câu trắc nghiệm tình huống dựa trên đúng nội dung mục đó · Học viên trả lời và nhận giải thích đúng sai ngay lập tức.
- Non-goals: KHÔNG tự động lưu kết quả vào bảng điểm chính thức (chỉ dùng để tự ôn); KHÔNG tạo quiz cho video (chỉ áp dụng text).
- Mức prototype nhắm tới: [x] Mock — Giao diện bấm được, Data bài đọc là giả, nhưng lời gọi AI sinh Quiz là THẬT.
- Automation: [x] automate — AI tự động sinh câu hỏi và tự động chấm. Lý do theo cost-of-error: Sai thì cực rẻ (nếu câu hỏi hơi vô lý, học viên chỉ bấm Bỏ qua hoặc tạo câu mới, không ảnh hưởng điểm).

## §5. Kiểu lỗi — 4 lớp chỗ khó + kịch bản
| Tình huống cụ thể | Lớp | Hành vi mong muốn (nói gì, hiện gì) |
|---|---|---|
| AI sinh câu hỏi lấy kiến thức ngoài bài đọc | Nguồn sự thật | Thêm nút "Báo lỗi câu hỏi" để user report. |
| AI đưa ra 4 đáp án nhưng đều đúng / đều sai | Mơ hồ | Nút "Giải thích đáp án" ưu tiên trích dẫn từ bài đọc gốc. |
| User yêu cầu: Sinh cho tôi đề thi cuối kỳ | Ngoài thẩm quyền | "Tôi chỉ có thể tạo test nhỏ dựa trên bài này." |
| AI chấm sai đáp án của học viên | Đặc thù domain | Hiển thị trích dẫn bài học ở đáp án để học viên tự đối chiếu. |

## §7. Kiểm thử
- Chiều chất lượng:
  - Đúng nội dung: Câu hỏi phải 100% nằm trong phạm vi đoạn text input.
  - Phân loại tốt: Đáp án nhiễu (distractors) phải logic, không quá hiển nhiên.
- Quality bar: "Đạt khi ≥ 80% qua bộ, và không có câu hỏi nào trắc nghiệm kiến thức ngoài."

## §8. Phân công & kế hoạch
- Phân công có tên: 
  - [Thành viên 1]: Lập spec, Phỏng vấn khảo sát (Evidence).
  - [Thành viên 2]: Xây dựng Golden Set, Viết Prompt AI, Test API.
  - [Thành viên 3]: Code UI Prototype, Demo.
