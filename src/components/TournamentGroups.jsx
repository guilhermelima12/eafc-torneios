import React, { useState, useEffect } from 'react';
import TeamLogo from './TeamLogo';
import { Play, CheckCircle2 } from 'lucide-react';

const getNumGroups = (count) => {
  if (count <= 5) return 1;
  if (count <= 11) return 2;
  if (count <= 23) return 4;
  return 8;
};

const generateGroupsAndMatches = (players) => {
  const numGroups = getNumGroups(players.length);
  const groups = Array.from({ length: numGroups }, () => []);
  
  // Snake Draft Seeding
  players.forEach((p, i) => {
    const round = Math.floor(i / numGroups);
    const dir = round % 2 === 0 ? 1 : -1;
    let groupIndex = dir === 1 ? i % numGroups : (numGroups - 1) - (i % numGroups);
    groups[groupIndex].push({ ...p, pts: 0, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0 });
  });

  const matches = [];
  let matchId = 1;
  groups.forEach((group, gIndex) => {
    for (let i = 0; i < group.length; i++) {
      for (let j = i + 1; j < group.length; j++) {
        matches.push({
          id: matchId++,
          groupId: gIndex,
          p1: group[i],
          p2: group[j],
          score1: '',
          score2: ''
        });
      }
    }
  });

  return { groups, matches };
};

const TournamentGroups = ({ players, onFinishGroups, readOnly = false, historyGroups = null, historyMatches = null }) => {
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
      const { groups, matches: newMatches } = generateGroupsAndMatches(players);
      setGroupsData(groups);
      setMatches(newMatches);
      localStorage.setItem('tournamentGroups', JSON.stringify(groups));
      localStorage.setItem('tournamentGroupMatches', JSON.stringify(newMatches));
    }
  }, [players, readOnly, historyGroups, historyMatches]);

  const updateMatchScore = (matchId, s1, s2) => {
    if (readOnly) return;
    const updatedMatches = [...matches];
    const matchIndex = updatedMatches.findIndex(m => m.id === matchId);
    if (matchIndex === -1) return;

    updatedMatches[matchIndex].score1 = s1;
    updatedMatches[matchIndex].score2 = s2;
    setMatches(updatedMatches);
    localStorage.setItem('tournamentGroupMatches', JSON.stringify(updatedMatches));

    recalculateStandings(updatedMatches);
  };

