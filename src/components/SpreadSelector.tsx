import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface Spread {
  id: string;
  name: string;
  description: string;
  quote: string;
  cardCount: number;
  positions: string[];
  blueprint: React.ReactNode;
}

const SingleCardBlueprint = () => (
  <svg viewBox="0 0 100 100" className="w-16 h-16 animate-pulse">
    <rect x="35" y="25" width="30" height="50" rx="4" fill="none" stroke="#f1c40f" strokeWidth="2" />
    <circle cx="50" cy="50" r="4" fill="#f1c40f" />
  </svg>
);

const TimeStreamBlueprint = () => (
  <svg viewBox="0 0 100 100" className="w-16 h-16 animate-pulse">
    <rect x="10" y="30" width="20" height="40" rx="3" fill="none" stroke="#f1c40f" strokeWidth="2" />
    <rect x="40" y="30" width="20" height="40" rx="3" fill="none" stroke="#f1c40f" strokeWidth="2" />
    <rect x="70" y="30" width="20" height="40" rx="3" fill="none" stroke="#f1c40f" strokeWidth="2" />
    <circle cx="50" cy="50" r="3" fill="#f1c40f" />
  </svg>
);

const HolyTriangleBlueprint = () => (
  <svg viewBox="0 0 100 100" className="w-16 h-16 animate-pulse">
    <rect x="40" y="15" width="20" height="35" rx="3" fill="none" stroke="#f1c40f" strokeWidth="2" />
    <rect x="15" y="55" width="20" height="35" rx="3" fill="none" stroke="#f1c40f" strokeWidth="2" />
    <rect x="65" y="55" width="20" height="35" rx="3" fill="none" stroke="#f1c40f" strokeWidth="2" />
    <path d="M50 35 L25 70 L75 70 Z" fill="none" stroke="#f1c40f" strokeWidth="1" strokeDasharray="2 2" opacity="0.5" />
  </svg>
);

const CelticCrossBlueprint = () => (
  <svg viewBox="0 0 100 100" className="w-16 h-16 animate-pulse">
    <rect x="30" y="40" width="16" height="24" rx="2" fill="none" stroke="#f1c40f" strokeWidth="1.5" />
    <rect x="26" y="46" width="24" height="12" rx="2" fill="none" stroke="#f1c40f" strokeWidth="1.5" />
    <rect x="30" y="10" width="16" height="24" rx="2" fill="none" stroke="#f1c40f" strokeWidth="1.5" />
    <rect x="30" y="70" width="16" height="24" rx="2" fill="none" stroke="#f1c40f" strokeWidth="1.5" />
    <rect x="8" y="40" width="16" height="24" rx="2" fill="none" stroke="#f1c40f" strokeWidth="1.5" />
    <rect x="52" y="40" width="16" height="24" rx="2" fill="none" stroke="#f1c40f" strokeWidth="1.5" />
    <rect x="76" y="10" width="16" height="18" rx="2" fill="none" stroke="#f1c40f" strokeWidth="1.5" />
    <rect x="76" y="32" width="16" height="18" rx="2" fill="none" stroke="#f1c40f" strokeWidth="1.5" />
    <rect x="76" y="54" width="16" height="18" rx="2" fill="none" stroke="#f1c40f" strokeWidth="1.5" />
    <rect x="76" y="76" width="16" height="18" rx="2" fill="none" stroke="#f1c40f" strokeWidth="1.5" />
  </svg>
);

export const SPREADS: Spread[] = [
  {
    id: 'daily',
    name: '每日启示',
    description: '单张牌阵，为你提供今日的专属指引与灵感。',
    quote: '一叶知秋，于此刻窥见今日之灵光。',
    cardCount: 1,
    positions: ['每日指引'],
    blueprint: <SingleCardBlueprint />
  },
  {
    id: 'time',
    name: '时间之流',
    description: '三张牌阵，揭示事物从过去到未来的发展脉络。',
    quote: '因果如河流，溯源而上，方知去向何方。',
    cardCount: 3,
    positions: ['过去', '现在', '未来'],
    blueprint: <TimeStreamBlueprint />
  },
  {
    id: 'triangle',
    name: '圣三角',
    description: '三张牌阵，深入剖析问题、环境与最终的解决方案。',
    quote: '三位一体之境，破除眼下纠结的迷雾。',
    cardCount: 3,
    positions: ['问题', '环境', '解决方案'],
    blueprint: <HolyTriangleBlueprint />
  },
  {
    id: 'celtic',
    name: '塞尔特大十字',
    description: '十张牌阵，全面而深刻地洞察局势的每一个维度。',
    quote: '古老的螺旋仪式，揭开宿命最完整的画卷。',
    cardCount: 10,
    positions: [
      '现状', '障碍', '目标', '根源', '过去', '未来', 
      '自我', '环境', '希望与恐惧', '最终结果'
    ],
    blueprint: <CelticCrossBlueprint />
  }
];

interface SpreadSelectorProps {
  onSelect: (spread: Spread) => void;
  swipeDirection: 'left' | 'right' | 'down' | null;
  onHoverChange: (isHovering: boolean) => void;
}

