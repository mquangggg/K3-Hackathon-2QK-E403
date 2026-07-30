/**
 * Cấu hình các bộ Slide PDF bài giảng VLearn REAL từ thư mục data/vlearn-pack/slides/
 */

export const vlearnRealCourseData = [
  {
    id: 'day1',
    title: 'Day 1 — AI & LLM Foundation',
    status: 'COMPLETED',
    pdfUrl: '/slides/d1-slide-hackathon.pdf',
    fileName: 'd1-slide-hackathon.pdf',
    documents: [
      { id: 'doc1_pdf', title: 'd1-slide-hackathon.pdf', pages: 29, type: 'pdf' }
    ]
  },
  {
    id: 'day2',
    title: 'Day 2 — Xác định bài toán AI & Problem Card',
    status: 'STUDYING',
    pdfUrl: '/slides/d2-slide-hackathon.pdf',
    fileName: 'd2-slide-hackathon.pdf',
    documents: [
      { id: 'doc2_pdf', title: 'd2-slide-hackathon.pdf', pages: 29, type: 'pdf' }
    ]
  }
];
