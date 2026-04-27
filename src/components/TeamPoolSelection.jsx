import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckSquare, Square, ArrowRight } from 'lucide-react';
import teamsData from '../data/teams.json';
import TeamLogo from './TeamLogo';

const TeamPoolSelection = () => {
  const navigate = useNavigate();
  const [selectedIds, setSelectedIds] = useState([]);

  useEffect(() => {
    // By default, select all teams
    setSelectedIds(teamsData.map(t => t.id));
  }, []);

  const toggleTeam = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(teamId => teamId !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleSelectAll = () => setSelectedIds(teamsData.map(t => t.id));
  const handleClearAll = () => setSelectedIds([]);
  
  const handleRandomize = () => {
    // Separate teams into top tier (83+) and the rest
    const topTier = teamsData.filter(t => t.overall >= 83);
    const rest = teamsData.filter(t => t.overall < 83);
    
    // Shuffle both arrays
    const shuffledTop = [...topTier].sort(() => 0.5 - Math.random());
    const shuffledRest = [...rest].sort(() => 0.5 - Math.random());
    
    // Pick exactly 3 from top tier, and 17 from the rest
    const selectedTop = shuffledTop.slice(0, 3);
    const selectedRest = shuffledRest.slice(0, 17);
    
    const combinedIds = [...selectedTop, ...selectedRest].map(t => t.id);
    setSelectedIds(combinedIds);
  };

  const handleNext = () => {
    if (selectedIds.length === 0) {
      alert('Selecione pelo menos 1 time!');
      return;
    }
    
    // Save the filtered pool to localStorage
    const pool = teamsData.filter(t => selectedIds.includes(t.id));
    localStorage.setItem('tournamentDraftPool', JSON.stringify(pool));
    
    // Proceed to player registration
    navigate('/draft');
  };

  return (
    <div className="glass-panel" style={{ maxWidth: '800px', margin: '2rem auto' }}>
      <h2 style={{ marginBottom: '0.5rem', color: 'var(--accent-primary)' }}>Defina o Pote do Draft</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
        Selecione quais times estarão disponíveis para o sorteio/escolha neste torneio. 
        <br/>Times Selecionados: <strong style={{ color: 'white' }}>{selectedIds.length}</strong> / {teamsData.length}
      </p>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        <button onClick={handleSelectAll} className="btn-secondary" style={{ padding: '8px 16px' }}>
          Selecionar Todos
        </button>
        <button onClick={handleRandomize} className="btn-secondary" style={{ padding: '8px 16px', color: '#ffd700', borderColor: 'rgba(255, 215, 0, 0.3)' }}>
          Sortear 20 Aleatórios
        </button>
        <button onClick={handleClearAll} className="btn-secondary" style={{ padding: '8px 16px', color: '#ff4b4b', borderColor: 'rgba(255, 75, 75, 0.3)' }}>
          Limpar Tudo
        </button>
      </div>

      <div style={{ 
        display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem',
        maxHeight: '400px', overflowY: 'auto', paddingRight: '10px'
      }}>
        {teamsData.map(team => {
          const isSelected = selectedIds.includes(team.id);
          return (
            <div 
              key={team.id}
              onClick={() => toggleTeam(team.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: '12px', padding: '12px',
                background: isSelected ? 'rgba(0, 255, 135, 0.1)' : 'rgba(255,255,255,0.02)',
                border: `1px solid ${isSelected ? 'var(--accent-primary)' : 'var(--border-color)'}`,
                borderRadius: '12px', cursor: 'pointer', transition: 'all 0.2s ease',
                opacity: isSelected ? 1 : 0.5
              }}
            >
              <div style={{ color: isSelected ? 'var(--accent-primary)' : 'var(--text-secondary)' }}>
                {isSelected ? <CheckSquare size={20} /> : <Square size={20} />}
              </div>
              <TeamLogo team={team} size={32} />
              <div style={{ overflow: 'hidden' }}>
                <div style={{ fontWeight: 600, fontSize: '0.9rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{team.name}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>GER: {team.overall}</div>
              </div>
            </div>
          )
        })}
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
