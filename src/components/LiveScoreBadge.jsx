import React from 'react';

const LiveScoreBadge = ({ liveMatch, style = {} }) => {
  if (!liveMatch) return null;

  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: '8px',
      padding: '4px 10px', borderRadius: '20px',
      background: 'rgba(255, 40, 40, 0.15)',
      border: '1px solid rgba(255, 40, 40, 0.4)',
      fontSize: '0.8rem', fontWeight: 700,
      color: '#ff4b4b',
      ...style,
    }}>
      {/* Pulsing dot */}
      <span style={{
        width: '8px', height: '8px', borderRadius: '50%',
        background: '#ff4b4b',
        display: 'inline-block',
        animation: 'livePulse 1.2s ease-in-out infinite',
      }} />
      <span>AO VIVO</span>
      <span style={{
        background: 'rgba(255,255,255,0.08)', borderRadius: '8px',
        padding: '1px 8px', fontWeight: 800, letterSpacing: '1px',
        color: 'white', fontSize: '0.85rem',
      }}>
        {liveMatch.score1} – {liveMatch.score2}
      </span>

      <style>{`
        @keyframes livePulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.85); }
        }
      `}</style>
    </div>
  );
};

export default LiveScoreBadge;
