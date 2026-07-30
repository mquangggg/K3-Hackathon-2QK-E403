import { useEffect, useRef } from 'react';

/**
 * SlideThumbnailList Component - Danh sách Thumbnail Slide đơn giản & Tự động cuộn theo Slide active
 */
export default function SlideThumbnailList({ 
  slides = [], 
  activeSlideIndex = 0, 
  onSelectSlide = () => {} 
}) {
  const thumbnailRefs = useRef([]);

  // Tự động cuộn Thumbnail active vào vùng nhìn thấy ở Sidebar
  useEffect(() => {
    const activeEl = thumbnailRefs.current[activeSlideIndex];
    if (activeEl) {
      activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [activeSlideIndex]);

  return (
    <div className="slide-thumbnail-strip">
      <div className="strip-header">
        <span>DANH SÁCH SLIDE ({slides.length})</span>
      </div>

      <div className="thumbnail-list-container">
        {slides.map((slide, index) => {
          const isActive = index === activeSlideIndex;

          return (
            <div
              key={slide.id || index}
              className={`thumbnail-card ${isActive ? 'active' : ''}`}
              onClick={() => onSelectSlide(index)}
              ref={(el) => (thumbnailRefs.current[index] = el)}
            >
              {/* Badge số thứ tự Slide */}
              <div className="slide-num-badge">{index + 1}</div>

              {/* Khung xem trước Thumbnail */}
              <div className="thumbnail-preview-box">
                {slide.thumbnailDataUrl ? (
                  <img 
                    src={slide.thumbnailDataUrl} 
                    alt={`Slide ${index + 1}`} 
                    className="thumbnail-img" 
                  />
                ) : (
                  <div className="thumbnail-text-preview">
                    <div className="preview-title">{slide.title}</div>
                    <div className="preview-category">Trang {index + 1}</div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
