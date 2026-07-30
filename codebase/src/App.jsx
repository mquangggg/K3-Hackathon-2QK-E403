import { useState } from 'react';
import './App.css';

// --- MOCK DATA ---
const courseData = [
  {
    id: 'day1',
    title: 'Day 1',
    status: 'COMPLETED',
    documents: [
      { id: 'doc1_1', title: 'day01_302.pdf', pages: 83, type: 'pdf' },
      { id: 'doc1_2', title: 'material_mrx...pdf', pages: 32, type: 'pdf' }
    ],
    content: {
      title: "Tổng quan về Machine Learning & Agent",
      body: [
        { type: 'h2', text: "Lịch sử phát triển" },
        { type: 'p', text: "Năm 2012 đánh dấu sự bùng nổ của Deep Learning với sự kiện AlexNet chiến thắng tại ImageNet Challenge. Điều này chứng minh sức mạnh của mạng nơ-ron tích chập (CNN) khi có đủ dữ liệu và sức mạnh tính toán từ GPU." },
        { type: 'p', text: "Năm 2016, AlphaGo đánh bại Lee Sedol, mở ra kỷ nguyên mới cho Reinforcement Learning kết hợp Deep Learning." },
        { type: 'h2', text: "Agent là gì?" },
        { type: 'p', text: "Agent không chỉ là một mô hình ngôn ngữ (LLM). Nó là một hệ thống có khả năng nhận thức môi trường (Perception), suy luận (Reasoning) và hành động (Action) thông qua các công cụ (Tools) được cung cấp." }
      ],
      quizzes: [
        {
          question: "Sự kiện nào năm 2012 đánh dấu sự bùng nổ của Deep Learning?",
          options: [
            "AlphaGo đánh bại Lee Sedol",
            "AlexNet chiến thắng ImageNet Challenge",
            "Sự ra đời của mô hình Transformer",
            "Việc phát minh ra mạng nơ-ron nhân tạo đầu tiên"
          ],
          correctIndex: 1,
          explanation: "Chính xác! AlexNet đã vô địch ImageNet 2012, chứng minh tính hiệu quả của CNN trên tập dữ liệu lớn khi được huấn luyện bằng GPU."
        },
        {
          question: "Agent được định nghĩa khác với một LLM thông thường ở điểm cốt lõi nào?",
          options: [
            "Agent có số lượng tham số lớn hơn rất nhiều",
            "Agent chỉ dùng để xử lý hình ảnh, không xử lý văn bản",
            "Agent có khả năng nhận thức, suy luận và gọi công cụ (Tools) để hành động",
            "Agent không cần dữ liệu để huấn luyện"
          ],
          correctIndex: 2,
          explanation: "Đúng! Agent vượt xa LLM truyền thống nhờ khả năng tự chủ: Perception -> Reasoning -> Action (thường thông qua việc gọi Tools)."
        },
        {
          question: "Sự kiện AlphaGo (2016) là minh chứng cho sự thành công của công nghệ nào?",
          options: [
            "Mạng nơ-ron tích chập (CNN)",
            "Reinforcement Learning kết hợp Deep Learning",
            "Kỹ thuật Prompt Engineering",
            "Kiến trúc Transformer"
          ],
          correctIndex: 1,
          explanation: "Chính xác! AlphaGo sử dụng Deep Reinforcement Learning để đánh bại nhà vô địch cờ vây thế giới."
        }
      ]
    }
  },
  {
    id: 'day2',
    title: 'Day 2',
    status: 'STUDYING',
    documents: [
      { id: 'doc2_1', title: 'day02_prompt_engineering.pdf', pages: 45, type: 'pdf' }
    ],
    content: {
      title: "Kỹ thuật Prompt Engineering nâng cao",
      body: [
        { type: 'h2', text: "Quản lý ngữ cảnh (Context Management)" },
        { type: 'p', text: "Trong kỹ thuật lập trình Agent, quản lý ngữ cảnh rất quan trọng để tránh 'context rot' (rác ngữ cảnh). Có 4 chiến lược cơ bản:" },
        { type: 'ul', items: [
          "Write: Chuyển state ra ngoài ngữ cảnh.",
          "Select: Chỉ nạp thông tin liên quan (RAG).",
          "Compress: Tóm tắt lịch sử chat.",
          "Isolate: Tách biệt ngữ cảnh của các sub-agent."
        ]},
        { type: 'p', text: "Đặc biệt, kỹ thuật Isolate giúp Agent chính không bị 'nhiễu' bởi những quá trình thử-sai của các Agent phụ." }
      ],
      quizzes: [
        {
          question: "Chiến lược nào giúp tách biệt ngữ cảnh của các sub-agent để tránh 'rác' tích tụ vào agent chính?",
          options: ["Write", "Select", "Compress", "Isolate"],
          correctIndex: 3,
          explanation: "Chính xác! Kỹ thuật Isolate đóng vai trò cô lập không gian làm việc của các sub-agent, giữ cho bộ nhớ của agent chính luôn sạch sẽ."
        },
        {
          question: "Hiện tượng 'Context Rot' trong lập trình Agent là gì?",
          options: [
            "Lỗi server bị sập do quá tải RAM",
            "Quá nhiều 'rác' (thử-sai, thông tin vô ích) tích tụ trong ngữ cảnh khiến LLM bị nhiễu",
            "Token bị ăn cắp bởi một Agent khác",
            "Cơ sở dữ liệu RAG bị mất kết nối"
          ],
          correctIndex: 1,
          explanation: "Đúng! Context Rot xảy ra khi lịch sử hội thoại chứa quá nhiều thông tin lan man hoặc lỗi sai, khiến khả năng suy luận của mô hình bị suy giảm."
        },
        {
          question: "Chiến lược 'Compress' xử lý ngữ cảnh bằng cách nào?",
          options: [
            "Lưu toàn bộ lịch sử chat vào ổ cứng",
            "Chỉ chọn ra 1 keyword duy nhất để đưa cho mô hình",
            "Thực hiện tóm tắt định kỳ lịch sử hội thoại và kết quả tool",
            "Chặn người dùng không được chat quá 10 câu"
          ],
          correctIndex: 2,
          explanation: "Đúng! Compress là kỹ thuật tóm tắt định kỳ các thông tin cũ để giải phóng không gian token mà không làm mất đi bối cảnh chính."
        }
      ]
    }
  },
  {
    id: 'day3',
    title: 'Day 3',
    status: 'LOCKED',
    documents: [
      { id: 'doc3_1', title: 'day03_rag_systems.pdf', pages: 50, type: 'pdf' }
    ],
    content: {
      title: "Hệ thống RAG (Retrieval-Augmented Generation)",
      body: [
        { type: 'p', text: "Bài học này hiện đang bị khóa. Hãy hoàn thành Day 2 để mở khóa." }
      ],
      quizzes: null
    }
  }
];

