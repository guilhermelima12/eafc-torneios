import React, { useState, useEffect } from 'react';
import { X, Play, Square } from 'lucide-react';
import TeamLogo from './TeamLogo';

const LiveMatchModal = ({ liveMatch, onUpdateScore, onFinish, onClose }) => {
  const [scoreAnim, setScoreAnim] = useState(null); // 'p1' | 'p2'

  const triggerAnim = (side) => {
    setScoreAnim(side);
    setTimeout(() => setScoreAnim(null), 500);
  };

  const handleGoal = async (side, delta) => {
    if (delta > 0) triggerAnim(side);
    await onUpdateScore(liveMatch.match_key, side, delta);
  };

  const handleFinish = async () => {
    if (!window.confirm(
      `Finalizar ${liveMatch.p1_name} ${liveMatch.score1} – ${liveMatch.score2} ${liveMatch.p2_name}?\n\nEsse placar será registrado no torneio.`
    )) return;
    await onFinish(liveMatch.match_key);
    onClose();
  };

  // Close on Escape key
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const btnStyle = (color) => ({
    width: '56px', height: '56px', borderRadius: '50%',
    background: `rgba(${color}, 0.15)`, border: `2px solid rgba(${color}, 0.5)`,
    color: `rgb(${color})`, fontSize: '1.6rem', fontWeight: 700,
    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'all 0.15s', fontFamily: 'Outfit',
  });

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.92)',
      backdropFilter: 'blur(16px)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
    }}>

      {/* Close button */}
      <button
        onClick={onClose}
        style={{
          position: 'absolute', top: '1.5rem', right: '1.5rem',
          background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
          color: 'white', cursor: 'pointer', padding: '8px', borderRadius: '8px',
          display: 'flex', alignItems: 'center', transition: 'all 0.2s',
        }}
        title="Fechar (Esc)"
      >
        <X size={20} />
      </button>

      {/* Live badge */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '8px',
        marginBottom: '2.5rem', padding: '6px 16px', borderRadius: '20px',
        background: 'rgba(255,40,40,0.15)', border: '1px solid rgba(255,40,40,0.4)',
        color: '#ff4b4b', fontWeight: 700, fontSize: '0.9rem', letterSpacing: '2px',
      }}>
        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ff4b4b', animation: 'livePulse 1.2s ease-in-out infinite' }} />
        AO VIVO · Rodada {liveMatch.round}
      </div>

      {/* Main scoreboard */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', width: '100%', maxWidth: '700px', padding: '0 2rem' }}>

        {/* Player 1 */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <TeamLogo team={liveMatch.p1_team} size={80} />
          <div style={{ fontWeight: 700, fontSize: '1.3rem', textAlign: 'center' }}>{liveMatch.p1_name}</div>
          <div style={{
            fontSize: '5.5rem', fontWeight: 900, lineHeight: 1,
            color: scoreAnim === 'p1' ? '#00ff87' : 'white',
            transform: scoreAnim === 'p1' ? 'scale(1.15)' : 'scale(1)',
            transformOrigin: 'center',
            transition: 'all 0.3s cubic-bezier(0.34,1.56,0.64,1)',
            textShadow: scoreAnim === 'p1' ? '0 0 40px rgba(0,255,135,0.6)' : 'none',
          }}>
            {liveMatch.score1}
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button style={btnStyle('255,40,40')} onClick={() => handleGoal('p1', -1)} title="Remover gol">−</button>
            <button
              style={{ ...btnStyle('0,255,135'), width: '72px', height: '72px', fontSize: '2rem' }}
              onClick={() => handleGoal('p1', 1)}
              title="Gol!"
            >＋</button>
          </div>
        </div>

        {/* VS divider */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'rgba(255,255,255,0.3)' }}>VS</div>
          <div style={{ width: '1px', height: '120px', background: 'rgba(255,255,255,0.1)' }} />
        </div>

        {/* Player 2 */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <TeamLogo team={liveMatch.p2_team} size={80} />
          <div style={{ fontWeight: 700, fontSize: '1.3rem', textAlign: 'center' }}>{liveMatch.p2_name}</div>
          <div style={{
            fontSize: '5.5rem', fontWeight: 900, lineHeight: 1,
            color: scoreAnim === 'p2' ? '#00ff87' : 'white',
            transform: scoreAnim === 'p2' ? 'scale(1.15)' : 'scale(1)',
            transformOrigin: 'center',
            transition: 'all 0.3s cubic-bezier(0.34,1.56,0.64,1)',
            textShadow: scoreAnim === 'p2' ? '0 0 40px rgba(0,255,135,0.6)' : 'none',
          }}>
            {liveMatch.score2}
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button style={btnStyle('255,40,40')} onClick={() => handleGoal('p2', -1)} title="Remover gol">−</button>
            <button
              style={{ ...btnStyle('0,255,135'), width: '72px', height: '72px', fontSize: '2rem' }}
              onClick={() => handleGoal('p2', 1)}
              title="Gol!"
            >＋</button>
          </div>
        </div>
      </div>

      {/* Finish button */}
      <button
        onClick={handleFinish}
        style={{
          marginTop: '3rem', padding: '14px 48px',
          background: 'rgba(0,255,135,0.12)',
          border: '2px solid rgba(0,255,135,0.4)',
          color: 'var(--accent-primary)', borderRadius: '14px',
          fontFamily: 'Outfit', fontSize: '1.1rem', fontWeight: 700,
          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px',
          transition: 'all 0.2s',
          letterSpacing: '0.5px',
        }}
      >
        <Square size={18} fill="currentColor" /> Finalizar Partida
      </button>

      <p style={{ marginTop: '1rem', fontSize: '0.78rem', color: 'rgba(255,255,255,0.25)' }}>
        Pressione Esc para fechar sem finalizar
      </p>

      <style>{`
        @keyframes livePulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.85); }
        }
      `}</style>
    </div>
  );
};

export default LiveMatchModal;
