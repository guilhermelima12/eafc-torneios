import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Trophy, Users, BarChart2, Zap, PlusCircle,
  ArrowRight, ShieldCheck, Eye, Swords, Star,
  CalendarDays, TrendingUp, Play,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import TeamLogo from './TeamLogo';

/* ── Animated counter ─────────────────────────────────────────── */
const AnimCounter = ({ target, suffix = '' }) => {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!target) return;
    let start = 0;
    const step = Math.ceil(target / 30);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setVal(target); clearInterval(timer); }
      else setVal(start);
    }, 30);
    return () => clearInterval(timer);
  }, [target]);
  return <>{val}{suffix}</>;
};

/* ── Stat Card ────────────────────────────────────────────────── */
const StatCard = ({ icon: Icon, label, value, color, suffix }) => (
  <div style={{
    flex: '1 1 160px',
    padding: '1.5rem',
    background: 'rgba(255,255,255,0.03)',
    border: `1px solid ${color}33`,
    borderRadius: '16px',
    display: 'flex', flexDirection: 'column', gap: '0.75rem',
    position: 'relative', overflow: 'hidden',
    transition: 'transform 0.2s, box-shadow 0.2s',
  }}
    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = `0 8px 24px ${color}22`; }}
    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
  >
    {/* bg glow */}
    <div style={{
      position: 'absolute', top: '-20px', right: '-20px',
      width: '80px', height: '80px', borderRadius: '50%',
      background: `radial-gradient(circle, ${color}18, transparent 70%)`,
      pointerEvents: 'none',
    }} />
    <div style={{
      width: '40px', height: '40px', borderRadius: '12px',
      background: `${color}15`, border: `1px solid ${color}30`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <Icon size={20} color={color} />
    </div>
    <div>
      <div style={{ fontSize: '2rem', fontWeight: 800, color: 'white', lineHeight: 1 }}>
        <AnimCounter target={value} suffix={suffix} />
      </div>
      <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '4px' }}>{label}</div>
    </div>
  </div>
);

