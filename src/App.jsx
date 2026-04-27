import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Link, NavLink } from 'react-router-dom';
import { Trophy, Users, Shield, Trash2 } from 'lucide-react';
import TournamentSetup from './components/TournamentSetup';
import PlayerRegistration from './components/PlayerRegistration';
import TeamLogo from './components/TeamLogo';
import TournamentBracket from './components/TournamentBracket';
import TournamentGroups from './components/TournamentGroups';
import TeamPoolSelection from './components/TeamPoolSelection';
import TournamentHistoryView from './components/TournamentHistoryView';
import PlayersManager from './components/PlayersManager';
import { supabase } from './lib/supabase';

const Dashboard = () => {
  const [config, setConfig] = useState(null);
  const [players, setPlayers] = useState(null);
  const [phase, setPhase] = useState('knockout');
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const savedConfig = localStorage.getItem('tournamentConfig');
    const savedPlayers = localStorage.getItem('tournamentPlayers');

    if (savedConfig && savedPlayers) {
      const cfg = JSON.parse(savedConfig);
      setConfig(cfg);
      setPlayers(JSON.parse(savedPlayers));
      if (cfg.format === 'groups' && !localStorage.getItem('groupStageFinished')) {
        setPhase('groups');
      } else if (cfg.format === 'league') {
        setPhase('league');
      }
    }

    // Load history from Supabase
    const loadHistory = async () => {
      const { data, error } = await supabase
        .from('tournaments')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && data) {
        setHistory(data);
      }
    };
    loadHistory();
  }, []);

  const handleFinishGroups = (qualifiedPlayers) => {
    const firsts = qualifiedPlayers.filter((_, i) => i % 2 === 0);
    const seconds = qualifiedPlayers.filter((_, i) => i % 2 === 1);
    const reordered = [...firsts, ...seconds];
    
    localStorage.setItem('tournamentPlayers', JSON.stringify(reordered));
    localStorage.setItem('groupStageFinished', 'true');
    
    // Wipe any stale bracket matches to force a fresh generation for these qualified players
    localStorage.removeItem('tournamentMatches');
    
    window.location.reload();
  };

  const handleDeleteTournament = async (id) => {
    if (!window.confirm('Tem certeza que deseja apagar este torneio do histórico? Esta ação não pode ser desfeita.')) return;
    const { error } = await supabase.from('tournaments').delete().eq('id', id);
    if (!error) {
      setHistory(history.filter(h => h.id !== id));
    }
  };

  const handleEndTournament = async () => {
    const championStr = localStorage.getItem('tournamentChampion');
    let champion = championStr ? JSON.parse(championStr) : null;

    // For league format, derive champion from group standings (1st place)
    if (!champion && config?.format === 'league') {
      const groupsData = JSON.parse(localStorage.getItem('tournamentGroups') || 'null');
      if (groupsData && groupsData[0] && groupsData[0].length > 0) {
        champion = groupsData[0][0]; // 1st place in the single group
      }
    }

    if (!champion) {
      if (!window.confirm('Atenção: O torneio atual ainda NÃO tem um campeão definido. Quer mesmo apagar sem salvar no histórico?')) {
        return;
      }
    } else {
      // Save to Supabase
      const historyItem = {
        id: Date.now().toString(),
        date: new Date().toLocaleDateString(),
        config: config,
        champion: champion,
        players: JSON.parse(localStorage.getItem('tournamentPlayers')),
        groups_data: JSON.parse(localStorage.getItem('tournamentGroups')),
        group_matches: JSON.parse(localStorage.getItem('tournamentGroupMatches')),
        bracket_matches: JSON.parse(localStorage.getItem('tournamentMatches'))
      };
      
      const { error } = await supabase.from('tournaments').insert([historyItem]);
      if (error) {
        alert('Erro ao salvar no banco de dados: ' + error.message);
        return;
      }

      // ─── Auto-update seeds based on final standings ───────────────────
      const bracketMatches = JSON.parse(localStorage.getItem('tournamentMatches') || '[]');
      const qualifiedPlayers = JSON.parse(localStorage.getItem('tournamentPlayers') || '[]');
      const groupsData = JSON.parse(localStorage.getItem('tournamentGroups') || 'null');

      const standings = [];
      const added = new Set();

      // 1) Process bracket matches from highest round (Final) down to lowest
      if (bracketMatches.length > 0) {
        const finishedMatches = bracketMatches
          .filter(m => m.winner)
          .sort((a, b) => b.round - a.round);

        finishedMatches.forEach(match => {
          const winner = match.winner;
          // Loser is whichever of p1/p2 is NOT the winner
          const loser = match.p1?.id === winner?.id ? match.p2 : match.p1;

          if (winner && !added.has(winner.name)) {
            standings.push(winner);
            added.add(winner.name);
          }
          if (loser && !added.has(loser.name)) {
            standings.push(loser);
            added.add(loser.name);
          }
        });
      }

      // 2) Add qualified players who never appeared in bracket (edge case)
      qualifiedPlayers.forEach(p => {
        if (!added.has(p.name)) {
          standings.push(p);
          added.add(p.name);
        }
      });

      // 3) Add players eliminated in the group stage (ranked by group position)
      if (groupsData) {
        const groupEliminated = [];
        groupsData.forEach(group => {
          group.forEach((p, idx) => {
            if (!added.has(p.name)) {
              groupEliminated.push({ player: p, groupRank: idx });
            }
          });
        });
        // Sort: lower group rank = better position → goes first
        groupEliminated.sort((a, b) => a.groupRank - b.groupRank);
        groupEliminated.forEach(({ player }) => {
          if (!added.has(player.name)) {
            standings.push(player);
            added.add(player.name);
          }
        });
      }

      // 4) Write the new seeds to Supabase (position in standings = new seed)
      if (standings.length > 0) {
        const { data: dbPlayers } = await supabase.from('players').select('id, name');
        if (dbPlayers) {
          const updatePromises = standings.map((player, idx) => {
            const dbPlayer = dbPlayers.find(db => db.name === player?.name);
            if (dbPlayer) {
              return supabase.from('players').update({ seed: idx + 1 }).eq('id', dbPlayer.id);
            }
            return Promise.resolve();
          });
          await Promise.all(updatePromises);
        }
      }
    }

    // Clear active tournament
    localStorage.removeItem('tournamentConfig');
    localStorage.removeItem('tournamentPlayers');
    localStorage.removeItem('tournamentMatches');
    localStorage.removeItem('tournamentGroups');
    localStorage.removeItem('tournamentGroupMatches');
    localStorage.removeItem('groupStageFinished');
    localStorage.removeItem('tournamentChampion');
    window.location.reload();
  };

  return (
    <div style={{ marginTop: '2rem' }}>
      
      {/* SEÇÃO 1: TORNEIO ATIVO */}
      <div className="glass-panel" style={{ marginBottom: '3rem' }}>
        <h2 style={{ marginBottom: '1rem', color: 'var(--text-primary)' }}>Torneio em Andamento</h2>
        
        {!config ? (
          <div>
            <p style={{ color: 'var(--text-secondary)' }}>Bem-vindo ao EA FC 26 Manager. Comece configurando o seu torneio presencial.</p>
            <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem' }}>
              <Link to="/setup" className="btn-primary" style={{ textDecoration: 'none', display: 'inline-block' }}>
                Criar Novo Torneio
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div style={{ padding: '1.5rem', background: 'rgba(0, 255, 135, 0.05)', border: '1px solid var(--accent-primary)', borderRadius: '12px', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ color: 'var(--accent-primary)', marginBottom: '0.5rem', fontSize: '1.5rem' }}>{config.name}</h3>
                <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
                  Formato: <strong>{config.format === 'knockout' ? 'Mata-Mata' : config.format === 'groups' ? 'Grupos + Eliminatórias' : 'Liga (Pontos Corridos)'}</strong> | 
                  Participantes: <strong>{config.participants}</strong>
                </p>
              </div>
              <button 
                onClick={handleEndTournament}
                className="btn-secondary" 
                style={{ color: '#ff4b4b', borderColor: 'rgba(255, 75, 75, 0.3)' }}
              >
                Encerrar / Salvar no Histórico
              </button>
            </div>

            <div style={{ marginTop: '2rem' }}>
              {phase === 'groups' ? (
                <TournamentGroups players={players} onFinishGroups={handleFinishGroups} />
              ) : phase === 'league' ? (
                <TournamentGroups players={players} onFinishGroups={handleFinishGroups} leagueOnly={true} />
              ) : (
                <TournamentBracket />
              )}
            </div>
          </>
        )}
      </div>

      {/* SEÇÃO 2: HISTÓRICO DE TORNEIOS */}
      <div className="glass-panel">
        <h2 style={{ marginBottom: '1.5rem', color: 'var(--text-primary)' }}>Galeria de Campeões</h2>
        
        {history.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)' }}>Nenhum torneio foi finalizado ainda. Jogue um campeonato até o fim para ver os campeões aqui!</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
            {history.map(item => (
              <div key={item.id} style={{ 
                padding: '1.5rem', background: 'rgba(255,255,255,0.02)', 
                border: '1px solid var(--border-color)', borderRadius: '12px',
                position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column'
              }}>
                <div style={{ position: 'absolute', top: '-10px', right: '-10px', opacity: 0.1 }}>
                  <Trophy size={120} />
                </div>
                
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                  {item.date} • {item.config.participants} Jogadores
                </div>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '1.5rem', color: 'white' }}>{item.config.name}</h3>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '1.5rem', flex: 1 }}>
                  <TeamLogo team={item.champion?.team} size={50} />
                  <div>
                    <div style={{ color: 'var(--accent-primary)', fontWeight: 'bold', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Campeão</div>
                    <h4 style={{ fontSize: '1.3rem', margin: 0, textShadow: '0 0 10px rgba(0,255,135,0.2)' }}>{item.champion?.name}</h4>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <Link to={`/history/${item.id}`} className="btn-secondary" style={{ textDecoration: 'none', textAlign: 'center', fontSize: '0.9rem', padding: '10px', flex: 1 }}>
                    Ver Detalhes
                  </Link>
                  <button
                    onClick={() => handleDeleteTournament(item.id)}
                    style={{
                      background: 'transparent', border: '1px solid rgba(255,75,75,0.3)',
                      color: '#ff4b4b', cursor: 'pointer', padding: '10px 14px',
                      borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '6px',
                      fontFamily: 'Outfit', fontSize: '0.9rem', transition: 'all 0.2s'
                    }}
                  >
                    <Trash2 size={16} /> Deletar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};

const App = () => {
  return (
    <HashRouter>
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        
        {/* Header Navigation */}
        <header style={{ 
          background: 'rgba(0,0,0,0.4)', borderBottom: '1px solid var(--border-color)', 
          padding: '1rem 2rem', backdropFilter: 'blur(10px)'
        }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ 
                background: 'var(--accent-primary)', padding: '8px', borderRadius: '8px',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <Trophy size={24} color="#000" />
              </div>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0, letterSpacing: '0.5px' }}>
                EA FC 26 Manager
              </h1>
            </div>

            <nav style={{ display: 'flex', gap: '2rem' }}>
              <NavLink 
                to="/" 
                style={({ isActive }) => ({ 
                  color: isActive ? 'var(--accent-primary)' : 'var(--text-secondary)',
                  fontWeight: isActive ? 600 : 400,
                  textDecoration: 'none', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px',
                  transition: 'color 0.2s',
                  borderBottom: isActive ? '2px solid var(--accent-primary)' : '2px solid transparent',
                  paddingBottom: '4px'
                })}
              >
                <Trophy size={20} /> Torneios
              </NavLink>
              
              <NavLink 
                to="/players" 
                style={({ isActive }) => ({ 
                  color: isActive ? 'var(--accent-primary)' : 'var(--text-secondary)',
                  fontWeight: isActive ? 600 : 400,
                  textDecoration: 'none', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px',
                  transition: 'color 0.2s',
                  borderBottom: isActive ? '2px solid var(--accent-primary)' : '2px solid transparent',
                  paddingBottom: '4px'
                })}
              >
                <Users size={20} /> Jogadores
              </NavLink>
            </nav>

          </div>
        </header>

        <main style={{ flex: 1, maxWidth: '1200px', width: '100%', margin: '0 auto', padding: '2rem' }}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/setup" element={<TournamentSetup />} />
            <Route path="/pool" element={<TeamPoolSelection />} />
            <Route path="/draft" element={<PlayerRegistration />} />
            <Route path="/players" element={<PlayersManager />} />
            <Route path="/history/:id" element={<TournamentHistoryView />} />
          </Routes>
        </main>
      </div>
    </HashRouter>
  );
};

export default App;
