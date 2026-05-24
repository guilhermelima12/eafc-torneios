import React, { useState, useEffect } from 'react';
import TeamLogo from './TeamLogo';
import { Trophy, Play } from 'lucide-react';
import { useLiveMatches } from '../hooks/useLiveMatches';
import LiveMatchModal from './LiveMatchModal';
import LiveScoreBadge from './LiveScoreBadge';
import { useAuth } from '../context/AuthContext';

/* ── Layout Constants ─────────────────────────────────────────── */
const CARD_W   = 216;   // match card width
const CARD_H   = 88;    // match card height (must match actual rendered height)
const BASE     = 120;   // slot height in round-0 (CARD_H + gap)
const CONN_W   = 60;    // SVG connector column width
const LABEL_H  = 28;    // height of the round label row

/* ── Bracket Generation ───────────────────────────────────────── */
export const generateKnockoutMatches = (players) => {
  const matches = [];
  const count = players.length;

  if (count === 8) {
    matches.push({ id: 1, round: 1, p1: players[0], p2: players[7], score1: null, score2: null, winner: null });
    matches.push({ id: 2, round: 1, p1: players[3], p2: players[4], score1: null, score2: null, winner: null });
    matches.push({ id: 3, round: 1, p1: players[2], p2: players[5], score1: null, score2: null, winner: null });
    matches.push({ id: 4, round: 1, p1: players[1], p2: players[6], score1: null, score2: null, winner: null });
  } else if (count === 4) {
    matches.push({ id: 1, round: 1, p1: players[0], p2: players[3], score1: null, score2: null, winner: null });
    matches.push({ id: 2, round: 1, p1: players[1], p2: players[2], score1: null, score2: null, winner: null });
  } else if (count >= 2) {
    let id = 1;
    const r1 = [];
    for (let i = 0; i + 1 < count; i += 2)
      r1.push({ id: id++, round: 1, p1: players[i], p2: players[i + 1], score1: null, score2: null, winner: null });
    if (count % 2 !== 0)
      r1.push({ id: id++, round: 1, p1: players[count - 1], p2: null, score1: null, score2: null, winner: players[count - 1], isBye: true });
    matches.push(...r1);
    if (r1.length > 1)
      matches.push({ id: id++, round: 2, p1: null, p2: null, score1: null, score2: null, winner: null });
  }

  return matches;
};

/* ── Round definitions per player count ───────────────────────── */
const getRounds = (playerCount) => {
  if (playerCount === 8) return [
    { label: 'Quartas de Final', ids: [1, 2, 3, 4] },
    { label: 'Semifinal',         ids: [5, 6] },
    { label: 'Final',             ids: [7] },
  ];
  if (playerCount === 4) return [
    { label: 'Semifinal', ids: [1, 2] },
    { label: 'Final',     ids: [3] },
  ];
  return [{ label: 'Final', ids: [1] }];
};

/* ── SVG Connector lines (between two adjacent rounds) ────────── */
// fromCount  = number of matches in the LEFT round
// fromRoundIdx = 0-based index of the LEFT round
const BracketConnector = ({ fromCount, fromRoundIdx }) => {
  const totalH = fromCount * BASE;
  const pairsCount = Math.floor(fromCount / 2);
  const stroke = 'rgba(255,255,255,0.18)';
  const lines = [];

  for (let i = 0; i < pairsCount; i++) {
    const exp = Math.pow(2, fromRoundIdx);
    const y1   = (2 * i + 0.5) * BASE * exp;   // center of match 2i in left round
    const y2   = (2 * i + 1.5) * BASE * exp;   // center of match 2i+1 in left round
    const yMid = (y1 + y2) / 2;                // center of match i in right round
    const xM   = CONN_W / 2;

    lines.push(
      <g key={i}>
        {/* Horizontal right from match 2i */}
        <line x1={0}    y1={y1}   x2={xM}       y2={y1}   stroke={stroke} strokeWidth={1.5} strokeLinecap="round" />
        {/* Vertical connector */}
        <line x1={xM}   y1={y1}   x2={xM}       y2={y2}   stroke={stroke} strokeWidth={1.5} strokeLinecap="round" />
        {/* Horizontal right from match 2i+1 */}
        <line x1={0}    y1={y2}   x2={xM}       y2={y2}   stroke={stroke} strokeWidth={1.5} strokeLinecap="round" />
        {/* Horizontal right to next match */}
        <line x1={xM}   y1={yMid} x2={CONN_W}   y2={yMid} stroke={stroke} strokeWidth={1.5} strokeLinecap="round" />
      </g>
    );
  }

  return (
    <svg
      width={CONN_W}
      height={totalH}
      style={{ flexShrink: 0, display: 'block', overflow: 'visible' }}
    >
      {lines}
    </svg>
  );
};

