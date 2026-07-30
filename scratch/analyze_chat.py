import csv
import os
import sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

csv_path = os.path.join('data', 'vlearn-pack', 'chatlog', 'chat_history_anonymized_for_hackathon.csv')

student_questions = []
validate_understanding_count = 0
asked_check_count = 0

with open(csv_path, 'r', encoding='utf-8', errors='ignore') as f:
    reader = csv.DictReader(f)
    for row in reader:
        role = row.get('role', '').lower()
        content = str(row.get('content', ''))
        move_used = str(row.get('move_used', '')).lower()
        asked_check = str(row.get('asked_check_question', '')).lower()

        if 'validate_understanding' in move_used:
            validate_understanding_count += 1
        if asked_check in ['true', '1']:
            asked_check_count += 1

        if role == 'student':
            student_questions.append((row.get('turn_id', ''), content))

print(f"--- BẰNG CHỨNG ĐÀO XỚI ĐỀ TÀI FLASH QUIZ (2,522 TIN NHẮN) ---")
print(f"1. Tổng số lượt hỏi của học viên (role=student): {len(student_questions)}")
print(f"2. Nước đi kiểm tra hiểu bài ('validate_understanding'): {validate_understanding_count} / {len(student_questions)} lượt ({validate_understanding_count/len(student_questions)*100:.2f}%)")
print(f"3. Cờ 'asked_check_question' (AI tự chủ động hỏi đặt câu hỏi kiểm tra): {asked_check_count} lần")

print("\n--- SAMPLE 10 QUOTES HỌC VIÊN HOÀNG MANG / CẦN TÓM TẮT / THẮC MẮC CƠ BẢN ---")
for tid, content in student_questions[:15]:
    cleaned = content.replace('\n', ' ').strip()
    if len(cleaned) > 20:
        print(f"• [{tid}] {cleaned[:120]}")
