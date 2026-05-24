import React, { useState, useEffect } from 'react';
import TeamLogo from './TeamLogo';
import { CheckCircle2 } from 'lucide-react';

const getNumGroups = (count) => {
  if (count <= 5) return 1;
  if (count <= 11) return 2;
  if (count <= 23) return 4;
  return 8;
};

const emptyStats = () => ({ pts: 0, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0 });

const generateGroupsAndMatches = (players, legsMode = 'single') => {
  const numGroups = getNumGroups(players.length);
  const groups = Array.from({ length: numGroups }, () => []);

  players.forEach((p, i) => {
    const round = Math.floor(i / numGroups);
    const dir = round % 2 === 0 ? 1 : -1;
    const groupIndex = dir === 1 ? i % numGroups : (numGroups - 1) - (i % numGroups);
    groups[groupIndex].push({ ...p, ...emptyStats() });
  });

  const matches = [];
  let matchId = 1;
  groups.forEach((group, gIndex) => {
    for (let i = 0; i < group.length; i++) {
      for (let j = i + 1; j < group.length; j++) {
        matches.push({ id: matchId++, groupId: gIndex, leg: 1, p1: group[i], p2: group[j], score1: '', score2: '' });
        if (legsMode === 'double') {
          matches.push({ id: matchId++, groupId: gIndex, leg: 2, p1: group[j], p2: group[i], score1: '', score2: '' });
        }
      }
    }
  });

  return { groups, matches };
};

