import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface CardDeckProps {
  onCardSelect: (cardIndex: number, isReversed: boolean) => void;
  swipeDirection: 'left' | 'right' | 'down' | null;
  drawnCardIndices: number[];
  isFist: boolean;
}

const TOTAL_CARDS = 78;
const CARD_WIDTH = 140;
const CARD_HEIGHT = 220;
const GAP = 100;

// ── Shared card back design ──────────────────────────────────────────────────
const CardBack: React.FC<{ large?: boolean }> = ({ large = false }) => {
  const outerDiamond = large ? 'w-[140px] h-[140px]' : 'w-[72px] h-[72px]';
  const midDiamond   = large ? 'w-[100px] h-[100px]' : 'w-[52px] h-[52px]';
  const innerDiamond = large ? 'w-[64px]  h-[64px]'  : 'w-[34px] h-[34px]';
  const coreDot      = large ? 'w-5 h-5 blur-[5px]'  : 'w-3 h-3 blur-[3px]';
  const moonText     = large ? 'text-[16px]'          : 'text-[10px]';
  const inset        = large ? 'inset-[7px]'          : 'inset-[4px]';
  const topLine      = large ? 'top-[22px]'           : 'top-[11px]';
  const botLine      = large ? 'bottom-[22px]'        : 'bottom-[11px]';
  const lineX        = large ? 'left-[24px] right-[24px]' : 'left-[12px] right-[12px]';
  const moonTop      = large ? 'top-[32px]'           : 'top-[18px]';
  const borderRad    = large ? 'rounded-[15px]'       : 'rounded-[9px]';

  return (
    <div
      className="absolute inset-0 overflow-hidden"
      style={{
        background: 'radial-gradient(ellipse at 35% 25%, #4c1d95 0%, #1a0a3e 50%, #04020e 100%)',
      }}
    >
      {/* Star-dot texture */}
      <div
        className="absolute inset-0 opacity-50"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(251,191,36,0.35) 1px, transparent 0)',
          backgroundSize: '14px 14px',
        }}
      />

      {/* Inner violet radial glow */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at 50% 50%, rgba(139,92,246,0.25) 0%, transparent 62%)',
        }}
      />

      {/* Inner offset glow highlight */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at 30% 20%, rgba(109,40,217,0.3) 0%, transparent 45%)',
        }}
      />

      {/* Three concentric rotating diamonds */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className={`absolute ${outerDiamond} border border-amber-400/45 rotate-45`} />
        <div className={`absolute ${midDiamond}   border border-violet-300/35 rotate-[22.5deg]`} />
        <div className={`absolute ${innerDiamond} border border-amber-300/30 rotate-45`} />
        <div className={`absolute ${coreDot} rounded-full bg-amber-300/55`} />
      </div>

      {/* Inner ornament border */}
      <div className={`absolute ${inset} ${borderRad} border border-amber-400/40`} />

      {/* Top & bottom decorative lines */}
      <div className={`absolute ${topLine} ${lineX} h-px bg-gradient-to-r from-transparent via-amber-400/55 to-transparent`} />
      <div className={`absolute ${botLine} ${lineX} h-px bg-gradient-to-r from-transparent via-amber-400/55 to-transparent`} />

      {/* Moon / star header */}
      <div className={`absolute ${moonTop} left-0 right-0 flex justify-center`}>
        <span className={`text-amber-300/40 ${moonText} leading-none tracking-widest`}>☽ ✦ ☾</span>
      </div>

      {/* Hover inner glow (only for small deck cards; large = always visible) */}
      {!large && (
        <div
          className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{ boxShadow: 'inset 0 0 22px rgba(251,191,36,0.15)' }}
        />
      )}
    </div>
  );
};

