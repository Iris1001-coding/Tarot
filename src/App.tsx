import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toPng } from 'html-to-image';
import { HandTracker, HandCoordinates } from './utils/HandTracking';
import { StarDustCanvas } from './components/StarDustCanvas';
import { StarField3D } from './components/StarField3D';
import { CardDeck } from './components/CardDeck';
import { FateTree, FateSession } from './components/FateTree';
import { ExportCard } from './components/ExportCard';
import { SpreadDisplay } from './components/SpreadDisplay';
import { SpreadSelector, SPREADS, Spread } from './components/SpreadSelector';
import { getInterpretation, DrawnCard } from './services/tarotService';
import { Sparkles, Save, TreeDeciduous, X, ChevronRight, Camera, CameraOff, KeyRound, Check, Download } from 'lucide-react';
import { MysticOrb } from './components/MysticOrb';

type AppState = 'HOME' | 'SPREAD_SELECTION' | 'ASK_QUESTION' | 'DECK' | 'SPREAD_DISPLAY' | 'INTERPRETATION' | 'TREE';

export default function App() {
  const [appState, setAppState] = useState<AppState>('HOME');
  const [question, setQuestion] = useState('');
  const [selectedSpread, setSelectedSpread] = useState<Spread>(SPREADS[0]);
  const [drawnCards, setDrawnCards] = useState<DrawnCard[]>([]);
  
  const [handCoords, setHandCoords] = useState<HandCoordinates | null>(null);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | 'down' | null>(null);
  const [isFist, setIsFist] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [sessions, setSessions] = useState<FateSession[]>([]);
  const [currentSession, setCurrentSession] = useState<FateSession | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isHoveringSpread, setIsHoveringSpread] = useState(false);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [apiKeySaved, setApiKeySaved] = useState(false);
  const [apiProvider, setApiProvider] = useState<'gemini' | 'openai'>('gemini');
  const [apiModelInput, setApiModelInput] = useState('');
  const [apiBaseUrlInput, setApiBaseUrlInput] = useState('');
  const [showBaseUrl, setShowBaseUrl] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const trackerRef = useRef<HandTracker | null>(null);
  const exportCardRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  /** Zone-based scroll velocity from HandTracker — updated without re-renders */
  const scrollVelocityRef = useRef<number>(0);
  /** Fist-hold progress 0–1 — updated without re-renders */
  const fistProgressRef = useRef<number>(0);

  const handleExport = async (session: FateSession) => {
    if (!exportCardRef.current || isExporting) return;
    setIsExporting(true);
    try {
      // Small delay to ensure offscreen element is rendered
      await new Promise(r => setTimeout(r, 100));
      const dataUrl = await toPng(exportCardRef.current, { pixelRatio: 2, cacheBust: true });
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `命运星尘_${session.date.replace(/\//g, '-')}.png`;
      a.click();
    } catch (e) {
      console.error('Export failed:', e);
    } finally {
      setIsExporting(false);
    }
  };

  // Preload Images
  useEffect(() => {
    for (let i = 0; i < 78; i++) {
      const img = new Image();
      img.src = `${import.meta.env.BASE_URL}assets/cards/card_${i}.png`;
    }
  }, []);

  // Load sessions from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('fate_sessions');
    if (saved) {
      setSessions(JSON.parse(saved));
    }
    const savedKey = localStorage.getItem('tarot_api_key');
    if (savedKey) setApiKeyInput(savedKey);
    const savedProvider = localStorage.getItem('tarot_api_provider');
    if (savedProvider === 'openai') setApiProvider('openai');
    const savedModel = localStorage.getItem('tarot_api_model');
    if (savedModel) setApiModelInput(savedModel);
    const savedBaseUrl = localStorage.getItem('tarot_api_base_url');
    if (savedBaseUrl) setApiBaseUrlInput(savedBaseUrl);
  }, []);

  // Save sessions to localStorage
  useEffect(() => {
    localStorage.setItem('fate_sessions', JSON.stringify(sessions));
  }, [sessions]);

  // Initialize Hand Tracking
  useEffect(() => {
    if ((appState === 'DECK' || appState === 'SPREAD_SELECTION') && !trackerRef.current && videoRef.current) {
      trackerRef.current = new HandTracker(
        (coords) => setHandCoords(coords),
        (dir) => {
          setSwipeDirection(dir);
          setTimeout(() => setSwipeDirection(null), 100);
        },
        (fist) => setIsFist(fist),
        (v) => { scrollVelocityRef.current = v; },
        (p) => { fistProgressRef.current = p; },
        (_p) => { /* palmProgress — 预留，暂不使用 */ },
      );
      trackerRef.current.start(videoRef.current).then((success) => {
        setIsCameraActive(success);
      });
    }

    return () => {
      if (appState !== 'DECK' && appState !== 'SPREAD_SELECTION' && trackerRef.current) {
        trackerRef.current.stop();
        trackerRef.current = null;
      }
    };
  }, [appState]);

  // Mouse fallback
  useEffect(() => {
    if (!isCameraActive) {
      const handleMouseMove = (e: MouseEvent) => {
        setHandCoords({ x: e.clientX, y: e.clientY });
      };
      // Removed mouse down/up handlers to prevent auto-selection
      
      window.addEventListener('mousemove', handleMouseMove);
      
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
      };
    }
  }, [isCameraActive]);

  const handleStart = () => {
    setAppState('SPREAD_SELECTION');
  };

  const handleSpreadSelect = (spread: Spread) => {
    setSelectedSpread(spread);
    setAppState('ASK_QUESTION');
  };

  const handleQuestionSubmit = () => {
    if (question.trim()) {
      setDrawnCards([]);
      setAppState('DECK');
    }
  };

  const handleCardSelect = async (cardIndex: number, isReversed: boolean) => {
    const newCard: DrawnCard = {
      index: cardIndex,
      isReversed,
      positionName: selectedSpread.positions[drawnCards.length]
    };
    
    const updatedCards = [...drawnCards, newCard];
    setDrawnCards(updatedCards);

    if (updatedCards.length >= selectedSpread.cardCount) {
      setAppState('SPREAD_DISPLAY');
    }
  };

  const handleInterpret = async () => {
    setIsLoading(true);
    setAppState('INTERPRETATION');
    
    const interpretation = await getInterpretation(question, selectedSpread.name, drawnCards);
    
    const newSession: FateSession = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      question,
      spreadName: selectedSpread.name,
      cards: drawnCards,
      interpretation,
    };
    
    setCurrentSession(newSession);
    setIsLoading(false);
  };

  const handleSaveSession = () => {
    if (currentSession) {
      setSessions(prev => [...prev, currentSession]);
      setAppState('TREE');
    }
  };

  const handleDeleteSession = (id: string) => {
    setSessions(prev => prev.filter(s => s.id !== id));
  };

  // Downward swipe to save
  useEffect(() => {
    if (swipeDirection === 'down' && appState === 'INTERPRETATION' && currentSession) {
      handleSaveSession();
    }
  }, [swipeDirection, appState, currentSession]);

  return (
    <div className="min-h-screen bg-transparent text-white overflow-hidden selection:bg-purple-500/30">
      {/* Hidden video element for MediaPipe */}
      <video ref={videoRef} className="hidden" playsInline />

      {/* 3D Star Field Background */}
      <StarField3D />

      {/* Interactive Particles Overlay */}
      <StarDustCanvas 
        targetCoords={appState === 'SPREAD_SELECTION' && isHoveringSpread ? { x: window.innerWidth / 2, y: window.innerHeight / 2 } : handCoords} 
        isNormalized={appState === 'SPREAD_SELECTION' && isHoveringSpread ? false : isCameraActive} 
        isAttracting={appState === 'SPREAD_SELECTION' && isHoveringSpread}
      />

      {/* Navigation / Header */}
      <header className="fixed top-0 left-0 right-0 px-6 py-4 z-50 flex justify-between items-center pointer-events-none">
        {/* Subtle top border glow */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-400/30 to-transparent" />
        <div className="flex items-center gap-3">
          <Sparkles className="w-5 h-5 text-amber-400/80" />
          <h1 className="font-mystic text-lg tracking-[0.35em] text-amber-400/90">命运星尘</h1>
        </div>
        <div className="flex gap-2 pointer-events-auto">
          <button
            onClick={() => { setShowApiKeyModal(true); setApiKeySaved(false); }}
            className="p-2.5 rounded-full bg-purple-950/50 border border-purple-500/20 hover:bg-purple-900/60 hover:border-purple-400/40 transition-all duration-300 backdrop-blur-md shadow-[0_0_15px_rgba(147,51,234,0.15)]"
            title="设置 API Key"
          >
            <KeyRound className="w-4 h-4 text-amber-400/80" />
          </button>
          <button
            onClick={() => setAppState('TREE')}
            className="p-2.5 rounded-full bg-purple-950/50 border border-purple-500/20 hover:bg-purple-900/60 hover:border-purple-400/40 transition-all duration-300 backdrop-blur-md shadow-[0_0_15px_rgba(147,51,234,0.15)]"
            title="命运之树"
          >
            <TreeDeciduous className="w-4 h-4 text-amber-400/80" />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative w-full h-screen flex items-center justify-center pt-20">
        <AnimatePresence mode="wait">
          
          {/* HOME STATE */}
          {appState === 'HOME' && (
            <motion.div
              key="home"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.9, ease: 'easeOut' }}
              className="flex flex-col items-center max-w-2xl w-full px-6 z-10"
            >
              {/* 3D Mystic Orb */}
              <motion.div
                className="mb-4 animate-float"
                initial={{ opacity: 0, scale: 0.4 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.15, duration: 1.0, ease: 'easeOut' }}
              >
                <MysticOrb />
              </motion.div>

              {/* Title */}
              <motion.h2
                className="font-tarot text-4xl md:text-5xl mb-3 text-center text-transparent bg-clip-text bg-gradient-to-b from-amber-200 via-yellow-300 to-amber-500 text-glow-gold tracking-[0.15em]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.8 }}
              >
                命运星尘
              </motion.h2>

              <motion.p
                className="font-mystic text-purple-200/60 mb-10 text-center text-sm tracking-[0.4em]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.8 }}
              >
                探索未知的指引 · 倾听星辰的低语
              </motion.p>

              {/* CTA Button with ritual ring decorations */}
              <motion.div
                className="relative"
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.75, duration: 0.6 }}
              >
                {/* Rotating ritual rings */}
                <div className="absolute inset-[-18px] rounded-full border border-amber-400/10 animate-spin-slow pointer-events-none" />
                <div className="absolute inset-[-28px] rounded-full border border-purple-500/8 animate-spin-reverse-slow pointer-events-none" />

                <button
                  onClick={handleStart}
                  className="group relative px-14 py-4 rounded-full bg-white/[0.04] border border-amber-400/20 backdrop-blur-md overflow-hidden transition-all duration-500 hover:bg-white/[0.08] hover:border-amber-400/45 hover:shadow-[0_0_45px_rgba(251,191,36,0.2),0_0_90px_rgba(147,51,234,0.15)]"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600/15 via-indigo-600/10 to-purple-600/15 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                  <span className="relative z-10 font-mystic text-base tracking-[0.35em] text-amber-200/85 group-hover:text-amber-100 transition-colors duration-300">
                    开启命运之门
                  </span>
                </button>
              </motion.div>

              <motion.p
                className="mt-10 font-mystic text-white/15 text-[10px] tracking-[0.6em] uppercase"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.0, duration: 0.8 }}
              >
                The Stars Await
              </motion.p>
            </motion.div>
          )}

          {/* SPREAD SELECTION STATE */}
          {appState === 'SPREAD_SELECTION' && (
            <motion.div 
              key="spread_selection"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full h-full z-10"
            >
              <SpreadSelector 
                onSelect={handleSpreadSelect} 
                swipeDirection={swipeDirection} 
                onHoverChange={setIsHoveringSpread}
              />
            </motion.div>
          )}

          {/* ASK QUESTION STATE */}
          {appState === 'ASK_QUESTION' && (
            <motion.div
              key="ask_question"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="flex flex-col items-center max-w-xl w-full px-6 z-10"
            >
              <div className="w-px h-12 bg-gradient-to-b from-transparent to-amber-400/40 mb-6" />
              <h2 className="font-tarot text-2xl mb-2 text-center text-amber-300 text-glow-gold tracking-widest">你寻求何种启示？</h2>
              <p className="font-mystic text-white/40 mb-8 text-center text-xs tracking-[0.3em]">
                已选：{selectedSpread.name} · 集中心神，输入你的问题
              </p>

              <div className="relative w-full mb-6">
                <input
                  type="text"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleQuestionSubmit()}
                  placeholder="例如：我未来的职业发展道路如何？"
                  className="w-full font-mystic bg-purple-950/30 border border-amber-400/20 rounded-2xl px-6 py-4 text-base focus:outline-none focus:border-amber-400/50 focus:shadow-[0_0_20px_rgba(251,191,36,0.15)] transition-all placeholder:text-white/15 backdrop-blur-md tracking-wide"
                />
                <div className="absolute inset-x-0 -bottom-px h-px bg-gradient-to-r from-transparent via-amber-400/30 to-transparent" />
              </div>

              <button
                onClick={handleQuestionSubmit}
                disabled={!question.trim()}
                className="group relative w-full max-w-xs py-4 rounded-full bg-white/[0.04] border border-amber-400/20 backdrop-blur-md overflow-hidden transition-all duration-500 hover:bg-white/[0.08] hover:border-amber-400/40 hover:shadow-[0_0_30px_rgba(251,191,36,0.2)] disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-rose-600/15 to-amber-500/15 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <span className="relative z-10 font-mystic text-sm tracking-[0.35em] text-amber-100/85 group-hover:text-amber-100 transition-colors">开始抽牌</span>
              </button>
            </motion.div>
          )}

          {/* DECK STATE */}
          {appState === 'DECK' && (
            <motion.div
              key="deck"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full h-full z-10 flex flex-col items-center justify-center"
            >
              <div className="absolute top-24 left-1/2 -translate-x-1/2 text-center pointer-events-none z-20">
                <h2 className="font-tarot text-xl text-amber-300 text-glow-gold mb-1 tracking-widest">
                  抽取第 {drawnCards.length + 1} 张牌
                </h2>

                {/* Camera status pill */}
                <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mystic tracking-widest mb-1 ${
                  isCameraActive
                    ? 'bg-emerald-900/40 border border-emerald-500/30 text-emerald-300'
                    : 'bg-white/5 border border-white/10 text-white/40'
                }`}>
                  {isCameraActive
                    ? <><Camera className="w-3 h-3" /> 手势控制已开启</>
                    : <><CameraOff className="w-3 h-3" /> 鼠标模式</>}
                </div>

                <p className="font-mystic text-rose-400/80 text-xs tracking-widest">
                  {selectedSpread.positions[drawnCards.length]}
                </p>
              </div>

              {/* Camera permission guide — shown only when camera is NOT active */}
              {!isCameraActive && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="absolute top-24 right-4 z-20 pointer-events-none max-w-[200px]"
                >
                  <div className="bg-purple-950/70 border border-purple-500/20 rounded-2xl p-3 backdrop-blur-md text-left">
                    <div className="flex items-center gap-1.5 mb-2">
                      <Camera className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span className="font-mystic text-amber-400 text-[10px] tracking-widest uppercase">开启手势</span>
                    </div>
                    <ol className="font-mystic text-white/50 text-[10px] leading-relaxed space-y-1 list-none">
                      <li>① 点击地址栏左侧的 🔒 / ℹ️ 图标</li>
                      <li>② 找到「摄像头」权限</li>
                      <li>③ 选择「允许」并刷新页面</li>
                    </ol>
                  </div>
                </motion.div>
              )}

              {/* Gesture guide — shown when camera IS active */}
              {isCameraActive && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="absolute top-24 right-4 z-20 pointer-events-none max-w-[190px]"
                >
                  <div className="bg-purple-950/70 border border-purple-500/20 rounded-2xl p-3 backdrop-blur-md text-left">
                    <div className="flex items-center gap-1.5 mb-2.5">
                      <Camera className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span className="font-mystic text-emerald-400 text-[10px] tracking-widest uppercase">手势指南</span>
                    </div>
                    <ul className="font-mystic text-white/55 text-[10px] leading-relaxed space-y-1.5 list-none">
                      <li className="flex items-center gap-1.5">
                        <span className="text-sm">🫲</span>
                        <span>手掌左倾 — 向左旋转</span>
                      </li>
                      <li className="flex items-center gap-1.5">
                        <span className="text-sm">🫱</span>
                        <span>手掌右倾 — 向右旋转</span>
                      </li>
                      <li className="flex items-center gap-1.5">
                        <span className="text-sm">✊</span>
                        <span>握拳1秒 — 抓取当前牌</span>
                      </li>
                    </ul>
                  </div>
                </motion.div>
              )}
              <CardDeck
                key={drawnCards.length}
                onCardSelect={handleCardSelect}
                swipeDirection={swipeDirection}
                drawnCardIndices={drawnCards.map(c => c.index)}
                isFist={isFist}
                scrollVelocityRef={isCameraActive ? scrollVelocityRef : undefined}
                fistProgressRef={isCameraActive ? fistProgressRef : undefined}
              />
            </motion.div>
          )}

          {/* SPREAD DISPLAY STATE */}
          {appState === 'SPREAD_DISPLAY' && (
            <motion.div
              key="spread_display"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full h-full z-10 flex flex-col items-center justify-center"
            >
              <div className="absolute top-24 left-1/2 -translate-x-1/2 text-center pointer-events-none z-20">
                <h2 className="font-tarot text-2xl text-amber-300 text-glow-gold mb-1 tracking-widest">{selectedSpread.name}</h2>
                <p className="font-mystic text-white/40 text-xs tracking-[0.3em]">卡牌已就位 · 命运的轮盘开始转动</p>
              </div>

              <SpreadDisplay spreadName={selectedSpread.name} cards={drawnCards} />

              <button
                onClick={handleInterpret}
                className="absolute bottom-12 group relative px-12 py-4 rounded-full bg-white/[0.04] border border-amber-400/20 backdrop-blur-md overflow-hidden transition-all duration-500 hover:bg-white/[0.08] hover:border-amber-400/40 hover:shadow-[0_0_35px_rgba(251,191,36,0.2)] z-20"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-rose-600/15 to-amber-500/15 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative z-10 flex items-center gap-2">
                  <span className="font-mystic text-sm tracking-[0.3em] text-amber-100/85 group-hover:text-amber-100 transition-colors">解读命运</span>
                  <ChevronRight className="w-4 h-4 text-amber-200/70 group-hover:text-amber-100" />
                </div>
              </button>
            </motion.div>
          )}

          {/* INTERPRETATION STATE */}
          {appState === 'INTERPRETATION' && (
            <motion.div
              key="interpretation"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="w-full max-w-3xl max-h-[80vh] overflow-y-auto bg-purple-950/40 backdrop-blur-xl border border-amber-400/15 rounded-3xl p-8 z-10 custom-scrollbar shadow-[0_0_60px_rgba(147,51,234,0.15),inset_0_0_40px_rgba(109,40,217,0.08)]"
            >
              {isLoading ? (
                <div className="flex flex-col items-center justify-center h-64 gap-6">
                  <div className="relative w-14 h-14">
                    <div className="absolute inset-0 rounded-full border-2 border-amber-400/20 border-t-amber-400 animate-spin" />
                    <div className="absolute inset-2 rounded-full border-2 border-purple-500/20 border-b-purple-400 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
                  </div>
                  <p className="font-mystic text-amber-300/80 text-sm tracking-[0.3em] animate-pulse">正在聆听星辰的低语...</p>
                </div>
              ) : currentSession ? (
                <div className="flex flex-col gap-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-tarot text-xl text-amber-300 text-glow-gold mb-1 tracking-widest">命运的启示</h3>
                      <p className="font-mystic text-xs text-rose-400/70 uppercase tracking-[0.35em]">{currentSession.spreadName}</p>
                    </div>
                    <button onClick={() => setAppState('HOME')} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                      <X className="w-5 h-5 text-white/40 hover:text-white/70" />
                    </button>
                  </div>

                  <div className="p-4 rounded-2xl bg-black/20 border border-white/5">
                    <p className="font-mystic text-xs text-white/35 mb-1.5 tracking-widest uppercase">你的问题</p>
                    <p className="font-mystic text-base italic text-white/80">"{currentSession.question}"</p>
                  </div>

                  <div className="h-px bg-gradient-to-r from-transparent via-amber-400/20 to-transparent" />

                  <div className="prose prose-invert max-w-none">
                    {currentSession.interpretation.split('\n').map((paragraph, i) => (
                      paragraph.trim() ? (
                        <p key={i} className="font-mystic text-white/70 leading-relaxed text-sm tracking-wide mb-3">{paragraph}</p>
                      ) : null
                    ))}
                  </div>

                  <div className="mt-4 flex flex-col items-center gap-3">
                    <div className="flex gap-3">
                      <button
                        onClick={handleSaveSession}
                        className="group relative px-8 py-3 rounded-full bg-white/[0.04] border border-amber-400/20 backdrop-blur-md overflow-hidden transition-all duration-500 hover:bg-white/[0.08] hover:border-amber-400/40 hover:shadow-[0_0_25px_rgba(251,191,36,0.18)]"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-rose-600/12 to-amber-500/12 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <div className="relative z-10 flex items-center gap-2.5">
                          <Save className="w-4 h-4 text-amber-300/80 group-hover:text-amber-200" />
                          <span className="font-mystic text-xs tracking-[0.3em] text-amber-200/80 group-hover:text-amber-100 transition-colors">保存至命运之树</span>
                        </div>
                      </button>
                      <button
                        onClick={() => currentSession && handleExport(currentSession)}
                        disabled={isExporting}
                        className="group relative px-6 py-3 rounded-full bg-white/[0.04] border border-violet-400/20 backdrop-blur-md overflow-hidden transition-all duration-500 hover:bg-white/[0.08] hover:border-violet-400/40 hover:shadow-[0_0_25px_rgba(139,92,246,0.25)] disabled:opacity-40"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-violet-600/12 to-purple-500/12 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <div className="relative z-10 flex items-center gap-2.5">
                          <Download className="w-4 h-4 text-violet-300/80 group-hover:text-violet-200" />
                          <span className="font-mystic text-xs tracking-[0.3em] text-violet-200/80 group-hover:text-violet-100 transition-colors">
                            {isExporting ? '生成中...' : '导出卡牌'}
                          </span>
                        </div>
                      </button>
                    </div>
                    <p className="font-mystic text-xs text-white/20 tracking-widest">或向下滑动以保存</p>
                  </div>
                </div>
              ) : null}
            </motion.div>
          )}

          {/* TREE STATE */}
          {appState === 'TREE' && (
            <motion.div
              key="tree"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full h-full z-10 flex flex-col items-center"
            >
              <div className="absolute top-24 left-1/2 -translate-x-1/2 text-center pointer-events-none z-20">
                <h2 className="font-tarot text-2xl text-amber-300 text-glow-gold mb-1 tracking-widest">命运之树</h2>
                <p className="font-mystic text-white/35 text-xs tracking-[0.35em]">你过去的解读已结出果实</p>
              </div>

              <FateTree
                sessions={sessions}
                onSelectSession={(session) => {
                  setCurrentSession(session);
                  setAppState('INTERPRETATION');
                }}
                onDeleteSession={handleDeleteSession}
              />

              <button
                onClick={() => setAppState('HOME')}
                className="absolute bottom-12 group relative px-10 py-4 rounded-full bg-white/[0.04] border border-purple-400/20 backdrop-blur-md overflow-hidden transition-all duration-500 hover:bg-white/[0.08] hover:border-purple-400/40 hover:shadow-[0_0_35px_rgba(168,85,247,0.2)] z-20"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600/15 to-indigo-600/15 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <span className="relative z-10 font-mystic text-sm tracking-[0.3em] text-amber-200/80 group-hover:text-amber-100 transition-colors">返回现在</span>
              </button>
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* ── API Key Modal ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showApiKeyModal && (
          <motion.div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowApiKeyModal(false)}
          >
            <motion.div
              className="relative w-[360px] bg-purple-950/90 border border-purple-500/30 rounded-2xl p-6 shadow-[0_0_60px_rgba(109,40,217,0.4)] backdrop-blur-xl"
              initial={{ scale: 0.9, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 20, opacity: 0 }}
              transition={{ type: 'spring', damping: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-amber-400" />
                  <span className="font-mystic text-amber-400 text-sm tracking-widest">AI 解牌 · API KEY</span>
                </div>
                <button onClick={() => setShowApiKeyModal(false)} className="text-white/30 hover:text-white/70 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Provider toggle */}
              <div className="flex gap-2 mb-4">
                {(['gemini', 'openai'] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => { setApiProvider(p); setApiKeySaved(false); }}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-mystic tracking-widest transition-all duration-200 ${
                      apiProvider === p
                        ? 'bg-amber-500/25 border border-amber-400/60 text-amber-300'
                        : 'bg-white/5 border border-white/10 text-white/40 hover:text-white/60'
                    }`}
                  >
                    {p === 'gemini' ? 'Gemini' : 'OpenAI 兼容'}
                  </button>
                ))}
              </div>

              <p className="font-mystic text-white/40 text-[11px] leading-relaxed mb-3 tracking-wide">
                {apiProvider === 'gemini'
                  ? '支持 Gemini 系列模型（gemini-2.0-flash-exp 等）。Key 仅存于本地，不会上传任何服务器。'
                  : '兼容 DeepSeek / Moonshot / OpenAI 等任意 OpenAI 格式 API。Key 仅存于本地，不会上传任何服务器。'}
              </p>

              {/* API Key input */}
              <input
                type="password"
                value={apiKeyInput}
                onChange={(e) => { setApiKeyInput(e.target.value); setApiKeySaved(false); }}
                placeholder="粘贴你的 API Key..."
                className="w-full bg-white/5 border border-purple-400/25 rounded-xl px-4 py-3 font-mono text-sm text-white/80 placeholder-white/20 focus:outline-none focus:border-amber-400/50 transition-all mb-2"
              />

              {/* OpenAI-only: model + base URL */}
              {apiProvider === 'openai' && (
                <div className="space-y-2 mb-2">
                  <input
                    type="text"
                    value={apiModelInput}
                    onChange={(e) => { setApiModelInput(e.target.value); setApiKeySaved(false); }}
                    placeholder="模型名称（如 deepseek-chat）"
                    className="w-full bg-white/5 border border-purple-400/25 rounded-xl px-4 py-2.5 font-mono text-sm text-white/80 placeholder-white/20 focus:outline-none focus:border-amber-400/50 transition-all"
                  />
                  <button
                    onClick={() => setShowBaseUrl(v => !v)}
                    className="text-[11px] text-white/30 hover:text-amber-400/60 transition-colors font-mystic tracking-wider"
                  >
                    {showBaseUrl ? '▾ 自定义端点' : '▸ 自定义端点'}
                  </button>
                  {showBaseUrl && (
                    <input
                      type="text"
                      value={apiBaseUrlInput}
                      onChange={(e) => { setApiBaseUrlInput(e.target.value); setApiKeySaved(false); }}
                      placeholder="https://api.deepseek.com"
                      className="w-full bg-white/5 border border-purple-400/25 rounded-xl px-4 py-2.5 font-mono text-xs text-white/80 placeholder-white/20 focus:outline-none focus:border-amber-400/50 transition-all"
                    />
                  )}
                </div>
              )}

              {/* Save */}
              <button
                onClick={() => {
                  const trimmed = apiKeyInput.trim();
                  if (trimmed) {
                    localStorage.setItem('tarot_api_key', trimmed);
                  } else {
                    localStorage.removeItem('tarot_api_key');
                  }
                  localStorage.setItem('tarot_api_provider', apiProvider);
                  const model = apiModelInput.trim();
                  if (model) localStorage.setItem('tarot_api_model', model);
                  else localStorage.removeItem('tarot_api_model');
                  const baseUrl = apiBaseUrlInput.trim();
                  if (baseUrl) localStorage.setItem('tarot_api_base_url', baseUrl);
                  else localStorage.removeItem('tarot_api_base_url');
                  setApiKeySaved(true);
                  setTimeout(() => setShowApiKeyModal(false), 800);
                }}
                className="w-full py-3 rounded-xl font-mystic text-sm tracking-widest transition-all duration-300 flex items-center justify-center gap-2 bg-amber-500/20 border border-amber-500/40 text-amber-300 hover:bg-amber-500/30 hover:border-amber-400/60"
              >
                {apiKeySaved ? <><Check className="w-4 h-4" /> 已保存</> : '保存'}
              </button>

              {apiKeyInput && (
                <button
                  onClick={() => {
                    localStorage.removeItem('tarot_api_key');
                    localStorage.removeItem('tarot_api_provider');
                    localStorage.removeItem('tarot_api_model');
                    localStorage.removeItem('tarot_api_base_url');
                    setApiKeyInput('');
                    setApiModelInput('');
                    setApiBaseUrlInput('');
                    setApiProvider('gemini');
                    setApiKeySaved(false);
                  }}
                  className="w-full mt-2 py-2 text-white/25 text-xs font-mystic tracking-widest hover:text-rose-400/60 transition-colors"
                >
                  清除 Key
                </button>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hidden off-screen ExportCard for png generation */}
      {currentSession && (
        <div style={{ position: 'absolute', left: '-9999px', top: 0, pointerEvents: 'none', zIndex: -1 }}>
          <ExportCard ref={exportCardRef} session={currentSession} />
        </div>
      )}
    </div>
  );
}
