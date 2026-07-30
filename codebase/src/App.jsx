import { useState, useEffect } from 'react';
import './App.css';
import { generateQuizFromFullPdf, askTutorChatbot } from './services/aiService';
import { loadPdfFromUrl } from './services/pdfService';
import { processSmartRetrieval } from './services/ragService';
import { vlearnRealCourseData as courseData } from './data/vlearnData';
import SlideThumbnailList from './components/SlideThumbnailList';
import MainSlideViewer from './components/MainSlideViewer';

function App() {
  const [activeCourseDay, setActiveCourseDay] = useState(courseData[0]); // Default Day 1
  const [currentDeckTitle, setCurrentDeckTitle] = useState(courseData[0].fileName);
  const [slides, setSlides] = useState([]);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);

  const [isLoadingPdf, setIsLoadingPdf] = useState(true);
  const [pdfProgress, setPdfProgress] = useState(0);

  const [activeRightTab, setActiveRightTab] = useState('chat'); // 'chat' | 'quiz'

  // Dynamic Panel Resizing State
  const [sidebarWidth, setSidebarWidth] = useState(280);
  const [rightPanelWidth, setRightPanelWidth] = useState(380);
  const [isResizingLeft, setIsResizingLeft] = useState(false);
  const [isResizingRight, setIsResizingRight] = useState(false);

  // Quiz States
  const [quizState, setQuizState] = useState('idle'); // 'idle' | 'loading' | 'quiz'
  const [numQuestions, setNumQuestions] = useState(5);
  const [activeQuizzes, setActiveQuizzes] = useState([]);
  const [answers, setAnswers] = useState({});
  const [statusMessage, setStatusMessage] = useState('');
  const [isRealAICall, setIsRealAICall] = useState(false);

  // Chatbot States
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    {
      role: 'bot',
      text: 'Chào bạn! Mình là AI Tutor trợ lý học tập theo ngữ cảnh. Bạn có thể hỏi bất kỳ kiến thức nào ("LLM là gì?") hoặc yêu cầu tóm tắt ("Tóm tắt Day 1", "Tóm tắt Slide 5 đến Slide 10"), mình sẽ tổng hợp chính xác từ PDF bài giảng!',
      sources: [
        { dayId: 'day1', dayTitle: 'Day 1', slide: 1 }
      ]
    }
  ]);

  // Load file PDF bài giảng thật từ data/vlearn-pack/slides/
  const fetchAndParsePdf = async (pdfUrl, fileName) => {
    setIsLoadingPdf(true);
    setPdfProgress(0);
    setStatusMessage(`Đang nạp dữ liệu slide PDF "${fileName}"...`);

    try {
      const parsedSlides = await loadPdfFromUrl(pdfUrl, fileName, (percent) => setPdfProgress(percent));
      setSlides(parsedSlides);
      setActiveSlideIndex(0);
      setCurrentDeckTitle(fileName);
      setIsLoadingPdf(false);
      setStatusMessage(`✨ Đã nạp ${parsedSlides.length} trang từ tệp PDF "${fileName}"`);
    } catch (err) {
      console.error(err);
      setIsLoadingPdf(false);
      setStatusMessage(`Lỗi tải PDF "${fileName}": ${err.message}`);
    }
  };

  useEffect(() => {
    fetchAndParsePdf('/slides/d1-slide-hackathon.pdf', 'day01_302.pdf');
  }, []);

  // --- KÉO THẢ THAY ĐỔI KÍCH THƯỚC PANEL ---
  const handleMouseDownLeft = (e) => {
    e.preventDefault();
    setIsResizingLeft(true);
  };

  const handleMouseDownRight = (e) => {
    e.preventDefault();
    setIsResizingRight(true);
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isResizingLeft) {
        const newWidth = Math.max(180, Math.min(480, e.clientX));
        setSidebarWidth(newWidth);
      } else if (isResizingRight) {
        const newWidth = Math.max(280, Math.min(680, window.innerWidth - e.clientX));
        setRightPanelWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      if (isResizingLeft) setIsResizingLeft(false);
      if (isResizingRight) setIsResizingRight(false);
    };

    if (isResizingLeft || isResizingRight) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizingLeft, isResizingRight]);

  // Đổi thư mục bài giảng (Day 1, Day 2...)
  const handleSelectFolder = (folderData) => {
    setActiveCourseDay(folderData);
    setQuizState('idle');
    setAnswers({});
    fetchAndParsePdf(folderData.pdfUrl, folderData.fileName);
  };

  const currentSlide = slides[activeSlideIndex] || slides[0];

  // --- XỬ LÝ GỬI TIN NHẮN CHATBOT VỚI INTENT DETECTION & METADATA RETRIEVAL ---
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || isChatLoading) return;

    const userPrompt = chatInput.trim();
    setChatInput('');
    setIsChatLoading(true);

    const newHistory = [...chatMessages, { role: 'user', text: userPrompt }];
    setChatMessages(newHistory);

    try {
      // 1. Phân loại Ý định (Intent) & Retrieval thông minh (QA vs Summary Range)
      const searchResult = await processSmartRetrieval(userPrompt, slides, courseData);

      // Nếu Intent == QUIZ -> Chuyển tự động sang tab Flash Quiz & TỰ ĐỘNG SINH QUIZ
      if (searchResult.intent === 'QUIZ') {
        const targetCount = searchResult.numQuestions || 5;
        setNumQuestions(targetCount);
        setActiveRightTab('quiz');
        setChatMessages(prev => [
          ...prev,
          {
            role: 'bot',
            text: `✨ Đã nhận yêu cầu! Đang chuyển sang tab Flash Quiz và sinh ngay ${targetCount} câu hỏi trắc nghiệm cho bạn...`,
            sources: []
          }
        ]);
        setIsChatLoading(false);
        // Tự động gọi AI sinh Quiz ngay lập tức!
        handleGenerateFullPdfQuiz(targetCount);
        return;
      }

      // 2. Gọi AI Tutor Chatbot với Intent & Retrieved Chunks phù hợp
      const result = await askTutorChatbot({
        question: userPrompt,
        intent: searchResult.intent,
        history: chatMessages,
        retrievedChunks: searchResult.retrievedChunks
      });

      if (result && result.answer) {
        setChatMessages(prev => [
          ...prev,
          {
            role: 'bot',
            text: result.answer,
            sources: result.used_sources || [],
            intent: searchResult.intent
          }
        ]);

        // Nếu tóm tắt một Day khác với Day đang mở, tự động thông báo
        if (searchResult.requestedDayId && searchResult.requestedDayId !== activeCourseDay.id) {
          setStatusMessage(`💡 AI đã tổng hợp tài liệu ${searchResult.requestedDayId === 'day1' ? 'Day 1' : 'Day 2'}. Click vào nguồn để chuyển tài liệu!`);
        }
      } else {
        setChatMessages(prev => [
          ...prev,
          {
            role: 'bot',
            text: "Xin lỗi, tôi không tìm thấy thông tin liên quan đến câu hỏi này trong các tài liệu học tập hiện có.",
            sources: []
          }
        ]);
      }
    } catch (err) {
      console.error(err);
      setChatMessages(prev => [
        ...prev,
        {
          role: 'bot',
          text: `❌ Lỗi xử lý: ${err.message}`,
          sources: []
        }
      ]);
    }

    setIsChatLoading(false);
  };

  // --- CHUYỂN BÀI GIẢNG (DAY X) VÀ JUMP ĐẾN ĐÚNG SLIDE Y KHI CLICK CỤM NGUỒN ---
  const handleJumpToDocumentAndSlide = async (dayId, slideNum) => {
    if (!slideNum) return;

    const targetCourse = courseData.find(c => c.id === dayId) || courseData[0];
    
    // Nếu nguồn thuộc bài giảng khác với bài giảng đang mở
    if (targetCourse.id !== activeCourseDay.id) {
      setActiveCourseDay(targetCourse);
      await fetchAndParsePdf(targetCourse.pdfUrl, targetCourse.fileName);
    }

    const finalIndex = Math.max(0, Math.min(slides.length - 1, Number(slideNum) - 1));
    setActiveSlideIndex(finalIndex);
    setStatusMessage(`📍 Đã chuyển đến ${targetCourse.title.split('—')[0]} - Slide ${slideNum}!`);
  };

  // --- KÍCH HOẠT AI SINH QUIZ TỪ TOÀN BỘ SLIDE PDF ---
  const handleGenerateFullPdfQuiz = async (overrideCount = null) => {
    if (!slides || slides.length === 0) {
      setStatusMessage("⚠️ Chưa có dữ liệu Slide PDF. Vui lòng đợi nạp tài liệu xong.");
      return;
    }

    const countToGenerate = (typeof overrideCount === 'number') ? overrideCount : numQuestions;
    setQuizState('loading');
    setStatusMessage(`🤖 AI đang phân tích toàn bộ ${slides.length} slide PDF để sinh ${countToGenerate} câu Quiz...`);

    try {
      const result = await generateQuizFromFullPdf({
        slides,
        numQuestions: countToGenerate
      });

      if (result && result.quizzes && result.quizzes.length > 0) {
        setActiveQuizzes(result.quizzes);
        setQuizState('quiz');
        setIsRealAICall(true);
        setStatusMessage(`✨ Gemini AI thật đã sinh thành công ${result.quizzes.length} câu Quiz từ toàn bộ tài liệu PDF!`);
      } else {
        setQuizState('idle');
        setStatusMessage(`⚠️ AI không sinh được bộ Quiz phù hợp từ tài liệu.`);
      }
    } catch (err) {
      console.error(err);
      setQuizState('idle');
      setStatusMessage(`❌ Lỗi sinh Quiz: ${err.message}`);
    }

    setAnswers({});
  };

  const handleSelectOption = (quizIndex, optIndex) => {
    if (answers[quizIndex]?.showResult) return;
    
    setAnswers(prev => ({
      ...prev,
      [quizIndex]: { selected: optIndex, showResult: false }
    }));
    
    setTimeout(() => {
      setAnswers(prev => ({
        ...prev,
        [quizIndex]: { ...prev[quizIndex], showResult: true }
      }));
    }, 250);
  };

  return (
    <div className="app-container">
      {/* 1. TOP NAVBAR */}
      <nav className="navbar">
        <div className="nav-left">
          <button className="nav-back-btn" title="Quay lại">‹</button>
          
          <div className="logo-vlearn">
            <svg className="logo-icon-svg" viewBox="0 0 40 40" fill="none">
              <path d="M5 12L20 28L35 12" stroke="#1D4ED8" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M14 6L20 13L26 6" stroke="#EF4444" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            VLearn
          </div>

          <div className="doc-info-pill">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>
            <div>
              <span className="doc-pill-title">{currentDeckTitle}</span>
              <span className="doc-pill-sub" style={{marginLeft: '0.5rem'}}>COMP2010 · Lecture_material_ms2039d0...hnxpxy</span>
            </div>
          </div>
        </div>

        <div className="nav-right">
          <button className="lang-btn">VI</button>
          <button className="icon-circle-btn" title="Chế độ tối">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
          </button>
        </div>
      </nav>

      {/* MAIN LAYOUT (3 COLUMNS WITH DRAGGABLE RESIZERS) */}
      <div className={`main-layout ${isResizingLeft || isResizingRight ? 'is-resizing' : ''}`}>
        
        {/* 2. LEFT SIDEBAR */}
        <aside className="left-sidebar" style={{ width: `${sidebarWidth}px` }}>
          <div className="sidebar-header-vlearn">
            <div className="header-icon-box">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>
            </div>
            <div className="header-titles">
              <h2>Học liệu môn học</h2>
              <p>Chương, slide và tài liệu đã upload</p>
            </div>
          </div>

          <div className="folder-list">
            {courseData.map(folder => {
              const isSelected = activeCourseDay.id === folder.id;
              return (
                <div key={folder.id} className="folder-item">
                  <div className="folder-header" onClick={() => handleSelectFolder(folder)}>
                    <div className="folder-title-group">
                      <span className="folder-name">{folder.title.split('—')[0]}</span>
                      {isSelected && <span className="studying-badge">STUDYING</span>}
                    </div>
                    <span style={{fontSize: '0.75rem', color: 'var(--text-sub)'}}>{isSelected ? '▲' : '▼'}</span>
                  </div>

                  {isSelected && (
                    <div className="doc-sublist">
                      <div className="doc-subitem active">
                        <div className="play-circle-icon">▶</div>
                        <div className="doc-subinfo">
                          <span className="doc-subname">{folder.fileName}</span>
                          <span className="doc-subpages">{slides.length || 29} trang</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {!isLoadingPdf && slides.length > 0 && (
            <SlideThumbnailList 
              slides={slides} 
              activeSlideIndex={activeSlideIndex} 
              onSelectSlide={(idx) => { setActiveSlideIndex(idx); }} 
            />
          )}
        </aside>

        {/* DRAGGABLE RESIZER BAR LEFT */}
        <div 
          className={`panel-resizer-bar ${isResizingLeft ? 'resizing' : ''}`}
          onMouseDown={handleMouseDownLeft}
          title="Kéo thả để mở rộng Sidebar trái"
        />

        {/* 3. CENTER READER STAGE */}
        <main className="reader-container">
          {isLoadingPdf ? (
            <div style={{textAlign: 'center', padding: '3rem', margin: 'auto'}}>
              <div className="spinner-small" style={{margin: '0 auto 1rem'}}></div>
              <p style={{fontSize: '0.9rem', color: 'var(--text-sub)'}}>Đang đọc & render từng trang PDF thật: <strong>{pdfProgress}%</strong></p>
            </div>
          ) : (
            <MainSlideViewer 
              slides={slides} 
              activeSlideIndex={activeSlideIndex} 
              onSelectSlide={(idx) => {
                setActiveSlideIndex(idx);
              }} 
            />
          )}
        </main>

        {/* DRAGGABLE RESIZER BAR RIGHT */}
        <div 
          className={`panel-resizer-bar ${isResizingRight ? 'resizing' : ''}`}
          onMouseDown={handleMouseDownRight}
          title="Kéo thả để mở rộng khung Chatbot & Quiz"
        />

        {/* 4. RIGHT SIDEBAR - TUTOR CHATBOT & FLASH QUIZ */}
        <aside className="right-sidebar" style={{ width: `${rightPanelWidth}px` }}>
          <div className="tutor-header">
            <div className="tutor-title-box">
              <div className="tutor-bot-icon">🤖</div>
              <div className="tutor-titles">
                <h3>VLearn Tutor</h3>
                <p>Trợ lý học theo ngữ cảnh</p>
              </div>
            </div>
            <div className="tutor-actions">
              <span className="slide-tag-pill">Trang slide: {activeSlideIndex + 1}</span>
            </div>
          </div>

          <div className="panel-tabs">
            <button 
              className={`tab-btn ${activeRightTab === 'chat' ? 'active' : ''}`}
              onClick={() => setActiveRightTab('chat')}
            >
              💬 Tutor Chatbot
            </button>
            <button 
              className={`tab-btn ${activeRightTab === 'quiz' ? 'active' : ''}`}
              onClick={() => setActiveRightTab('quiz')}
            >
              ⚡ Flash Quiz (Toàn bộ PDF)
            </button>
          </div>

          <div className="tutor-content">
            
            {/* TAB 1: TUTOR CHATBOT WITH SMART INTENT & METADATA RANGE RETRIEVAL */}
            {activeRightTab === 'chat' && (
              <>
                {chatMessages.map((msg, i) => (
                  <div key={i} style={{display: 'flex', flexDirection: 'column', gap: '0.5rem'}}>
                    {msg.role === 'user' ? (
                      <>
                        <span className="user-bubble-context">CÂU HỎI HỌC VIÊN</span>
                        <div className="user-bubble-prompt">{msg.text}</div>
                      </>
                    ) : (
                      <div className="tutor-card">
                        <div style={{display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, fontSize: '0.8rem', color: 'var(--primary)'}}>
                          <span>🤖 AI Tutor</span>
                          {msg.intent === 'SUMMARY' && (
                            <span style={{fontSize: '0.7rem', background: '#eff6ff', color: '#1d4ed8', padding: '0.1rem 0.5rem', borderRadius: '10px', fontWeight: 700}}>
                              📑 BẢN TÓM TẮT
                            </span>
                          )}
                        </div>

                        <div className="tutor-quote-text" style={{whiteSpace: 'pre-wrap'}}>
                          {msg.text}
                        </div>

                        {/* HIỂN THỊ DANH SÁCH NGUỒN CÓ THỂ CLICK ĐỂ JUMP SLIDE */}
                        {msg.sources && msg.sources.length > 0 && (
                          <div className="tutor-sources-box">
                            <div className="tutor-sources-title">
                              📚 Sources ({msg.sources.length} slide trích dẫn từ PDF)
                            </div>
                            <div className="tutor-sources-list">
                              {msg.sources.slice(0, 15).map((src, sIdx) => {
                                const dayText = src.dayTitle || (src.dayId === 'day1' ? 'Day 1' : 'Day 2');
                                return (
                                  <button
                                    key={sIdx}
                                    className="tutor-source-pill"
                                    onClick={() => handleJumpToDocumentAndSlide(src.dayId, src.slide)}
                                    title={`Click để chuyển đến ${dayText} - Slide ${src.slide}`}
                                  >
                                    📖 {dayText} - Slide {src.slide} ➔
                                  </button>
                                );
                              })}
                              {msg.sources.length > 15 && (
                                <span style={{fontSize: '0.75rem', color: 'var(--text-sub)', alignSelf: 'center'}}>
                                  ... và thêm {msg.sources.length - 15} slide khác
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        <button 
                          className="btn-quiz-shortcut"
                          onClick={() => setActiveRightTab('quiz')}
                        >
                          📝 Làm Quiz kiểm tra kiến thức ➔
                        </button>
                      </div>
                    )}
                  </div>
                ))}

                {isChatLoading && (
                  <div className="tutor-card" style={{alignItems: 'center', padding: '1.5rem'}}>
                    <div className="spinner-small"></div>
                    <span style={{fontSize: '0.8rem', color: 'var(--text-sub)', marginTop: '0.5rem'}}>
                      AI đang phân tích & tổng hợp tài liệu PDF...
                    </span>
                  </div>
                )}
              </>
            )}

            {/* TAB 2: FLASH QUIZ TỪ TOÀN BỘ PDF */}
            {activeRightTab === 'quiz' && (
              <div className="quiz-container">
                {statusMessage && (
                  <div style={{padding: '0.6rem 0.8rem', background: isRealAICall ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)', border: '1px solid var(--border)', borderRadius: '10px', fontSize: '0.8rem', color: isRealAICall ? '#10B981' : '#D97706', fontWeight: 500}}>
                    {statusMessage}
                  </div>
                )}

                {quizState === 'idle' && (
                  <div className="quiz-empty-state">
                    <div className="quiz-hero-card">
                      <div className="quiz-hero-title">
                        <span>⚡ Flash Quiz AI Generator</span>
                      </div>
                      <p className="quiz-hero-desc">
                        Tự động phân tích toàn bộ <strong>{slides.length} slide PDF ({currentDeckTitle})</strong> để sinh bộ Quiz trắc nghiệm kiểm tra mức độ hiểu bài.
                      </p>

                      <label style={{display: 'block', marginBottom: '0.5rem', fontWeight: 700, fontSize: '0.78rem', color: '#e2e8f0'}}>
                        Số lượng câu hỏi muốn tạo:
                      </label>
                      
                      <div className="preset-grid">
                        {[5, 10, 15, 20].map(count => (
                          <button 
                            key={count} 
                            className={`preset-btn ${numQuestions === count ? 'active' : ''}`}
                            onClick={() => setNumQuestions(count)}
                          >
                            {count} câu
                          </button>
                        ))}
                      </div>

                      <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.6rem'}}>
                        <span style={{fontSize: '0.75rem', color: '#94a3b8'}}>Tùy chỉnh:</span>
                        <input 
                          type="number" 
                          min={1} 
                          max={30} 
                          value={numQuestions} 
                          onChange={(e) => setNumQuestions(Math.max(1, Math.min(30, Number(e.target.value))))}
                          style={{width: '60px', padding: '0.3rem 0.5rem', borderRadius: '6px', border: '1px solid rgba(255, 255, 255, 0.2)', background: 'rgba(255, 255, 255, 0.1)', color: '#fff', fontSize: '0.8rem', outline: 'none'}}
                        />
                        <span style={{fontSize: '0.75rem', color: '#94a3b8'}}>câu</span>
                      </div>
                    </div>

                    <button 
                      className="btn-generate-quiz" 
                      onClick={() => handleGenerateFullPdfQuiz()}
                    >
                      🤖 Sinh {numQuestions} Câu Quiz Từ Toàn Bộ PDF
                    </button>
                  </div>
                )}

                {quizState === 'loading' && (
                  <div className="quiz-empty-state" style={{padding: '3rem 1rem'}}>
                    <div className="spinner-small"></div>
                    <p style={{fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-main)'}}>AI đang đọc toàn bộ {slides.length} slide PDF để tạo {numQuestions} câu Quiz...</p>
                  </div>
                )}

                {quizState === 'quiz' && activeQuizzes.length > 0 && (
                  <div style={{display: 'flex', flexDirection: 'column', gap: '1.25rem'}}>
                    {activeQuizzes.map((quizItem, qIdx) => {
                      const ansState = answers[qIdx];
                      const isResultShowing = ansState?.showResult;
                      const userSelection = ansState?.selected;
                      const sourceSlideNum = quizItem.source_slide || (qIdx + 1);
                      const isCorrect = userSelection === quizItem.correctIndex || quizItem.options[userSelection] === quizItem.correct_answer;

                      return (
                        <div key={qIdx} className="quiz-question-box">
                          <div className="q-header-row">
                            <span className="q-num-pill">Q{qIdx < 9 ? `0${qIdx + 1}` : qIdx + 1}</span>
                            <div className="q-text">{quizItem.question}</div>
                          </div>
                          
                          <div style={{display: 'flex', flexDirection: 'column', gap: '0.4rem'}}>
                            {quizItem.options.map((opt, oIdx) => {
                              let btnClass = "opt-btn-modern";
                              if (isResultShowing) {
                                if (oIdx === quizItem.correctIndex || opt === quizItem.correct_answer) btnClass += " correct";
                                else if (oIdx === userSelection) btnClass += " wrong";
                              }

                              return (
                                <button 
                                  key={oIdx} 
                                  className={btnClass}
                                  onClick={() => handleSelectOption(qIdx, oIdx)}
                                  disabled={isResultShowing}
                                >
                                  <span className="opt-badge-circle">{String.fromCharCode(65 + oIdx)}</span>
                                  <span style={{flex: 1}}>{opt}</span>
                                </button>
                              )
                            })}
                          </div>

                          {isResultShowing && (
                            <div className="quiz-feedback-box">
                              {isCorrect ? (
                                <div className="feedback-title-success">
                                  ✔ Chính xác! ({quizItem.correct_answer || quizItem.options[quizItem.correctIndex]})
                                </div>
                              ) : (
                                <div className="feedback-title-error">
                                  ✖ Chưa đúng. Đáp án chuẩn: {quizItem.correct_answer || quizItem.options[quizItem.correctIndex]}
                                </div>
                              )}
                              
                              <p style={{color: 'var(--text-sub)', margin: '0.4rem 0'}}>
                                💡 <strong>Giải thích:</strong> {quizItem.explanation}
                              </p>

                              <button 
                                className="source-slide-link" 
                                onClick={() => handleJumpToDocumentAndSlide(activeCourseDay.id, sourceSlideNum)}
                                title="Click để tự động trượt Slide Viewer đến đúng trang này"
                              >
                                📖 Nguồn: Slide {sourceSlideNum} ➔
                              </button>
                            </div>
                          )}
                        </div>
                      )
                    })}
                    {(() => {
                      const answeredCount = Object.keys(answers).length;
                      const isFinished = answeredCount === activeQuizzes.length && Object.values(answers).every(a => a.showResult);
                      if (!isFinished) return null;
                      
                      const correctCount = activeQuizzes.filter((q, i) => {
                        const ans = answers[i];
                        return ans && (ans.selected === q.correctIndex || q.options[ans.selected] === q.correct_answer);
                      }).length;
                      const scorePercentage = Math.round((correctCount / activeQuizzes.length) * 100);
                      
                      return (
                        <div className="quiz-result-summary" style={{
                          display: 'flex', flexDirection: 'column', alignItems: 'center', 
                          padding: '1.5rem', background: 'var(--surface-sunken)', 
                          borderRadius: '12px', border: '1px solid var(--border)',
                          boxShadow: 'var(--shadow-sm)'
                        }}>
                          <h3 style={{margin: '0 0 1rem 0', color: 'var(--text-main)', fontSize: '1.1rem'}}>Hoàn thành bộ Quiz!</h3>
                          <div style={{
                            width: '100px', height: '100px', borderRadius: '50%',
                            background: `conic-gradient(var(--primary) ${scorePercentage}%, var(--border) 0)`,
                            display: 'flex', justifyContent: 'center', alignItems: 'center',
                            marginBottom: '1rem'
                          }}>
                            <div style={{
                              width: '82px', height: '82px', borderRadius: '50%', 
                              background: 'var(--surface)', display: 'flex', 
                              justifyContent: 'center', alignItems: 'center',
                              fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-main)'
                            }}>
                              {scorePercentage}%
                            </div>
                          </div>
                          <div style={{fontSize: '0.95rem', color: 'var(--text-sub)', fontWeight: 500}}>
                            Bạn trả lời đúng {correctCount} / {activeQuizzes.length} câu.
                          </div>
                        </div>
                      );
                    })()}
                    
                    <button 
                      style={{padding: '0.75rem', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--surface)', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-main)', boxShadow: 'var(--shadow-sm)'}}
                      onClick={() => setQuizState('idle')}
                    >
                      🔄 Sinh bộ Quiz mới từ PDF
                    </button>
                  </div>
                )}
              </div>
            )}

          </div>

          {/* INPUT GỬI CÂU HỎI TUTOR CHATBOT */}
          <form className="tutor-input-container" onSubmit={handleSendMessage}>
            <div className="tutor-input-wrapper">
              <input 
                type="text" 
                placeholder="Nhập câu hỏi ('LLM là gì?') hoặc yêu cầu tóm tắt ('Tóm tắt Day 1')..." 
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                disabled={isChatLoading}
              />
              <button type="submit" className="send-circle-btn" disabled={isChatLoading}>
                ➤
              </button>
            </div>
          </form>
        </aside>
      </div>
    </div>
  );
}

export default App;