export const SpreadSelector: React.FC<SpreadSelectorProps> = ({ onSelect, swipeDirection, onHoverChange }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHolding, setIsHolding] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);
  const [isWarping, setIsWarping] = useState(false);
  
  const holdTimerRef = useRef<NodeJS.Timeout | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const playWindChime = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const t = ctx.currentTime;
      
      // Create multiple oscillators for a chime effect
      const frequencies = [523.25, 659.25, 783.99, 1046.50, 1318.51]; // C Major Pentatonic
      
      frequencies.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t);
        
        // Randomize start time slightly for natural feel
        const startOffset = i * 0.05 + Math.random() * 0.05;
        
        gain.gain.setValueAtTime(0, t + startOffset);
        gain.gain.linearRampToValueAtTime(0.1 / frequencies.length, t + startOffset + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, t + startOffset + 2.5); // Long decay
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start(t + startOffset);
        osc.stop(t + startOffset + 3);
      });

    } catch (e) {
      // Ignore
    }
  };

  // Handle Swipe
  useEffect(() => {
    if (swipeDirection === 'left') {
      setCurrentIndex((prev) => Math.min(prev + 1, SPREADS.length - 1));
    } else if (swipeDirection === 'right') {
      setCurrentIndex((prev) => Math.max(prev - 1, 0));
    }
  }, [swipeDirection]);

  const handlePointerDown = (index: number) => {
    if (index !== currentIndex) {
      setCurrentIndex(index);
      return;
    }
    
    // Select immediately if clicking the center card
    playWindChime();
    onSelect(SPREADS[currentIndex]);
  };

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden perspective-1000">
      
      {/* Carousel */}
      <div className="relative w-full max-w-5xl h-[500px] flex items-center justify-center">
        {SPREADS.map((spread, index) => {
          const offset = index - currentIndex;
          const isCenter = offset === 0;
          
          return (
            <motion.div
              key={spread.id}
              className="absolute w-[280px] h-[420px] rounded-2xl cursor-pointer select-none"
              style={{
                x: offset * 240,
                scale: isCenter ? 1.1 : 0.8,
                opacity: isCenter ? 1 : 0.4,
                zIndex: isCenter ? 10 : 5 - Math.abs(offset),
              }}
              animate={{
                x: offset * 240,
                scale: isCenter ? 1.1 : 0.8,
                opacity: isCenter ? 1 : 0.4,
                zIndex: isCenter ? 10 : 5 - Math.abs(offset),
              }}
              transition={{ type: 'spring', stiffness: 100, damping: 20 }}
              onPointerDown={() => handlePointerDown(index)}
              onPointerLeave={() => {
                if (isCenter) onHoverChange(false);
              }}
              onPointerEnter={() => {
                if (isCenter) onHoverChange(true);
              }}
            >
              {/* Glassmorphism Card with Border Beam */}
              <div className={`relative w-full h-full rounded-2xl overflow-hidden transition-all duration-300 ${
                isCenter 
                  ? 'shadow-[0_0_40px_rgba(241,196,15,0.4)]' 
                  : 'hover:bg-[#16213e]/70'
              }`}>
                
                {/* Border Beam (Only on center) */}
                {isCenter && (
                  <motion.div
                    className="absolute inset-[-50%] z-0"
                    style={{
                      background: 'conic-gradient(from 0deg, transparent 70%, rgba(241,196,15,0.8) 100%)'
                    }}
                    animate={{ rotate: 360 }}
                    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                  />
                )}

                {/* Inner Card Content */}
                <div className={`absolute inset-[2px] rounded-[14px] flex flex-col items-center justify-center p-6 text-center z-10 ${
                  isCenter ? 'bg-gradient-to-br from-[#1a1a3a]/95 to-[#0f0f2a]/95 backdrop-blur-xl' : 'bg-[#16213e]/80 backdrop-blur-md'
                }`}>
                  
                  <div className={`mb-4 p-4 rounded-full ${isCenter ? 'bg-[#f1c40f]/10 shadow-[0_0_20px_rgba(241,196,15,0.2)]' : 'bg-white/5'}`}>
                    {spread.blueprint}
                  </div>
                  
                  <h3 className={`text-2xl font-serif mb-2 ${isCenter ? 'text-[#f1c40f] drop-shadow-[0_0_8px_rgba(241,196,15,0.8)]' : 'text-white/70'}`}>
                    {spread.name}
                  </h3>
                  
                  <p className={`text-xs mb-4 ${isCenter ? 'text-white/90' : 'text-white/40'}`}>
                    {spread.description}
                  </p>

                  {/* Mystic Copywriting */}
                  <p className={`text-sm italic font-serif mb-6 bg-clip-text text-transparent bg-gradient-to-r from-[#f1c40f] to-[#e94560] ${isCenter ? 'opacity-100' : 'opacity-0'}`}>
                    "{spread.quote}"
                  </p>
                  
                  <div className={`mt-auto px-4 py-1 rounded-full text-xs tracking-widest ${isCenter ? 'bg-[#e94560]/20 text-[#e94560] border border-[#e94560]/30' : 'bg-white/5 text-white/30'}`}>
                    需抽取 {spread.cardCount} 张牌
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Instructions */}
      <motion.div 
        className="absolute bottom-12 text-center pointer-events-none"
      >
        <p className="text-[#f1c40f] font-serif tracking-widest text-lg mb-2 drop-shadow-[0_0_5px_rgba(241,196,15,0.5)]">
          选择你的命运牌阵
        </p>
        <p className="text-white/50 text-sm">
          左右滑动切换 • 点击确认选择
        </p>
      </motion.div>
    </div>
  );
};