// ... recalculateStandings logic remains the same ...
  const recalculateStandings = (currentMatches) => {
    // Reset standings
    const newGroupsData = groupsData.map(group => 
      group.map(p => ({ ...p, pts: 0, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0 }))
    );

    currentMatches.forEach(m => {
      if (m.score1 !== '' && m.score2 !== '') {
        const s1 = parseInt(m.score1);
        const s2 = parseInt(m.score2);
        
        const gIndex = m.groupId;
        const group = newGroupsData[gIndex];
        
        const p1Index = group.findIndex(p => p.id === m.p1.id);
        const p2Index = group.findIndex(p => p.id === m.p2.id);

        // Update P1
        group[p1Index].p += 1;
        group[p1Index].gf += s1;
        group[p1Index].ga += s2;
        group[p1Index].gd = group[p1Index].gf - group[p1Index].ga;
        
        // Update P2
        group[p2Index].p += 1;
        group[p2Index].gf += s2;
        group[p2Index].ga += s1;
        group[p2Index].gd = group[p2Index].gf - group[p2Index].ga;

        if (s1 > s2) {
          group[p1Index].w += 1;
          group[p1Index].pts += 3;
          group[p2Index].l += 1;
        } else if (s2 > s1) {
          group[p2Index].w += 1;
          group[p2Index].pts += 3;
          group[p1Index].l += 1;
        } else {
          group[p1Index].d += 1;
          group[p2Index].d += 1;
          group[p1Index].pts += 1;
          group[p2Index].pts += 1;
        }
      }
    });

    // Sort by Points > GD > GF
    newGroupsData.forEach(group => {
      group.sort((a, b) => {
        if (b.pts !== a.pts) return b.pts - a.pts;
        if (b.gd !== a.gd) return b.gd - a.gd;
        return b.gf - a.gf;
      });
    });

    setGroupsData(newGroupsData);
    localStorage.setItem('tournamentGroups', JSON.stringify(newGroupsData));
  };

  const handleAdvance = () => {
    if (readOnly) return;
    const qualified = [];

    if (groupsData.length === 1) {
      // Single group: advance top 4 for a proper 4-player bracket (or top 2 if group has <= 3 players)
      const group = groupsData[0];
      const spots = group.length >= 4 ? 4 : 2;
      for (let i = 0; i < spots && i < group.length; i++) {
        qualified.push(group[i]);
      }
    } else {
      // Multiple groups: advance top 2 from each group
      groupsData.forEach(group => {
        qualified.push(group[0]);
        if (group.length > 1) qualified.push(group[1]);
      });
    }

    onFinishGroups(qualified);
  };

  const isAllMatchesFinished = matches.length > 0 && matches.every(m => m.score1 !== '' && m.score2 !== '');

  const groupNames = ['Grupo A', 'Grupo B', 'Grupo C', 'Grupo D', 'Grupo E', 'Grupo F', 'Grupo G', 'Grupo H'];

  return (
    <div style={{ padding: '2rem 0' }}>
      {groupsData.map((group, gIndex) => (
        <div key={gIndex} style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', marginBottom: '3rem' }}>
          
          {/* Table */}
          <div className="glass-panel" style={{ flex: '2 1 400px', padding: '1rem' }}>
            <h3 style={{ color: 'var(--accent-primary)', marginBottom: '1rem' }}>{groupNames[gIndex]}</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                  <th style={{ padding: '8px' }}>Pos</th>
                  <th style={{ padding: '8px' }}>Clube</th>
                  <th style={{ padding: '8px' }}>Pts</th>
                  <th style={{ padding: '8px' }}>J</th>
                  <th style={{ padding: '8px' }}>V</th>
                  <th style={{ padding: '8px' }}>SG</th>
                </tr>
              </thead>
              <tbody>
                {group.map((p, i) => (
                  <tr key={p.id} style={{ 
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                    background: i < 2 ? 'rgba(0, 255, 135, 0.05)' : 'transparent' // Highlight Top 2
                  }}>
                    <td style={{ padding: '8px' }}>{i + 1}º</td>
                    <td style={{ padding: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <TeamLogo team={p.team} size={20} />
                      {p.name}
                    </td>
                    <td style={{ padding: '8px', fontWeight: 'bold' }}>{p.pts}</td>
                    <td style={{ padding: '8px' }}>{p.p}</td>
                    <td style={{ padding: '8px' }}>{p.w}</td>
                    <td style={{ padding: '8px' }}>{p.gd > 0 ? `+${p.gd}` : p.gd}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Matches List */}
          <div className="glass-panel" style={{ flex: '1 1 300px', padding: '1rem', maxHeight: '400px', overflowY: 'auto' }}>
            <h4 style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>Partidas</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {matches.filter(m => m.groupId === gIndex).map(match => (
                <div key={match.id} style={{ 
                  background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '8px',
                  display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px'
                }}>
                  <div style={{ flex: 1, textAlign: 'right', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{match.p1.name}</span>
                    <TeamLogo team={match.p1.team} size={24} />
                  </div>
                  
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    {readOnly ? (
                      <span style={{ fontWeight: 'bold', fontSize: '1.2rem', color: 'white' }}>
                        {match.score1 !== '' ? match.score1 : '-'}
                      </span>
                    ) : (
                      <input type="number" min="0" placeholder="-" className="score-input" value={match.score1} onChange={(e) => updateMatchScore(match.id, e.target.value, match.score2)} />
                    )}
                    <span style={{ color: 'var(--text-secondary)', fontWeight: 'bold' }}>x</span>
                    {readOnly ? (
                      <span style={{ fontWeight: 'bold', fontSize: '1.2rem', color: 'white' }}>
                        {match.score2 !== '' ? match.score2 : '-'}
                      </span>
                    ) : (
                      <input type="number" min="0" placeholder="-" className="score-input" value={match.score2} onChange={(e) => updateMatchScore(match.id, match.score1, e.target.value)} />
                    )}
                  </div>

                  <div style={{ flex: 1, textAlign: 'left', display: 'flex', justifyContent: 'flex-start', alignItems: 'center', gap: '8px' }}>
                    <TeamLogo team={match.p2.team} size={24} />
                    <span style={{ fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{match.p2.name}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      ))}

      {isAllMatchesFinished && !readOnly && (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '2rem', animation: 'fadeIn 0.5s ease' }}>
          <button onClick={handleAdvance} className="btn-primary" style={{ padding: '16px 32px', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
            Avançar para Mata-Mata <CheckCircle2 size={24} />
          </button>
        </div>
      )}

    </div>
  );
};

export default TournamentGroups;
