import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface CardDeckProps {
  onCardSelect: (cardIndex: number, isReversed: boolean) => void;
  swipeDirection: 'left' | 'right' | 'down' | null;
  drawnCardIndices: number[];
  isFist: boolean;
  scrollVelocityRef?: React.RefObject<number>;
  fistProgressRef?: React.RefObject<number>;
}

const TOTAL_CARDS = 78;
const CARD_WIDTH  = 150;   // 比原来更大
const CARD_HEIGHT = 236;

// ─── 扇形布局参数 ─────────────────────────────────────────────────────────────
const N_VISIBLE      = 11;
const ARC_HALF       = 5;           // 中心槽位索引（= Math.floor(N_VISIBLE/2)）
const ARC_STEP_DEG   = 9;           // 每张牌之间的角度（更宽松）
const ARC_STEP_RAD   = ARC_STEP_DEG * Math.PI / 180;
const ARC_RADIUS     = 520;         // px，更大扇形半径
const ARC_LIFT       = 140;         // px，边缘牌下沉量（弧形感更强）
const SCALE_FACTOR   = 0.06;        // 每格距中心的缩放递减
const MIN_SCALE      = 0.48;
const OPACITY_FACTOR = 0.11;        // 每格距中心的透明度递减
const MIN_OPACITY    = 0.22;
const SCROLL_SPEED   = 2.0;         // 速度单位 → 每帧卡片数
const DRAG_PX_PER_CARD = 55;        // 鼠标拖 55px = 1 张牌

// ─── 神秘 SVG 牌背 ────────────────────────────────────────────────────────────

