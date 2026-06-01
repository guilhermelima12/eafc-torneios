import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, Users, Settings, ArrowRight } from 'lucide-react';

const TournamentSetup = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    format: 'groups',
    participants: 8,
    teamSelectionMode: 'manual',
    legsMode: 'single',
    numGroups: 2,
    advancePerGroup: 2,
    playerPotsCount: 'auto',
    enableTeamPots: false,
    teamPotsCount: 3,
    teamPotsMode: 'standard',
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

        {/* Group config — only for groups format */}
        {formData.format === 'groups' && (() => {
          const totalQ = formData.numGroups * formData.advancePerGroup;
          const isStandard = [2, 4, 8].includes(totalQ);
          const btnStyle = (active) => ({
            flex: 1, padding: '10px', borderRadius: '8px', cursor: 'pointer',
            fontFamily: 'Outfit', fontWeight: 600, transition: 'all 0.2s',
            border: `1px solid ${active ? 'var(--accent-secondary)' : 'var(--border-color)'}`,
            background: active ? 'rgba(96,239,255,0.1)' : 'transparent',
            color: active ? 'var(--accent-secondary)' : 'var(--text-secondary)',
          });
          return (
            <>
              <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '180px' }}>
                  <label style={{ display: 'block', marginBottom: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Número de Grupos</label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {[2, 3, 4].map(n => (
                      <button key={n} type="button" onClick={() => setFormData(f => ({...f, numGroups: n}))} style={btnStyle(formData.numGroups === n)}>{n} grupos</button>
                    ))}
                  </div>
                </div>
                <div style={{ flex: 1, minWidth: '180px' }}>
                  <label style={{ display: 'block', marginBottom: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Classificados por Grupo</label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {[1, 2, 3].map(n => (
                      <button key={n} type="button" onClick={() => setFormData(f => ({...f, advancePerGroup: n}))} style={btnStyle(formData.advancePerGroup === n)}>{n}º lugar</button>
                    ))}
                  </div>
                </div>
              </div>
              <div style={{
                padding: '10px 16px', borderRadius: '8px', fontSize: '0.88rem',
                background: isStandard ? 'rgba(0,255,135,0.07)' : 'rgba(251,191,36,0.07)',
                border: `1px solid ${isStandard ? 'rgba(0,255,135,0.2)' : 'rgba(251,191,36,0.25)'}`,
                color: isStandard ? 'var(--accent-primary)' : '#fbbf24',
              }}>
                {totalQ} classificados → {isStandard
                  ? `Bracket de ${totalQ} (${totalQ === 2 ? 'Final direta' : totalQ === 4 ? 'Semis + Final' : 'QF + Semis + Final'}) ✓`
                  : `Bracket de ${totalQ} com WO (não é potência de 2)`}
              </div>
            </>
          );
        })()}

        {/* Legs Mode */}
        <div>
          <label style={{ display: 'block', marginBottom: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
            Jogos
          </label>
          <div style={{ display: 'flex', gap: '1rem' }}>
            {[{v:'single',label:'Apenas Ida'},{v:'double',label:'Ida e Volta'}].map(({v,label}) => (
              <button
                key={v}
                type="button"
                onClick={() => setFormData({...formData, legsMode: v})}
                style={{
                  flex: 1, padding: '12px', borderRadius: '8px',
                  border: `1px solid ${formData.legsMode === v ? 'var(--accent-secondary)' : 'var(--border-color)'}`,
                  background: formData.legsMode === v ? 'rgba(96,239,255,0.1)' : 'transparent',
                  color: formData.legsMode === v ? 'var(--accent-secondary)' : 'var(--text-primary)',
                  cursor: 'pointer', fontFamily: 'Outfit', fontWeight: 600, transition: 'all 0.2s ease'
                }}
              >
                {label}
              </button>
            ))}
          </div>
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

        {/* ── SEÇÃO: CONFIGURAÇÕES DE POTES ── */}
        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem', marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <h3 style={{ fontSize: '1.1rem', color: 'var(--accent-secondary)', margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            🏆 Potes e Sorteio
          </h3>

          {/* Quantidade de Potes de Jogadores */}
          <div>
            <label style={{ display: 'block', marginBottom: '0.75rem', color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 500 }}>
              Potes de Jogadores (Sorteio)
            </label>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {[
                { v: 'auto', label: 'Auto' },
                { v: 2, label: '2 Potes' },
                { v: 3, label: '3 Potes' },
                { v: 4, label: '4 Potes' }
              ].map(({ v, label }) => {
                const active = formData.playerPotsCount === v;
                return (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setFormData({ ...formData, playerPotsCount: v })}
                    style={{
                      flex: 1, minWidth: '70px', padding: '10px', borderRadius: '8px', cursor: 'pointer',
                      fontFamily: 'Outfit', fontWeight: 600, transition: 'all 0.2s',
                      border: `1px solid ${active ? 'var(--accent-primary)' : 'var(--border-color)'}`,
                      background: active ? 'rgba(0,255,135,0.1)' : 'transparent',
                      color: active ? 'var(--accent-primary)' : 'var(--text-secondary)',
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Ativar Potes de Times */}
          <div>
            <label style={{ display: 'block', marginBottom: '0.75rem', color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 500 }}>
              Dividir Times em Potes (Draft)
            </label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {[
                { v: false, label: 'Não' },
                { v: true, label: 'Sim' }
              ].map(({ v, label }) => {
                const active = formData.enableTeamPots === v;
                return (
                  <button
                    key={label}
                    type="button"
                    onClick={() => setFormData({ ...formData, enableTeamPots: v })}
                    style={{
                      flex: 1, padding: '10px', borderRadius: '8px', cursor: 'pointer',
                      fontFamily: 'Outfit', fontWeight: 600, transition: 'all 0.2s',
                      border: `1px solid ${active ? 'var(--accent-primary)' : 'var(--border-color)'}`,
                      background: active ? 'rgba(0,255,135,0.1)' : 'transparent',
                      color: active ? 'var(--accent-primary)' : 'var(--text-secondary)',
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Opções adicionais de potes de times */}
          {formData.enableTeamPots && (
            <div style={{
              display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: '1rem',
              background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '12px',
              animation: 'fadeIn 0.2s ease-out'
            }}>
              {/* Quantidade de Potes de Times */}
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  Quantidade de Potes de Times
                </label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {[2, 3, 4].map(n => {
                    const active = formData.teamPotsCount === n;
                    return (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setFormData({ ...formData, teamPotsCount: n })}
                        style={{
                          flex: 1, padding: '8px', borderRadius: '8px', cursor: 'pointer',
                          fontFamily: 'Outfit', fontWeight: 600, fontSize: '0.85rem', transition: 'all 0.2s',
                          border: `1px solid ${active ? 'var(--accent-secondary)' : 'var(--border-color)'}`,
                          background: active ? 'rgba(96,239,255,0.1)' : 'transparent',
                          color: active ? 'var(--accent-secondary)' : 'var(--text-secondary)',
                        }}
                      >
                        {n} Potes
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Modo de Distribuição/Emparelhamento */}
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  Distribuição no Draft
                </label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {[
                    { v: 'standard', label: 'Padrão (Forte x Forte)' },
                    { v: 'handicap', label: 'Handicap (Forte x Fraco)' }
                  ].map(({ v, label }) => {
                    const active = formData.teamPotsMode === v;
                    return (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setFormData({ ...formData, teamPotsMode: v })}
                        style={{
                          flex: 1, padding: '8px', borderRadius: '8px', cursor: 'pointer',
                          fontFamily: 'Outfit', fontWeight: 600, fontSize: '0.85rem', transition: 'all 0.2s',
                          border: `1px solid ${active ? 'var(--accent-secondary)' : 'var(--border-color)'}`,
                          background: active ? 'rgba(96,239,255,0.1)' : 'transparent',
                          color: active ? 'var(--accent-secondary)' : 'var(--text-secondary)',
                        }}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
                <p style={{ margin: '8px 0 0 0', fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                  {formData.teamPotsMode === 'handicap' 
                    ? '💡 Handicap: Jogadores com melhores seeds (mais fortes) serão limitados a escolher times de potes mais fracos, enquanto jogadores mais fracos pegarão os melhores times.' 
                    : '💡 Padrão: Cada pote de jogador escolhe de seu pote correspondente de times (Pote 1 de jogadores escolhe do Pote 1 de times).'}
                </p>
              </div>
            </div>
          )}
        </div>

        <button type="submit" className="btn-primary" style={{ marginTop: '1rem', padding: '16px', fontSize: '1.2rem' }}>
          Continuar para o Pote
        </button>
      </form>
    </div>
  );
};

export default TournamentSetup;
