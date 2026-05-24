import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Trophy, ArrowLeft, Pencil, X, Check, PenLine, Eye } from 'lucide-react';
import TeamLogo from './TeamLogo';
import TournamentGroups from './TournamentGroups';
import TournamentBracket from './TournamentBracket';
import { supabase } from '../lib/supabase';

/* ── Debounce helper ─────────────────────────────────────────── */
const useSaveDebounce = (saveFn, delay = 1200) => {
  const timerRef = React.useRef(null);
  return useCallback((...args) => {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => saveFn(...args), delay);
  }, [saveFn, delay]);
};

/* ── Edit Config Modal ───────────────────────────────────────── */
const EditModal = ({ tournament, onClose, onSave }) => {
  const [form, setForm] = useState({
    name: tournament.config.name || '',
    format: tournament.config.format || 'groups',
    legsMode: tournament.config.legsMode || 'single',
    participants: tournament.config.participants || 8,
  });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    const newConfig = { ...tournament.config, ...form };
    const { data: updatedRows, error } = await supabase
      .from('tournaments')
      .update({ config: newConfig })
      .eq('id', tournament.id)
      .select();
    setSaving(false);
    if (error) {
      alert('Erro ao salvar: ' + error.message + '\nCódigo: ' + error.code);
      return;
    }
    if (!updatedRows || updatedRows.length === 0) {
      alert('Aviso: Nenhuma linha foi atualizada no banco de dados.\nID usado: ' + tournament.id + '\nVerifique RLS ou tipo da coluna id.');
      return;
    }
    onSave(newConfig);
  };

  const inputStyle = {
    width: '100%', padding: '10px 14px', borderRadius: '8px', boxSizing: 'border-box',
    background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-color)',
    color: 'white', fontFamily: 'Outfit', fontSize: '1rem', outline: 'none',
  };
  const btnActive = (active) => ({
    flex: 1, padding: '10px', borderRadius: '8px', cursor: 'pointer', fontFamily: 'Outfit', fontWeight: 600,
    border: `1px solid ${active ? 'var(--accent-primary)' : 'var(--border-color)'}`,
    background: active ? 'rgba(0,255,135,0.1)' : 'transparent',
    color: active ? 'var(--accent-primary)' : 'var(--text-secondary)', transition: 'all 0.15s',
  });

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 999, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '480px', position: 'relative' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><X size={22} /></button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem' }}>
          <Pencil size={22} color="var(--accent-secondary)" />
          <h3 style={{ margin: 0, fontSize: '1.3rem' }}>Editar Configuração</h3>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Nome</label>
            <input style={inputStyle} value={form.name} onChange={e => set('name', e.target.value)} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Formato</label>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {[{ v: 'knockout', l: 'Mata-Mata' }, { v: 'groups', l: 'Grupos + Elim.' }, { v: 'league', l: 'Pontos Corridos' }].map(({ v, l }) => (
                <button key={v} type="button" onClick={() => set('format', v)} style={btnActive(form.format === v)}>{l}</button>
              ))}
            </div>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Jogos</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {[{ v: 'single', l: 'Apenas Ida' }, { v: 'double', l: 'Ida e Volta' }].map(({ v, l }) => (
                <button key={v} type="button" onClick={() => set('legsMode', v)} style={btnActive(form.legsMode === v)}>{l}</button>
              ))}
            </div>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Participantes</label>
            <input type="number" min="2" max="32" style={{ ...inputStyle, width: '100px' }} value={form.participants} onChange={e => set('participants', parseInt(e.target.value) || 2)} />
          </div>
          <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
            <button onClick={onClose} className="btn-secondary" style={{ flex: 1 }}>Cancelar</button>
            <button onClick={handleSave} disabled={saving} className="btn-primary" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              {saving ? 'Salvando...' : <><Check size={18} /> Salvar</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ── Main Component ──────────────────────────────────────────── */
const TournamentHistoryView = () => {
  const { id } = useParams();
  const [tournament, setTournament] = useState(null);
  const [showEdit, setShowEdit] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState(false);

  // Local editable copies of match data
  const [localGroups, setLocalGroups] = useState(null);
  const [localGroupMatches, setLocalGroupMatches] = useState(null);
  const [localBracketMatches, setLocalBracketMatches] = useState(null);

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase.from('tournaments').select('*').eq('id', id).single();
      if (!error && data) {
        setTournament(data);
        setLocalGroups(data.groups_data);
        setLocalGroupMatches(data.group_matches);
        setLocalBracketMatches(data.bracket_matches);
      }
    };
    load();
  }, [id]);

  // Track the latest payload so we can flush immediately on exit
  const pendingPayload = React.useRef({});

  const saveToSupabase = useCallback(async (payload) => {
    setSaving(true);
    const { data: updatedRows, error } = await supabase
      .from('tournaments')
      .update(payload)
      .eq('id', id)
      .select();
    setSaving(false);
    if (error) {
      console.error('Supabase update error:', error);
      alert('Erro ao salvar: ' + error.message + '\nCódigo: ' + error.code);
      return;
    }
    if (!updatedRows || updatedRows.length === 0) {
      console.warn('Supabase: 0 rows updated. ID:', id);
      alert('Aviso: Nenhuma linha foi atualizada.\nID: ' + id + '\n\nPossíveis causas:\n1. RLS bloqueando UPDATE\n2. ID não encontrado na tabela');
      return;
    }
    console.log('Supabase: updated', updatedRows.length, 'row(s)');
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 2000);
  }, [id]);

  const debouncedSave = useSaveDebounce(saveToSupabase, 600);

  const handleGroupsChange = useCallback((groups, matches) => {
    setLocalGroups(groups);
    setLocalGroupMatches(matches);
    const payload = { groups_data: groups, group_matches: matches };
    pendingPayload.current = { ...pendingPayload.current, ...payload };
    debouncedSave(payload);
  }, [debouncedSave]);

  const handleBracketChange = useCallback((bracketMatches) => {
    setLocalBracketMatches(bracketMatches);
    const finalMatch = bracketMatches.length > 0
      ? bracketMatches.reduce((max, m) => m.round > max.round ? m : max, bracketMatches[0])
      : null;
    const champion = finalMatch?.winner || null;
    const payload = { bracket_matches: bracketMatches, ...(champion ? { champion } : {}) };
    pendingPayload.current = { ...pendingPayload.current, ...payload };
    debouncedSave(payload);
  }, [debouncedSave]);

  // Flush any pending changes immediately when exiting edit mode
  const handleToggleEditMode = useCallback(() => {
    setEditMode(prev => {
      if (prev) {
        // Exiting edit mode — flush pending saves immediately
        const payload = pendingPayload.current;
        if (Object.keys(payload).length > 0) {
          saveToSupabase(payload);
          pendingPayload.current = {};
        }
      }
      return !prev;
    });
  }, [saveToSupabase]);

  // MUST be before early return — hooks cannot be called conditionally
  const qualifiedPlayers = React.useMemo(() => {
    if (!tournament) return [];
    const fmt = tournament.config.format;
    if (fmt === 'knockout') return tournament.players || [];
    if (!localGroups || localGroups.length === 0) return tournament.players || [];
    const qualified = [];
    localGroups.forEach(group => {
      const spots = (localGroups.length === 1 && group.length >= 4) ? 4 : 2;
      for (let i = 0; i < spots && i < group.length; i++) qualified.push(group[i]);
    });
    return qualified.length > 0 ? qualified : (tournament.players || []);
  }, [tournament, localGroups]);

  if (!tournament) {
    return (
      <div style={{ textAlign: 'center', marginTop: '4rem' }}>
        <h2 style={{ color: 'var(--text-secondary)' }}>Torneio não encontrado.</h2>
        <Link to="/" className="btn-primary" style={{ textDecoration: 'none', display: 'inline-block', marginTop: '1rem' }}>Voltar</Link>
      </div>
    );
  }

  const handleSaveConfig = (newConfig) => {
    setTournament(t => ({ ...t, config: newConfig }));
    setShowEdit(false);
  };

  const fmt = tournament.config.format;
  const formatLabel = fmt === 'knockout' ? 'Mata-Mata' : fmt === 'league' ? 'Pontos Corridos' : 'Grupos + Eliminatórias';
  const legsLabel = tournament.config.legsMode === 'double' ? ' • Ida e Volta' : '';

  return (
    <div style={{ marginTop: '1rem', animation: 'fadeIn 0.5s ease' }}>

      {showEdit && <EditModal tournament={tournament} onClose={() => setShowEdit(false)} onSave={handleSaveConfig} />}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        <Link to="/" style={{ color: 'var(--text-secondary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px', padding: '8px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)' }}>
          <ArrowLeft size={20} /> Voltar
        </Link>
        <div style={{ flex: 1 }}>
          <h2 style={{ margin: 0 }}>{tournament.config.name}</h2>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            {tournament.date} • {tournament.config.participants} Participantes • {formatLabel}{legsLabel}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {saving && <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Salvando...</span>}
          {savedMsg && <span style={{ fontSize: '0.8rem', color: 'var(--accent-primary)' }}>✓ Salvo</span>}
          <button
            onClick={handleToggleEditMode}
            className="btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', fontSize: '0.9rem', color: editMode ? '#fbbf24' : 'var(--text-secondary)', borderColor: editMode ? 'rgba(251,191,36,0.4)' : 'var(--border-color)' }}
          >
            {editMode ? <><Eye size={16} /> Visualizar</> : <><PenLine size={16} /> Editar Partidas</>}
          </button>
          <button onClick={() => setShowEdit(true)} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', fontSize: '0.9rem', color: 'var(--accent-secondary)', borderColor: 'rgba(96,239,255,0.3)' }}>
            <Pencil size={16} /> Configuração
          </button>
        </div>
      </div>

      {/* Edit mode banner */}
      {editMode && (
        <div style={{ padding: '10px 16px', background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.3)', borderRadius: '10px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <PenLine size={16} color="#fbbf24" />
          <span style={{ fontSize: '0.9rem', color: '#fbbf24' }}>Modo Edição ativo — as partidas são salvas automaticamente no banco de dados.</span>
        </div>
      )}

      {/* Champion — for league: top of standings; for knockout/groups: only bracket shows champion */}
      {fmt === 'league' && tournament.champion && (
        <div className="glass-panel" style={{ marginBottom: '3rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', padding: '3rem 1rem', background: 'linear-gradient(to bottom, rgba(0,255,135,0.1), rgba(0,0,0,0.4))', border: '1px solid var(--accent-primary)', boxShadow: '0 0 30px rgba(0,255,135,0.1)' }}>
          <Trophy size={64} color="#ffd700" style={{ marginBottom: '1rem', filter: 'drop-shadow(0 0 20px rgba(255,215,0,0.5))' }} />
          <h3 style={{ color: '#ffd700', margin: 0, fontSize: '1.2rem', textTransform: 'uppercase', letterSpacing: '2px' }}>Campeão</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginTop: '1.5rem' }}>
            <TeamLogo team={tournament.champion?.team} size={80} />
            <h1 style={{ fontSize: '3.5rem', margin: 0, color: 'white', textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>{tournament.champion?.name}</h1>
          </div>
        </div>
      )}

      {/* Knockout: participant list */}
      {tournament.players && fmt === 'knockout' && !editMode && (
        <div style={{ marginBottom: '4rem' }}>
          <h3 style={{ color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>Participantes</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
            {tournament.players.map(p => (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255,255,255,0.05)', padding: '12px', borderRadius: '8px' }}>
                <TeamLogo team={p.team} size={32} />
                <span style={{ fontWeight: 600 }}>{p.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Groups / League table */}
      {(fmt === 'groups' || fmt === 'league') && (localGroups || editMode) && (
        <div style={{ marginBottom: '4rem' }}>
          <h3 style={{ color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '2rem' }}>
            {fmt === 'league' ? 'Classificação Final' : 'Fase de Grupos'}
          </h3>
          <TournamentGroups
            readOnly={!editMode}
            leagueOnly={fmt === 'league'}
            historyGroups={localGroups}
            historyMatches={localGroupMatches}
            players={tournament.players}
            onDataChange={editMode ? handleGroupsChange : null}
          />
        </div>
      )}

      {fmt !== 'league' && (
        <div>
          <h3 style={{ color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '2rem', textAlign: 'center' }}>
            Fase Eliminatória
          </h3>
          {(localBracketMatches && localBracketMatches.length > 0) || editMode ? (
            <TournamentBracket
              readOnly={!editMode}
              historyMatches={localBracketMatches || []}
              historyPlayers={qualifiedPlayers}
              onDataChange={editMode ? handleBracketChange : null}
            />
          ) : (
            <div style={{ textAlign: 'center', padding: '2rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px' }}>
              <p style={{ color: 'var(--text-secondary)', margin: '0 0 1rem' }}>
                Detalhes das partidas não disponíveis para este torneio (salvo em versão anterior).
              </p>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>
                Ative o <strong>Modo Edição</strong> para inserir os resultados manualmente.
              </p>
            </div>
          )}
        </div>
      )}


    </div>
  );
};

export default TournamentHistoryView;
