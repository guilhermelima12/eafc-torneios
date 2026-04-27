import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckSquare, Square, ArrowRight, Filter } from 'lucide-react';
import teamsData from '../data/teams.json';
import TeamLogo from './TeamLogo';

const ALL_LEAGUES = ['Todas', ...Array.from(new Set(teamsData.map(t => t.league))).sort()];

const TeamPoolSelection = () => {
  const navigate = useNavigate();
  const [selectedIds, setSelectedIds] = useState([]);
  const [activeLeague, setActiveLeague] = useState('Todas');
  const [search, setSearch] = useState('');

  useEffect(() => {
    setSelectedIds(teamsData.map(t => t.id));
  }, []);

  const visibleTeams = teamsData.filter(t => {
    const matchLeague = activeLeague === 'Todas' || t.league === activeLeague;
    const matchSearch = t.name.toLowerCase().includes(search.toLowerCase());
    return matchLeague && matchSearch;
  });

  const toggleTeam = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleSelectLeague = () => {
    const ids = visibleTeams.map(t => t.id);
    const allVisible = ids.every(id => selectedIds.includes(id));
    if (allVisible) {
      setSelectedIds(prev => prev.filter(id => !ids.includes(id)));
    } else {
      setSelectedIds(prev => [...new Set([...prev, ...ids])]);
    }
  };

  const handleSelectAll = () => setSelectedIds(teamsData.map(t => t.id));
  const handleClearAll = () => setSelectedIds([]);

  const handleRandomize = () => {
    const pool = activeLeague === 'Todas' ? teamsData : visibleTeams;
    const top = pool.filter(t => t.overall >= 83).sort(() => 0.5 - Math.random()).slice(0, 3);
    const rest = pool.filter(t => t.overall < 83).sort(() => 0.5 - Math.random()).slice(0, 17);
    setSelectedIds([...top, ...rest].map(t => t.id));
  };

  const handleNext = () => {
    if (selectedIds.length === 0) { alert('Selecione pelo menos 1 time!'); return; }
    const pool = teamsData.filter(t => selectedIds.includes(t.id));
    localStorage.setItem('tournamentDraftPool', JSON.stringify(pool));
    navigate('/draft');
  };

  const visibleSelected = visibleTeams.filter(t => selectedIds.includes(t.id)).length;
  const allVisibleSelected = visibleTeams.length > 0 && visibleSelected === visibleTeams.length;

  return (
    <div className="glass-panel" style={{ maxWidth: '900px', margin: '2rem auto' }}>
      <h2 style={{ marginBottom: '0.5rem', color: 'var(--accent-primary)' }}>Defina o Pote do Draft</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
        Times selecionados: <strong style={{ color: 'white' }}>{selectedIds.length}</strong> / {teamsData.length}
      </p>

      {/* Search */}
      <input
        type="text"
        placeholder="Buscar time..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        style={{
          width: '100%', padding: '10px 14px', borderRadius: '8px', marginBottom: '1rem',
          background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)',
          color: 'white', fontFamily: 'Outfit', fontSize: '1rem', outline: 'none', boxSizing: 'border-box'
        }}
      />

      {/* League filter tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
        {ALL_LEAGUES.map(league => (
          <button
            key={league}
            onClick={() => setActiveLeague(league)}
            style={{
              padding: '5px 12px', borderRadius: '20px', border: '1px solid',
              fontFamily: 'Outfit', fontSize: '0.8rem', cursor: 'pointer', transition: 'all 0.2s',
              borderColor: activeLeague === league ? 'var(--accent-secondary)' : 'var(--border-color)',
              background: activeLeague === league ? 'rgba(96,239,255,0.1)' : 'transparent',
              color: activeLeague === league ? 'var(--accent-secondary)' : 'var(--text-secondary)',
              fontWeight: activeLeague === league ? 700 : 400
            }}
          >
            {league}
          </button>
        ))}
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <button onClick={handleSelectAll} className="btn-secondary" style={{ padding: '7px 14px', fontSize: '0.85rem' }}>
          Todos
        </button>
        <button onClick={handleSelectLeague} className="btn-secondary" style={{ padding: '7px 14px', fontSize: '0.85rem', color: 'var(--accent-secondary)', borderColor: 'rgba(96,239,255,0.3)' }}>
          {allVisibleSelected ? 'Desmarcar' : 'Selecionar'} {activeLeague !== 'Todas' ? activeLeague : 'Visíveis'}
        </button>
        <button onClick={handleRandomize} className="btn-secondary" style={{ padding: '7px 14px', fontSize: '0.85rem', color: '#ffd700', borderColor: 'rgba(255,215,0,0.3)' }}>
          Sortear 20 Aleatórios
        </button>
        <button onClick={handleClearAll} className="btn-secondary" style={{ padding: '7px 14px', fontSize: '0.85rem', color: '#ff4b4b', borderColor: 'rgba(255,75,75,0.3)' }}>
          Limpar Tudo
        </button>
      </div>

      {/* Teams grid */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: '0.75rem',
        maxHeight: '420px', overflowY: 'auto', paddingRight: '6px'
      }}>
        {visibleTeams.map(team => {
          const isSelected = selectedIds.includes(team.id);
          return (
            <div
              key={team.id}
              onClick={() => toggleTeam(team.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px',
                background: isSelected ? 'rgba(0,255,135,0.07)' : 'rgba(255,255,255,0.02)',
                border: `1px solid ${isSelected ? 'var(--accent-primary)' : 'var(--border-color)'}`,
                borderRadius: '10px', cursor: 'pointer', transition: 'all 0.15s ease',
                opacity: isSelected ? 1 : 0.45
              }}
            >
              <div style={{ color: isSelected ? 'var(--accent-primary)' : 'var(--text-secondary)', flexShrink: 0 }}>
                {isSelected ? <CheckSquare size={18} /> : <Square size={18} />}
              </div>
              <TeamLogo team={team} size={28} />
              <div style={{ overflow: 'hidden', minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{team.name}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>OVR {team.overall}</div>
              </div>
            </div>
          );
        })}
        {visibleTeams.length === 0 && (
          <p style={{ color: 'var(--text-secondary)', gridColumn: '1/-1' }}>Nenhum time encontrado.</p>
        )}
      </div>

      <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
        <button onClick={handleNext} className="btn-primary" style={{ padding: '14px 32px', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          Continuar <ArrowRight size={20} />
        </button>
      </div>
    </div>
  );
};

export default TeamPoolSelection;