function App() {
  const [activeDay, setActiveDay] = useState(courseData[1]); // Default Day 2
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('quiz'); // 'chat' or 'quiz'
  
  // Quiz States: 'idle' | 'loading' | 'quiz'
  const [quizState, setQuizState] = useState('idle');
  const [numQuestions, setNumQuestions] = useState(1);
  const [activeQuizzes, setActiveQuizzes] = useState([]); // The sliced array of quizzes to show
  const [answers, setAnswers] = useState({}); // { 0: { selected: 1, showResult: true }, 1: ... }

  // Chat States
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([
    { role: 'bot', text: 'Chào bạn, mình là VLearn Tutor. Bạn có thắc mắc gì về bài giảng này không?' }
  ]);

  // Handle Chapter selection
  const handleSelectDay = (day) => {
    setActiveDay(day);
    setQuizState('idle');
    setAnswers({});
    setActiveQuizzes([]);
  };

  // Chat Actions
  const handleSendMessage = (e) => {
    e.preventDefault();
    if(!chatInput.trim()) return;
    
    setChatMessages(prev => [...prev, { role: 'user', text: chatInput }]);
    const userInput = chatInput;
    setChatInput('');

    setTimeout(() => {
      setChatMessages(prev => [...prev, { 
        role: 'bot', 
        text: `Hiện tại AI đang ở bản Mockup. Nội dung bạn hỏi "${userInput}" sẽ được xử lý bằng AI thật ở Checkpoint 3 nhé!` 
      }]);
    }, 1000);
  };

  // Quiz Actions
  const handleGenerateQuiz = () => {
    setQuizState('loading');
    setTimeout(() => {
      if (activeDay.content.quizzes) {
        // Mock generating numQuestions
        setActiveQuizzes(activeDay.content.quizzes.slice(0, numQuestions));
      }
      setQuizState('quiz');
      setAnswers({});
    }, 1500);
  };

  const handleSelectOption = (quizIndex, optIndex) => {
    // If already answered this question, don't allow changing
    if (answers[quizIndex]?.showResult) return;
    
    setAnswers(prev => ({
      ...prev,
      [quizIndex]: { selected: optIndex, showResult: false }
    }));
    
    // Auto show result after 500ms
    setTimeout(() => {
      setAnswers(prev => ({
        ...prev,
        [quizIndex]: { ...prev[quizIndex], showResult: true }
      }));
    }, 500);
  };

  return (
    <div className="app-container">
      {/* 1. TOP NAVBAR */}
      <nav className="navbar">
        <div className="nav-left">
          <div className="logo">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>
            VLearn
          </div>
          <div className="doc-title">{activeDay.documents[0]?.title || 'Tài liệu khóa học'}</div>
        </div>
        <div className="nav-right">
          <button className="icon-btn" title="Giao diện sáng/tối">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
          </button>
          <div className="user-profile">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            Sinh viên K3
          </div>
        </div>
      </nav>

      {/* MAIN LAYOUT (3 COLUMNS) */}
      <div className="main-layout">
        
        {/* 2. LEFT SIDEBAR */}
        <aside className="left-sidebar">
          <div className="sidebar-header">
            <h2>Học liệu môn học</h2>
            <p>Chương, slide và tài liệu đã upload</p>
          </div>
          <div className="chapter-list">
            {courseData.map(day => (
              <div key={day.id} className="chapter-item">
                <div className="chapter-header" onClick={() => handleSelectDay(day)}>
                  <span className="chapter-title">{day.title}</span>
                  {day.status === 'STUDYING' && <span className="chapter-status">STUDYING</span>}
                  {day.status !== 'STUDYING' && (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                  )}
                </div>
                
                {/* Show documents if selected or studying */}
                {(activeDay.id === day.id || day.status === 'STUDYING') && (
                  <div className="doc-list">
                    {day.documents.map((doc, idx) => (
                      <div 
                        key={doc.id} 
                        className={`doc-item ${activeDay.id === day.id && idx === 0 ? 'active' : ''}`}
                        onClick={() => handleSelectDay(day)}
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{color: 'var(--primary)', flexShrink: 0}}>
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                          <polyline points="14 2 14 8 20 8"></polyline>
                        </svg>
                        <div className="doc-info">
                          <span className="doc-name" title={doc.title}>{doc.title}</span>
                          <span className="doc-meta">{doc.pages} trang</span>
                        </div>
                        {activeDay.id === day.id && idx === 0 && (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{color: 'var(--primary)', flexShrink: 0}}>
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                            <polyline points="22 4 12 14.01 9 11.01"></polyline>
                          </svg>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </aside>

        {/* 3. MIDDLE READER */}
        <main className="reader-container">
          <div className="reader-toolbar">
            <div className="toolbar-group">
              <button className="toolbar-btn active"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg> Đọc</button>
              <button className="toolbar-btn"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg> Bút</button>
              <button className="toolbar-btn"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg> Highlight</button>
            </div>
            <div className="toolbar-group">
              <button className="toolbar-btn">-</button>
              <span style={{fontSize: '0.85rem', fontWeight: 500}}>100%</span>
              <button className="toolbar-btn">+</button>
            </div>
          </div>

          {!isRightPanelOpen && (
            <button className="toggle-panel-btn" onClick={() => setIsRightPanelOpen(true)}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              Mở AI Tutor
            </button>
          )}

          <div className="reader-content">
            <div className="pdf-page">
              <h1>{activeDay.content.title}</h1>
              {activeDay.content.body.map((block, idx) => {
                if (block.type === 'h2') return <h2 key={idx}>{block.text}</h2>;
                if (block.type === 'p') {
                  if (block.text.includes('Isolate:')) {
                     const parts = block.text.split('Isolate:');
                     return <p key={idx}>{parts[0]}<span className="pdf-highlight">Isolate:</span>{parts[1]}</p>;
                  }
                  return <p key={idx}>{block.text}</p>;
                }
                if (block.type === 'ul') {
                  return (
                    <ul key={idx}>
                      {block.items.map((li, i) => <li key={i}>{li}</li>)}
                    </ul>
                  )
                }
                return null;
              })}
            </div>
          </div>
        </main>

        {/* 4. RIGHT SIDEBAR (CHAT & QUIZ) */}
        <aside className={`right-sidebar ${!isRightPanelOpen ? 'closed' : ''}`}>
          
          <div className="panel-header">
            <div className="panel-title">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2"><path d="M12 2a10 10 0 1 0 10 10H12V2z"/><path d="M12 12 2.1 7.1"/><path d="M12 12l9.9 4.9"/></svg>
              AI Assistant
            </div>
            <button className="icon-btn" onClick={() => setIsRightPanelOpen(false)} title="Đóng panel">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>

          <div className="panel-tabs">
            <button 
              className={`tab-btn ${activeTab === 'chat' ? 'active' : ''}`}
              onClick={() => setActiveTab('chat')}
            >
              Tutor Chatbot
            </button>
            <button 
              className={`tab-btn ${activeTab === 'quiz' ? 'active' : ''}`}
              onClick={() => setActiveTab('quiz')}
            >
              Flash Quiz
            </button>
          </div>

          <div className="panel-content">
            
            {/* --- TAB: TUTOR CHATBOT --- */}
            {activeTab === 'chat' && (
              <>
                <div className="chat-messages">
                  {chatMessages.map((msg, i) => (
                    <div key={i} className={`chat-bubble ${msg.role}`}>
                      {msg.text}
                    </div>
                  ))}
                </div>
                <form className="chat-input-area" onSubmit={handleSendMessage}>
                  <div className="chat-input-wrapper">
                    <input 
                      type="text" 
                      placeholder="Hỏi AI nội dung bài giảng..." 
                      value={chatInput}
                      onChange={e => setChatInput(e.target.value)}
                    />
                    <button type="submit" className="chat-send-btn">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                    </button>
                  </div>
                </form>
              </>
            )}

            {/* --- TAB: FLASH QUIZ --- */}
            {activeTab === 'quiz' && (
              <div className="quiz-container">
                {quizState === 'idle' && (
                  <div className="quiz-empty-state">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--border-dark)" strokeWidth="1"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                    <p>Đọc xong chương <strong>{activeDay.title}</strong> rồi? Hãy làm test nhanh để kiểm tra xem bạn đã thực sự hiểu bài chưa nhé.</p>
                    
                    {activeDay.content.quizzes && (
                      <div style={{width: '100%', maxWidth: '250px', background: 'var(--surface)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border)', textAlign: 'left', marginBottom: '0.5rem'}}>
                        <label style={{display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem'}}>Số câu hỏi trắc nghiệm:</label>
                        <select 
                          value={numQuestions} 
                          onChange={(e) => setNumQuestions(Number(e.target.value))}
                          style={{width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border)', outline: 'none'}}
                        >
                          <option value={1}>1 Câu (Nhanh)</option>
                          <option value={2}>2 Câu (Trung bình)</option>
                          <option value={3}>3 Câu (Kiểm tra sâu)</option>
                        </select>
                      </div>
                    )}

                    <button 
                      className="btn-generate-quiz" 
                      onClick={handleGenerateQuiz}
                      disabled={!activeDay.content.quizzes}
                    >
                      Tạo Quiz Từ Trang Này
                    </button>
                    {!activeDay.content.quizzes && <p style={{color:'red', fontSize:'0.8rem'}}>Bài giảng này chưa có data quiz mock.</p>}
                  </div>
                )}

                {quizState === 'loading' && (
                  <div className="quiz-empty-state">
                    <div className="spinner-small"></div>
                    <p>AI đang phân tích bài giảng và sinh {numQuestions} câu hỏi trắc nghiệm...</p>
                  </div>
                )}

                {quizState === 'quiz' && activeQuizzes.length > 0 && (
                  <div style={{display: 'flex', flexDirection: 'column', gap: '2rem'}}>
                    {activeQuizzes.map((quizItem, qIdx) => {
                      const ansState = answers[qIdx];
                      const isResultShowing = ansState?.showResult;
                      const userSelection = ansState?.selected;

                      return (
                        <div key={qIdx} className="quiz-question-box" style={{borderBottom: '2px dashed var(--border)', paddingBottom: '2rem'}}>
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
                              <h4>
                                {userSelection === quizItem.correctIndex 
                                  ? <><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg> Chính xác!</>
                                  : <><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg> Sai rồi!</>
                                }
                              </h4>
                              <p>{quizItem.explanation}</p>
                            </div>
                          )}
                        </div>
                      )
                    })}
                    
                    {Object.keys(answers).length === activeQuizzes.length && (
                      <button 
                        style={{marginTop: '1rem', width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--surface)', cursor: 'pointer', fontWeight: 600, boxShadow: 'var(--shadow-sm)'}}
                        onClick={() => setQuizState('idle')}
                      >
                        Tạo bộ Test mới
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
            
          </div>
        </aside>
      </div>
    </div>
  );
}

export default App;