/* ── Match Card ───────────────────────────────────────────────── */
const MatchCard = ({ match, onUpdateScore, readOnly, liveMatch, onStartLive }) => {
  const [s1, setS1] = useState(match.score1 ?? '');
  const [s2, setS2] = useState(match.score2 ?? '');
  const [p1, setP1] = useState(match.pen1 ?? '');
  const [p2, setP2] = useState(match.pen2 ?? '');

  // Sync when match prop changes (e.g., a winner advances and the next match updates)
  useEffect(() => {
    setS1(match.score1 ?? '');
    setS2(match.score2 ?? '');
    setP1(match.pen1 ?? '');
    setP2(match.pen2 ?? '');
  }, [match.score1, match.score2, match.pen1, match.pen2]);

  const isTied    = s1 !== '' && s2 !== '' && parseInt(s1) === parseInt(s2);
  const isFinished = match.winner !== null;
  const w1 = isFinished && match.winner?.id === match.p1?.id;
  const w2 = isFinished && match.winner?.id === match.p2?.id;

  const save = (ns1 = s1, ns2 = s2, np1 = p1, np2 = p2) => {
    if (ns1 !== '' && ns2 !== '') {
      onUpdateScore?.(match.id, parseInt(ns1), parseInt(ns2),
        np1 !== '' ? parseInt(np1) : null,
        np2 !== '' ? parseInt(np2) : null);
    }
  };

  const playerRow = (player, score, isWinner, val, setVal, penVal, side) => (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '8px 10px', gap: '8px',
      borderRadius: side === 'top' ? '9px 9px 0 0' : '0 0 9px 9px',
      background: isWinner ? 'rgba(0,255,135,0.07)' : 'transparent',
      transition: 'background 0.2s',
      borderLeft: isWinner ? '3px solid var(--accent-primary)' : '3px solid transparent',
    }}>
      {/* Left: logo + name */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '7px', flex: 1, minWidth: 0 }}>
        <TeamLogo team={player?.team} size={20} />
        <span style={{
          fontWeight: isWinner ? 700 : 500,
          color: player ? (isWinner ? 'var(--accent-primary)' : isFinished ? 'rgba(255,255,255,0.45)' : 'white') : 'var(--text-secondary)',
          fontSize: '0.88rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          transition: 'color 0.2s'
        }}>
          {player?.name || (match.isBye ? '—' : 'TBD')}
        </span>
      </div>

      {/* Right: score or input */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
        {penVal != null && isFinished && (
          <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>({penVal})</span>
        )}
        {!isFinished && player && !readOnly ? (
          <input
            type="number" min="0" placeholder="—" value={val}
            onChange={e => setVal(e.target.value)}
            onBlur={() => save()}
            onKeyDown={e => e.key === 'Enter' && save()}
            className="score-input"
            style={{ width: '40px', textAlign: 'center', fontSize: '0.9rem', padding: '2px 4px' }}
          />
        ) : (
          <span style={{
            fontWeight: 700, fontSize: '1.25rem', minWidth: '22px', textAlign: 'right',
            color: isWinner ? 'var(--accent-primary)' : isFinished ? 'rgba(255,255,255,0.35)' : 'var(--text-secondary)'
          }}>
            {score != null ? score : '—'}
          </span>
        )}
      </div>
    </div>
  );

  const isLive = !!liveMatch;

  return (
    <div style={{ position: 'relative' }}>
      {/* Live badge overlay (top of card) */}
      {isLive && (
        <div style={{ position: 'absolute', top: '-14px', left: '50%', transform: 'translateX(-50%)', zIndex: 10, whiteSpace: 'nowrap' }}>
          <LiveScoreBadge liveMatch={liveMatch} />
        </div>
      )}

      <div style={{
        width: CARD_W,
        border: isLive
          ? '1px solid rgba(255,40,40,0.5)'
          : `1px solid ${isFinished ? 'rgba(255,255,255,0.08)' : 'rgba(96,239,255,0.25)'}`,
        borderRadius: '10px',
        background: 'rgba(12,18,32,0.85)',
        backdropFilter: 'blur(4px)',
        overflow: 'hidden',
        boxShadow: isLive
          ? '0 0 18px rgba(255,40,40,0.2)'
          : isFinished ? 'none' : '0 0 12px rgba(96,239,255,0.08)',
        transition: 'border-color 0.3s, box-shadow 0.3s',
      }}>
        {playerRow(match.p1, match.score1, w1, s1, setS1, match.pen1, 'top')}

        {/* Divider */}
        <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', margin: '0 10px' }} />

        {playerRow(match.p2, match.score2, w2, s2, setS2, match.pen2, 'bottom')}

        {/* Penalty row */}
        {isTied && !isFinished && !readOnly && (
          <div style={{ padding: '8px 10px', background: 'rgba(251,191,36,0.06)', borderTop: '1px solid rgba(251,191,36,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.72rem', color: '#fbbf24', fontWeight: 600, whiteSpace: 'nowrap' }}>Pênaltis</span>
            <input type="number" min="0" placeholder="—" value={p1}
              onChange={e => setP1(e.target.value)} onBlur={() => save()} className="score-input"
              style={{ width: '38px', textAlign: 'center', fontSize: '0.85rem', padding: '2px 4px' }} />
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>×</span>
            <input type="number" min="0" placeholder="—" value={p2}
              onChange={e => setP2(e.target.value)} onBlur={() => save()} className="score-input"
              style={{ width: '38px', textAlign: 'center', fontSize: '0.85rem', padding: '2px 4px' }} />
          </div>
        )}

        {/* Start Live button — admin only, match not finished, both players defined */}
        {!readOnly && !isFinished && match.p1 && match.p2 && onStartLive && !isLive && (
          <button
            onClick={() => onStartLive(match)}
            style={{
              width: '100%', padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
              background: 'rgba(96,239,255,0.05)', borderTop: '1px solid rgba(96,239,255,0.15)',
              border: 'none', color: 'var(--accent-secondary)', cursor: 'pointer',
              fontFamily: 'Outfit', fontSize: '0.75rem', fontWeight: 600,
              transition: 'background 0.2s', letterSpacing: '0.5px',
            }}
          >
            <Play size={12} fill="currentColor" /> INICIAR PARTIDA
          </button>
        )}

        {/* Re-open live modal button when match is already live */}
        {!readOnly && isLive && onStartLive && (
          <button
            onClick={() => onStartLive(match, true)}
            style={{
              width: '100%', padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
              background: 'rgba(255,40,40,0.08)', borderTop: '1px solid rgba(255,40,40,0.2)',
              border: 'none', color: '#ff4b4b', cursor: 'pointer',
              fontFamily: 'Outfit', fontSize: '0.75rem', fontWeight: 600,
              transition: 'background 0.2s',
            }}
          >
            <Play size={12} fill="currentColor" /> ABRIR PAINEL
          </button>
        )}
      </div>
    </div>
  );
};

