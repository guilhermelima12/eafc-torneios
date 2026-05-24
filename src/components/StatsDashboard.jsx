import React, { useState, useEffect, useMemo } from 'react';
import { BarChart2, TrendingUp, Target, Swords, Shield, Trophy, ChevronDown } from 'lucide-react';
import { supabase } from '../lib/supabase';

/* ── helpers ──────────────────────────────────────────────────── */
const getTournamentStandings = (t) => {
  const fmt = t.config?.format;
  if (fmt === 'league') return (t.groups_data?.[0] || t.players || []).filter(Boolean);
  const bMatches = t.bracket_matches || [];
  const qualified = t.players || [];
  const gData = t.groups_data;
  const standings = []; const added = new Set();
  if (bMatches.length > 0) {
    bMatches.filter(m => m.winner).sort((a, b) => b.round - a.round).forEach(m => {
      const w = m.winner; const l = m.p1?.id === w?.id ? m.p2 : m.p1;
      if (w?.name && !added.has(w.name)) { standings.push(w); added.add(w.name); }
      if (l?.name && !added.has(l.name)) { standings.push(l); added.add(l.name); }
    });
  }
  qualified.forEach(p => { if (p?.name && !added.has(p.name)) { standings.push(p); added.add(p.name); } });
  if (gData) {
    const elim = [];
    gData.forEach(g => g.forEach((p, i) => { if (p?.name && !added.has(p.name)) elim.push({ player: p, rank: i }); }));
    elim.sort((a, b) => a.rank - b.rank).forEach(({ player }) => {
      if (!added.has(player.name)) { standings.push(player); added.add(player.name); }
    });
  }
  return standings;
};

const getPlayerGoals = (playerName, matches) => {
  let gf = 0, ga = 0, wins = 0, losses = 0, draws = 0;
  (matches || []).forEach(m => {
    const isP1 = m.p1?.name === playerName;
    const isP2 = m.p2?.name === playerName;
    if (!isP1 && !isP2) return;
    const s1 = Number(m.score1);
    const s2 = Number(m.score2);
    if (isNaN(s1) || isNaN(s2) || m.score1 == null || m.score2 == null) return;
    const myGoals = isP1 ? s1 : s2;
    const oppGoals = isP1 ? s2 : s1;
    gf += myGoals; ga += oppGoals;
    if (myGoals > oppGoals) wins++;
    else if (myGoals < oppGoals) losses++;
    else draws++;
  });
  return { gf, ga, wins, losses, draws };
};