const CardBackSVG: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    viewBox="0 0 140 220"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    style={{ width: '100%', height: '100%', display: 'block' }}
  >
    <defs>
      <radialGradient id="cbBg" cx="50%" cy="45%" r="65%">
        <stop offset="0%"   stopColor="#1e0a4e" />
        <stop offset="55%"  stopColor="#0d0720" />
        <stop offset="100%" stopColor="#04020e" />
      </radialGradient>
      <radialGradient id="cbGlow" cx="50%" cy="50%" r="50%">
        <stop offset="0%"   stopColor="#7c3aed" stopOpacity="0.45" />
        <stop offset="50%"  stopColor="#db2777" stopOpacity="0.15" />
        <stop offset="100%" stopColor="#000000" stopOpacity="0" />
      </radialGradient>
      <linearGradient id="cbGold" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%"   stopColor="#fbbf24" stopOpacity="0.9" />
        <stop offset="50%"  stopColor="#f9a8d4" stopOpacity="0.7" />
        <stop offset="100%" stopColor="#a78bfa" stopOpacity="0.9" />
      </linearGradient>
      <pattern id="cbLattice" x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse">
        <path d="M5,0 L10,5 L5,10 L0,5 Z" fill="none" stroke="#fbbf24" strokeWidth="0.3" strokeOpacity="0.18" />
      </pattern>
      <clipPath id="cbClip">
        <rect x="0" y="0" width="140" height="220" rx="10" ry="10" />
      </clipPath>
    </defs>

    <g clipPath="url(#cbClip)">
      <rect x="0" y="0" width="140" height="220" fill="url(#cbBg)" />
      <rect x="0" y="0" width="140" height="220" fill="url(#cbLattice)" />
      <ellipse cx="70" cy="110" rx="55" ry="55" fill="url(#cbGlow)" />

      <rect x="4" y="4" width="132" height="212" rx="7" ry="7"
        fill="none" stroke="url(#cbGold)" strokeWidth="1.2" strokeOpacity="0.8" />
      <rect x="7" y="7" width="126" height="206" rx="5" ry="5"
        fill="none" stroke="#fbbf24" strokeWidth="0.5" strokeOpacity="0.4" />

      {[[12, 12], [128, 12], [12, 208], [128, 208]].map(([cx, cy], i) => (
        <g key={i}>
          <circle cx={cx} cy={cy} r="3" fill="#fbbf24" fillOpacity="0.8" />
          <circle cx={cx} cy={cy} r="5" fill="none" stroke="#fbbf24" strokeWidth="0.6" strokeOpacity="0.5" />
        </g>
      ))}

      <circle cx="70" cy="110" r="48" fill="none" stroke="#7c3aed" strokeWidth="0.8" strokeOpacity="0.6" />
      <circle cx="70" cy="110" r="44" fill="none" stroke="#a78bfa" strokeWidth="0.4" strokeOpacity="0.3" />

      {Array.from({ length: 12 }).map((_, i) => {
        const angle = (i / 12) * Math.PI * 2 - Math.PI / 2;
        return (
          <circle key={i}
            cx={70 + 48 * Math.cos(angle)} cy={110 + 48 * Math.sin(angle)}
            r={i % 3 === 0 ? 2 : 1}
            fill="#fbbf24" fillOpacity={i % 3 === 0 ? 0.8 : 0.4}
          />
        );
      })}

      <polygon points="70,78 91,114 49,114"  fill="none"   stroke="#fbbf24" strokeWidth="1.2" strokeOpacity="0.65" strokeLinejoin="round" />
      <polygon points="70,142 91,106 49,106" fill="none"   stroke="#fbbf24" strokeWidth="1.2" strokeOpacity="0.65" strokeLinejoin="round" />
      <polygon points="70,78 91,114 49,114"  fill="#7c3aed" fillOpacity="0.06" />
      <polygon points="70,142 91,106 49,106" fill="#fbbf24" fillOpacity="0.04" />

      {[[70,78],[91,114],[49,114],[70,142],[91,106],[49,106]].map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r="2" fill="#fbbf24" fillOpacity="0.7" />
      ))}

      <circle cx="70" cy="110" r="10" fill="none" stroke="#fbbf24" strokeWidth="0.8" strokeOpacity="0.5" />
      <circle cx="70" cy="110" r="4"  fill="#fbbf24" fillOpacity="0.4" />
      <circle cx="70" cy="110" r="2"  fill="#f9a8d4" fillOpacity="0.7" />

      <path d="M70,66 A6,6 0 1,1 70,54 A4,4 0 1,0 70,66 Z"   fill="#fbbf24" fillOpacity="0.55" />
      <path d="M70,154 A6,6 0 1,0 70,166 A4,4 0 1,1 70,154 Z" fill="#fbbf24" fillOpacity="0.55" />
      <path d="M22,110 A6,6 0 1,1 10,110 A4,4 0 1,0 22,110 Z"  fill="#fbbf24" fillOpacity="0.55" />
      <path d="M118,110 A6,6 0 1,0 130,110 A4,4 0 1,1 118,110 Z" fill="#fbbf24" fillOpacity="0.55" />

      <text x="70" y="23"  textAnchor="middle" fontSize="5" fill="#fbbf24" fillOpacity="0.55" fontFamily="serif" letterSpacing="2">✦ ☽ ✦ ☾ ✦</text>
      <text x="70" y="202" textAnchor="middle" fontSize="5" fill="#fbbf24" fillOpacity="0.55" fontFamily="serif" letterSpacing="2">✦ ☽ ✦ ☾ ✦</text>

      {[[18,35],[122,40],[15,185],[125,178],[30,95],[110,125],[25,150],[115,80]].map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r="0.8" fill="#ffffff" fillOpacity="0.3" />
      ))}
    </g>
  </svg>
);

// ─── CardDeck ─────────────────────────────────────────────────────────────────

