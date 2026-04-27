import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, Users, Settings, ArrowRight } from 'lucide-react';

const TournamentSetup = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    format: 'groups',
    participants: 8,
    teamSelectionMode: 'manual'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Wipe any existing active tournament data to ensure a clean start
    localStorage.removeItem('tournamentPlayers');
    localStorage.removeItem('tournamentMatches');
    localStorage.removeItem('tournamentGroups');
    localStorage.removeItem('tournamentGroupMatches');
    localStorage.removeItem('groupStageFinished');
    localStorage.removeItem('tournamentChampion');
    
    localStorage.setItem('tournamentConfig', JSON.stringify(formData));
    navigate('/pool');
  };

  return (
    <div className="glass-panel" style={{ maxWidth: '600px', margin: '2rem auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '2rem' }}>
        <Settings size={28} color="var(--accent-primary)" />
        <h2 style={{ fontSize: '1.8rem' }}>Nova Competição</h2>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
            Nome do Torneio
          </label>
          <input
            type="text"
            required
            placeholder="Ex: Copa Libertadores dos Amigos"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            style={{
              width: '100%', padding: '12px 16px', borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border-color)',
              color: 'white', fontFamily: 'Outfit', fontSize: '1.1rem', outline: 'none'
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
            Formato
          </label>
          <select
            value={formData.format}
            onChange={(e) => setFormData({...formData, format: e.target.value})}
            style={{
              width: '100%', padding: '12px 16px', borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border-color)',
              color: 'white', fontFamily: 'Outfit', fontSize: '1.1rem', outline: 'none'
            }}
          >
            <option value="knockout" style={{ background: 'var(--bg-secondary)' }}>Mata-Mata Direto (Knockout)</option>
            <option value="groups" style={{ background: 'var(--bg-secondary)' }}>Fase de Grupos + Eliminatórias</option>
            <option value="league" style={{ background: 'var(--bg-secondary)' }}>Pontos Corridos (Liga)</option>
          </select>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
            Número de Participantes
          </label>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <input
              type="number"
              min="4"
              max="32"
              value={formData.participants}
              onChange={(e) => setFormData({...formData, participants: parseInt(e.target.value) || 4})}
              style={{
                width: '100px', padding: '12px', borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border-color)',
                color: 'white', fontFamily: 'Outfit', fontSize: '1.1rem', outline: 'none', textAlign: 'center'
              }}
            />
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {[4, 8, 16].map(num => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setFormData({...formData, participants: num})}
                  style={{
                    padding: '8px 16px', borderRadius: '8px',
                    border: `1px solid ${formData.participants === num ? 'var(--accent-primary)' : 'var(--border-color)'}`,
                    background: formData.participants === num ? 'rgba(0, 255, 135, 0.1)' : 'transparent',
                    color: formData.participants === num ? 'var(--accent-primary)' : 'var(--text-primary)',
                    cursor: 'pointer', fontFamily: 'Outfit', transition: 'all 0.2s ease'
                  }}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
            Modo de Seleção de Clubes
          </label>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              type="button"
              onClick={() => setFormData({...formData, teamSelectionMode: 'manual'})}
              style={{
                flex: 1, padding: '12px', borderRadius: '8px',
                border: `1px solid ${formData.teamSelectionMode === 'manual' ? 'var(--accent-primary)' : 'var(--border-color)'}`,
                background: formData.teamSelectionMode === 'manual' ? 'rgba(0, 255, 135, 0.1)' : 'transparent',
                color: formData.teamSelectionMode === 'manual' ? 'var(--accent-primary)' : 'var(--text-primary)',
                cursor: 'pointer', fontFamily: 'Outfit', fontWeight: 600, transition: 'all 0.2s ease'
              }}
            >
              Draft Manual (Por Nível)
            </button>
            <button
              type="button"
              onClick={() => setFormData({...formData, teamSelectionMode: 'random'})}
              style={{
                flex: 1, padding: '12px', borderRadius: '8px',
                border: `1px solid ${formData.teamSelectionMode === 'random' ? 'var(--accent-primary)' : 'var(--border-color)'}`,
                background: formData.teamSelectionMode === 'random' ? 'rgba(0, 255, 135, 0.1)' : 'transparent',
                color: formData.teamSelectionMode === 'random' ? 'var(--accent-primary)' : 'var(--text-primary)',
                cursor: 'pointer', fontFamily: 'Outfit', fontWeight: 600, transition: 'all 0.2s ease'
              }}
            >
              Sorteio Aleatório
            </button>
          </div>
        </div>

        <button type="submit" className="btn-primary" style={{ marginTop: '1rem', padding: '16px', fontSize: '1.2rem' }}>
          Continuar para o Pote
        </button>
      </form>
    </div>
  );
};

export default TournamentSetup;
