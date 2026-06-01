import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckSquare, Square, ArrowRight, Filter } from 'lucide-react';
import teamsData from '../data/teams.json';
import TeamLogo from './TeamLogo';

const ALL_LEAGUES = ['Todas', ...Array.from(new Set(teamsData.map(t => t.league))).sort()];

const autoAssignPotsByRating = (ids, potsCount) => {
  const mapping = {};
  ids.forEach(id => {
    const team = teamsData.find(t => t.id === id);
    if (team) {
      if (potsCount === 2) {
        mapping[id] = team.overall >= 82 ? 1 : 2;
      } else if (potsCount === 3) {
        if (team.overall >= 83) mapping[id] = 1;
        else if (team.overall >= 80) mapping[id] = 2;
        else mapping[id] = 3;
      } else { // 4 pots
        if (team.overall >= 84) mapping[id] = 1;
        else if (team.overall >= 81) mapping[id] = 2;
        else if (team.overall >= 78) mapping[id] = 3;
        else mapping[id] = 4;
      }
    }
  });
  return mapping;
};

const TeamPoolSelection = () => {
  const navigate = useNavigate();
  const [selectedIds, setSelectedIds] = useState([]);
  const [activeLeague, setActiveLeague] = useState('Todas');
  const [search, setSearch] = useState('');
  const [config, setConfig] = useState(null);
  const [teamPots, setTeamPots] = useState({});
  const [activePot, setActivePot] = useState('all');

  useEffect(() => {
    const savedConfig = localStorage.getItem('tournamentConfig');
    let parsedConfig = null;
    if (savedConfig) {
      parsedConfig = JSON.parse(savedConfig);
      setConfig(parsedConfig);
    }
    const allIds = teamsData.map(t => t.id);
    setSelectedIds(allIds);
    if (parsedConfig && parsedConfig.enableTeamPots) {
      const potsCount = parsedConfig.teamPotsCount || 3;
      setTeamPots(autoAssignPotsByRating(allIds, potsCount));
    }
  }, []);

  const visibleTeams = teamsData.filter(t => {
    const matchLeague = activeLeague === 'Todas' || t.league === activeLeague;
    const matchSearch = t.name.toLowerCase().includes(search.toLowerCase());
    
    let matchPot = true;
    if (config && config.enableTeamPots && activePot !== 'all') {
      const currentPot = selectedIds.includes(t.id) 
        ? (teamPots[t.id] || 1) 
        : (autoAssignPotsByRating([t.id], config.teamPotsCount || 3)[t.id] || 1);
      matchPot = currentPot === activePot;
    }
    return matchLeague && matchSearch && matchPot;
  });

  const toggleTeam = (id) => {
    setSelectedIds(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
      if (config && config.enableTeamPots && !prev.includes(id)) {
        const potsCount = config.teamPotsCount || 3;
        const initialMap = autoAssignPotsByRating([id], potsCount);
        setTeamPots(prevPots => ({ ...prevPots, ...initialMap }));
      }
      return next;
    });
  };

  const handleSelectLeague = () => {
    const ids = visibleTeams.map(t => t.id);
    const allVisible = ids.every(id => selectedIds.includes(id));
    let nextIds;
    if (allVisible) {
      nextIds = selectedIds.filter(id => !ids.includes(id));
    } else {
      nextIds = [...new Set([...selectedIds, ...ids])];
    }
    setSelectedIds(nextIds);
    if (config && config.enableTeamPots) {
      const potsCount = config.teamPotsCount || 3;
      const newMap = autoAssignPotsByRating(ids, potsCount);
      setTeamPots(prev => ({ ...prev, ...newMap }));
    }
  };

  const handleSelectAll = () => {
    const allIds = teamsData.map(t => t.id);
    setSelectedIds(allIds);
    if (config && config.enableTeamPots) {
      const potsCount = config.teamPotsCount || 3;
      setTeamPots(autoAssignPotsByRating(allIds, potsCount));
    }
  };

  const handleClearAll = () => {
    setSelectedIds([]);
    setTeamPots({});
  };

  const handleRandomize = () => {
    const pool = activeLeague === 'Todas' ? teamsData : visibleTeams;
    const top = pool.filter(t => t.overall >= 83).sort(() => 0.5 - Math.random()).slice(0, 3);
    const rest = pool.filter(t => t.overall < 83).sort(() => 0.5 - Math.random()).slice(0, 17);
    const newIds = [...top, ...rest].map(t => t.id);
    setSelectedIds(newIds);
    if (config && config.enableTeamPots) {
      const potsCount = config.teamPotsCount || 3;
      setTeamPots(autoAssignPotsByRating(newIds, potsCount));
    }
  };

  const handleNext = () => {
    if (selectedIds.length === 0) { alert('Selecione pelo menos 1 time!'); return; }
    const pool = teamsData.filter(t => selectedIds.includes(t.id)).map(t => {
      if (config && config.enableTeamPots) {
        return {
          ...t,
          potNumber: teamPots[t.id] || 1
        };
      }
      return t;
    });
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

      {/* Pot filter tabs */}
      {config && config.enableTeamPots && (
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.25rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.75rem' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', alignSelf: 'center', marginRight: '6px' }}>Filtrar Pote:</span>
          {['Todos os Potes', ...Array.from({ length: config.teamPotsCount || 3 }, (_, i) => `Pote ${i + 1}`)].map(potOption => {
            const potVal = potOption === 'Todos os Potes' ? 'all' : parseInt(potOption.replace('Pote ', ''), 10);
            const active = activePot === potVal;
            return (
              <button
                key={potOption}
                type="button"
                onClick={() => setActivePot(potVal)}
                style={{
                  padding: '5px 12px', borderRadius: '20px', border: '1px solid',
                  fontFamily: 'Outfit', fontSize: '0.8rem', cursor: 'pointer', transition: 'all 0.2s',
                  borderColor: active ? 'var(--accent-primary)' : 'var(--border-color)',
                  background: active ? 'rgba(0,255,135,0.1)' : 'transparent',
                  color: active ? 'var(--accent-primary)' : 'var(--text-secondary)',
                  fontWeight: active ? 700 : 400
                }}
              >
                {potOption}
              </button>
            );
          })}
        </div>
      )}

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
                opacity: isSelected ? 1 : 0.45,
                position: 'relative'
              }}
            >
              <div style={{ color: isSelected ? 'var(--accent-primary)' : 'var(--text-secondary)', flexShrink: 0 }} onClick={e => { e.stopPropagation(); toggleTeam(team.id); }}>
                {isSelected ? <CheckSquare size={18} /> : <Square size={18} />}
              </div>
              <TeamLogo team={team} size={28} />
              <div style={{ overflow: 'hidden', minWidth: 0, flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{team.name}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>OVR {team.overall}</div>
              </div>
              {isSelected && config && config.enableTeamPots && (
                <select
                  value={teamPots[team.id] || 1}
                  onClick={e => e.stopPropagation()}
                  onChange={e => {
                    const newPot = parseInt(e.target.value, 10);
                    setTeamPots(prev => ({ ...prev, [team.id]: newPot }));
                  }}
                  style={{
                    background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.15)',
                    color: 'white', fontSize: '0.7rem', fontWeight: 600, borderRadius: '4px',
                    padding: '2px 4px', cursor: 'pointer', outline: 'none', fontFamily: 'Outfit'
                  }}
                >
                  {Array.from({ length: config.teamPotsCount || 3 }, (_, idx) => (
                    <option key={idx + 1} value={idx + 1}>Pote {idx + 1}</option>
                  ))}
                </select>
              )}
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