/* ── Stat Card ─────────────────────────────────────────────────── */
const StatCard = ({ icon: Icon, iconColor, label, value, sub }) => (
  <div style={{
    background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)',
    borderRadius: '14px', padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '6px'
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
      <Icon size={14} color={iconColor} /> {label}
    </div>
    <div style={{ fontSize: '2rem', fontWeight: 700, color: 'white', lineHeight: 1 }}>{value}</div>
    {sub && <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{sub}</div>}
  </div>
);

/* ── SVG Position Chart ─────────────────────────────────────────── */
const PositionChart = ({ points, maxPos }) => {
  if (!points || points.length < 2) return (
    <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
      Jogue ao menos 2 torneios para ver o gráfico de evolução.
    </div>
  );
  const W = 600; const H = 180; const PAD = { t: 20, r: 20, b: 40, l: 36 };
  const iW = W - PAD.l - PAD.r; const iH = H - PAD.t - PAD.b;
  const xScale = (i) => PAD.l + (i / (points.length - 1)) * iW;
  const yScale = (pos) => PAD.t + ((pos - 1) / (maxPos - 1)) * iH;
  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${xScale(i)},${yScale(p.pos)}`).join(' ');
  const areaD = `${pathD} L${xScale(points.length - 1)},${H - PAD.b} L${xScale(0)},${H - PAD.b} Z`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', overflow: 'visible' }}>
      <defs>
        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#00ff87" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#00ff87" stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* Grid lines */}
      {Array.from({ length: maxPos }, (_, i) => i + 1).map(pos => (
        <g key={pos}>
          <line x1={PAD.l} y1={yScale(pos)} x2={W - PAD.r} y2={yScale(pos)} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
          <text x={PAD.l - 6} y={yScale(pos) + 4} fontSize="10" fill="rgba(255,255,255,0.3)" textAnchor="end">{pos}°</text>
        </g>
      ))}
      {/* Area */}
      <path d={areaD} fill="url(#areaGrad)" />
      {/* Line */}
      <path d={pathD} fill="none" stroke="#00ff87" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {/* Dots + labels */}
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={xScale(i)} cy={yScale(p.pos)} r="5" fill="#00ff87" stroke="#0d1117" strokeWidth="2" />
          <text x={xScale(i)} y={H - PAD.b + 16} fontSize="9" fill="rgba(255,255,255,0.4)" textAnchor="middle">
            {p.label.length > 10 ? p.label.slice(0, 9) + '…' : p.label}
          </text>
          {/* Position badge on hover via title */}
          <title>{p.label}: {p.pos}° lugar</title>
        </g>
      ))}
    </svg>
  );
};

/* ── Main Component ─────────────────────────────────────────────── */
const StatsDashboard = () => {
  const [tournaments, setTournaments] = useState([]);
  const [players, setPlayers] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [{ data: tourns }, { data: pls }] = await Promise.all([
        supabase.from('tournaments').select('*').order('created_at', { ascending: true }),
        supabase.from('players').select('*').order('seed', { ascending: true }),
      ]);
      if (tourns) setTournaments(tourns);
      if (pls) { setPlayers(pls); if (pls.length > 0) setSelected(pls[0].name); }
      setLoading(false);
    };
    load();
  }, []);

  // All unique player names across all tournaments
  const allNames = useMemo(() => {
    const names = new Set(players.map(p => p.name));
    tournaments.forEach(t => {
      (t.players || []).forEach(p => { if (p?.name) names.add(p.name); });
    });
    return [...names].sort();
  }, [players, tournaments]);

  const stats = useMemo(() => {
    if (!selected) return null;
    let titles = 0, tournsPlayed = 0;
    let totalPos = 0, bestPos = Infinity, worstPos = 0;
    let gf = 0, ga = 0, wins = 0, losses = 0, draws = 0;
    const history = [];

    tournaments.forEach(t => {
      const stds = getTournamentStandings(t);
      const posIdx = stds.findIndex(p => p?.name === selected);
      if (posIdx === -1) return; // player not in this tournament
      const pos = posIdx + 1;
      tournsPlayed++;
      totalPos += pos;
      if (pos < bestPos) bestPos = pos;
      if (pos > worstPos) worstPos = pos;
      if (t.champion?.name === selected) titles++;

      // Goals from bracket
      const bStats = getPlayerGoals(selected, t.bracket_matches);
      const gStats = getPlayerGoals(selected, t.group_matches);
      gf += bStats.gf + gStats.gf;
      ga += bStats.ga + gStats.ga;
      wins += bStats.wins + gStats.wins;
      losses += bStats.losses + gStats.losses;
      draws += bStats.draws + gStats.draws;

      history.push({
        name: t.config?.name || 'Torneio',
        date: t.date,
        pos,
        total: stds.length,
        champion: t.champion?.name,
        isChampion: t.champion?.name === selected,
        format: t.config?.format,
      });
    });

    const avgPos = tournsPlayed > 0 ? (totalPos / tournsPlayed).toFixed(1) : '—';
    const matches = wins + losses + draws;
    const winRate = matches > 0 ? ((wins / matches) * 100).toFixed(0) : '—';
    const maxPos = Math.max(...history.map(h => h.total), 1);

    return { titles, tournsPlayed, avgPos, bestPos: bestPos === Infinity ? '—' : bestPos, worstPos,
             gf, ga, gd: gf - ga, wins, losses, draws, matches, winRate, history, maxPos };
  }, [selected, tournaments]);

  const chartPoints = useMemo(() =>
    stats?.history.map(h => ({ pos: h.pos, label: h.name })) || [],
  [stats]);

  const fmtLabel = (f) => f === 'knockout' ? 'Mata-Mata' : f === 'league' ? 'Pontos Corridos' : 'Grupos+Elim';

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
      <BarChart2 size={40} style={{ marginBottom: '1rem', opacity: 0.4 }} />
      <p>Carregando dados...</p>
    </div>
  );

  if (tournaments.length === 0) return (
    <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
      <BarChart2 size={40} style={{ marginBottom: '1rem', opacity: 0.4 }} />
      <p>Nenhum torneio finalizado ainda.</p>
    </div>
  );

  return (
    <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>

      {/* Header + Player Selector */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ background: 'rgba(0,255,135,0.1)', border: '1px solid rgba(0,255,135,0.2)', padding: '10px', borderRadius: '12px' }}>
            <BarChart2 size={28} color="var(--accent-primary)" />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.6rem' }}>Estatísticas</h2>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              Desempenho histórico baseado em {tournaments.length} torneio(s)
            </p>
          </div>
        </div>

        {/* Player select */}
        <div style={{ position: 'relative' }}>
          <select
            value={selected || ''}
            onChange={e => setSelected(e.target.value)}
            style={{
              appearance: 'none', padding: '10px 40px 10px 16px',
              background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-color)',
              borderRadius: '10px', color: 'white', fontFamily: 'Outfit', fontSize: '1rem',
              cursor: 'pointer', outline: 'none', minWidth: '180px'
            }}
          >
            {allNames.map(n => <option key={n} value={n} style={{ background: '#1a1a2e' }}>{n}</option>)}
          </select>
          <ChevronDown size={16} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', pointerEvents: 'none' }} />
        </div>
      </div>

      {!stats || stats.tournsPlayed === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
          <p>{selected} ainda não participou de nenhum torneio na galeria.</p>
        </div>
      ) : (
        <>
          {/* Key Metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '1rem' }}>
            <StatCard icon={Trophy} iconColor="#FFD700" label="Títulos" value={stats.titles}
              sub={stats.tournsPlayed > 0 ? `${((stats.titles / stats.tournsPlayed) * 100).toFixed(0)}% dos torneios` : ''} />
            <StatCard icon={BarChart2} iconColor="var(--accent-secondary)" label="Torneios" value={stats.tournsPlayed} sub="disputados" />
            <StatCard icon={TrendingUp} iconColor="var(--accent-primary)" label="Posição Média" value={`${stats.avgPos}°`}
              sub={`Melhor: ${stats.bestPos}° · Pior: ${stats.worstPos}°`} />
            <StatCard icon={Target} iconColor="#f59e0b" label="Gols Feitos" value={stats.gf}
              sub={`Sofridos: ${stats.ga} · Saldo: ${stats.gd >= 0 ? '+' : ''}${stats.gd}`} />
            <StatCard icon={Swords} iconColor="#60efff" label="Aproveitamento" value={`${stats.winRate}%`}
              sub={`${stats.wins}V ${stats.draws}E ${stats.losses}D`} />
            <StatCard icon={Shield} iconColor="#a78bfa" label="Partidas" value={stats.matches}
              sub={stats.matches > 0 ? `${(stats.gf / stats.matches).toFixed(1)} gols/jogo` : ''} />
          </div>

          {/* Position over time chart */}
          <div className="glass-panel">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem' }}>
              <TrendingUp size={20} color="var(--accent-primary)" />
              <h3 style={{ margin: 0 }}>Evolução de Posição</h3>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginLeft: '4px' }}>(quanto menor, melhor)</span>
            </div>
            <PositionChart points={chartPoints} maxPos={Math.max(stats.maxPos, 4)} />
          </div>

          {/* Tournament history table */}
          <div className="glass-panel">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem' }}>
              <Trophy size={20} color="#FFD700" />
              <h3 style={{ margin: 0 }}>Histórico de Torneios</h3>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '480px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    <th style={{ padding: '8px 12px', textAlign: 'left' }}>Torneio</th>
                    <th style={{ padding: '8px 12px', textAlign: 'left' }}>Formato</th>
                    <th style={{ padding: '8px 12px', textAlign: 'center' }}>Data</th>
                    <th style={{ padding: '8px 12px', textAlign: 'center' }}>Posição</th>
                    <th style={{ padding: '8px 12px', textAlign: 'center' }}>Campeão</th>
                  </tr>
                </thead>
                <tbody>
                  {[...stats.history].reverse().map((h, i) => (
                    <tr key={i} style={{
                      borderBottom: '1px solid rgba(255,255,255,0.04)',
                      background: h.isChampion ? 'rgba(255,215,0,0.04)' : 'transparent'
                    }}>
                      <td style={{ padding: '12px', fontWeight: 600 }}>
                        {h.isChampion && <span style={{ marginRight: '6px' }}>🏆</span>}
                        {h.name}
                      </td>
                      <td style={{ padding: '12px' }}>
                        <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '12px', background: 'rgba(96,239,255,0.1)', color: 'var(--accent-secondary)', border: '1px solid rgba(96,239,255,0.15)' }}>
                          {fmtLabel(h.format)}
                        </span>
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{h.date}</td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <span style={{
                          display: 'inline-block', padding: '4px 12px', borderRadius: '20px', fontWeight: 700,
                          background: h.pos === 1 ? 'rgba(255,215,0,0.15)' : h.pos <= 3 ? 'rgba(0,255,135,0.1)' : 'rgba(255,255,255,0.05)',
                          color: h.pos === 1 ? '#FFD700' : h.pos <= 3 ? 'var(--accent-primary)' : 'var(--text-secondary)',
                          border: h.pos === 1 ? '1px solid rgba(255,215,0,0.3)' : h.pos <= 3 ? '1px solid rgba(0,255,135,0.2)' : '1px solid transparent'
                        }}>
                          {h.pos}° / {h.total}
                        </span>
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center', color: h.isChampion ? '#FFD700' : 'var(--text-secondary)', fontWeight: h.isChampion ? 700 : 400, fontSize: '0.9rem' }}>
                        {h.champion || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default StatsDashboard;