/* ── Main Component ───────────────────────────────────────────── */
const TournamentBracket = ({ readOnly = false, historyMatches = null, historyPlayers = null, onDataChange = null }) => {
  const { isAdmin } = useAuth();
  const { liveMatches, getLiveMatch, startLive, updateScore: liveUpdateScore, finishLive } = useLiveMatches();
  const [activeLiveMatch, setActiveLiveMatch] = useState(null); // the live_matches row being controlled
  const [players, setPlayers] = useState([]);
  const [matches, setMatches] = useState([]);
  const [champion, setChampion] = useState(null);

  useEffect(() => {
    if (historyPlayers) setPlayers(historyPlayers);

    if (historyMatches && historyMatches.length > 0) {
      setMatches(historyMatches);
      const finalMatch = historyMatches.reduce((max, m) => m.round > max.round ? m : max, historyMatches[0]);
      if (finalMatch?.winner) setChampion(finalMatch.winner);
    } else if (!readOnly && historyPlayers && historyPlayers.length > 0) {
      const init = generateKnockoutMatches(historyPlayers);
      setMatches(init);
      onDataChange?.(init);
    }

    if (readOnly || historyPlayers) return;

    const savedPlayers  = localStorage.getItem('tournamentPlayers');
    const savedMatches  = localStorage.getItem('tournamentMatches');
    const savedChampion = localStorage.getItem('tournamentChampion');

    if (savedChampion) setChampion(JSON.parse(savedChampion));
    if (savedPlayers) {
      const p = JSON.parse(savedPlayers);
      setPlayers(p);
      if (savedMatches) {
        setMatches(JSON.parse(savedMatches));
      } else {
        const init = generateKnockoutMatches(p);
        setMatches(init);
        localStorage.setItem('tournamentMatches', JSON.stringify(init));
      }
    }
  }, [readOnly, historyMatches, historyPlayers]);

  /* ── Score update + advancement ── */
  const processAdvancement = (all, finished) => {
    const is8 = all.some(m => m.round === 1) && all.length >= 4;

    if (finished.round === 1 && is8) {
      const nextId = (finished.id === 1 || finished.id === 2) ? 5 : 6;
      let next = all.find(m => m.id === nextId);
      if (!next) { next = { id: nextId, round: 2, p1: null, p2: null, score1: null, score2: null, winner: null }; all.push(next); }
      if (finished.id === 1 || finished.id === 3) next.p1 = finished.winner; else next.p2 = finished.winner;

    } else if (finished.round === 1 && !is8) {
      let fin = all.find(m => m.id === 3);
      if (!fin) { fin = { id: 3, round: 2, p1: null, p2: null, score1: null, score2: null, winner: null }; all.push(fin); }
      if (finished.id === 1) fin.p1 = finished.winner; else fin.p2 = finished.winner;

    } else if (finished.round === 2 && is8) {
      let fin = all.find(m => m.id === 7);
      if (!fin) { fin = { id: 7, round: 3, p1: null, p2: null, score1: null, score2: null, winner: null }; all.push(fin); }
      if (finished.id === 5) fin.p1 = finished.winner; else fin.p2 = finished.winner;

    } else {
      setChampion(finished.winner);
      if (!historyPlayers) localStorage.setItem('tournamentChampion', JSON.stringify(finished.winner));
    }
  };

  const updateScore = (matchId, s1, s2, pen1 = null, pen2 = null) => {
    if (readOnly) return;
    const all = matches.map(m => m.id === matchId
      ? { ...m, score1: s1, score2: s2, pen1, pen2,
          winner: s1 > s2 ? m.p1 : s2 > s1 ? m.p2 :
                  pen1 != null && pen2 != null && pen1 !== pen2 ? (pen1 > pen2 ? m.p1 : m.p2) : null }
      : m
    );
    const updated = all.find(m => m.id === matchId);
    if (!updated?.winner) return;

    processAdvancement(all, updated);
    setMatches([...all]);

    if (onDataChange) onDataChange([...all]);
    else localStorage.setItem('tournamentMatches', JSON.stringify(all));
  };

  /* ── Live match handlers ── */
  const handleStartLive = async (match, reopen = false) => {
    if (reopen) {
      // Match already live — just re-open the panel using the existing live row
      const existing = getLiveMatch(match.round, match.p1, match.p2);
      if (existing) setActiveLiveMatch(existing);
      return;
    }
    const matchKey = await startLive(match, match.round);
    if (matchKey) {
      // Build local object optimistically so modal opens immediately
      setActiveLiveMatch({
        match_key: matchKey,
        p1_name: match.p1?.name, p2_name: match.p2?.name,
        p1_team: match.p1?.team || null, p2_team: match.p2?.team || null,
        score1: 0, score2: 0, round: match.round, status: 'live',
        _matchId: match.id,
      });
    }
  };

  const handleLiveFinish = async (matchKey, s1, s2) => {
    await finishLive(matchKey);
    if (activeLiveMatch?._matchId != null) {
      updateScore(activeLiveMatch._matchId, s1, s2);
    }
    setActiveLiveMatch(null);
  };

  /* ── Render ── */
  const rounds = getRounds(players.length);
  // total height of the bracket content area (based on round-0 match count)
  const r0Count = rounds[0].ids.length;
  const totalH = r0Count * BASE;

  // Keep activeLiveMatch in sync with realtime updates from the hook
  React.useEffect(() => {
    if (!activeLiveMatch) return;
    const updated = liveMatches.find(m => m.match_key === activeLiveMatch.match_key);
    if (updated) setActiveLiveMatch(prev => ({ ...updated, _matchId: prev._matchId }));
  }, [liveMatches, activeLiveMatch?.match_key]);

  return (
    <div style={{ padding: '1.5rem 0', overflowX: 'auto', overflowY: 'visible' }}>

      {/* Live Match Modal (admin panel) */}
      {activeLiveMatch && (
        <LiveMatchModal
          liveMatch={activeLiveMatch}
          onUpdateScore={liveUpdateScore}
          onFinish={handleLiveFinish}
          onClose={() => setActiveLiveMatch(null)}
        />
      )}

      {/* Champion banner */}
      {champion && (
        <div style={{ textAlign: 'center', marginBottom: '2.5rem', animation: 'fadeIn 0.8s ease' }}>
          <Trophy size={56} color="#ffd700" style={{ marginBottom: '0.75rem', filter: 'drop-shadow(0 0 18px rgba(255,215,0,0.5))' }} />
          <div style={{ fontSize: '0.85rem', color: '#ffd700', letterSpacing: '3px', textTransform: 'uppercase', fontWeight: 700, marginBottom: '6px' }}>Campeão</div>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '14px' }}>
            <TeamLogo team={champion.team} size={52} />
            <span style={{ fontSize: '2.2rem', fontWeight: 800, color: '#ffd700', textShadow: '0 0 20px rgba(255,215,0,0.3)' }}>{champion.name}</span>
          </div>
        </div>
      )}

      {/* Bracket */}
      <div style={{ display: 'inline-flex', flexDirection: 'column', minWidth: 'max-content' }}>

        {/* Labels row */}
        <div style={{ display: 'flex', marginBottom: '8px' }}>
          {rounds.map((r, ri) => (
            <React.Fragment key={ri}>
              <div style={{
                width: CARD_W, textAlign: 'center', height: LABEL_H,
                fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase',
                letterSpacing: '1.5px', color: 'var(--text-secondary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {r.label}
              </div>
              {ri < rounds.length - 1 && <div style={{ width: CONN_W }} />}
            </React.Fragment>
          ))}
        </div>

        {/* Content row: columns + SVG connectors */}
        <div style={{ display: 'flex', alignItems: 'flex-start' }}>
          {rounds.map((r, ri) => {
            const slotH = BASE * Math.pow(2, ri);

            return (
              <React.Fragment key={ri}>
                {/* Match column (absolute positioned slots) */}
                <div style={{ position: 'relative', width: CARD_W, height: totalH, flexShrink: 0 }}>
                  {r.ids.map((id, mi) => {
                    const match = matches.find(m => m.id === id);
                    const topY = mi * slotH + (slotH - CARD_H) / 2;
                    const liveM = getLiveMatch(match?.round, match?.p1, match?.p2);
                    return (
                      <div key={id} style={{ position: 'absolute', top: topY, left: 0, width: CARD_W, paddingTop: liveM ? '18px' : '0' }}>
                        {match
                          ? <MatchCard
                              match={match}
                              onUpdateScore={readOnly ? null : updateScore}
                              readOnly={readOnly}
                              liveMatch={liveM}
                              onStartLive={isAdmin && !readOnly ? handleStartLive : null}
                            />
                          : <div style={{ width: CARD_W, height: CARD_H, border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '10px' }} />
                        }
                      </div>
                    );
                  })}
                </div>

                {/* SVG connector to next round */}
                {ri < rounds.length - 1 && (
                  <BracketConnector fromCount={r.ids.length} fromRoundIdx={ri} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default TournamentBracket;
