import { useState, useRef, useEffect } from 'react';

/**
 * MainSlideViewer Component - Kiến Trúc Vertical Paginated Slide Viewer
 * - Mỗi slide là một Page viewport độc lập 100% kích thước.
 * - Hỗ trợ Wheel, Trackpad, Touch Swipe với Cooldown Throttling (chuyển chính xác 1 slide/nấc vuốt).
 * - DOM Virtualization & Lazy Loading (chỉ render canvas nét cao cho cửa sổ 3 trang [active - 1, active, active + 1]).
 * - Chuyển trang 60fps mượt mà bằng CSS Transform: translateY(-index * 100%).
 */
export default function MainSlideViewer({ 
  slides = [], 
  activeSlideIndex = 0, 
  onSelectSlide = () => {} 
}) {
  const isThrottledRef = useRef(false);
  const touchStartYRef = useRef(0);

  // 1. XỬ LÝ SỰ KIỆN LĂN CON CHUỘT / TRACKPAD (WHEEL THROTTLING)
  const handleWheel = (e) => {
    // Ngăn cuộn dồn dập
    if (isThrottledRef.current) return;

    const delta = e.deltaY;
    if (Math.abs(delta) < 20) return; // Bỏ qua vi rung

    if (delta > 0 && activeSlideIndex < slides.length - 1) {
      // Cuộn xuống -> Trang tiếp theo
      isThrottledRef.current = true;
      onSelectSlide(activeSlideIndex + 1);
      resetThrottleLock();
    } else if (delta < 0 && activeSlideIndex > 0) {
      // Cuộn lên -> Trang trước đó
      isThrottledRef.current = true;
      onSelectSlide(activeSlideIndex - 1);
      resetThrottleLock();
    }
  };

  // Mở khóa cooldown sau 350ms
  const resetThrottleLock = () => {
    setTimeout(() => {
      isThrottledRef.current = false;
    }, 350);
  };

  // 2. XỬ LÝ SỰ KIỆN VUỐT CẢM ỨNG (TOUCH SWIPE ON MOBILE/TABLET)
  const handleTouchStart = (e) => {
    touchStartYRef.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e) => {
    if (isThrottledRef.current) return;
    const touchEndY = e.changedTouches[0].clientY;
    const diffY = touchStartYRef.current - touchEndY;

    if (Math.abs(diffY) > 40) {
      if (diffY > 0 && activeSlideIndex < slides.length - 1) {
        // Vuốt lên -> Sang slide tiếp theo
        isThrottledRef.current = true;
        onSelectSlide(activeSlideIndex + 1);
        resetThrottleLock();
      } else if (diffY < 0 && activeSlideIndex > 0) {
        // Vuốt xuống -> Quay lại slide trước
        isThrottledRef.current = true;
        onSelectSlide(activeSlideIndex - 1);
        resetThrottleLock();
      }
    }
  };

  // Phím tắt điều hướng bàn phím (Mũi tên lên / xuống, PageUp / PageDown)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowDown' || e.key === 'PageDown') {
        if (activeSlideIndex < slides.length - 1) onSelectSlide(activeSlideIndex + 1);
      } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        if (activeSlideIndex > 0) onSelectSlide(activeSlideIndex - 1);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeSlideIndex, slides.length, onSelectSlide]);

  if (!slides.length) {
    return (
      <div className="main-slide-empty" style={{textAlign: 'center', padding: '3rem'}}>
        <p style={{fontSize: '0.9rem', color: 'var(--text-sub)'}}>Đang nạp dữ liệu slide bài giảng...</p>
      </div>
    );
  }

  return (
    <div 
      className="paginated-viewport-container"
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* 1. TOP TOOLBAR PHONG CÁCH PAGINATION */}
      <div className="slide-viewer-toolbar">
        <div className="toolbar-left">
          <span className="slide-counter-badge">
            📄 Slide Page {activeSlideIndex + 1} / {slides.length}
            {slides[activeSlideIndex]?.originalPage && (
              <span className="orig-page"> (Gốc PDF: Trang {slides[activeSlideIndex].originalPage})</span>
            )}
          </span>
        </div>

        <div className="toolbar-right">
          <span className="slide-type-tag">
            Paginated Viewport (Virtualization Active)
          </span>
        </div>
      </div>

      {/* 2. KHUNG PHÂN TRANG CHUYỂN SLIDE 60FPS BẰNG CSS TRANSFORM */}
      <div className="paginated-stage">
        <div 
          className="paginated-feed-strip"
          style={{
            transform: `translateY(-${activeSlideIndex * 100}%)`
          }}
        >
          {slides.map((slide, index) => {
            // VIRTUALIZATION & LAZY LOADING WINDOW (Chỉ render Canvas nét cao cho cửa sổ 3 trang: [active-1, active, active+1])
            const isShouldRenderContent = Math.abs(index - activeSlideIndex) <= 1;

            return (
              <div 
                key={slide.id || index}
                className={`paginated-slide-page ${index === activeSlideIndex ? 'active-page' : ''}`}
              >
                <div className="slide-canvas-card">
                  {isShouldRenderContent ? (
                    slide.fullDataUrl ? (
                      /* HIỂN THỊ HÌNH ẢNH TRANG PDF RENDER TỪ CANVAS GỐC */
                      <div className="pdf-rendered-wrapper">
                        <img 
                          src={slide.fullDataUrl} 
                          alt={`Slide ${index + 1}`} 
                          className="pdf-full-img" 
                          loading={index === activeSlideIndex ? "eager" : "lazy"}
                        />
                      </div>
                    ) : (
                      /* THẺ PRESENTATION 16:9 CHUẨN */
                      <div className="vector-slide-content">
                        <div className="watermark-overlay">26AI.QUANGVM@VINUNI.EDU.VN</div>

                        <div className="slide-header-bar">
                          <span className="category-pill">{slide.category || 'VLearn Presentation'}</span>
                          <span className="page-idx-text">SLIDE {index + 1} / {slides.length}</span>
                        </div>

                        <div className="slide-body-content">
                          <h1 className="slide-main-title">{slide.title}</h1>
                          {slide.subtitle && <p className="slide-main-subtitle">{slide.subtitle}</p>}

                          <div className="slide-bullet-list">
                            {(slide.contentLines || (slide.content || [])).map((line, lIdx) => (
                              <div key={lIdx} className="bullet-row">
                                <span className="bullet-dot">•</span>
                                <span>{line.replace(/^•\s*/, '')}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="slide-footer-bar">
                          <span>Khóa học AI Thực Chiến · VinUni AICB</span>
                          <span>{slide.subtitle || 'PDF Slide'}</span>
                        </div>
                      </div>
                    )
                  ) : (
                    /* PLACEHOLDER ẢO GIÚP GIẢM TẢI MEMORY DOM */
                    <div className="virtual-placeholder-page">
                      <span>Đang sẵn sàng... (Slide {index + 1})</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
