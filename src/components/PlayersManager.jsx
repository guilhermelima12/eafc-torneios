import React, { useState, useEffect } from 'react';
import { Users, Plus, Trash2, Trophy, AlertCircle, Loader, Pencil, Check, X } from 'lucide-react';
import { supabase } from '../lib/supabase';

const PlayersManager = () => {
  const [registeredPlayers, setRegisteredPlayers] = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [newName, setNewName] = useState('');
  const [newSeed, setNewSeed] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [dbError, setDbError] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editSeedValue, setEditSeedValue] = useState('');

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setDbError(null);

      const { data: players, error: pErr } = await supabase
        .from('players')
        .select('*')
        .order('seed', { ascending: true });

      const { data: tourns } = await supabase
        .from('tournaments')
        .select('champion');

      if (pErr) {
        setDbError(pErr.message);
      } else {
        if (players) setRegisteredPlayers(players);
      }

      if (tourns) setTournaments(tourns);
      setLoading(false);
    };
    loadData();
  }, []);

  const winsMap = tournaments.reduce((acc, t) => {
    const name = t.champion?.name;
    if (name) acc[name] = (acc[name] || 0) + 1;
    return acc;
  }, {});

  const handleAddPlayer = async (e) => {
    e.preventDefault();
    if (!newName.trim() || saving) return;
    setSaving(true);
    const seed = newSeed ? parseInt(newSeed) : (registeredPlayers.length + 1);
    const newPlayer = { id: Date.now().toString(), name: newName.trim(), seed };
    const { error } = await supabase.from('players').insert([newPlayer]);
    if (error) {
      alert(`Erro ao salvar: ${error.message}`);
    } else {
      setRegisteredPlayers(prev => [...prev, newPlayer].sort((a, b) => a.seed - b.seed));
      setNewName('');
      setNewSeed('');
    }
    setSaving(false);
  };

  const handleDeletePlayer = async (id) => {
    if (!window.confirm('Tem certeza que deseja remover este jogador?')) return;
    setDeleting(id);
    const { error } = await supabase.from('players').delete().eq('id', id);
    if (!error) {
      setRegisteredPlayers(prev => prev.filter(p => p.id !== id));
    } else {
      alert(`Erro ao deletar: ${error.message}`);
    }
    setDeleting(null);
  };

  const handleStartEdit = (p) => {
    setEditingId(p.id);
    setEditSeedValue(String(p.seed ?? ''));
  };

  const handleSaveSeed = async (id) => {
    const val = parseInt(editSeedValue);
    if (isNaN(val) || val < 1) {
      alert('Seed deve ser um número maior que 0.');
      return;
    }
    const { error } = await supabase.from('players').update({ seed: val }).eq('id', id);
    if (!error) {
      setRegisteredPlayers(prev =>
        prev.map(p => p.id === id ? { ...p, seed: val } : p).sort((a, b) => a.seed - b.seed)
      );
      setEditingId(null);
    } else {
      alert(`Erro ao atualizar: ${error.message}`);
    }
  };

  const ranking = registeredPlayers
    .map(p => ({ ...p, wins: winsMap[p.name] || 0 }))
    .sort((a, b) => b.wins - a.wins);

  const medalColors = ['#FFD700', '#C0C0C0', '#CD7F32'];
  const medalIcons = ['🥇', '🥈', '🥉'];

  return (
    <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>

      {/* RANKING */}
      <div className="glass-panel">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.5rem' }}>
          <Trophy size={28} color="#FFD700" />
          <h2 style={{ margin: 0 }}>Ranking de Campeões</h2>
        </div>

        {loading ? (
          <p style={{ color: 'var(--text-secondary)' }}>Carregando...</p>
        ) : ranking.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)' }}>Nenhum jogador cadastrado ainda.</p>
        ) : (
          <div>
            {/* Podium top 3 */}
            {ranking.filter(p => p.wins > 0).length > 0 && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
                {ranking.filter(p => p.wins > 0).slice(0, 3).map((p, i) => (
                  <div key={p.id} style={{
                    textAlign: 'center', padding: '1.5rem 2rem',
                    background: `rgba(${i === 0 ? '255,215,0' : i === 1 ? '192,192,192' : '205,127,50'}, 0.08)`,
                    border: `1px solid rgba(${i === 0 ? '255,215,0' : i === 1 ? '192,192,192' : '205,127,50'}, 0.3)`,
                    borderRadius: '16px', minWidth: '140px',
                    order: i === 0 ? 0 : i === 1 ? -1 : 1,
                    transform: i === 0 ? 'scale(1.1)' : 'scale(1)',
                    boxShadow: i === 0 ? '0 0 30px rgba(255,215,0,0.15)' : 'none'
                  }}>
                    <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>{medalIcons[i]}</div>
                    <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'white', marginBottom: '4px' }}>{p.name}</div>
                    <div style={{ color: medalColors[i], fontWeight: 600 }}>{p.wins} {p.wins === 1 ? 'vitória' : 'vitórias'}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Full table */}
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  <th style={{ padding: '8px 12px', textAlign: 'left' }}>Pos</th>
                  <th style={{ padding: '8px 12px', textAlign: 'left' }}>Jogador</th>
                  <th style={{ padding: '8px 12px', textAlign: 'center' }}>Seed</th>
                  <th style={{ padding: '8px 12px', textAlign: 'center' }}>Vitórias 🏆</th>
                </tr>
              </thead>
              <tbody>
                {ranking.map((p, i) => (
                  <tr key={p.id} style={{
                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                    background: i < 3 && p.wins > 0 ? `rgba(${i === 0 ? '255,215,0' : i === 1 ? '192,192,192' : '205,127,50'}, 0.03)` : 'transparent'
                  }}>
                    <td style={{ padding: '12px', color: i < 3 && p.wins > 0 ? medalColors[i] : 'var(--text-secondary)', fontWeight: 700 }}>
                      {i < 3 && p.wins > 0 ? medalIcons[i] : `${i + 1}º`}
                    </td>
                    <td style={{ padding: '12px', fontWeight: 600 }}>{p.name}</td>
                    <td style={{ padding: '12px', textAlign: 'center', color: 'var(--accent-primary)', fontWeight: 700 }}>#{p.seed ?? '—'}</td>
                    <td style={{ padding: '12px', textAlign: 'center', color: p.wins > 0 ? '#FFD700' : 'var(--text-secondary)', fontWeight: p.wins > 0 ? 700 : 400 }}>
                      {p.wins}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* GERENCIAR JOGADORES */}
      <div className="glass-panel">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.5rem' }}>
          <Users size={28} color="var(--accent-secondary)" />
          <h2 style={{ margin: 0 }}>Jogadores Cadastrados</h2>
        </div>

        {dbError && (
          <div style={{
            marginBottom: '1rem', padding: '12px 16px',
            background: 'rgba(255,75,75,0.1)', border: '1px solid rgba(255,75,75,0.3)',
            borderRadius: '8px', color: '#ff4b4b', display: 'flex', alignItems: 'flex-start', gap: '10px'
          }}>
            <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong>Erro de banco de dados:</strong> {dbError}
            </div>
          </div>
        )}

        <form onSubmit={handleAddPlayer} style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Nome do jogador"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            style={{
              flex: 2, minWidth: '180px', padding: '12px 16px', borderRadius: '8px',
              background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)',
              color: 'white', fontFamily: 'Outfit', fontSize: '1rem', outline: 'none'
            }}
          />
          <input
            type="number"
            min="1"
            placeholder="Seed (ex: 1)"
            value={newSeed}
            onChange={e => setNewSeed(e.target.value)}
            style={{
              flex: 1, minWidth: '100px', maxWidth: '120px', padding: '12px 16px', borderRadius: '8px',
              background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)',
              color: 'white', fontFamily: 'Outfit', fontSize: '1rem', outline: 'none', textAlign: 'center'
            }}
          />
          <button
            type="submit"
            disabled={saving}
            className="btn-primary"
            style={{ padding: '12px 24px', display: 'flex', alignItems: 'center', gap: '8px', opacity: saving ? 0.7 : 1 }}
          >
            {saving ? <Loader size={20} /> : <Plus size={20} />}
            {saving ? 'Salvando...' : 'Adicionar'}
          </button>
        </form>

        {loading ? (
          <p style={{ color: 'var(--text-secondary)' }}>Carregando...</p>
        ) : registeredPlayers.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)' }}>Nenhum jogador cadastrado. Adicione seus amigos acima!</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {registeredPlayers.map(p => (
              <div
                key={p.id}
                style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '14px 16px', background: 'rgba(255,255,255,0.02)',
                  border: '1px solid var(--border-color)', borderRadius: '10px'
                }}
              >
                {/* Left: avatar + info */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '36px', height: '36px', borderRadius: '50%',
                    background: 'rgba(96,239,255,0.1)', border: '1px solid rgba(96,239,255,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 700, color: 'var(--accent-secondary)', fontSize: '1rem', flexShrink: 0
                  }}>
                    {p.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '1rem' }}>{p.name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                      <span style={{
                        background: 'rgba(0,255,135,0.1)', border: '1px solid rgba(0,255,135,0.2)',
                        color: 'var(--accent-primary)', padding: '1px 8px', borderRadius: '10px',
                        fontSize: '0.75rem', fontWeight: 700
                      }}>
                        Seed #{p.seed ?? '—'}
                      </span>
                      {winsMap[p.name] ? `🏆 ${winsMap[p.name]} vitória${winsMap[p.name] > 1 ? 's' : ''}` : 'Sem vitórias ainda'}
                    </div>
                  </div>
                </div>

                {/* Right: edit + delete */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {editingId === p.id ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <input
                        type="number"
                        min="1"
                        value={editSeedValue}
                        onChange={e => setEditSeedValue(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') handleSaveSeed(p.id);
                          if (e.key === 'Escape') setEditingId(null);
                        }}
                        autoFocus
                        style={{
                          width: '60px', padding: '6px 8px', borderRadius: '6px', textAlign: 'center',
                          background: 'rgba(255,255,255,0.08)', border: '1px solid var(--accent-primary)',
                          color: 'white', fontFamily: 'Outfit', fontSize: '0.9rem', outline: 'none'
                        }}
                      />
                      <button
                        onClick={() => handleSaveSeed(p.id)}
                        title="Salvar seed"
                        style={{
                          background: 'rgba(0,255,135,0.1)', border: '1px solid rgba(0,255,135,0.3)',
                          color: 'var(--accent-primary)', cursor: 'pointer', padding: '6px 8px',
                          borderRadius: '6px', display: 'flex', alignItems: 'center', transition: 'all 0.2s'
                        }}
                      >
                        <Check size={16} />
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        title="Cancelar"
                        style={{
                          background: 'transparent', border: '1px solid rgba(255,255,255,0.1)',
                          color: 'var(--text-secondary)', cursor: 'pointer', padding: '6px 8px',
                          borderRadius: '6px', display: 'flex', alignItems: 'center', transition: 'all 0.2s'
                        }}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleStartEdit(p)}
                      title="Editar seed"
                      style={{
                        background: 'transparent', border: '1px solid rgba(255,255,255,0.08)',
                        color: 'var(--text-secondary)', cursor: 'pointer', padding: '6px 8px',
                        borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '4px',
                        fontFamily: 'Outfit', fontSize: '0.8rem', transition: 'all 0.2s'
                      }}
                    >
                      <Pencil size={14} />
                    </button>
                  )}

                  <button
                    onClick={() => handleDeletePlayer(p.id)}
                    disabled={deleting === p.id}
                    title="Remover jogador"
                    style={{
                      background: 'transparent', border: 'none', color: '#ff4b4b',
                      cursor: 'pointer', padding: '6px 8px', borderRadius: '6px',
                      opacity: deleting === p.id ? 0.5 : 1, display: 'flex', alignItems: 'center',
                      transition: 'all 0.2s'
                    }}
                  >
                    <Trash2 size={18} />
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

export default PlayersManager;
