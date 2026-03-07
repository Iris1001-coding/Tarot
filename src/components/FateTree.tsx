import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toPng } from 'html-to-image';
import { DrawnCard } from '../services/tarotService';
import { ExportCard } from './ExportCard';
import { X, Download, Trash2 } from 'lucide-react';

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
  onDeleteSession: (id: string) => void;
}

export const FateTree: React.FC<FateTreeProps> = ({ sessions, onSelectSession, onDeleteSession }) => {
  const [activeSession, setActiveSession] = useState<FateSession | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  const handleExport = async () => {
    if (!exportRef.current || isExporting || !activeSession) return;
    setIsExporting(true);
    try {
      await new Promise(r => setTimeout(r, 100));
      const dataUrl = await toPng(exportRef.current, { pixelRatio: 2, cacheBust: true });
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `命运星尘_${activeSession.date.replace(/\//g, '-')}.png`;
      a.click();
    } catch (e) {
      console.error('Export failed:', e);
    } finally {
      setIsExporting(false);
    }
  };

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
          const angle = (index * 137.5) % 360;
          const radius = 100 + (index * 15) % 200;
          const x = Math.cos(angle * (Math.PI / 180)) * radius + 50;
          const y = Math.sin(angle * (Math.PI / 180)) * radius + 40;

          return (
            <motion.div
              key={session.id}
              className="absolute w-8 h-8 rounded-full bg-[#e94560] shadow-[0_0_15px_#e94560] cursor-pointer flex items-center justify-center hover:scale-125 transition-transform"
              style={{ left: `${x}%`, top: `${y}%` }}
              onClick={() => setActiveSession(session)}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="w-2 h-2 bg-[#f1c40f] rounded-full animate-pulse" />
            </motion.div>
          );
        })}
      </div>

      {/* Session Detail Panel */}
      <AnimatePresence>
        {activeSession && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => { setActiveSession(null); setDeleteConfirm(false); }}
          >
            <motion.div
              className="relative w-full max-w-lg max-h-[80vh] overflow-y-auto bg-purple-950/60 backdrop-blur-xl border border-amber-400/15 rounded-3xl p-7 shadow-[0_0_60px_rgba(147,51,234,0.2)] custom-scrollbar"
              initial={{ scale: 0.9, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 30 }}
              onClick={e => e.stopPropagation()}
            >
              {/* Close */}
              <button
                className="absolute top-4 right-4 p-1.5 hover:bg-white/10 rounded-full transition-colors"
                onClick={() => { setActiveSession(null); setDeleteConfirm(false); }}
              >
                <X className="w-4 h-4 text-white/40 hover:text-white/70" />
              </button>

              {/* Header */}
              <div className="mb-5">
                <p className="font-mystic text-xs text-amber-300/60 tracking-[0.4em] uppercase mb-1">{activeSession.spreadName}</p>
                <p className="font-mystic text-xs text-white/30 tracking-widest">{activeSession.date}</p>
              </div>

              {/* Question */}
              <div className="mb-5 p-4 rounded-2xl bg-black/20 border border-white/5">
                <p className="font-mystic text-xs text-white/30 mb-1.5 tracking-widest uppercase">你的问题</p>
                <p className="font-mystic text-base italic text-white/80">"{activeSession.question}"</p>
              </div>

              {/* Cards */}
              <div className="mb-5">
                <p className="font-mystic text-xs text-white/30 mb-3 tracking-widest uppercase">抽到的牌</p>
                <div className="flex flex-wrap gap-2">
                  {activeSession.cards.map((c, i) => (
                    <div key={i} className="px-3 py-1.5 rounded-full bg-violet-900/30 border border-violet-400/20 text-xs font-mystic text-violet-200/80">
                      {c.positionName} · 第{c.index}号 · {c.isReversed ? '逆位' : '正位'}
                    </div>
                  ))}
                </div>
              </div>

              {/* Interpretation */}
              <div className="h-px bg-gradient-to-r from-transparent via-amber-400/20 to-transparent mb-5" />
              <div className="mb-6">
                {activeSession.interpretation.split('\n').map((p, i) =>
                  p.trim() ? (
                    <p key={i} className="font-mystic text-sm text-white/65 leading-relaxed mb-3">{p}</p>
                  ) : null
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => { setDeleteConfirm(false); setActiveSession(null); onSelectSession(activeSession); }}
                  className="flex-1 py-2.5 rounded-full bg-white/[0.04] border border-amber-400/20 font-mystic text-xs text-amber-200/70 tracking-[0.3em] hover:bg-white/[0.08] hover:border-amber-400/40 transition-all"
                >
                  重新查看
                </button>
                <button
                  onClick={handleExport}
                  disabled={isExporting}
                  className="flex-1 py-2.5 rounded-full bg-white/[0.04] border border-violet-400/20 font-mystic text-xs text-violet-200/70 tracking-[0.3em] hover:bg-white/[0.08] hover:border-violet-400/40 transition-all flex items-center justify-center gap-2 disabled:opacity-40"
                >
                  <Download className="w-3.5 h-3.5" />
                  {isExporting ? '生成中...' : '导出卡牌'}
                </button>
                <button
                  onClick={() => {
                    if (!deleteConfirm) {
                      setDeleteConfirm(true);
                    } else {
                      onDeleteSession(activeSession.id);
                      setActiveSession(null);
                      setDeleteConfirm(false);
                    }
                  }}
                  className={`flex-1 py-2.5 rounded-full font-mystic text-xs tracking-[0.3em] transition-all flex items-center justify-center gap-1.5 ${
                    deleteConfirm
                      ? 'bg-rose-900/30 border border-rose-400/50 text-rose-300/90'
                      : 'bg-white/[0.04] border border-white/10 text-white/30 hover:border-rose-400/30 hover:text-rose-300/60'
                  }`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  {deleteConfirm ? '确认删除' : '删除'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hidden off-screen ExportCard */}
      {activeSession && (
        <div style={{ position: 'absolute', left: '-9999px', top: 0, pointerEvents: 'none', zIndex: -1 }}>
          <ExportCard ref={exportRef} session={activeSession} />
        </div>
      )}
    </div>
  );
};