export const CardDeck: React.FC<CardDeckProps> = ({ onCardSelect, swipeDirection, drawnCardIndices, isFist }) => {
  const [scrollPosition, setScrollPosition] = useState(0);
  const [selectedCard, setSelectedCard] = useState<number | null>(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isReversed, setIsReversed] = useState(false);
  const [centerIndex, setCenterIndex] = useState(0);
  const [canSelect, setCanSelect] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const availableCards = Array.from({ length: TOTAL_CARDS })
    .map((_, index) => index)
    .filter(index => !drawnCardIndices.includes(index));

  // Delay selection capability to prevent accidental triggers
  useEffect(() => {
    const timer = setTimeout(() => {
      setCanSelect(true);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  // Calculate center index based on scroll position
  useEffect(() => {
    const index = Math.round(scrollPosition / (CARD_WIDTH + GAP));
    setCenterIndex(Math.max(0, Math.min(index, availableCards.length - 1)));
  }, [scrollPosition, availableCards.length]);

  // Handle Swipe — hand moves right → next card, hand moves left → previous card
  useEffect(() => {
    if (swipeDirection === 'right') {
      const nextIndex = Math.min(centerIndex + 1, availableCards.length - 1);
      setScrollPosition(nextIndex * (CARD_WIDTH + GAP));
    } else if (swipeDirection === 'left') {
      const nextIndex = Math.max(centerIndex - 1, 0);
      setScrollPosition(nextIndex * (CARD_WIDTH + GAP));
    }
  }, [swipeDirection]);

  // Handle Pinch Selection
  useEffect(() => {
    if (canSelect && isFist && selectedCard === null && availableCards[centerIndex] !== undefined) {
      handleCardClick(availableCards[centerIndex]);
    }
  }, [isFist, centerIndex, selectedCard, availableCards, canSelect]);

  const handleCardClick = (index: number) => {
    if (selectedCard === null) {
      setSelectedCard(index);
      const reversed = Math.random() > 0.5;
      setIsReversed(reversed);
      setTimeout(() => {
        setIsFlipped(true);
      }, 800);
    }
  };

  const handleOverlayClick = () => {
    if (isFlipped && selectedCard !== null) {
      const card = selectedCard;
      const reversed = isReversed;
      setSelectedCard(null);
      setIsFlipped(false);
      setIsReversed(false);
      onCardSelect(card, reversed);
    }
  };

  const isPinching = isFist && canSelect && selectedCard === null;

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
      {/* Scrollable Deck */}
      <motion.div
        className="flex items-center h-full px-8"
        style={{
          gap: GAP,
          paddingLeft: `calc(50vw - ${CARD_WIDTH / 2}px)`,
          paddingRight: `calc(50vw - ${CARD_WIDTH / 2}px)`,
        }}
        animate={{ x: -scrollPosition }}
        transition={{ type: 'spring', stiffness: 100, damping: 20 }}
        drag="x"
        dragConstraints={{
          left: -((availableCards.length - 1) * (CARD_WIDTH + GAP)),
          right: 0,
        }}
        onDrag={(e, info) => {
          setScrollPosition((prev) => prev - info.delta.x);
        }}
        onDragEnd={(e, info) => {
          const itemWidth = CARD_WIDTH + GAP;
          const velocityFactor = 0.2;
          const projectedPosition = scrollPosition - info.velocity.x * velocityFactor;
          const nearestIndex = Math.round(projectedPosition / itemWidth);
          const clampedIndex = Math.max(0, Math.min(nearestIndex, availableCards.length - 1));
          setScrollPosition(clampedIndex * itemWidth);
        }}
      >
        {availableCards.map((cardIndex, i) => {
          const isSelected = selectedCard === cardIndex;
          if (isSelected) return <div key={cardIndex} style={{ width: CARD_WIDTH, height: CARD_HEIGHT }} className="shrink-0" />;

          const isCenter = i === centerIndex;

          return (
            <motion.div
              key={cardIndex}
              style={{ width: CARD_WIDTH, height: CARD_HEIGHT }}
              className={`shrink-0 rounded-xl cursor-pointer relative overflow-visible group ${isCenter ? 'z-10' : 'z-0 opacity-70'}`}
              animate={{
                scale: isCenter ? 1.3 : 1,
                y: isCenter ? -20 : 0,
              }}
              onClick={() => handleCardClick(cardIndex)}
            >
              {/* Card back — rounded clip wrapper */}
              <div className="absolute inset-0 rounded-xl overflow-hidden border border-amber-500/50 shadow-lg">
                <CardBack />
              </div>

              {/* Static amber ring for center card */}
              {isCenter && !isPinching && (
                <div className="absolute inset-0 rounded-xl ring-2 ring-amber-400/50 shadow-[0_0_20px_rgba(251,191,36,0.3)] pointer-events-none" />
              )}

              {/* Pinch active — pulsing selection ring */}
              {isCenter && isPinching && (
                <>
                  <motion.div
                    className="absolute inset-[-4px] rounded-xl pointer-events-none"
                    animate={{ opacity: [0.6, 1, 0.6] }}
                    transition={{ duration: 0.35, repeat: Infinity, ease: 'easeInOut' }}
                    style={{
                      border: '2px solid rgba(251,191,36,0.95)',
                      boxShadow: '0 0 28px rgba(251,191,36,0.75), 0 0 55px rgba(139,92,246,0.5)',
                    }}
                  />
                  <motion.div
                    className="absolute -top-8 left-0 right-0 flex justify-center pointer-events-none"
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <span className="font-mystic text-amber-300 text-[10px] tracking-widest bg-black/50 px-2 py-0.5 rounded-full">
                      松手即选
                    </span>
                  </motion.div>
                </>
              )}
            </motion.div>
          );
        })}
      </motion.div>

      {/* Selected Card Overlay */}
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
              style={{ perspective: '1200px' }}
              initial={{ scale: 0.5, y: 200 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ type: 'spring', damping: 15 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Flip container — framer-motion only, no CSS transition class */}
              <motion.div
                className="w-full h-full relative preserve-3d"
                animate={{ rotateY: isFlipped ? 540 : 0 }}
                transition={{ duration: 1.1, ease: [0.4, 0, 0.2, 1] }}
                style={{ transformStyle: 'preserve-3d' }}
                onClick={handleOverlayClick}
              >
                {/* Card Back (large, high-res) */}
                <div className="absolute inset-0 backface-hidden rounded-2xl overflow-hidden border border-amber-500/80 shadow-[0_0_60px_rgba(109,40,217,0.6)]">
                  <CardBack large />
                </div>

                {/* Card Front */}
                <div
                  className="absolute inset-0 backface-hidden rounded-2xl bg-[#0f0f1a] border-2 border-amber-400 overflow-hidden flex items-center justify-center shadow-[0_0_50px_rgba(251,191,36,0.3)]"
                  style={{
                    transform: 'rotateY(180deg)',
                    filter: isReversed ? 'brightness(0.9) sepia(0.1)' : 'none',
                  }}
                >
                  <img
                    src={`/assets/cards/card_${selectedCard}.png`}
                    alt={`Card ${selectedCard}`}
                    className={`w-full h-full object-cover ${isReversed ? 'rotate-180' : ''}`}
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
