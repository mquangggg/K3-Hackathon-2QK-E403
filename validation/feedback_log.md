# Feedback Log (Vòng Validation - CP5)

| Người thử (Tên/Vai trò) | Task | Quan sát | Quote nguyên văn | Mức nghiêm trọng | Thay đổi đã làm (Changelog) |
|---|---|---|---|---|---|
| Nguyễn Gia Thiều (Willing User) | Tạo Quiz 5 câu từ Slide 1 | Cố tình hỏi thông tin ngoài luồng, AI sinh ra quiz sai lệch ban đầu. | *"Câu hỏi AI sinh ra bám khá sát kiến thức, nhưng lúc đầu AI hay bịa câu trả lời nếu mình hỏi lan man."* | Cao | Siết lại Guardrail, bổ sung quy tắc ngắt `INSUFFICIENT_DATA` nếu không có dữ liệu thực tế từ Slide. |
| Nguyễn Hoàng Minh (Willing User) | Test tính năng Chatbot | Trượt tìm nguồn khá vất vả vì giao diện lag nhẹ khi tải toàn bộ pdf. | *"Mình thích việc có nút bấm trượt thẳng đến trang Slide để xem lại, nhưng tốc độ load ban đầu hơi chậm."* | Vừa | Chuyển API sang Groq (`llama-3.3-70b`) để load kết quả JSON siêu tốc, loại bỏ độ trễ. |
| Nguyễn Quốc Thịnh (Willing User) | Chọn 20 câu hỏi Quiz | Đọc kỹ từng câu hỏi, thấy có vài câu quá dễ. | *"Quiz khá hữu ích để ôn nhanh, nhưng có vẻ chưa có các câu hỏi suy luận sâu."* | Thấp | Giữ nguyên (Vì mục tiêu của Flash Quiz là chống Illusion of Competence ngay sau khi học, không phải đánh đố). Cân nhắc thêm phân loại mức độ khó trong backlog. |
| Trần Thị Bích (Học viên K3) | Đưa biểu đồ trống | AI báo lỗi `INSUFFICIENT_DATA` thành công nhưng thông báo hơi máy móc. | *"Cái thông báo lỗi nhìn hơi đáng sợ, cứ tưởng hỏng web."* | Thấp | (Sẽ sửa thông báo thân thiện hơn trong tương lai). Giữ nguyên bản hiện tại vì vẫn hoạt động đúng chức năng chặn hallucination. |
| Lê Văn Cường (Học viên K3) | Tóm tắt bài | Sinh tóm tắt rất mượt, đầy đủ nguồn. | *"Cái tính năng tóm tắt này hay phết, chỉ ra đúng chỗ mình cần đọc lại."* | Thấp | Không thay đổi. |

### Tổng hợp
- **Chủ đề lặp nhiều nhất:** Tốc độ load và rủi ro bịa câu trả lời khi thiếu ngữ cảnh.
- **Thay đổi làm trước demo:** Đổi API sang Groq để tăng tốc độ. Bổ sung chặt chẽ luồng Intent Detection & Guardrail.
- **Đưa vào backlog:** Thống kê kết quả kiểm tra định kỳ (Learning Analytics). Tối ưu câu thông báo lỗi cho mượt hơn.
