import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Link, NavLink, Navigate } from 'react-router-dom';
import { Trophy, Users, BarChart2, Trash2, LogOut, ShieldCheck, Eye, Home, Menu, X } from 'lucide-react';
import TournamentSetup from './components/TournamentSetup';
import PlayerRegistration from './components/PlayerRegistration';
import TeamLogo from './components/TeamLogo';
import TournamentBracket from './components/TournamentBracket';
import TournamentGroups from './components/TournamentGroups';
import TeamPoolSelection from './components/TeamPoolSelection';
import TournamentHistoryView from './components/TournamentHistoryView';
import PlayersManager from './components/PlayersManager';
import StatsDashboard from './components/StatsDashboard';
import HomePage from './components/HomePage';
import { supabase } from './lib/supabase';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginGate from './components/LoginGate';

const Dashboard = () => {
  const { isAdmin } = useAuth();
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
    const ap = config?.advancePerGroup || 2;
    const numGroups = ap > 0 ? Math.round(qualifiedPlayers.length / ap) : qualifiedPlayers.length;

    // Group qualifiers by their position within each group
    // qualifiedPlayers order: [A1, A2, ..., B1, B2, ..., ...]
    const byTier = Array.from({ length: ap }, () => []);
    for (let g = 0; g < numGroups; g++) {
      for (let pos = 0; pos < ap; pos++) {
        const idx = g * ap + pos;
        if (idx < qualifiedPlayers.length) byTier[pos].push(qualifiedPlayers[idx]);
      }
    }

    // Sort each tier by group performance (pts DESC, gd DESC, gf DESC)
    const sortByPerf = (arr) => [...arr].sort((a, b) => {
      if ((b.pts ?? 0) !== (a.pts ?? 0)) return (b.pts ?? 0) - (a.pts ?? 0);
      if ((b.gd  ?? 0) !== (a.gd  ?? 0)) return (b.gd  ?? 0) - (a.gd  ?? 0);
      return (b.gf ?? 0) - (a.gf ?? 0);
    });

    // Seeded order: [best 1st, 2nd best 1st, ...all 2nds sorted, ...all 3rds sorted]
    const seeded = byTier.flatMap(tier => sortByPerf(tier));

    localStorage.setItem('tournamentPlayers', JSON.stringify(seeded));
    localStorage.setItem('groupStageFinished', 'true');
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

      // ─── Recalculate seeds: average finish position across ALL tournaments ───
      // Helper: extract ordered standings from any tournament record
      const getTournamentStandings = (t) => {
        const fmt = t.config?.format;
        // League: standings are groups_data[0] (already sorted by points)
        if (fmt === 'league') {
          return (t.groups_data?.[0] || t.players || []).filter(Boolean);
        }

        // Knockout / Groups+Knockout: derive from bracket results
        const bMatches = t.bracket_matches || [];
        const qualified = t.players || [];
        const gData = t.groups_data;
        const standings = [];
        const added = new Set();

        // 1) Process bracket from Final down to first round
        if (bMatches.length > 0) {
          bMatches
            .filter(m => m.winner)
            .sort((a, b) => b.round - a.round)
            .forEach(match => {
              const winner = match.winner;
              const loser = match.p1?.id === winner?.id ? match.p2 : match.p1;
              if (winner?.name && !added.has(winner.name)) { standings.push(winner); added.add(winner.name); }
              if (loser?.name && !added.has(loser.name)) { standings.push(loser); added.add(loser.name); }
            });
        }

        // 2) Bracket players not yet in list
        qualified.forEach(p => {
          if (p?.name && !added.has(p.name)) { standings.push(p); added.add(p.name); }
        });

        // 3) Group-eliminated players ordered by group rank
        if (gData) {
          const groupElim = [];
          gData.forEach(group => {
            group.forEach((p, idx) => {
              if (p?.name && !added.has(p.name)) groupElim.push({ player: p, rank: idx });
            });
          });
          groupElim.sort((a, b) => a.rank - b.rank);
          groupElim.forEach(({ player }) => {
            if (!added.has(player.name)) { standings.push(player); added.add(player.name); }
          });
        }

        return standings;
      };

      // Load all tournaments (including the one just inserted)
      const { data: allTournaments } = await supabase.from('tournaments').select('*');

      // Accumulate position totals per player
      const posMap = {}; // name -> { total, count }
      if (allTournaments) {
        allTournaments.forEach(t => {
          const stds = getTournamentStandings(t);
          stds.forEach((player, idx) => {
            if (!player?.name) return;
            if (!posMap[player.name]) posMap[player.name] = { total: 0, count: 0 };
            posMap[player.name].total += (idx + 1); // 1-based position
            posMap[player.name].count += 1;
          });
        });
      }

      // Sort by average position ascending (best avg = lowest seed number)
      const ranked = Object.entries(posMap)
        .map(([name, { total, count }]) => ({ name, avg: total / count }))
        .sort((a, b) => a.avg - b.avg);

      // Write new seeds
      if (ranked.length > 0) {
        const { data: dbPlayers } = await supabase.from('players').select('id, name');
        if (dbPlayers) {
          const seedUpdates = ranked.map((entry, idx) => {
            const dbPlayer = dbPlayers.find(db => db.name === entry.name);
            if (dbPlayer) {
              return supabase.from('players').update({ seed: idx + 1 }).eq('id', dbPlayer.id);
            }
            return Promise.resolve();
          });
          await Promise.all(seedUpdates);
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
            <p style={{ color: 'var(--text-secondary)' }}>Bem-vindo ao EA FC 26 Manager.{isAdmin ? ' Comece configurando o seu torneio presencial.' : ' Aguardando o início de um torneio.'}</p>
            {isAdmin && (
              <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem' }}>
                <Link to="/setup" className="btn-primary" style={{ textDecoration: 'none', display: 'inline-block' }}>
                  Criar Novo Torneio
                </Link>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Tournament Header */}
            <div style={{ padding: '1.5rem', background: 'rgba(0,255,135,0.05)', border: '1px solid var(--accent-primary)', borderRadius: '12px', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h3 style={{ color: 'var(--accent-primary)', marginBottom: '0.4rem', fontSize: '1.5rem' }}>{config.name}</h3>
                  <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.9rem' }}>
                    <strong>{config.format === 'knockout' ? 'Mata-Mata' : config.format === 'groups' ? 'Grupos + Eliminatórias' : 'Pontos Corridos'}</strong>
                    {' · '}{config.legsMode === 'double' ? 'Ida e Volta' : 'Jogo Único'}
                    {' · '}{config.participants} participantes
                  </p>
                </div>
                {isAdmin && (
                  <button onClick={handleEndTournament} className="btn-secondary" style={{ color: '#ff4b4b', borderColor: 'rgba(255,75,75,0.3)', whiteSpace: 'nowrap' }}>
                    Encerrar / Salvar no Histórico
                  </button>
                )}
              </div>

              {/* Management buttons — admin only */}
              {isAdmin && (
                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => {
                      if (!window.confirm('Resetar todos os placares? Os jogadores e times serão mantidos, mas os seeds NÃO serão alterados.')) return;
                      localStorage.removeItem('tournamentMatches');
                      localStorage.removeItem('tournamentGroups');
                      localStorage.removeItem('tournamentGroupMatches');
                      localStorage.removeItem('groupStageFinished');
                      localStorage.removeItem('tournamentChampion');
                      window.location.reload();
                    }}
                    className="btn-secondary"
                    style={{ padding: '7px 14px', fontSize: '0.85rem', color: '#fbbf24', borderColor: 'rgba(251,191,36,0.3)' }}
                  >
                    🔄 Resetar Partidas
                  </button>
                  <button
                    onClick={() => { localStorage.removeItem('tournamentPlayers'); localStorage.removeItem('tournamentDraftPool'); window.location.href = '/#/pool'; }}
                    className="btn-secondary"
                    style={{ padding: '7px 14px', fontSize: '0.85rem', color: 'var(--accent-secondary)', borderColor: 'rgba(96,239,255,0.3)' }}
                  >
                    ⚙️ Trocar Times
                  </button>
                  <button
                    onClick={() => { localStorage.removeItem('tournamentPlayers'); window.location.href = '/#/draft'; }}
                    className="btn-secondary"
                    style={{ padding: '7px 14px', fontSize: '0.85rem' }}
                  >
                    👥 Refazer Draft
                  </button>
                </div>
              )}
            </div>

            <div style={{ marginTop: '1rem' }}>
              {phase === 'groups' ? (
                <TournamentGroups
                  players={players}
                  onFinishGroups={isAdmin ? handleFinishGroups : null}
                  legsMode={config.legsMode || 'single'}
                  numGroups={config.numGroups || 2}
                  advancePerGroup={config.advancePerGroup || 2}
                  readOnly={!isAdmin}
                />
              ) : phase === 'league' ? (
                <TournamentGroups players={players} onFinishGroups={isAdmin ? handleFinishGroups : null} leagueOnly={true} legsMode={config.legsMode || 'single'} numGroups={1} advancePerGroup={4} readOnly={!isAdmin} />
              ) : (
                <TournamentBracket readOnly={!isAdmin} />
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
                <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', color: 'white' }}>{item.config.name}</h3>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '2px 10px', borderRadius: '20px', marginBottom: '1rem', display: 'inline-block', background: 'rgba(96,239,255,0.1)', color: 'var(--accent-secondary)', border: '1px solid rgba(96,239,255,0.2)', letterSpacing: '0.5px' }}>
                  {item.config.format === 'knockout' ? 'Mata-Mata' : item.config.format === 'league' ? 'Pontos Corridos' : 'Grupos + Eliminatórias'}
                  {item.config.legsMode === 'double' ? ' • Ida e Volta' : ''}
                </span>
                
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
                  {isAdmin && (
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
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};

/* ── NavLink style helper ─────────────────────────────────────── */
const navLinkStyle = ({ isActive }) => ({
  color: isActive ? 'var(--accent-primary)' : 'var(--text-secondary)',
  fontWeight: isActive ? 600 : 400,
  textDecoration: 'none',
  display: 'flex', alignItems: 'center', gap: '8px',
  transition: 'color 0.2s',
  borderBottom: isActive ? '2px solid var(--accent-primary)' : '2px solid transparent',
  paddingBottom: '4px'
});

/* ── Guarded route: redirects guests away from admin-only pages ── */
const AdminRoute = ({ element }) => {
  const { isAdmin } = useAuth();
  return isAdmin ? element : <Navigate to="/" replace />;
};

/* ── Main shell (inside HashRouter + AuthProvider) ─────────────── */
const AppShell = () => {
  const { role, isAdmin, logout } = useAuth();
  const [navOpen, setNavOpen] = useState(false);
  const closeNav = () => setNavOpen(false);

  if (!role) return <LoginGate />;

  const mobileNavLinkStyle = (isActive) => ({
    display: 'flex', alignItems: 'center', gap: '14px',
    padding: '0.875rem 1.25rem', borderRadius: '12px',
    textDecoration: 'none', marginBottom: '6px',
    color: isActive ? 'var(--accent-primary)' : 'var(--text-primary)',
    background: isActive ? 'rgba(0,255,135,0.08)' : 'rgba(255,255,255,0.03)',
    border: `1px solid ${isActive ? 'rgba(0,255,135,0.2)' : 'rgba(255,255,255,0.05)'}`,
    fontWeight: isActive ? 700 : 500,
    fontSize: '1.05rem',
    transition: 'all 0.2s',
  });

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

      {/* ── Header ── */}
      <header style={{
        background: 'rgba(0,0,0,0.5)', borderBottom: '1px solid var(--border-color)',
        padding: '0.875rem 1.5rem', backdropFilter: 'blur(12px)',
        position: 'sticky', top: 0, zIndex: 200,
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>

          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ background: 'var(--accent-primary)', padding: '7px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Trophy size={22} color="#000" />
            </div>
            <h1 className="header-title" style={{ fontSize: '1.4rem', fontWeight: 700, margin: 0, letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>
              EA FC 26 Manager
            </h1>
          </div>

          {/* Desktop nav */}
          <nav className="desk-nav" style={{ display: 'flex', gap: '1.75rem', alignItems: 'center' }}>
            <NavLink to="/" end style={navLinkStyle}><Home size={18} /> Home</NavLink>
            <NavLink to="/tournaments" style={navLinkStyle}><Trophy size={18} /> Torneios</NavLink>
            <NavLink to="/players" style={navLinkStyle}><Users size={18} /> Jogadores</NavLink>
            <NavLink to="/stats" style={navLinkStyle}><BarChart2 size={18} /> Estatísticas</NavLink>
          </nav>

          {/* Desktop: role + logout */}
          <div className="desk-nav" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '5px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600,
              background: isAdmin ? 'rgba(0,255,135,0.1)' : 'rgba(96,239,255,0.1)',
              border: `1px solid ${isAdmin ? 'rgba(0,255,135,0.25)' : 'rgba(96,239,255,0.25)'}`,
              color: isAdmin ? 'var(--accent-primary)' : 'var(--accent-secondary)',
            }}>
              {isAdmin ? <ShieldCheck size={14} /> : <Eye size={14} />}
              {isAdmin ? 'Admin' : 'Convidado'}
            </div>
            <button onClick={logout} title="Sair" style={{
              background: 'transparent', border: '1px solid rgba(255,255,255,0.1)',
              color: 'var(--text-secondary)', cursor: 'pointer', padding: '6px 10px',
              borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '6px',
              fontFamily: 'Outfit', fontSize: '0.8rem', transition: 'all 0.2s'
            }}>
              <LogOut size={14} /> Sair
            </button>
          </div>

          {/* Mobile: role chip + hamburger */}
          <div className="mob-only" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '5px',
              padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600,
              background: isAdmin ? 'rgba(0,255,135,0.12)' : 'rgba(96,239,255,0.12)',
              border: `1px solid ${isAdmin ? 'rgba(0,255,135,0.3)' : 'rgba(96,239,255,0.3)'}`,
              color: isAdmin ? 'var(--accent-primary)' : 'var(--accent-secondary)',
            }}>
              {isAdmin ? <ShieldCheck size={12} /> : <Eye size={12} />}
              {isAdmin ? 'Admin' : 'Guest'}
            </div>
            <button
              onClick={() => setNavOpen(o => !o)}
              style={{
                background: navOpen ? 'rgba(0,255,135,0.08)' : 'rgba(255,255,255,0.06)',
                border: `1px solid ${navOpen ? 'rgba(0,255,135,0.25)' : 'rgba(255,255,255,0.1)'}`,
                borderRadius: '8px', padding: '7px', cursor: 'pointer',
                color: navOpen ? 'var(--accent-primary)' : 'white',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s',
              }}
              aria-label="Menu"
            >
              {navOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>

        </div>
      </header>

      {/* ── Mobile Nav Overlay ── */}
      {navOpen && (
        <div
          onClick={closeNav}
          style={{
            position: 'fixed', inset: 0, zIndex: 190,
            background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
          }}
        />
      )}
      <div className="mob-only" style={{
        position: 'fixed', top: '58px', left: 0, right: 0, zIndex: 195,
        flexDirection: 'column',
        background: 'rgba(10,14,26,0.98)', backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        padding: navOpen ? '1.25rem 1.25rem 1.5rem' : '0 1.25rem',
        maxHeight: navOpen ? '500px' : '0',
        overflow: 'hidden',
        transition: 'max-height 0.35s cubic-bezier(0.4,0,0.2,1), padding 0.3s ease',
      }}>
        {[
          { to: '/',            end: true, Icon: Home,      label: 'Home' },
          { to: '/tournaments', end: false, Icon: Trophy,    label: 'Torneios' },
          { to: '/players',     end: false, Icon: Users,     label: 'Jogadores' },
          { to: '/stats',       end: false, Icon: BarChart2, label: 'Estatísticas' },
        ].map(({ to, end, Icon, label }) => (
          <NavLink key={to} to={to} end={end} onClick={closeNav}
            style={({ isActive }) => mobileNavLinkStyle(isActive)}>
            <Icon size={20} /> {label}
          </NavLink>
        ))}

        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '1rem', marginTop: '0.5rem' }}>
          <button onClick={() => { logout(); closeNav(); }} style={{
            width: '100%', padding: '0.875rem 1.25rem',
            display: 'flex', alignItems: 'center', gap: '12px',
            background: 'rgba(255,75,75,0.06)', border: '1px solid rgba(255,75,75,0.15)',
            color: '#ff4b4b', cursor: 'pointer', borderRadius: '12px',
            fontFamily: 'Outfit', fontSize: '1rem', fontWeight: 600,
            transition: 'all 0.2s',
          }}>
            <LogOut size={18} /> Sair da conta
          </button>
        </div>
      </div>

      {/* ── Main content ── */}
      <main className="main-content" style={{ flex: 1, maxWidth: '1200px', width: '100%', margin: '0 auto', padding: '2rem' }}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/tournaments" element={<Dashboard />} />
          <Route path="/setup" element={<AdminRoute element={<TournamentSetup />} />} />
          <Route path="/pool" element={<AdminRoute element={<TeamPoolSelection />} />} />
          <Route path="/draft" element={<AdminRoute element={<PlayerRegistration />} />} />
          <Route path="/players" element={<PlayersManager />} />
          <Route path="/stats" element={<StatsDashboard />} />
          <Route path="/history/:id" element={<TournamentHistoryView />} />
        </Routes>
      </main>

    </div>
  );
};

/* ── Root App ─────────────────────────────────────────────────── */
const App = () => (
  <AuthProvider>
    <HashRouter>
      <AppShell />
    </HashRouter>
  </AuthProvider>
);

export default App;