const TournamentGroups = ({
  players, onFinishGroups,
  readOnly = false, leagueOnly = false,
  legsMode = 'single',
  historyGroups = null, historyMatches = null
}) => {
  const [groupsData, setGroupsData] = useState([]);
  const [matches, setMatches] = useState([]);

  useEffect(() => {
    if (readOnly) {
      if (historyGroups) setGroupsData(historyGroups);
      if (historyMatches) setMatches(historyMatches);
      return;
    }

    const savedGroups = localStorage.getItem('tournamentGroups');
    const savedMatches = localStorage.getItem('tournamentGroupMatches');

    if (savedGroups && savedMatches) {
      setGroupsData(JSON.parse(savedGroups));
      setMatches(JSON.parse(savedMatches));
    } else {
      const { groups, matches: newMatches } = generateGroupsAndMatches(players, legsMode);
      setGroupsData(groups);
      setMatches(newMatches);
      localStorage.setItem('tournamentGroups', JSON.stringify(groups));
      localStorage.setItem('tournamentGroupMatches', JSON.stringify(newMatches));
    }
  }, [players, readOnly, historyGroups, historyMatches, legsMode]);

  const recalculateStandings = (currentMatches, currentGroupsData) => {
    const newGroupsData = currentGroupsData.map(group =>
      group.map(p => ({ ...p, ...emptyStats() }))
    );

    currentMatches.forEach(m => {
      if (m.score1 !== '' && m.score2 !== '') {
        const s1 = parseInt(m.score1);
        const s2 = parseInt(m.score2);
        const group = newGroupsData[m.groupId];
        const i1 = group.findIndex(p => p.id === m.p1.id);
        const i2 = group.findIndex(p => p.id === m.p2.id);
        if (i1 === -1 || i2 === -1) return;

        group[i1].p += 1; group[i1].gf += s1; group[i1].ga += s2;
        group[i2].p += 1; group[i2].gf += s2; group[i2].ga += s1;

        if (s1 > s2) { group[i1].w++; group[i1].pts += 3; group[i2].l++; }
        else if (s2 > s1) { group[i2].w++; group[i2].pts += 3; group[i1].l++; }
        else { group[i1].d++; group[i2].d++; group[i1].pts++; group[i2].pts++; }
      }
    });

    newGroupsData.forEach(group => {
      group.forEach(p => { p.gd = p.gf - p.ga; });
      // Desempate: Pts > V > SG > GP > GC
      group.sort((a, b) => {
        if (b.pts !== a.pts) return b.pts - a.pts;
        if (b.w !== a.w) return b.w - a.w;
        if (b.gd !== a.gd) return b.gd - a.gd;
        if (b.gf !== a.gf) return b.gf - a.gf;
        return a.ga - b.ga;
      });
    });

    setGroupsData(newGroupsData);
    localStorage.setItem('tournamentGroups', JSON.stringify(newGroupsData));
  };

  const updateMatchScore = (matchId, s1, s2) => {
    if (readOnly) return;
    const updated = matches.map(m => m.id === matchId ? { ...m, score1: s1, score2: s2 } : m);
    setMatches(updated);
    localStorage.setItem('tournamentGroupMatches', JSON.stringify(updated));
    recalculateStandings(updated, groupsData);
  };

  const handleAdvance = () => {
    if (readOnly) return;
    const qualified = [];
    if (groupsData.length === 1) {
      const group = groupsData[0];
      const spots = group.length >= 4 ? 4 : 2;
      for (let i = 0; i < spots && i < group.length; i++) qualified.push(group[i]);
    } else {
      groupsData.forEach(group => {
        qualified.push(group[0]);
        if (group.length > 1) qualified.push(group[1]);
      });
    }
    onFinishGroups(qualified);
  };

  const isAllMatchesFinished = matches.length > 0 && matches.every(m => m.score1 !== '' && m.score2 !== '');
  const groupNames = ['Grupo A', 'Grupo B', 'Grupo C', 'Grupo D', 'Grupo E', 'Grupo F', 'Grupo G', 'Grupo H'];

  const qualifySpots = groupsData.length === 1
    ? (groupsData[0]?.length >= 4 ? 4 : 2)
    : 2;

  return (
    <div style={{ padding: '2rem 0' }}>
      {groupsData.map((group, gIndex) => (
        <div key={gIndex} style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', marginBottom: '3rem' }}>

          {/* Standings Table */}
          <div className="glass-panel" style={{ flex: '2 1 480px', padding: '1rem', overflowX: 'auto' }}>
            <h3 style={{ color: 'var(--accent-primary)', marginBottom: '1rem' }}>
              {groupNames[gIndex]}
              {!readOnly && !leagueOnly && (
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginLeft: '8px' }}>
                  Top {qualifySpots} avançam
                </span>
              )}
            </h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                  <th style={{ padding: '6px 4px', textAlign: 'left' }}>Pos</th>
                  <th style={{ padding: '6px 8px', textAlign: 'left' }}>Clube</th>
                  <th style={{ padding: '6px 4px' }} title="Pontos">Pts</th>
                  <th style={{ padding: '6px 4px' }} title="Jogos">J</th>
                  <th style={{ padding: '6px 4px' }} title="Vitórias">V</th>
                  <th style={{ padding: '6px 4px' }} title="Empates">E</th>
                  <th style={{ padding: '6px 4px' }} title="Derrotas">D</th>
                  <th style={{ padding: '6px 4px' }} title="Gols Pró">GP</th>
                  <th style={{ padding: '6px 4px' }} title="Gols Contra">GC</th>
                  <th style={{ padding: '6px 4px' }} title="Saldo de Gols">SG</th>
                </tr>
              </thead>
              <tbody>
                {group.map((p, i) => {
                  const isQualified = !leagueOnly && i < qualifySpots;
                  const isChampion = leagueOnly && i === 0;
                  return (
                    <tr key={p.id} style={{
                      borderBottom: '1px solid rgba(255,255,255,0.05)',
                      background: isQualified || isChampion ? 'rgba(0,255,135,0.06)' : 'transparent'
                    }}>
                      <td style={{ padding: '8px 4px', textAlign: 'left', fontWeight: 600 }}>
                        {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}º`}
                      </td>
                      <td style={{ padding: '8px', textAlign: 'left' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <TeamLogo team={p.team} size={20} />
                          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '120px' }}>{p.name}</span>
                        </div>
                      </td>
                      <td style={{ padding: '8px 4px', fontWeight: 'bold', color: 'var(--accent-primary)' }}>{p.pts}</td>
                      <td style={{ padding: '8px 4px' }}>{p.p}</td>
                      <td style={{ padding: '8px 4px', color: '#4ade80' }}>{p.w}</td>
                      <td style={{ padding: '8px 4px', color: '#fbbf24' }}>{p.d}</td>
                      <td style={{ padding: '8px 4px', color: '#f87171' }}>{p.l}</td>
                      <td style={{ padding: '8px 4px' }}>{p.gf}</td>
                      <td style={{ padding: '8px 4px' }}>{p.ga}</td>
                      <td style={{ padding: '8px 4px', fontWeight: 600, color: p.gd > 0 ? '#4ade80' : p.gd < 0 ? '#f87171' : 'white' }}>
                        {p.gd > 0 ? `+${p.gd}` : p.gd}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Matches */}
          <div className="glass-panel" style={{ flex: '1 1 300px', padding: '1rem', maxHeight: '500px', overflowY: 'auto' }}>
            <h4 style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>Partidas</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {matches.filter(m => m.groupId === gIndex).map(match => (
                <div key={match.id}>
                  {match.leg && (
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      {match.leg === 1 ? 'Jogo 1' : 'Jogo 2'}
                    </div>
                  )}
                  <div style={{
                    background: match.score1 !== '' && match.score2 !== '' ? 'rgba(0,255,135,0.04)' : 'rgba(0,0,0,0.2)',
                    padding: '10px', borderRadius: '8px', border: match.score1 !== '' && match.score2 !== '' ? '1px solid rgba(0,255,135,0.15)' : '1px solid transparent',
                    display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px'
                  }}>
                    <div style={{ flex: 1, textAlign: 'right', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '0.85rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '80px' }}>{match.p1.name}</span>
                      <TeamLogo team={match.p1.team} size={22} />
                    </div>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      {readOnly ? (
                        <span style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{match.score1 !== '' ? match.score1 : '-'}</span>
                      ) : (
                        <input type="number" min="0" placeholder="-" className="score-input" value={match.score1}
                          onChange={e => updateMatchScore(match.id, e.target.value, match.score2)} />
                      )}
                      <span style={{ color: 'var(--text-secondary)', fontWeight: 'bold' }}>x</span>
                      {readOnly ? (
                        <span style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{match.score2 !== '' ? match.score2 : '-'}</span>
                      ) : (
                        <input type="number" min="0" placeholder="-" className="score-input" value={match.score2}
                          onChange={e => updateMatchScore(match.id, match.score1, e.target.value)} />
                      )}
                    </div>
                    <div style={{ flex: 1, textAlign: 'left', display: 'flex', justifyContent: 'flex-start', alignItems: 'center', gap: '6px' }}>
                      <TeamLogo team={match.p2.team} size={22} />
                      <span style={{ fontSize: '0.85rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '80px' }}>{match.p2.name}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}

      {isAllMatchesFinished && !readOnly && (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '2rem', animation: 'fadeIn 0.5s ease' }}>
          {leagueOnly ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏆</div>
              <h3 style={{ color: 'var(--accent-primary)', marginBottom: '0.5rem' }}>Liga Encerrada!</h3>
              <p style={{ color: 'var(--text-secondary)' }}>Clique em "Encerrar / Salvar no Histórico" para registrar os resultados.</p>
            </div>
          ) : (
            <button onClick={handleAdvance} className="btn-primary" style={{ padding: '16px 32px', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
              Avançar para Mata-Mata <CheckCircle2 size={24} />
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default TournamentGroups;
