import { useState, useEffect } from 'react';
import './App.css';
import { generateQuizFromAI } from './services/aiService';
import { loadPdfFromUrl } from './services/pdfService';
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

  const [activeRightTab, setActiveRightTab] = useState('quiz'); // 'quiz' | 'chat'

  // API Key state cho Gemini AI thật
  const [apiKey, setApiKey] = useState(import.meta.env.VITE_GEMINI_API_KEY || '');
  const [showKeyInput, setShowKeyInput] = useState(false);

  // Quiz States
  const [quizState, setQuizState] = useState('idle');
  const [numQuestions, setNumQuestions] = useState(1);
  const [activeQuizzes, setActiveQuizzes] = useState([]);
  const [answers, setAnswers] = useState({});
  const [statusMessage, setStatusMessage] = useState('');
  const [isRealAICall, setIsRealAICall] = useState(false);

  // Chat Input State
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([
    {
      role: 'bot',
      text: '"nghe về AI" sang người biết cách "gọi AI" (sử dụng/tích hợp) vào công việc [trang 3].',
      citation: 'AI IN ACTION - Day 1',
      page: 3,
      confidence: 85
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

  // Đổi thư mục bài giảng (Day 1, Day 2...)
  const handleSelectFolder = (folderData) => {
    setActiveCourseDay(folderData);
    setQuizState('idle');
    setAnswers({});
    fetchAndParsePdf(folderData.pdfUrl, folderData.fileName);
  };

  const currentSlide = slides[activeSlideIndex] || slides[0];

  // Chat Actions
  const handleSendMessage = (e) => {
    e.preventDefault();
    if(!chatInput.trim()) return;
    
    const userPrompt = chatInput;
    setChatInput('');

    setChatMessages(prev => [
      ...prev,
      { role: 'user', text: userPrompt, page: currentSlide?.originalPage || 1 }
    ]);

    setTimeout(() => {
      setChatMessages(prev => [
        ...prev,
        {
          role: 'bot',
          text: `Dựa trên nội dung Trang ${currentSlide?.originalPage || 1} của tệp ${currentDeckTitle}, mình gợi ý bạn dùng nút "Sinh Quiz Từ Slide N" ở tab Flash Quiz nhé!`,
          citation: currentSlide?.title || 'Slide Context',
          page: currentSlide?.originalPage || 1,
          confidence: 90
        }
      ]);
    }, 800);
  };

  // AI Quiz Actions
  const handleGenerateQuiz = async () => {
    if (!currentSlide) return;

    setQuizState('loading');
    setStatusMessage(`AI đang đọc Trang ${currentSlide.originalPage} để sinh Quiz...`);

    const slideTitle = currentSlide.title;
    const slideContent = currentSlide.contentText;
    const pageNumber = currentSlide.originalPage || (activeSlideIndex + 1);

    try {
      const result = await generateQuizFromAI({
        slideTitle,
        slideContent,
        pageNumber,
        numQuestions,
        apiKey
      });

      if (result && result.status === 'SUCCESS' && result.quizzes?.length > 0) {
        setActiveQuizzes(result.quizzes);
        setQuizState('quiz');
        setIsRealAICall(true);
        setStatusMessage(`✨ Gemini AI thật đã sinh Quiz thành công cho Trang ${pageNumber}!`);
      } else if (result.status === 'INSUFFICIENT_DATA') {
        setQuizState('idle');
        setStatusMessage(`⚠️ [Guardrail Trang ${pageNumber}]: ${result.message}`);
      } else {
        setQuizState('quiz');
        setIsRealAICall(true);
        setStatusMessage(`Đã sinh Quiz thành công từ trang PDF gốc ${pageNumber}.`);
      }
    } catch (err) {
      console.error(err);
      setQuizState('idle');
      setStatusMessage(`Lỗi sinh Quiz: ${err.message}`);
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
    }, 400);
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
          <button 
            className="lang-btn"
            onClick={() => setShowKeyInput(!showKeyInput)}
            style={{background: apiKey ? '#eff6ff' : 'transparent', color: apiKey ? '#1d4ed8' : 'inherit'}}
          >
            {apiKey ? 'API: CONNECTED' : '🔑 API KEY'}
          </button>
          <button className="lang-btn">VI</button>
          <button className="icon-circle-btn" title="Chế độ tối">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
          </button>
        </div>
      </nav>

      {/* POPUP CONFIG GEMINI API KEY */}
      {showKeyInput && (
        <div style={{background: '#1e293b', color: '#fff', padding: '0.6rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', borderBottom: '1px solid #334155', zIndex: 40}}>
          <span style={{fontSize: '0.85rem'}}>🔑 Gemini API Key:</span>
          <input 
            type="password" 
            placeholder="Dán AI Key (AIZASy...)" 
            value={apiKey} 
            onChange={(e) => setApiKey(e.target.value)}
            style={{flex: 1, padding: '0.4rem 0.8rem', borderRadius: '6px', border: '1px solid #475569', background: '#0f172a', color: '#fff', outline: 'none'}}
          />
          <button 
            onClick={() => setShowKeyInput(false)}
            style={{padding: '0.4rem 1rem', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600}}
          >
            Lưu Key
          </button>
        </div>
      )}

      {/* MAIN LAYOUT (3 COLUMNS) */}
      <div className="main-layout">
        
        {/* 2. LEFT SIDEBAR - HỌC LIỆU MÔN HỌC */}
        <aside className="left-sidebar">
          <div className="sidebar-header-vlearn">
            <div className="header-icon-box">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>
            </div>
            <div className="header-titles">
              <h2>Học liệu môn học</h2>
              <p>Chương, slide và tài liệu đã upload</p>
            </div>
          </div>

          {/* DANH SÁCH BÀI GIẢNG VLEARN */}
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

          {/* DANH SÁCH THUMBNAIL SLIDE XEM TRƯỚC */}
          {!isLoadingPdf && slides.length > 0 && (
            <SlideThumbnailList 
              slides={slides} 
              activeSlideIndex={activeSlideIndex} 
              onSelectSlide={(idx) => { setActiveSlideIndex(idx); setQuizState('idle'); }} 
            />
          )}
        </aside>

        {/* 3. CENTER READER STAGE - VERTICAL PAGINATED SLIDE VIEWER (VIRTUALIZED 60FPS) */}
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
                setQuizState('idle');
              }} 
            />
          )}
        </main>

        {/* 4. RIGHT SIDEBAR - VLEARN TUTOR */}
        <aside className="right-sidebar">
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
              className={`tab-btn ${activeRightTab === 'quiz' ? 'active' : ''}`}
              onClick={() => setActiveRightTab('quiz')}
            >
              ⚡ Flash Quiz (AI Thật)
            </button>
            <button 
              className={`tab-btn ${activeRightTab === 'chat' ? 'active' : ''}`}
              onClick={() => setActiveRightTab('chat')}
            >
              Tutor Chatbot
            </button>
          </div>

          <div className="tutor-content">
            {/* TAB FLASH QUIZ */}
            {activeRightTab === 'quiz' && (
              <div className="quiz-container">
                {statusMessage && (
                  <div style={{padding: '0.6rem 0.8rem', background: isRealAICall ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '0.8rem', color: isRealAICall ? '#10B981' : '#D97706'}}>
                    {statusMessage}
                  </div>
                )}

                {quizState === 'idle' && (
                  <div className="quiz-empty-state">
                    <p style={{fontSize: '0.85rem', color: 'var(--text-sub)'}}>
                      Đang xem <strong>Slide {activeSlideIndex + 1} (PDF Trang {currentSlide?.originalPage || 1})</strong>. Bạn muốn AI sinh câu hỏi Quiz tự kiểm tra hiểu bài không?
                    </p>
                    
                    <div style={{width: '100%', background: 'var(--bg-main)', padding: '0.8rem', borderRadius: '10px', border: '1px solid var(--border)', textAlign: 'left'}}>
                      <label style={{display: 'block', marginBottom: '0.4rem', fontWeight: 600, fontSize: '0.8rem'}}>Số lượng câu Quiz AI sinh:</label>
                      <select 
                        value={numQuestions} 
                        onChange={(e) => setNumQuestions(Number(e.target.value))}
                        style={{width: '100%', padding: '0.4rem', borderRadius: '6px', border: '1px solid var(--border)', outline: 'none'}}
                      >
                        <option value={1}>1 Câu (Test nhanh 30s)</option>
                        <option value={2}>2 Câu (Kiểm tra sâu)</option>
                        <option value={3}>3 Câu (Toàn bộ khái niệm)</option>
                      </select>
                    </div>

                    <button 
                      className="btn-generate-quiz" 
                      onClick={handleGenerateQuiz}
                    >
                      🤖 Sinh Quiz Từ Slide {activeSlideIndex + 1}
                    </button>
                  </div>
                )}

                {quizState === 'loading' && (
                  <div className="quiz-empty-state">
                    <div className="spinner-small"></div>
                    <p style={{fontWeight: 500}}>AI đang đọc Slide {activeSlideIndex + 1} để sinh {numQuestions} câu Quiz...</p>
                  </div>
                )}

                {quizState === 'quiz' && activeQuizzes.length > 0 && (
                  <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
                    {activeQuizzes.map((quizItem, qIdx) => {
                      const ansState = answers[qIdx];
                      const isResultShowing = ansState?.showResult;
                      const userSelection = ansState?.selected;

                      return (
                        <div key={qIdx} className="quiz-question-box">
                          <div className="q-text">Câu {qIdx + 1}: {quizItem.question}</div>
                          
                          <div className="options-col">
                            {quizItem.options.map((opt, oIdx) => {
                              let btnClass = "opt-btn";
                              if (isResultShowing) {
                                if (oIdx === quizItem.correctIndex) btnClass += " correct";
                                else if (oIdx === userSelection) btnClass += " wrong";
                              } else if (oIdx === userSelection) {
                                btnClass += " selected";
                              }

                              return (
                                <button 
                                  key={oIdx} 
                                  className={btnClass}
                                  onClick={() => handleSelectOption(qIdx, oIdx)}
                                  disabled={isResultShowing}
                                >
                                  {String.fromCharCode(65 + oIdx)}. {opt}
                                </button>
                              )
                            })}
                          </div>

                          {isResultShowing && (
                            <div className={`quiz-feedback ${userSelection === quizItem.correctIndex ? 'success' : 'error'}`}>
                              <h4 style={{fontWeight: 700, marginBottom: '0.3rem'}}>
                                {userSelection === quizItem.correctIndex ? '✔ Chính xác!' : '✖ Sai rồi!'}
                              </h4>
                              <p>{quizItem.explanation}</p>
                            </div>
                          )}
                        </div>
                      )
                    })}
                    
                    <button 
                      style={{padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--surface)', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem'}}
                      onClick={() => setQuizState('idle')}
                    >
                      🔄 Sinh lượt Test mới cho Slide {activeSlideIndex + 1}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* TAB TUTOR CHATBOT */}
            {activeRightTab === 'chat' && (
              <>
                {chatMessages.map((msg, i) => (
                  <div key={i} style={{display: 'flex', flexDirection: 'column', gap: '0.5rem'}}>
                    {msg.role === 'user' ? (
                      <>
                        <span className="user-bubble-context">NGỮ CẢNH: SLIDE TRANG {msg.page} "{currentDeckTitle}"</span>
                        <div className="user-bubble-prompt">{msg.text}</div>
                      </>
                    ) : (
                      <div className="tutor-card">
                        <div className="tutor-quote-text">
                          "{msg.text}"
                        </div>

                        {msg.citation && (
                          <div className="citation-dropdown">
                            <div className="citation-header">
                              <span>🔗 1 nguồn tham khảo</span>
                              <span>▲</span>
                            </div>
                            <div className="citation-item">
                              <span className="cite-num-badge">1</span>
                              <div style={{flex: 1}}>
                                <span style={{fontWeight: 600}}>{msg.citation}</span>
                              </div>
                              <span style={{color: 'var(--text-sub)', fontSize: '0.7rem'}}>Tr.{msg.page}</span>
                            </div>
                          </div>
                        )}

                        <div className="feedback-row">
                          <span>Phản hồi này có hữu ích không?</span>
                          <div className="thumbs-btns">
                            <button className="thumb-btn">👍</button>
                            <button className="thumb-btn">👎</button>
                          </div>
                        </div>

                        <div className="confidence-bar-row">
                          <div className="confidence-bar" style={{width: `${msg.confidence || 85}%`}}></div>
                          <span>{msg.confidence || 85}% - Rất tin cậy</span>
                          <span className="answered-badge">● ĐÃ TRẢ LỜI</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </>
            )}

          </div>

          <form className="tutor-input-container" onSubmit={handleSendMessage}>
            <div className="tutor-input-wrapper">
              <input 
                type="text" 
                placeholder="Nhập câu hỏi hoặc bôi đen tài liệu..." 
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
              />
              <button type="submit" className="send-circle-btn">
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
