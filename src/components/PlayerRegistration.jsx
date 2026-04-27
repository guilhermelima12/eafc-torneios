import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Shield, Plus, Trash2, CheckCircle2, ArrowRight, Play, Dices, UserPlus } from 'lucide-react';
import TeamLogo from './TeamLogo';
import defaultTeamsData from '../data/teams.json';
import { supabase } from '../lib/supabase';

const PlayerRegistration = () => {
  const navigate = useNavigate();
  const [config, setConfig] = useState(null);
  const [draftPool, setDraftPool] = useState([]);
  const [registeredPlayers, setRegisteredPlayers] = useState([]);
  const [loadingPlayers, setLoadingPlayers] = useState(true);
  const [showManualForm, setShowManualForm] = useState(false);

  const [step, setStep] = useState('registration');
  const [players, setPlayers] = useState([]);

  const [currentPlayerName, setCurrentPlayerName] = useState('');
  const [currentPlayerRank, setCurrentPlayerRank] = useState('');

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

    const loadRegistered = async () => {
      setLoadingPlayers(true);
      const { data } = await supabase.from('players').select('*').order('seed', { ascending: true });
      if (data) setRegisteredPlayers(data);
      setLoadingPlayers(false);
    };
    loadRegistered();
  }, [navigate]);

  if (!config) return null;

  const isFull = players.length >= config.participants;

  const togglePlayer = (registered) => {
    const alreadyIn = players.some(p => p.name === registered.name);
    if (alreadyIn) {
      setPlayers(players.filter(p => p.name !== registered.name));
    } else {
      if (isFull) return;
      setPlayers([...players, {
        id: Date.now().toString(),
        name: registered.name,
        lastRank: registered.seed ?? (players.length + 1),
        team: null
      }]);
    }
  };

  const handleAddManual = (e) => {
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

  // --- DRAFT ---
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
            {step === 'registration' ? 'Selecionar Participantes' : step === 'draft' ? 'Sala de Draft' : 'Resumo do Draft'}
          </h2>
        </div>
        {step === 'registration' && (
          <div style={{ background: 'rgba(255,255,255,0.1)', padding: '6px 12px', borderRadius: '20px', fontSize: '0.9rem' }}>
            <span style={{ color: isFull ? 'var(--accent-primary)' : 'white', fontWeight: 600 }}>{players.length}</span> / {config.participants} Selecionados
          </div>
        )}
      </div>

      {/* STEP 1: REGISTRATION */}
      {step === 'registration' && (
        <>
          {/* Registered players grid */}
          <div style={{ marginBottom: '2rem' }}>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem', fontSize: '0.9rem' }}>
              Clique nos jogadores cadastrados para adicioná-los ao torneio:
            </p>

            {loadingPlayers ? (
              <p style={{ color: 'var(--text-secondary)' }}>Carregando jogadores...</p>
            ) : registeredPlayers.length === 0 ? (
              <div style={{
                padding: '1.5rem', background: 'rgba(255,255,255,0.02)', border: '1px dashed var(--border-color)',
                borderRadius: '12px', textAlign: 'center', color: 'var(--text-secondary)'
              }}>
                Nenhum jogador cadastrado ainda.{' '}
                <span
                  style={{ color: 'var(--accent-secondary)', cursor: 'pointer', textDecoration: 'underline' }}
                  onClick={() => navigate('/players')}
                >
                  Cadastre seus amigos aqui
                </span>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem' }}>
                {registeredPlayers.map(rp => {
                  const selected = players.some(p => p.name === rp.name);
                  return (
                    <button
                      key={rp.id}
                      onClick={() => togglePlayer(rp)}
                      disabled={isFull && !selected}
                      style={{
                        padding: '12px 16px', borderRadius: '10px', cursor: isFull && !selected ? 'not-allowed' : 'pointer',
                        border: `1px solid ${selected ? 'var(--accent-primary)' : 'var(--border-color)'}`,
                        background: selected ? 'rgba(0,255,135,0.08)' : 'rgba(255,255,255,0.02)',
                        color: 'white', fontFamily: 'Outfit', textAlign: 'left',
                        opacity: isFull && !selected ? 0.4 : 1,
                        transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '10px'
                      }}
                    >
                      <div style={{
                        width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
                        background: selected ? 'rgba(0,255,135,0.15)' : 'rgba(96,239,255,0.1)',
                        border: `1px solid ${selected ? 'rgba(0,255,135,0.4)' : 'rgba(96,239,255,0.2)'}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 700, color: selected ? 'var(--accent-primary)' : 'var(--accent-secondary)', fontSize: '0.9rem'
                      }}>
                        {selected ? <CheckCircle2 size={16} /> : rp.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{rp.name}</div>
                        <div style={{ fontSize: '0.75rem', color: selected ? 'var(--accent-primary)' : 'var(--text-secondary)' }}>
                          Seed #{rp.seed ?? '—'}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Selected players list */}
          {players.length > 0 && (
            <div style={{ marginBottom: '1.5rem' }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Participantes selecionados
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {players.map(player => (
                  <div key={player.id} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '10px 14px', background: 'rgba(0,255,135,0.04)',
                    border: '1px solid rgba(0,255,135,0.15)', borderRadius: '8px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        background: 'rgba(0,255,135,0.1)', color: 'var(--accent-primary)',
                        padding: '2px 8px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 700
                      }}>
                        #{player.lastRank}
                      </div>
                      <span style={{ fontWeight: 600 }}>{player.name}</span>
                    </div>
                    <button onClick={() => removePlayer(player.id)} style={{
                      background: 'transparent', border: 'none', color: '#ff4b4b',
                      cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center'
                    }}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Manual add (collapsible) */}
          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
            <button
              onClick={() => setShowManualForm(!showManualForm)}
              style={{
                background: 'transparent', border: 'none', color: 'var(--text-secondary)',
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
                fontFamily: 'Outfit', fontSize: '0.9rem', padding: '4px 0', marginBottom: showManualForm ? '1rem' : 0
              }}
            >
              <UserPlus size={16} />
              Adicionar jogador não cadastrado (convidado)
              <span>{showManualForm ? '▲' : '▼'}</span>
            </button>

            {showManualForm && !isFull && (
              <form onSubmit={handleAddManual} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                <div style={{ flex: 2 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Nome</label>
                  <input
                    type="text" required placeholder="Nome do convidado"
                    value={currentPlayerName} onChange={e => setCurrentPlayerName(e.target.value)}
                    style={{
                      width: '100%', padding: '10px 14px', borderRadius: '8px',
                      background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)',
                      color: 'white', fontFamily: 'Outfit', outline: 'none'
                    }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Seed</label>
                  <input
                    type="number" required min="1" placeholder="Ex: 8"
                    value={currentPlayerRank} onChange={e => setCurrentPlayerRank(e.target.value)}
                    style={{
                      width: '100%', padding: '10px 14px', borderRadius: '8px',
                      background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)',
                      color: 'white', fontFamily: 'Outfit', outline: 'none'
                    }}
                  />
                </div>
                <button type="submit" className="btn-secondary" style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Plus size={18} /> Adicionar
                </button>
              </form>
            )}
          </div>

          {isFull && (
            <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={startDraft} className="btn-primary" style={{ padding: '14px 32px', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                Ir para o Draft <ArrowRight size={20} />
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
            <p style={{ color: 'var(--text-secondary)' }}>(Seed: #{players[draftIndex].lastRank})</p>
          </div>

          <div style={{ maxWidth: '400px', margin: '0 auto' }}>
            {config.teamSelectionMode === 'manual' ? (
              <form onSubmit={handleManualPick} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', alignItems: 'center' }}>
                <div style={{ width: '100%' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontWeight: 500, textAlign: 'left' }}>
                    Escolha o Clube (Exclusivo)
                  </label>
                  <select
                    required value={selectedTeamId}
                    onChange={e => setSelectedTeamId(e.target.value)}
                    style={{
                      width: '100%', padding: '16px', borderRadius: '12px',
                      background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)',
                      color: selectedTeamId ? 'white' : 'rgba(255,255,255,0.5)', fontFamily: 'Outfit',
                      fontSize: '1.1rem', outline: 'none', cursor: 'pointer'
                    }}
                  >
                    <option value="" disabled style={{ background: 'var(--bg-secondary)' }}>Selecione um clube...</option>
                    {availableTeams.map(team => (
                      <option key={team.id} value={team.id} style={{ background: 'var(--bg-secondary)', color: 'white' }}>
                        {team.name} (GER: {team.overall})
                      </option>
                    ))}
                  </select>
                </div>
                {selectedTeamId && (
                  <div style={{ marginTop: '1rem', animation: 'fadeIn 0.3s ease', display: 'flex', justifyContent: 'center' }}>
                    <TeamLogo team={draftPool.find(t => t.id === selectedTeamId)} size={100} />
                  </div>
                )}
                <button type="submit" className="btn-primary" style={{ width: '100%', padding: '16px', fontSize: '1.2rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
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