/* ── Quick Action Button ──────────────────────────────────────── */
const ActionBtn = ({ to, icon: Icon, label, desc, color, primary }) => (
  <Link to={to} style={{ textDecoration: 'none', flex: '1 1 200px' }}>
    <div style={{
      padding: '1.25rem 1.5rem',
      background: primary ? `linear-gradient(135deg, ${color}22, ${color}08)` : 'rgba(255,255,255,0.03)',
      border: `1px solid ${primary ? color + '50' : 'rgba(255,255,255,0.08)'}`,
      borderRadius: '14px', cursor: 'pointer',
      display: 'flex', alignItems: 'center', gap: '1rem',
      transition: 'all 0.2s',
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 6px 20px ${color}20`; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
    >
      <div style={{
        width: '44px', height: '44px', borderRadius: '12px', flexShrink: 0,
        background: `${color}18`, border: `1px solid ${color}30`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon size={22} color={color} />
      </div>
      <div>
        <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'white' }}>{label}</div>
        <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px' }}>{desc}</div>
      </div>
      <ArrowRight size={16} color="var(--text-secondary)" style={{ marginLeft: 'auto', flexShrink: 0 }} />
    </div>
  </Link>
);

/* ── Main Component ───────────────────────────────────────────── */
const HomePage = () => {
  const { isAdmin, role } = useAuth();
  const [stats, setStats] = useState({ tournaments: 0, players: 0, matches: 0 });
  const [lastChampion, setLastChampion] = useState(null);
  const [recentTournaments, setRecentTournaments] = useState([]);
  const [hasActiveTournament, setHasActiveTournament] = useState(false);
  const [loading, setLoading] = useState(true);
  const [time, setTime] = useState(new Date());

  /* live clock */
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  /* fetch data */
  useEffect(() => {
    const load = async () => {
      try {
        const [{ data: tournaments }, { count: playerCount }] = await Promise.all([
          supabase.from('tournaments').select('*').order('created_at', { ascending: false }),
          supabase.from('players').select('*', { count: 'exact', head: true }),
        ]);

        if (tournaments) {
          setStats({
            tournaments: tournaments.length,
            players: playerCount || 0,
            matches: tournaments.reduce((acc, t) => acc + (t.bracket_matches?.length || 0) + (t.group_matches?.length || 0), 0),
          });

          // Last tournament with champion
          const withChampion = tournaments.find(t => t.champion);
          if (withChampion) {
            setLastChampion({ ...withChampion.champion, tournamentName: withChampion.config?.name, date: withChampion.date });
          }

          setRecentTournaments(tournaments.slice(0, 3));
        }

        // Check active tournament
        const savedConfig = localStorage.getItem('tournamentConfig');
        setHasActiveTournament(!!savedConfig);
      } catch (e) {
        console.error('HomePage load error:', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const timeStr = time.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const dateStr = time.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div style={{ marginTop: '1rem', animation: 'fadeIn 0.5s ease' }}>

      {/* ── Hero Banner ─────────────────────────────────────────── */}
      <div style={{
        position: 'relative', overflow: 'hidden',
        borderRadius: '20px', marginBottom: '2rem',
        padding: '3rem 2.5rem',
        background: 'linear-gradient(135deg, rgba(0,255,135,0.08) 0%, rgba(96,239,255,0.05) 50%, rgba(10,14,26,0.9) 100%)',
        border: '1px solid rgba(0,255,135,0.15)',
      }}>
        {/* decorative orbs */}
        <div style={{ position: 'absolute', top: '-40px', right: '10%', width: '200px', height: '200px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,255,135,0.12), transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-60px', right: '30%', width: '160px', height: '160px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(96,239,255,0.1), transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: '20px', right: '20px', opacity: 0.05 }}>
          <Trophy size={120} color="white" />
        </div>

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              padding: '4px 12px', borderRadius: '20px', fontSize: '0.78rem', fontWeight: 700,
              background: isAdmin ? 'rgba(0,255,135,0.12)' : 'rgba(96,239,255,0.12)',
              border: `1px solid ${isAdmin ? 'rgba(0,255,135,0.3)' : 'rgba(96,239,255,0.3)'}`,
              color: isAdmin ? 'var(--accent-primary)' : 'var(--accent-secondary)',
            }}>
              {isAdmin ? <ShieldCheck size={13} /> : <Eye size={13} />}
              {isAdmin ? 'Administrador' : 'Convidado'}
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              {timeStr} · {dateStr}
            </div>
          </div>

          <h1 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 900, margin: '0 0 0.5rem', lineHeight: 1.1 }}>
            Bem-vindo ao<br />
            <span style={{ background: 'linear-gradient(90deg, var(--accent-primary), var(--accent-secondary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              EA FC 26 Manager
            </span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', margin: '0 0 2rem', maxWidth: '480px' }}>
            {isAdmin
              ? 'Gerencie torneios, registre placares ao vivo e acompanhe o desempenho dos jogadores.'
              : 'Acompanhe os torneios, veja as classificações e o histórico de campeões.'}
          </p>

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            {isAdmin ? (
              <>
                {hasActiveTournament ? (
                  <Link to="/tournaments" className="btn-primary" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 24px' }}>
                    <Play size={16} fill="currentColor" /> Continuar Torneio
                  </Link>
                ) : (
                  <Link to="/setup" className="btn-primary" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 24px' }}>
                    <PlusCircle size={16} /> Criar Torneio
                  </Link>
                )}
                <Link to="/players" className="btn-secondary" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 24px' }}>
                  <Users size={16} /> Jogadores
                </Link>
              </>
            ) : (
              <>
                <Link to="/tournaments" className="btn-secondary" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 24px' }}>
                  <Trophy size={16} /> Ver Torneios
                </Link>
                <Link to="/stats" className="btn-secondary" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 24px' }}>
                  <BarChart2 size={16} /> Estatísticas
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Stats Row ───────────────────────────────────────────── */}
      {!loading && (
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
          <StatCard icon={Trophy} label="Torneios realizados" value={stats.tournaments} color="var(--accent-primary)" />
          <StatCard icon={Users} label="Jogadores cadastrados" value={stats.players} color="var(--accent-secondary)" />
          <StatCard icon={Swords} label="Partidas disputadas" value={stats.matches} color="#a78bfa" />
          {hasActiveTournament && (
            <StatCard icon={Zap} label="Torneio em andamento" value={1} color="#fbbf24" />
          )}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>

        {/* ── Last Champion ────────────────────────────────────── */}
        {lastChampion && (
          <div style={{
            background: 'linear-gradient(135deg, rgba(255,215,0,0.08), rgba(255,215,0,0.02))',
            border: '1px solid rgba(255,215,0,0.2)',
            borderRadius: '18px', padding: '2rem',
            position: 'relative', overflow: 'hidden',
          }}>
            <div style={{ position: 'absolute', top: '-10px', right: '-10px', opacity: 0.06 }}>
              <Trophy size={100} color="#ffd700" />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.25rem' }}>
              <Star size={16} color="#ffd700" fill="#ffd700" />
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#ffd700', textTransform: 'uppercase', letterSpacing: '1.5px' }}>
                Último Campeão
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
              <TeamLogo team={lastChampion.team} size={64} />
              <div>
                <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#ffd700', lineHeight: 1.1 }}>
                  {lastChampion.name}
                </div>
                {lastChampion.tournamentName && (
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    🏆 {lastChampion.tournamentName}
                  </div>
                )}
                {lastChampion.date && (
                  <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.35)', marginTop: '2px' }}>
                    <CalendarDays size={11} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
                    {lastChampion.date}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Active Tournament ────────────────────────────────── */}
        {hasActiveTournament && (() => {
          const cfg = JSON.parse(localStorage.getItem('tournamentConfig') || '{}');
          return (
            <div style={{
              background: 'linear-gradient(135deg, rgba(0,255,135,0.08), rgba(0,255,135,0.02))',
              border: '1px solid rgba(0,255,135,0.25)',
              borderRadius: '18px', padding: '2rem',
              position: 'relative', overflow: 'hidden',
            }}>
              <div style={{ position: 'absolute', top: '-10px', right: '-10px', opacity: 0.05 }}>
                <Zap size={100} color="var(--accent-primary)" />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.25rem' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-primary)', display: 'inline-block', animation: 'livePulse 1.5s infinite' }} />
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--accent-primary)', textTransform: 'uppercase', letterSpacing: '1.5px' }}>
                  Em andamento
                </span>
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'white', marginBottom: '0.5rem' }}>
                {cfg.name || 'Torneio Ativo'}
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                {cfg.participants || '?'} participantes •{' '}
                {cfg.format === 'knockout' ? 'Mata-Mata' : cfg.format === 'league' ? 'Pontos Corridos' : 'Grupos + Eliminatórias'}
              </div>
              <Link to="/tournaments" className="btn-primary" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 20px', fontSize: '0.9rem' }}>
                <ArrowRight size={16} /> Ir para o Torneio
              </Link>
            </div>
          );
        })()}

        {/* ── Quick Actions (admin) ────────────────────────────── */}
        {isAdmin && (
          <div style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: '18px', padding: '2rem',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.25rem' }}>
              <TrendingUp size={16} color="var(--accent-secondary)" />
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--accent-secondary)', textTransform: 'uppercase', letterSpacing: '1.5px' }}>
                Ações Rápidas
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <ActionBtn to="/setup" icon={PlusCircle} label="Criar Torneio" desc="Configure um novo campeonato" color="var(--accent-primary)" primary />
              <ActionBtn to="/players" icon={Users} label="Jogadores" desc="Gerencie o cadastro de jogadores" color="var(--accent-secondary)" />
              <ActionBtn to="/stats" icon={BarChart2} label="Estatísticas" desc="Ranking e desempenho geral" color="#a78bfa" />
            </div>
          </div>
        )}
      </div>

      {/* ── Recent Tournaments ──────────────────────────────────── */}
      {recentTournaments.length > 0 && (
        <div style={{
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: '18px', padding: '2rem',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CalendarDays size={16} color="var(--text-secondary)" />
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1.5px' }}>
                Torneios Recentes
              </span>
            </div>
            <Link to="/tournaments" style={{ fontSize: '0.82rem', color: 'var(--accent-secondary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
              Ver todos <ArrowRight size={13} />
            </Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {recentTournaments.map(t => (
              <Link key={t.id} to={`/history/${t.id}`} style={{ textDecoration: 'none' }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '1rem',
                  padding: '0.875rem 1rem', borderRadius: '12px',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  transition: 'all 0.2s',
                }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.borderColor = 'rgba(96,239,255,0.2)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; }}
                >
                  {t.champion && <TeamLogo team={t.champion.team} size={36} />}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, color: 'white', fontSize: '0.95rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {t.config?.name || 'Torneio'}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                      {t.date} · {t.config?.participants} jogadores
                    </div>
                  </div>
                  {t.champion && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                      <Trophy size={13} color="#ffd700" />
                      <span style={{ fontSize: '0.82rem', color: '#ffd700', fontWeight: 700 }}>{t.champion.name}</span>
                    </div>
                  )}
                  <ArrowRight size={15} color="var(--text-secondary)" style={{ flexShrink: 0 }} />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;
