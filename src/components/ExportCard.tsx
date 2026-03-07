import React, { forwardRef } from 'react';
import { FateSession } from './FateTree';

// Card names for the 78 Rider-Waite tarot cards (0-indexed)
const CARD_NAMES: Record<number, string> = {
  0: '愚者', 1: '魔术师', 2: '女祭司', 3: '女皇', 4: '皇帝',
  5: '教皇', 6: '恋人', 7: '战车', 8: '力量', 9: '隐士',
  10: '命运之轮', 11: '正义', 12: '倒吊人', 13: '死神', 14: '节制',
  15: '恶魔', 16: '塔', 17: '星星', 18: '月亮', 19: '太阳',
  20: '审判', 21: '世界',
  22: '权杖王牌', 23: '权杖二', 24: '权杖三', 25: '权杖四', 26: '权杖五',
  27: '权杖六', 28: '权杖七', 29: '权杖八', 30: '权杖九', 31: '权杖十',
  32: '权杖侍者', 33: '权杖骑士', 34: '权杖王后', 35: '权杖国王',
  36: '圣杯王牌', 37: '圣杯二', 38: '圣杯三', 39: '圣杯四', 40: '圣杯五',
  41: '圣杯六', 42: '圣杯七', 43: '圣杯八', 44: '圣杯九', 45: '圣杯十',
  46: '圣杯侍者', 47: '圣杯骑士', 48: '圣杯王后', 49: '圣杯国王',
  50: '宝剑王牌', 51: '宝剑二', 52: '宝剑三', 53: '宝剑四', 54: '宝剑五',
  55: '宝剑六', 56: '宝剑七', 57: '宝剑八', 58: '宝剑九', 59: '宝剑十',
  60: '宝剑侍者', 61: '宝剑骑士', 62: '宝剑王后', 63: '宝剑国王',
  64: '星币王牌', 65: '星币二', 66: '星币三', 67: '星币四', 68: '星币五',
  69: '星币六', 70: '星币七', 71: '星币八', 72: '星币九', 73: '星币十',
  74: '星币侍者', 75: '星币骑士', 76: '星币王后', 77: '星币国王',
};

interface ExportCardProps {
  session: FateSession;
}

