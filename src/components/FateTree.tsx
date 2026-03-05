import React from 'react';
import { motion } from 'framer-motion';
import { DrawnCard } from '../services/tarotService';

export interface FateSession {
  id: string;
  date: string;
  question: string;
  spreadName: string;
  cards: DrawnCard[];
  interpretation: string;
}

interface FateTreeProps {
  sessions: FateSession[];
  onSelectSession: (session: FateSession) => void;
}

export const FateTree: React.FC<FateTreeProps> = ({ sessions, onSelectSession }) => {
  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
      {/* Tree SVG Background */}
      <svg className="absolute w-full h-full opacity-30 pointer-events-none" viewBox="0 0 800 800" preserveAspectRatio="xMidYMax meet">
        <path d="M400,800 C400,600 350,500 300,400 C250,300 150,250 100,200" stroke="#f1c40f" strokeWidth="2" fill="none" />
        <path d="M400,800 C400,600 450,500 500,400 C550,300 650,250 700,200" stroke="#f1c40f" strokeWidth="2" fill="none" />
        <path d="M400,800 C400,500 400,300 400,100" stroke="#f1c40f" strokeWidth="3" fill="none" />
        <path d="M300,400 C350,350 400,350 450,300" stroke="#f1c40f" strokeWidth="1.5" fill="none" />
        <path d="M500,400 C450,350 400,350 350,300" stroke="#f1c40f" strokeWidth="1.5" fill="none" />
      </svg>

      {/* Fruits (Sessions) */}
      <div className="relative w-full max-w-2xl h-[600px]">
        {sessions.map((session, index) => {
          // Distribute fruits pseudo-randomly but consistently based on index
          const angle = (index * 137.5) % 360;
          const radius = 100 + (index * 15) % 200;
          const x = Math.cos(angle * (Math.PI / 180)) * radius + 50; // percentage
          const y = Math.sin(angle * (Math.PI / 180)) * radius + 40; // percentage

          return (
            <motion.div
              key={session.id}
              className="absolute w-8 h-8 rounded-full bg-[#e94560] shadow-[0_0_15px_#e94560] cursor-pointer flex items-center justify-center hover:scale-125 transition-transform"
              style={{ left: `${x}%`, top: `${y}%` }}
              onClick={() => onSelectSession(session)}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="w-2 h-2 bg-[#f1c40f] rounded-full animate-pulse" />
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
