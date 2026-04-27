import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, NavLink } from 'react-router-dom';
import { Trophy, Users, Shield } from 'lucide-react';
import TournamentSetup from './components/TournamentSetup';
import PlayerRegistration from './components/PlayerRegistration';
import TeamLogo from './components/TeamLogo';
import TournamentBracket from './components/TournamentBracket';
import TournamentGroups from './components/TournamentGroups';
import TeamPoolSelection from './components/TeamPoolSelection';
import TournamentHistoryView from './components/TournamentHistoryView';

const Dashboard = () => {
  const [config, setConfig] = useState(null);
  const [players, setPlayers] = useState(null);
  const [phase, setPhase] = useState('knockout');
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const savedConfig = localStorage.getItem('tournamentConfig');
    const savedPlayers = localStorage.getItem('tournamentPlayers');
    const savedHistory = localStorage.getItem('tournamentsHistory');
    
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    }

    if (savedConfig && savedPlayers) {
      const cfg = JSON.parse(savedConfig);
      setConfig(cfg);
      setPlayers(JSON.parse(savedPlayers));
      
      if (cfg.format === 'groups' && !localStorage.getItem('groupStageFinished')) {
        setPhase('groups');
      }
    }
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

  const handleEndTournament = () => {
    const championStr = localStorage.getItem('tournamentChampion');
    const champion = championStr ? JSON.parse(championStr) : null;
    
    if (!champion) {
      if (!window.confirm('Atenção: O torneio atual ainda NÃO tem um campeão definido. Quer mesmo apagar sem salvar no histórico?')) {
        return;
      }
    } else {
      // Save to history
      const historyItem = {
        id: Date.now().toString(),
        date: new Date().toLocaleDateString(),
        config: config,
        champion: champion,
        players: JSON.parse(localStorage.getItem('tournamentPlayers')),
        groupsData: JSON.parse(localStorage.getItem('tournamentGroups')),
        groupMatches: JSON.parse(localStorage.getItem('tournamentGroupMatches')),
        bracketMatches: JSON.parse(localStorage.getItem('tournamentMatches'))
      };
      const newHistory = [historyItem, ...history];
      localStorage.setItem('tournamentsHistory', JSON.stringify(newHistory));
    }

    // Clear all active tournament data
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

                <Link to={`/history/${item.id}`} className="btn-secondary" style={{ textDecoration: 'none', textAlign: 'center', fontSize: '0.9rem', padding: '10px' }}>
                  Ver Detalhes
                </Link>
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
    <BrowserRouter>
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
            <Route path="/players" element={<PlayerRegistration />} />
            <Route path="/history/:id" element={<TournamentHistoryView />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
};

export default App;