export const CardDeck: React.FC<CardDeckProps> = ({
  onCardSelect,
  swipeDirection,
  drawnCardIndices,
  isFist,
  scrollVelocityRef,
  fistProgressRef,
}) => {
  // 洗牌（仅挂载时一次）
  const [shuffledOrder] = useState<number[]>(() => {
    const arr = Array.from({ length: TOTAL_CARDS }, (_, i) => i);
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  });

  // ── 扇形核心 refs（不触发 re-render）──────────────────────────────────────
  const scrollOffsetRef = useRef(0);          // 连续滚动偏移（卡片单位）
  const snapTargetRef   = useRef<number | null>(null); // 吸附目标
  const cardRefs        = useRef<(HTMLDivElement | null)[]>(Array(N_VISIBLE).fill(null));
  const rafIdRef        = useRef<number | null>(null);
  const frameCountRef   = useRef(0);

  // 每个槽显示的牌索引（React state，每 4 帧更新）
  const [cards, setCards] = useState<number[]>(() =>
    Array.from({ length: N_VISIBLE }, (_, i) => {
      const step = i - ARC_HALF;
      return shuffledOrder[((step % TOTAL_CARDS) + TOTAL_CARDS) % TOTAL_CARDS];
    })
  );

  // ── 翻牌状态 ──────────────────────────────────────────────────────────────
  const [selectedCard,   setSelectedCard]   = useState<number | null>(null);
  const [isFlipped,      setIsFlipped]      = useState(false);
  const [isReversed,     setIsReversed]     = useState(false);
  const [canSelect,      setCanSelect]      = useState(false);
  const [chargeProgress, setChargeProgress] = useState(0);

  // ── 鼠标拖拽 ──────────────────────────────────────────────────────────────
  const isDragging       = useRef(false);
  const dragStartClientX = useRef(0);
  const dragStartOffset  = useRef(0);

  // 选牌延迟保护
  useEffect(() => {
    const timer = setTimeout(() => setCanSelect(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  // ── RAF 主循环：位置直接写入 DOM ──────────────────────────────────────────
  useEffect(() => {
    const loop = () => {
      // 1. 手势速度 / 吸附
      if (!isDragging.current) {
        if (snapTargetRef.current !== null) {
          // 吸附动画（lerp 趋近）
          const diff = snapTargetRef.current - scrollOffsetRef.current;
          if (Math.abs(diff) < 0.005) {
            scrollOffsetRef.current = snapTargetRef.current;
            snapTargetRef.current   = null;
          } else {
            scrollOffsetRef.current += diff * 0.18;
          }
        } else if (scrollVelocityRef) {
          const v = scrollVelocityRef.current ?? 0;
          if (Math.abs(v) > 0.0005) {
            scrollOffsetRef.current += v * SCROLL_SPEED;
          }
        }
      }

      // 2. 握拳蓄力进度
      if (fistProgressRef) {
        const p = fistProgressRef.current ?? 0;
        setChargeProgress(prev => Math.abs(prev - p) > 0.015 ? p : prev);
      }

      // 3. 直接写入 DOM（绕过 React re-render）
      const offset   = scrollOffsetRef.current;
      const rounded  = Math.round(offset);
      const frac     = offset - rounded;

      for (let i = 0; i < N_VISIBLE; i++) {
        const el = cardRefs.current[i];
        if (!el) continue;

        const d        = (i - ARC_HALF) - frac;  // d=0 时在视觉中心
        const theta    = d * ARC_STEP_RAD;
        const thetaDeg = d * ARC_STEP_DEG;
        // 以牌底为旋转轴：只需横向扩展，不需要额外的 y 偏移
        // ARC_LIFT 让边缘牌锚点稍微下沉，增强弧感
        const x        = Math.sin(theta) * ARC_RADIUS;
        const y        = ARC_LIFT * (1 - Math.cos(theta));
        const scale    = Math.max(MIN_SCALE, 1 - Math.abs(d) * SCALE_FACTOR);
        const opacity  = Math.max(MIN_OPACITY, 1 - Math.abs(d) * OPACITY_FACTOR);
        const z        = Math.max(0, 10 - Math.round(Math.abs(d)));

        // transformOrigin 已设为 50% 100%，rotateZ 以牌底为轴旋转
        el.style.transform = `translateX(${x.toFixed(1)}px) translateY(${y.toFixed(1)}px) rotateZ(${thetaDeg.toFixed(2)}deg) scale(${scale.toFixed(3)})`;
        el.style.opacity   = opacity.toFixed(3);
        el.style.zIndex    = String(z);
      }

      // 4. 每 4 帧更新牌面内容（state，触发 React re-render）
      frameCountRef.current++;
      if (frameCountRef.current % 4 === 0) {
        const step = Math.round(scrollOffsetRef.current);
        const newCards = Array.from({ length: N_VISIBLE }, (_, i) => {
          const s = step + i - ARC_HALF;
          return shuffledOrder[((s % TOTAL_CARDS) + TOTAL_CARDS) % TOTAL_CARDS];
        });
        setCards(prev => prev.every((c, i) => c === newCards[i]) ? prev : newCards);
      }

      rafIdRef.current = requestAnimationFrame(loop);
    };

    rafIdRef.current = requestAnimationFrame(loop);
    return () => { if (rafIdRef.current !== null) cancelAnimationFrame(rafIdRef.current); };
  }, [scrollVelocityRef, fistProgressRef, shuffledOrder]);

  // ── 鼠标拖拽（window 级监听）──────────────────────────────────────────────
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      const deltaCards = (e.clientX - dragStartClientX.current) / DRAG_PX_PER_CARD;
      // 注意：向右拖 → deltaCards > 0 → scrollOffset 减小 → 牌向右移
      scrollOffsetRef.current = dragStartOffset.current - deltaCards;
      snapTargetRef.current   = null;
    };
    const handleMouseUp = () => {
      if (!isDragging.current) return;
      isDragging.current    = false;
      snapTargetRef.current = Math.round(scrollOffsetRef.current);
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup',   handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup',   handleMouseUp);
    };
  }, []);

  // ── 离散滑动回退（无摄像头时）────────────────────────────────────────────
  useEffect(() => {
    if (scrollVelocityRef) return;
    if (swipeDirection === 'left') {
      snapTargetRef.current = Math.round(scrollOffsetRef.current) + 1;
    } else if (swipeDirection === 'right') {
      snapTargetRef.current = Math.round(scrollOffsetRef.current) - 1;
    }
  }, [swipeDirection]);

  // ── 握拳选牌 ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!canSelect || !isFist || selectedCard !== null) return;
    const frontCard = cards[ARC_HALF];
    if (!drawnCardIndices.includes(frontCard)) {
      handleCardClick(frontCard);
    }
  }, [isFist]);

  // ── 处理函数 ──────────────────────────────────────────────────────────────

  const handleCardClick = useCallback((index: number) => {
    if (selectedCard !== null || drawnCardIndices.includes(index)) return;
    setSelectedCard(index);
    const reversed = Math.random() > 0.5;
    setIsReversed(reversed);
    setTimeout(() => setIsFlipped(true), 800);
  }, [selectedCard, drawnCardIndices]);

  const handleOverlayClick = useCallback(() => {
    if (isFlipped && selectedCard !== null) {
      const card     = selectedCard;
      const reversed = isReversed;
      setSelectedCard(null);
      setIsFlipped(false);
      setIsReversed(false);
      onCardSelect(card, reversed);
    }
  }, [isFlipped, selectedCard, isReversed, onCardSelect]);

  // ─── 渲染 ─────────────────────────────────────────────────────────────────

  return (
    <div
      className="relative w-full h-full overflow-hidden select-none"
      style={{ cursor: 'grab' }}
      onMouseDown={(e) => {
        isDragging.current       = true;
        dragStartClientX.current = e.clientX;
        dragStartOffset.current  = scrollOffsetRef.current;
        snapTargetRef.current    = null;
        e.preventDefault();
      }}
    >
      {/* 扇形牌堆：锚点在屏幕下方，牌从底部向上展开（如手持牌扇）*/}
      <div
        className="absolute"
        style={{ left: '50%', top: '62%', width: 0, height: 0 }}
      >
        {cards.map((cardIndex, i) => {
          const isCenter   = i === ARC_HALF;
          const isDrawn    = drawnCardIndices.includes(cardIndex);
          const isSelected = selectedCard === cardIndex;
          const chargeGlow = isCenter && chargeProgress > 0;
          const glowSize   = chargeGlow ? 20 + chargeProgress * 80 : 0;

          return (
            <div
              key={i}
              ref={el => { cardRefs.current[i] = el!; }}
              className="absolute"
              style={{
                width:           CARD_WIDTH,
                height:          CARD_HEIGHT,
                marginLeft:      -CARD_WIDTH / 2,
                marginTop:       -CARD_HEIGHT,   // 牌底部对齐锚点，向上展开
                transformOrigin: '50% 100%',     // 以牌底中心为旋转轴（扇形效果）
                willChange:      'transform, opacity',
                visibility:      isSelected ? 'hidden' : 'visible',
              }}
              onClick={() => isCenter && canSelect && !isDrawn && handleCardClick(cardIndex)}
            >
              {/* 牌背 */}
              <div
                className="w-full h-full rounded-xl overflow-hidden"
                style={{
                  boxShadow: chargeGlow
                    ? `0 0 ${glowSize}px rgba(255,255,255,${0.4 + chargeProgress * 0.5}), 0 0 ${glowSize * 0.5}px rgba(251,191,36,0.85)`
                    : isCenter
                    ? '0 0 24px rgba(251,191,36,0.3)'
                    : 'none',
                }}
              >
                <CardBackSVG />
              </div>

              {/* 中心牌高亮环 + 蓄力弧 */}
              {isCenter && (
                <>
                  <div className="absolute inset-0 rounded-xl ring-2 ring-amber-400/70 pointer-events-none" />
                  {chargeProgress > 0 && (
                    <div
                      className="absolute inset-0 rounded-xl pointer-events-none"
                      style={{
                        background: `conic-gradient(rgba(251,191,36,${chargeProgress * 0.6}) ${chargeProgress * 360}deg, transparent ${chargeProgress * 360}deg)`,
                        mask: 'radial-gradient(farthest-side, transparent calc(100% - 4px), white calc(100% - 4px))',
                        WebkitMask: 'radial-gradient(farthest-side, transparent calc(100% - 4px), white calc(100% - 4px))',
                      }}
                    />
                  )}
                </>
              )}

              {/* 已抽覆盖层 */}
              {isDrawn && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-xl">
                  <div className="text-amber-400/60 text-2xl">✓</div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ▲ 当前牌指示：紧贴扇形锚点（62%）下方 */}
      <div className="absolute left-1/2 -translate-x-1/2 text-amber-400/40 text-[10px] tracking-widest pointer-events-none font-mystic"
           style={{ top: 'calc(62% + 8px)' }}>
        ▲ 当前牌
      </div>

      {/* 倾斜方向提示 */}
      <div className="absolute left-5 text-amber-400/25 pointer-events-none font-mystic flex flex-col items-center gap-1"
           style={{ top: '38%' }}>
        <span className="text-2xl">↙</span>
        <span className="text-[9px] tracking-widest">左倾</span>
      </div>
      <div className="absolute right-5 text-amber-400/25 pointer-events-none font-mystic flex flex-col items-center gap-1"
           style={{ top: '38%' }}>
        <span className="text-2xl">↘</span>
        <span className="text-[9px] tracking-widest">右倾</span>
      </div>

      {/* 底部握拳提示 */}
      {canSelect && (
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 text-amber-400/50 text-xs tracking-widest pointer-events-none">
          握拳1秒 · 抓取当前牌
        </div>
      )}

      {/* 翻牌浮层（fixed，不受扇形容器影响）*/}
      <AnimatePresence>
        {selectedCard !== null && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleOverlayClick}
          >
            <motion.div
              className="relative w-[300px] h-[480px] md:w-[360px] md:h-[580px] rounded-2xl cursor-pointer"
              initial={{ scale: 0.5, y: 200 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ type: 'spring', damping: 15 }}
            >
              <motion.div
                className="w-full h-full relative preserve-3d transition-transform duration-1000"
                animate={{ rotateY: isFlipped ? 180 : 0 }}
                style={{ transformStyle: 'preserve-3d' }}
                onClick={handleOverlayClick}
              >
                {/* 牌背（浮层大尺寸） */}
                <div className="absolute inset-0 backface-hidden rounded-2xl overflow-hidden shadow-[0_0_60px_rgba(124,58,237,0.6)]">
                  <CardBackSVG />
                </div>

                {/* 牌面 */}
                <div
                  className="absolute inset-0 backface-hidden rounded-2xl bg-[#0f0f1a] border-2 border-amber-400 overflow-hidden flex items-center justify-center shadow-[0_0_50px_rgba(251,191,36,0.3)]"
                  style={{ transform: 'rotateY(180deg)' }}
                >
                  <img
                    src={`${import.meta.env.BASE_URL}assets/cards/card_${selectedCard}.png`}
                    alt={`Card ${selectedCard}`}
                    className={`w-full h-full object-cover ${isReversed ? 'rotate-180' : ''}`}
                    style={{ filter: isReversed ? 'brightness(0.9) sepia(0.1)' : 'none' }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/10 to-white/0 pointer-events-none" />
                </div>
              </motion.div>

              {isFlipped && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="absolute -bottom-16 left-0 right-0 text-center text-white/50 text-sm"
                >
                  点击任意处继续
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