export const ExportCard = forwardRef<HTMLDivElement, ExportCardProps>(
  ({ session }, ref) => {
    const paragraphs = session.interpretation
      .split('\n')
      .filter((p) => p.trim().length > 0);

    return (
      <div
        ref={ref}
        style={{
          width: '1080px',
          minHeight: '1920px',
          background: 'radial-gradient(ellipse at 30% 10%, #3b0764 0%, #1a0a3e 35%, #04020e 70%, #000000 100%)',
          fontFamily: '"Cinzel", "Noto Serif SC", "Source Han Serif", serif',
          color: '#f3e8d0',
          padding: '80px 80px 60px',
          boxSizing: 'border-box',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          gap: '0',
        }}
      >
        {/* Star dot texture */}
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.4,
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(251,191,36,0.4) 1px, transparent 0)',
          backgroundSize: '22px 22px',
          pointerEvents: 'none',
        }} />

        {/* Top glow */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '500px',
          background: 'radial-gradient(ellipse at 50% 0%, rgba(139,92,246,0.35) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        {/* Bottom glow */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: '400px',
          background: 'radial-gradient(ellipse at 50% 100%, rgba(109,40,217,0.2) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        {/* ── HEADER ── */}
        <div style={{ position: 'relative', textAlign: 'center', marginBottom: '48px' }}>
          {/* Outer ornament line */}
          <div style={{
            height: '1px', marginBottom: '28px',
            background: 'linear-gradient(to right, transparent, rgba(251,191,36,0.6), transparent)',
          }} />

          <div style={{ fontSize: '14px', letterSpacing: '0.5em', color: 'rgba(251,191,36,0.55)', marginBottom: '14px', textTransform: 'uppercase' }}>
            ☽ ✦ ☾
          </div>
          <h1 style={{
            fontSize: '52px', fontWeight: 700, letterSpacing: '0.25em',
            background: 'linear-gradient(135deg, #fbbf24 0%, #f9a8d4 50%, #a78bfa 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            margin: '0 0 12px',
          }}>
            命运星尘
          </h1>
          <p style={{ fontSize: '18px', letterSpacing: '0.4em', color: 'rgba(251,191,36,0.6)', margin: '0 0 28px', textTransform: 'uppercase' }}>
            Tarot Reading
          </p>

          <div style={{
            height: '1px',
            background: 'linear-gradient(to right, transparent, rgba(251,191,36,0.6), transparent)',
          }} />
        </div>

        {/* ── DATE + SPREAD ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '40px', position: 'relative' }}>
          <div>
            <div style={{ fontSize: '11px', letterSpacing: '0.4em', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', marginBottom: '6px' }}>
              占卜日期
            </div>
            <div style={{ fontSize: '20px', color: 'rgba(255,255,255,0.75)', letterSpacing: '0.1em' }}>
              {session.date}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '11px', letterSpacing: '0.4em', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', marginBottom: '6px' }}>
              牌阵
            </div>
            <div style={{ fontSize: '20px', color: 'rgba(251,191,36,0.85)', letterSpacing: '0.1em' }}>
              {session.spreadName}
            </div>
          </div>
        </div>

        {/* ── QUESTION ── */}
        <div style={{
          position: 'relative', marginBottom: '48px',
          padding: '32px 40px',
          background: 'rgba(0,0,0,0.3)',
          border: '1px solid rgba(251,191,36,0.15)',
          borderRadius: '20px',
        }}>
          <div style={{ fontSize: '11px', letterSpacing: '0.5em', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginBottom: '14px' }}>
            你的问题
          </div>
          <p style={{
            fontSize: '26px', fontStyle: 'italic', lineHeight: 1.6,
            color: 'rgba(255,255,255,0.85)', margin: 0,
          }}>
            "{session.question}"
          </p>
        </div>

        {/* ── CARDS ── */}
        <div style={{ marginBottom: '48px', position: 'relative' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px',
          }}>
            <div style={{ flex: 1, height: '1px', background: 'linear-gradient(to right, transparent, rgba(251,191,36,0.3))' }} />
            <span style={{ fontSize: '13px', letterSpacing: '0.4em', color: 'rgba(251,191,36,0.6)', textTransform: 'uppercase' }}>
              抽到的牌
            </span>
            <div style={{ flex: 1, height: '1px', background: 'linear-gradient(to left, transparent, rgba(251,191,36,0.3))' }} />
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: session.cards.length <= 3 ? `repeat(${session.cards.length}, 1fr)` : 'repeat(3, 1fr)',
            gap: '16px',
          }}>
            {session.cards.map((card, i) => (
              <div key={i} style={{
                padding: '20px 16px',
                background: 'rgba(139,92,246,0.1)',
                border: '1px solid rgba(139,92,246,0.25)',
                borderRadius: '14px',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: '11px', letterSpacing: '0.35em', color: 'rgba(255,255,255,0.35)', marginBottom: '8px', textTransform: 'uppercase' }}>
                  {card.positionName}
                </div>
                <div style={{ fontSize: '18px', fontWeight: 600, color: 'rgba(251,191,36,0.9)', marginBottom: '6px' }}>
                  {CARD_NAMES[card.index] ?? `第${card.index}号`}
                </div>
                <div style={{
                  display: 'inline-block', fontSize: '11px', padding: '3px 10px',
                  borderRadius: '20px', letterSpacing: '0.2em',
                  background: card.isReversed ? 'rgba(249,168,212,0.15)' : 'rgba(167,243,208,0.15)',
                  color: card.isReversed ? 'rgba(249,168,212,0.8)' : 'rgba(167,243,208,0.8)',
                  border: card.isReversed ? '1px solid rgba(249,168,212,0.3)' : '1px solid rgba(167,243,208,0.3)',
                }}>
                  {card.isReversed ? '逆位' : '正位'}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── INTERPRETATION ── */}
        <div style={{ flex: 1, position: 'relative', marginBottom: '48px' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '28px',
          }}>
            <div style={{ flex: 1, height: '1px', background: 'linear-gradient(to right, transparent, rgba(251,191,36,0.3))' }} />
            <span style={{ fontSize: '13px', letterSpacing: '0.4em', color: 'rgba(251,191,36,0.6)', textTransform: 'uppercase' }}>
              星辰的启示
            </span>
            <div style={{ flex: 1, height: '1px', background: 'linear-gradient(to left, transparent, rgba(251,191,36,0.3))' }} />
          </div>

          {paragraphs.map((para, i) => (
            <p key={i} style={{
              fontSize: '21px', lineHeight: 2.0, letterSpacing: '0.05em',
              color: 'rgba(255,255,255,0.75)', margin: '0 0 24px',
            }}>
              {para}
            </p>
          ))}
        </div>

        {/* ── FOOTER ── */}
        <div style={{ position: 'relative', textAlign: 'center' }}>
          <div style={{
            height: '1px', marginBottom: '24px',
            background: 'linear-gradient(to right, transparent, rgba(251,191,36,0.4), transparent)',
          }} />
          <div style={{ fontSize: '13px', letterSpacing: '0.5em', color: 'rgba(251,191,36,0.4)', textTransform: 'uppercase' }}>
            ☽ &nbsp; 命运星尘 · Tarot &nbsp; ☾
          </div>
        </div>
      </div>
    );
  }
);

ExportCard.displayName = 'ExportCard';
