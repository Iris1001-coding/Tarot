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

  // Handle Swipe
  useEffect(() => {
    if (swipeDirection === 'left') {
      const nextIndex = Math.min(centerIndex + 1, availableCards.length - 1);
      setScrollPosition(nextIndex * (CARD_WIDTH + GAP));
    } else if (swipeDirection === 'right') {
      const nextIndex = Math.max(centerIndex - 1, 0);
      setScrollPosition(nextIndex * (CARD_WIDTH + GAP));
    }
  }, [swipeDirection]);

  // Handle Fist Selection
  useEffect(() => {
    if (canSelect && isFist && selectedCard === null && availableCards[centerIndex] !== undefined) {
      handleCardClick(availableCards[centerIndex]);
    }
  }, [isFist, centerIndex, selectedCard, availableCards, canSelect]);

  const handleCardClick = (index: number) => {
    if (selectedCard === null) {
      setSelectedCard(index);
      // Determine if reversed (50% chance)
      const reversed = Math.random() > 0.5;
      setIsReversed(reversed);
      
      // Auto flip after a short delay
      setTimeout(() => {
        setIsFlipped(true);
      }, 800);
    }
  };

  const handleOverlayClick = () => {
    if (isFlipped && selectedCard !== null) {
      // Close overlay and notify parent
      const card = selectedCard;
      const reversed = isReversed;
      
      // Reset local state
      setSelectedCard(null);
      setIsFlipped(false);
      setIsReversed(false);
      
      // Notify parent
      onCardSelect(card, reversed);
    }
  };

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
      {/* Scrollable Deck */}
      <motion.div 
        className="flex items-center h-full px-8"
        style={{ 
          gap: GAP,
          paddingLeft: `calc(50vw - ${CARD_WIDTH / 2}px)`, 
          paddingRight: `calc(50vw - ${CARD_WIDTH / 2}px)` 
        }}
        animate={{ x: -scrollPosition }}
        transition={{ type: 'spring', stiffness: 100, damping: 20 }}
        drag="x"
        dragConstraints={{ 
          left: -((availableCards.length - 1) * (CARD_WIDTH + GAP)), 
          right: 0 
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
              className={`shrink-0 rounded-xl cursor-pointer relative overflow-hidden group transition-all duration-300 ${isCenter ? 'z-10' : 'z-0 opacity-70'}`}
              animate={{ 
                scale: isCenter ? 1.3 : 1,
                y: isCenter ? -20 : 0
              }}
              onClick={() => handleCardClick(cardIndex)}
            >
              {/* Enhanced Card Back */}
              <div className="absolute inset-0 bg-[#1a1a2e] border-2 border-amber-500/40 rounded-xl overflow-hidden shadow-lg group-hover:border-amber-400/80 group-hover:shadow-[0_0_20px_rgba(139,92,246,0.4)] transition-all duration-300">
                {/* Mystic Texture */}
                <div className="absolute inset-0 opacity-30" 
                  style={{
                    backgroundImage: `radial-gradient(circle at 2px 2px, rgba(251, 191, 36, 0.2) 1px, transparent 0)`,
                    backgroundSize: '12px 12px'
                  }}
                />
                {/* Mystic Pattern */}
                <div className="absolute inset-0 opacity-40" 
                  style={{
                    backgroundImage: `
                      radial-gradient(circle at 50% 50%, transparent 20%, rgba(139, 92, 246, 0.1) 21%, transparent 22%),
                      radial-gradient(circle at 50% 50%, transparent 35%, rgba(251, 191, 36, 0.1) 36%, transparent 37%),
                      conic-gradient(from 0deg, transparent 0deg, rgba(139, 92, 246, 0.1) 90deg, transparent 180deg, rgba(139, 92, 246, 0.1) 270deg, transparent 360deg)
                    `
                  }}
                />
                <div className="absolute inset-2 border border-purple-400/30 rounded-lg flex items-center justify-center group-hover:border-purple-400/60 transition-colors">
                   <div className="w-16 h-16 border border-amber-500/20 rotate-45 group-hover:border-amber-500/40 transition-colors" />
                   <div className="absolute w-12 h-12 border border-purple-500/20 rotate-45 group-hover:border-purple-500/40 transition-colors" />
                </div>
                {/* Center Emblem */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400/20 to-purple-600/20 border border-amber-300/40 blur-[1px] group-hover:blur-[2px] transition-all" />
                </div>
              </div>
              
              {/* Glow effect for center card */}
              {isCenter && (
                <div className="absolute inset-0 rounded-xl ring-2 ring-amber-400/50 shadow-[0_0_20px_rgba(251,191,36,0.3)]" />
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
            onClick={handleOverlayClick} // Click anywhere to close
          >
            <motion.div
              className="relative w-[300px] h-[480px] md:w-[360px] md:h-[580px] rounded-2xl cursor-pointer perspective-1000"
              initial={{ scale: 0.5, y: 200 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ type: 'spring', damping: 15 }}
              onClick={(e) => e.stopPropagation()} // Prevent closing when clicking card itself (optional, but user asked for "click anywhere", usually implies background. Let's allow clicking card too to be safe, or just background. User said "click arbitrary position", so clicking card should probably also work or just background. Let's make clicking background close it. Actually user said "only user click arbitrary position card will disappear". So clicking card should also close it.)
            >
              <motion.div
                className="w-full h-full relative preserve-3d transition-transform duration-1000"
                animate={{ rotateY: isFlipped ? 180 : 0 }}
                style={{ transformStyle: 'preserve-3d' }}
                onClick={handleOverlayClick}
              >
                {/* Card Back (High Res) */}
                <div className="absolute inset-0 backface-hidden rounded-2xl bg-[#1a1a2e] border-2 border-amber-500 shadow-[0_0_50px_rgba(147,51,234,0.5)] overflow-hidden">
                   <div className="absolute inset-0 opacity-40" 
                      style={{
                        backgroundImage: `
                          radial-gradient(circle at 50% 50%, transparent 20%, rgba(139, 92, 246, 0.2) 21%, transparent 22%),
                          radial-gradient(circle at 50% 50%, transparent 35%, rgba(251, 191, 36, 0.2) 36%, transparent 37%),
                          conic-gradient(from 0deg, transparent 0deg, rgba(139, 92, 246, 0.2) 90deg, transparent 180deg, rgba(139, 92, 246, 0.2) 270deg, transparent 360deg)
                        `
                      }}
                    />
                    <div className="absolute inset-4 border-2 border-purple-400/50 rounded-xl flex items-center justify-center">
                       <div className="w-24 h-24 border-2 border-amber-500/30 rotate-45" />
                    </div>
                </div>

                {/* Card Front */}
                <div 
                  className="absolute inset-0 backface-hidden rounded-2xl bg-[#0f0f1a] border-2 border-amber-400 overflow-hidden flex items-center justify-center shadow-[0_0_50px_rgba(251,191,36,0.3)]"
                  style={{ 
                    transform: 'rotateY(180deg)',
                    filter: isReversed ? 'brightness(0.9) sepia(0.1)' : 'none'
                  }}
                >
                  <img 
                    src={`/assets/cards/card_${selectedCard}.png`} 
                    alt={`Card ${selectedCard}`}
                    className={`w-full h-full object-cover ${isReversed ? 'rotate-180' : ''}`}
                  />
                  {/* Shine effect */}
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
