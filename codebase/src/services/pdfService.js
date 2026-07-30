import * as pdfjsLib from 'pdfjs-dist';

// Cấu hình Worker cho PDF.js trong môi trường Vite
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs`;

/**
 * Xử lý tệp PDF: Trích xuất các trang thành Canvas Image DataURL & Text Content
 * @param {Blob|File} pdfBlob - Blob hoặc File PDF
 * @param {Function} onProgress - Callback báo tiến trình (0% -> 100%)
 * @param {string} sourceName - Tên tệp PDF
 * @returns {Promise<Array>} Danh sách slide objects
 */
export async function parsePdfToSlides(pdfBlob, onProgress = () => {}, sourceName = 'PDF Document') {
  const arrayBuffer = await pdfBlob.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdfDoc = await loadingTask.promise;
  const numPages = pdfDoc.numPages;

  const slides = [];

  for (let i = 1; i <= numPages; i++) {
    onProgress(Math.round((i / numPages) * 100));

    const page = await pdfDoc.getPage(i);

    // 1. Trích xuất Text Content từ trang PDF
    const textContent = await page.getTextContent();
    const textItems = textContent.items.map(item => item.str).filter(str => str.trim().length > 0);
    
    const slideTitle = textItems.length > 0 ? textItems.slice(0, 2).join(' ') : `Slide Trang ${i}`;
    const slideBodyText = textItems.join(' ');

    // 2. Render Canvas thu nhỏ (Thumbnail - Scale 0.4)
    const thumbScale = 0.4;
    const thumbViewport = page.getViewport({ scale: thumbScale });
    const thumbCanvas = document.createElement('canvas');
    const thumbCtx = thumbCanvas.getContext('2d');
    thumbCanvas.width = thumbViewport.width;
    thumbCanvas.height = thumbViewport.height;

    await page.render({
      canvasContext: thumbCtx,
      viewport: thumbViewport
    }).promise;

    const thumbnailDataUrl = thumbCanvas.toDataURL('image/png');

    // 3. Render Canvas kích thước lớn (Main View - Scale 1.5)
    const fullScale = 1.5;
    const fullViewport = page.getViewport({ scale: fullScale });
    const fullCanvas = document.createElement('canvas');
    const fullCtx = fullCanvas.getContext('2d');
    fullCanvas.width = fullViewport.width;
    fullCanvas.height = fullViewport.height;

    await page.render({
      canvasContext: fullCtx,
      viewport: fullViewport
    }).promise;

    const fullDataUrl = fullCanvas.toDataURL('image/png');

    slides.push({
      id: `pdf_slide_${Date.now()}_${i}`,
      pageNum: i, // Thứ tự sắp xếp hiện tại
      originalPage: i, // Trang gốc trong PDF
      title: slideTitle,
      subtitle: `Tệp: ${sourceName}`,
      category: `PDF Trang ${i}`,
      contentText: slideBodyText,
      contentLines: textItems.length > 0 ? textItems : [slideBodyText],
      thumbnailDataUrl,
      fullDataUrl
    });
  }

  return slides;
}

/**
 * Tải file PDF trực tiếp từ URL tĩnh (ví dụ: /slides/d1-slide-hackathon.pdf) và parse ra slides
 */
export async function loadPdfFromUrl(pdfUrl, fileName, onProgress = () => {}) {
  const response = await fetch(pdfUrl);
  if (!response.ok) {
    throw new Error(`Không thể tải file PDF từ ${pdfUrl}`);
  }
  const blob = await response.blob();
  return await parsePdfToSlides(blob, onProgress, fileName);
}
