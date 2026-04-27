import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Shield, Plus, Trash2, CheckCircle2, ArrowRight, Play, Dices } from 'lucide-react';
import TeamLogo from './TeamLogo';
import defaultTeamsData from '../data/teams.json';

const PlayerRegistration = () => {
  const navigate = useNavigate();
  const [config, setConfig] = useState(null);
  const [draftPool, setDraftPool] = useState([]);
  
  // App states
  const [step, setStep] = useState('registration'); // 'registration' | 'draft' | 'finished'
  const [players, setPlayers] = useState([]);
  
  // Registration form state
  const [currentPlayerName, setCurrentPlayerName] = useState('');
  const [currentPlayerRank, setCurrentPlayerRank] = useState('');
  
  // Draft state
  const [draftIndex, setDraftIndex] = useState(0);
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [isSpinning, setIsSpinning] = useState(false);

  useEffect(() => {
    const savedConfig = localStorage.getItem('tournamentConfig');
    const savedPool = localStorage.getItem('tournamentDraftPool');
    
    if (savedConfig) {
      setConfig(JSON.parse(savedConfig));
    } else {
      navigate('/setup');
    }

    if (savedPool) {
      setDraftPool(JSON.parse(savedPool));
    } else {
      setDraftPool(defaultTeamsData);
    }
  }, [navigate]);

  if (!config) return null;

  const isFull = players.length >= config.participants;

  // --- REGISTRATION STEP ---
  const handleAddPlayer = (e) => {
    e.preventDefault();
    if (!currentPlayerName || !currentPlayerRank) return;
    if (isFull) return;

    setPlayers([...players, {
      id: Date.now().toString(),
      name: currentPlayerName,
      lastRank: parseInt(currentPlayerRank, 10),
      team: null
    }]);
    
    setCurrentPlayerName('');
    setCurrentPlayerRank('');
  };

  const removePlayer = (id) => {
    setPlayers(players.filter(p => p.id !== id));
  };

  const startDraft = () => {
    const sortedPlayers = [...players].sort((a, b) => b.lastRank - a.lastRank);
    setPlayers(sortedPlayers);
    setStep('draft');
  };

  // --- DRAFT STEP ---
  const availableTeams = draftPool.filter(team => 
    !players.some(p => p.team?.id === team.id)
  );

  const confirmPick = (teamId) => {
    const selectedTeam = draftPool.find(t => t.id === teamId);
    
    const updatedPlayers = [...players];
    updatedPlayers[draftIndex].team = selectedTeam;
    setPlayers(updatedPlayers);
    setSelectedTeamId('');

    if (draftIndex + 1 < players.length) {
      setDraftIndex(draftIndex + 1);
    } else {
      setStep('finished');
    }
  };

  const handleManualPick = (e) => {
    e.preventDefault();
    if (!selectedTeamId) return;
    confirmPick(selectedTeamId);
  };

  const handleRandomPick = () => {
    if (availableTeams.length === 0) return;
    setIsSpinning(true);
    
    // Simple visual roulette effect
    let count = 0;
    const interval = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * availableTeams.length);
      setSelectedTeamId(availableTeams[randomIndex].id);
      count++;
      if (count > 10) {
        clearInterval(interval);
        setIsSpinning(false);
      }
    }, 100);
  };

  const handleStartTournament = () => {
    const seeds = [...players].sort((a, b) => a.lastRank - b.lastRank);
    localStorage.setItem('tournamentPlayers', JSON.stringify(seeds));
    navigate('/');
  };

  return (
    <div className="glass-panel" style={{ maxWidth: '800px', margin: '2rem auto' }}>
      
      {/* HEADER */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Users size={28} color="var(--accent-secondary)" />
          <h2 style={{ fontSize: '1.8rem' }}>
            {step === 'registration' ? 'Cadastro (Seed)' : step === 'draft' ? 'Sala de Draft' : 'Resumo do Draft'}
          </h2>
        </div>
        {step === 'registration' && (
          <div style={{ background: 'rgba(255,255,255,0.1)', padding: '6px 12px', borderRadius: '20px', fontSize: '0.9rem' }}>
            <span style={{ color: isFull ? 'var(--accent-primary)' : 'white', fontWeight: 600 }}>{players.length}</span> / {config.participants} Registrados
          </div>
        )}
      </div>

      {/* STEP 1: REGISTRATION */}
      {step === 'registration' && (
        <>
          {/* Form and list rendering identical to previous */}
          {!isFull ? (
            <form onSubmit={handleAddPlayer} style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', alignItems: 'flex-end' }}>
              <div style={{ flex: 2 }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  Nome do Jogador
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: João Silva"
                  value={currentPlayerName}
                  onChange={(e) => setCurrentPlayerName(e.target.value)}
                  style={{
                    width: '100%', padding: '12px 16px', borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border-color)',
                    color: 'white', fontFamily: 'Outfit', outline: 'none'
                  }}
                />
              </div>
              
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  Posição Anterior (Ex: 1)
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  placeholder="Ex: 8"
                  value={currentPlayerRank}
                  onChange={(e) => setCurrentPlayerRank(e.target.value)}
                  style={{
                    width: '100%', padding: '12px 16px', borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border-color)',
                    color: 'white', fontFamily: 'Outfit', outline: 'none'
                  }}
                />
              </div>

              <button type="submit" className="btn-secondary" style={{ padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Plus size={24} />
              </button>
            </form>
          ) : (
            <div style={{ padding: '1rem', background: 'rgba(0,255,135,0.1)', border: '1px solid var(--accent-primary)', borderRadius: '8px', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--accent-primary)' }}>
              <CheckCircle2 size={24} />
              <span style={{ fontWeight: 500 }}>Vagas preenchidas! Pronto para o Draft.</span>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {players.map((player) => (
              <div key={player.id} style={{ 
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '16px', background: 'rgba(255,255,255,0.02)', 
                border: '1px solid var(--border-color)', borderRadius: '12px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ 
                    width: '32px', height: '32px', borderRadius: '50%', 
                    background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontWeight: 'bold', color: 'var(--text-secondary)'
                  }}>
                    {player.lastRank}º
                  </div>
                  <h4 style={{ fontSize: '1.1rem' }}>{player.name}</h4>
                </div>
                
                <button onClick={() => removePlayer(player.id)} style={{
                  background: 'transparent', border: 'none', color: '#ff4b4b',
                  cursor: 'pointer', padding: '8px', borderRadius: '8px', transition: 'background 0.2s'
                }}>
                  <Trash2 size={20} />
                </button>
              </div>
            ))}
          </div>

          {isFull && (
            <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={startDraft} className="btn-primary" style={{ padding: '14px 32px', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                Iniciar Draft <ArrowRight size={20} />
              </button>
            </div>
          )}
        </>
      )}

      {/* STEP 2: DRAFT */}
      {step === 'draft' && (
        <div style={{ textAlign: 'center' }}>
          <div style={{ marginBottom: '3rem', padding: '2rem', background: 'rgba(0,0,0,0.2)', borderRadius: '16px', border: '1px solid var(--accent-secondary)' }}>
            <h3 style={{ color: 'var(--text-secondary)', marginBottom: '1rem', fontWeight: 500, letterSpacing: '2px', textTransform: 'uppercase' }}>
              Com a Pick #{draftIndex + 1}...
            </h3>
            <h1 style={{ fontSize: '3rem', color: 'var(--accent-primary)', marginBottom: '0.5rem', textShadow: '0 0 20px rgba(0,255,135,0.4)' }}>
              {players[draftIndex].name}
            </h1>
            <p style={{ color: 'var(--text-secondary)' }}>(Rank: {players[draftIndex].lastRank}º)</p>
          </div>

          <div style={{ maxWidth: '400px', margin: '0 auto' }}>
            {config.teamSelectionMode === 'manual' ? (
              <form onSubmit={handleManualPick} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', alignItems: 'center' }}>
                <div style={{ width: '100%' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontWeight: 500, textAlign: 'left' }}>
                    Escolha o Clube (Exclusivo)
                  </label>
                  <select
                    required
                    value={selectedTeamId}
                    onChange={(e) => setSelectedTeamId(e.target.value)}
                    style={{
                      width: '100%', padding: '16px', borderRadius: '12px',
                      background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border-color)',
                      color: selectedTeamId ? 'white' : 'rgba(255,255,255,0.5)', fontFamily: 'Outfit',
                      fontSize: '1.1rem', outline: 'none', cursor: 'pointer'
                    }}
                  >
                    <option value="" disabled style={{ background: 'var(--bg-secondary)' }}>Selecione um clube...</option>
                    {availableTeams.map(team => (
                      <option key={team.id} value={team.id} style={{ background: 'var(--bg-secondary)', color: 'white' }}>
                        {team.name} (Geral: {team.overall})
                      </option>
                    ))}
                  </select>
                </div>

                {selectedTeamId && (
                  <div style={{ marginTop: '1rem', animation: 'fadeIn 0.3s ease', display: 'flex', justifyContent: 'center' }}>
                    <TeamLogo team={draftPool.find(t => t.id === selectedTeamId)} size={100} />
                  </div>
                )}

                <button type="submit" className="btn-primary" style={{ width: '100%', padding: '16px', fontSize: '1.2rem', marginTop: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                  Confirmar Pick <CheckCircle2 size={24} />
                </button>
              </form>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', alignItems: 'center' }}>
                
                <div style={{ minHeight: '150px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {selectedTeamId ? (
                    <div style={{ animation: isSpinning ? 'pulse 0.2s infinite' : 'bounce 0.5s ease' }}>
                      <TeamLogo team={draftPool.find(t => t.id === selectedTeamId)} size={120} />
                    </div>
                  ) : (
                    <div style={{ width: '120px', height: '120px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed var(--border-color)' }}>
                      <Shield size={40} color="var(--text-secondary)" />
                    </div>
                  )}
                </div>
                
                {selectedTeamId && !isSpinning && (
                  <h2 style={{ color: 'white', animation: 'fadeIn 0.5s ease' }}>
                    {draftPool.find(t => t.id === selectedTeamId)?.name}
                  </h2>
                )}

                {!selectedTeamId || isSpinning ? (
                  <button onClick={handleRandomPick} disabled={isSpinning} className="btn-primary" style={{ width: '100%', padding: '20px', fontSize: '1.2rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px' }}>
                    <Dices size={28} /> {isSpinning ? 'Sorteando...' : 'Sortear Meu Time'}
                  </button>
                ) : (
                  <button onClick={() => confirmPick(selectedTeamId)} className="btn-secondary" style={{ width: '100%', padding: '16px', fontSize: '1.2rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', color: 'var(--accent-primary)', borderColor: 'var(--accent-primary)' }}>
                    Aceitar Time <CheckCircle2 size={24} />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* STEP 3: FINISHED */}
      {step === 'finished' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
            {players.map((player, index) => (
              <div key={player.id} style={{ 
                display: 'flex', alignItems: 'center', gap: '16px',
                padding: '16px', background: 'rgba(255,255,255,0.02)', 
                border: '1px solid var(--border-color)', borderRadius: '12px'
              }}>
                <TeamLogo team={player.team} size={50} />
                <div>
                  <h4 style={{ fontSize: '1.1rem', marginBottom: '4px' }}>{player.name}</h4>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    {player.team.name} <span style={{ opacity: 0.5 }}>| Pick #{index + 1}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: '3rem', display: 'flex', justifyContent: 'center' }}>
            <button onClick={handleStartTournament} className="btn-primary" style={{ padding: '16px 32px', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Play size={24} fill="currentColor" /> Iniciar Torneio
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlayerRegistration;
