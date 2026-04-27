import React, { useState, useEffect } from 'react';
import TeamLogo from './TeamLogo';
import { Trophy } from 'lucide-react';

// Bracket Generation Logic for 8, 4 or 2 players
const generateKnockoutMatches = (players) => {
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
  } else if (count === 2) {
    // Direct final (e.g. 3-player single group where only top 2 advance)
    matches.push({ id: 3, round: 2, p1: players[0], p2: players[1], score1: null, score2: null, winner: null });
  }
  return matches;
};

const MatchCard = ({ match, onUpdateScore, readOnly }) => {
  const [s1, setS1] = useState(match.score1 ?? '');
  const [s2, setS2] = useState(match.score2 ?? '');
  
  const handleSave = () => {
    if (s1 !== '' && s2 !== '') {
      onUpdateScore(match.id, parseInt(s1), parseInt(s2));
    }
  };

  const isFinished = match.winner !== null;

  return (
    <div style={{
      background: 'rgba(18, 24, 38, 0.8)',
      border: `1px solid ${isFinished ? 'var(--border-color)' : 'var(--accent-secondary)'}`,
      borderRadius: '12px',
      padding: '16px',
      width: '260px',
      position: 'relative',
      boxShadow: isFinished ? 'none' : '0 0 15px rgba(96, 239, 255, 0.1)'
    }}>
      {/* Player 1 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', opacity: isFinished && match.winner?.id !== match.p1?.id ? 0.5 : 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <TeamLogo team={match.p1?.team} size={24} />
          <span style={{ fontWeight: 600 }}>{match.p1?.name || 'TBD'}</span>
        </div>
        {!isFinished && match.p1 && !readOnly ? (
          <input type="number" min="0" placeholder="-" value={s1} onChange={(e)=>setS1(e.target.value)} onBlur={handleSave} className="score-input" />
        ) : (
          <span style={{ fontWeight: 'bold', fontSize: '1.5rem', color: match.winner?.id === match.p1?.id ? 'var(--accent-primary)' : 'white' }}>{match.score1 ?? '-'}</span>
        )}
      </div>

      <div style={{ height: '1px', background: 'var(--border-color)', margin: '12px 0' }} />

      {/* Player 2 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: isFinished && match.winner?.id !== match.p2?.id ? 0.5 : 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <TeamLogo team={match.p2?.team} size={24} />
          <span style={{ fontWeight: 600 }}>{match.p2?.name || 'TBD'}</span>
        </div>
        {!isFinished && match.p2 && !readOnly ? (
          <input type="number" min="0" placeholder="-" value={s2} onChange={(e)=>setS2(e.target.value)} onBlur={handleSave} className="score-input" />
        ) : (
          <span style={{ fontWeight: 'bold', fontSize: '1.5rem', color: match.winner?.id === match.p2?.id ? 'var(--accent-primary)' : 'white' }}>{match.score2 ?? '-'}</span>
        )}
      </div>
    </div>
  );
};

const TournamentBracket = ({ readOnly = false, historyMatches = null, historyPlayers = null }) => {
  const [players, setPlayers] = useState([]);
  const [matches, setMatches] = useState([]);
  const [champion, setChampion] = useState(null);

  useEffect(() => {
    if (readOnly) {
      if (historyPlayers) setPlayers(historyPlayers);
      if (historyMatches) {
        setMatches(historyMatches);
        const finalMatch = historyMatches.reduce((max, m) => m.round > max.round ? m : max, historyMatches[0]);
        if (finalMatch && finalMatch.winner) {
          setChampion(finalMatch.winner);
        }
      }
      return;
    }

    const savedPlayers = localStorage.getItem('tournamentPlayers');
    const savedMatches = localStorage.getItem('tournamentMatches');
    const savedChampion = localStorage.getItem('tournamentChampion');
    
    if (savedChampion) {
      setChampion(JSON.parse(savedChampion));
    }

    if (savedPlayers) {
      const p = JSON.parse(savedPlayers);
      setPlayers(p);
      
      if (savedMatches) {
        setMatches(JSON.parse(savedMatches));
      } else {
        const initialMatches = generateKnockoutMatches(p);
        setMatches(initialMatches);
        localStorage.setItem('tournamentMatches', JSON.stringify(initialMatches));
      }
    }
  }, [readOnly, historyMatches, historyPlayers]);

  const updateScore = (matchId, s1, s2) => {
    if (readOnly) return;
    const updatedMatches = [...matches];
    const matchIndex = updatedMatches.findIndex(m => m.id === matchId);
    if (matchIndex === -1) return;

    const match = updatedMatches[matchIndex];
    match.score1 = s1;
    match.score2 = s2;
    
    // Determine winner
    if (s1 > s2) match.winner = match.p1;
    else if (s2 > s1) match.winner = match.p2;
    else {
      alert('Empate! Em campeonatos de Mata-mata, insira o placar após os pênaltis/prorrogação.');
      return;
    }

    // Process advancement logic
    processAdvancement(updatedMatches, match);
    
    setMatches(updatedMatches);
    localStorage.setItem('tournamentMatches', JSON.stringify(updatedMatches));
  };

  const processAdvancement = (allMatches, finishedMatch) => {
    if (readOnly) return;
    const isQuarters = allMatches.some(m => m.round === 1) && allMatches.length >= 4;
    
    if (finishedMatch.round === 1 && isQuarters) {
      // Advance to Semis
      // Match 1 & 2 winners go to Match 5
      // Match 3 & 4 winners go to Match 6
      const nextMatchId = finishedMatch.id === 1 || finishedMatch.id === 2 ? 5 : 6;
      let nextMatch = allMatches.find(m => m.id === nextMatchId);
      
      if (!nextMatch) {
        nextMatch = { id: nextMatchId, round: 2, p1: null, p2: null, score1: null, score2: null, winner: null };
        allMatches.push(nextMatch);
      }
      
      if (finishedMatch.id === 1 || finishedMatch.id === 3) nextMatch.p1 = finishedMatch.winner;
      else nextMatch.p2 = finishedMatch.winner;
      
    } else if (finishedMatch.round === 1 && !isQuarters) {
      // 4 player tournament (Semis directly) -> Advance to Final
      const nextMatchId = 3; // Final
      let finalMatch = allMatches.find(m => m.id === nextMatchId);
      if (!finalMatch) {
        finalMatch = { id: nextMatchId, round: 2, p1: null, p2: null, score1: null, score2: null, winner: null };
        allMatches.push(finalMatch);
      }
      if (finishedMatch.id === 1) finalMatch.p1 = finishedMatch.winner;
      else finalMatch.p2 = finishedMatch.winner;
      
    } else if (finishedMatch.round === 2 && isQuarters) {
      // Semis to Final (8 players)
      const finalMatchId = 7;
      let finalMatch = allMatches.find(m => m.id === finalMatchId);
      if (!finalMatch) {
        finalMatch = { id: finalMatchId, round: 3, p1: null, p2: null, score1: null, score2: null, winner: null };
        allMatches.push(finalMatch);
      }
      if (finishedMatch.id === 5) finalMatch.p1 = finishedMatch.winner;
      else finalMatch.p2 = finishedMatch.winner;
      
    } else {
      // Final finished!
      setChampion(finishedMatch.winner);
      localStorage.setItem('tournamentChampion', JSON.stringify(finishedMatch.winner));
    }
  };

  const renderColumn = (roundNum, matchIds, title) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', justifyContent: 'center' }}>
      <h3 style={{ textAlign: 'center', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.9rem', marginBottom: '1rem' }}>{title}</h3>
      {matchIds.map(id => {
        const match = matches.find(m => m.id === id);
        if (!match) return <div key={id} style={{ height: '100px', width: '260px' }} />; // placeholder
        return <MatchCard key={id} match={match} onUpdateScore={updateScore} readOnly={readOnly} />;
      })}
    </div>
  );

  return (
    <div style={{ padding: '2rem 0', overflowX: 'auto' }}>
      {champion && (
        <div style={{ textAlign: 'center', marginBottom: '3rem', animation: 'fadeIn 1s ease' }}>
          <Trophy size={64} color="#ffd700" style={{ marginBottom: '1rem', filter: 'drop-shadow(0 0 20px rgba(255, 215, 0, 0.5))' }} />
          <h2 style={{ fontSize: '2.5rem', color: '#ffd700', textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>CAMPEÃO</h2>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', marginTop: '1rem' }}>
            <TeamLogo team={champion.team} size={60} />
            <h1 style={{ fontSize: '3rem', margin: 0 }}>{champion.name}</h1>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: '4rem', minWidth: '800px', justifyContent: 'center' }}>
        {players.length === 8 && renderColumn(1, [1, 2, 3, 4], 'Quartas de Final')}

        {players.length === 8
          ? renderColumn(2, [5, 6], 'Semifinal')
          : players.length === 4
          ? renderColumn(1, [1, 2], 'Semifinal')
          : null}

        {players.length === 8
          ? renderColumn(3, [7], 'Final')
          : players.length === 4
          ? renderColumn(2, [3], 'Final')
          : renderColumn(2, [3], 'Final')}
      </div>
    </div>
  );
};

export default TournamentBracket;
