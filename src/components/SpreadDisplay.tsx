import React from 'react';
import { motion } from 'framer-motion';
import { DrawnCard } from '../services/tarotService';

interface SpreadDisplayProps {
  spreadName: string;
  cards: DrawnCard[];
}

export const SpreadDisplay: React.FC<SpreadDisplayProps> = ({ spreadName, cards }) => {
  const getLayoutClass = () => {
    switch (spreadName) {
      case '每日启示':
        return 'flex justify-center items-center h-full';
      case '时间之流':
        return 'flex justify-center items-center gap-4 md:gap-8 h-full';
      case '圣三角':
        return 'relative w-full max-w-2xl mx-auto h-[600px] flex justify-center items-center';
      case '塞尔特大十字':
        return 'relative w-full max-w-4xl mx-auto h-[800px] flex justify-center items-center';
      default:
        return 'flex justify-center items-center h-full flex-wrap gap-4';
    }
  };

  const getCardStyle = (index: number) => {
    if (spreadName === '圣三角') {
      // 0: Problem (Bottom Left), 1: Environment (Bottom Right), 2: Solution (Top Center)
      if (index === 0) return { position: 'absolute', bottom: '10%', left: '15%' };
      if (index === 1) return { position: 'absolute', bottom: '10%', right: '15%' };
      if (index === 2) return { position: 'absolute', top: '10%', left: '50%', transform: 'translateX(-50%)' };
    }
    
    if (spreadName === '塞尔特大十字') {
      // Traditional Celtic Cross Layout
      // 0: Center (Present)
      // 1: Crossing (Obstacle) - rotated 90deg
      // 2: Top (Goal)
      // 3: Bottom (Root)
      // 4: Left (Past)
      // 5: Right (Future)
      // 6: Bottom Right (Self)
      // 7: Mid-Bottom Right (Environment)
      // 8: Mid-Top Right (Hopes/Fears)
      // 9: Top Right (Outcome)
      const baseLeft = '35%';
      const baseTop = '45%';
      
      if (index === 0) return { position: 'absolute', left: baseLeft, top: baseTop, transform: 'translate(-50%, -50%)', zIndex: 1 };
      if (index === 1) return { position: 'absolute', left: baseLeft, top: baseTop, transform: 'translate(-50%, -50%) rotate(90deg)', zIndex: 2 };
      if (index === 2) return { position: 'absolute', left: baseLeft, top: '15%', transform: 'translate(-50%, -50%)' };
      if (index === 3) return { position: 'absolute', left: baseLeft, top: '75%', transform: 'translate(-50%, -50%)' };
      if (index === 4) return { position: 'absolute', left: '15%', top: baseTop, transform: 'translate(-50%, -50%)' };
      if (index === 5) return { position: 'absolute', left: '55%', top: baseTop, transform: 'translate(-50%, -50%)' };
      
      // Staff on the right
      const staffLeft = '85%';
      if (index === 6) return { position: 'absolute', left: staffLeft, top: '80%', transform: 'translate(-50%, -50%)' };
      if (index === 7) return { position: 'absolute', left: staffLeft, top: '60%', transform: 'translate(-50%, -50%)' };
      if (index === 8) return { position: 'absolute', left: staffLeft, top: '40%', transform: 'translate(-50%, -50%)' };
      if (index === 9) return { position: 'absolute', left: staffLeft, top: '20%', transform: 'translate(-50%, -50%)' };
    }
    return {};
  };

  return (
    <div className="w-full h-full relative p-4 md:p-8 overflow-y-auto custom-scrollbar">
      <div className={getLayoutClass() as string}>
        {cards.map((card, idx) => {
          const style = getCardStyle(idx) as React.CSSProperties;
          const isAbsolute = style.position === 'absolute';
          
          return (
            <motion.div
              key={idx}
              className={`flex flex-col items-center gap-2 ${!isAbsolute ? 'relative' : ''}`}
              style={style}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.15, type: 'spring' }}
            >
              <div className="text-[#f1c40f] text-xs md:text-sm font-serif tracking-widest uppercase bg-black/50 px-2 py-1 rounded backdrop-blur-sm whitespace-nowrap z-10">
                {card.positionName}
              </div>
              <div className="relative w-[80px] h-[128px] md:w-[120px] md:h-[192px] rounded-xl border-2 border-[#f1c40f] overflow-hidden shadow-[0_0_20px_rgba(241,196,15,0.3)] bg-[#1a1a2e]">
                <img
                  src={`/assets/cards/card_${card.index}.png`}
                  alt={`Card ${card.index}`}
                  className={`w-full h-full object-cover ${card.isReversed ? 'rotate-180' : ''}`}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.parentElement!.innerHTML += `<div class="text-[#f1c40f] text-lg font-serif text-center p-2 flex items-center justify-center h-full ${card.isReversed ? 'rotate-180' : ''}">Card ${card.index}<br/><span class="text-[10px] text-[#e94560]">${card.isReversed ? '逆位' : '正位'}</span></div>`;
                  }}
                />
              </div>
              <div className="text-[#e94560] text-[10px] md:text-xs tracking-widest bg-black/50 px-2 py-1 rounded backdrop-blur-sm z-10">
                {card.isReversed ? '逆位' : '正位'}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
