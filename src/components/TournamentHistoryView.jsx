import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Trophy, ArrowLeft } from 'lucide-react';
import TeamLogo from './TeamLogo';
import TournamentGroups from './TournamentGroups';
import TournamentBracket from './TournamentBracket';
import { supabase } from '../lib/supabase';

const TournamentHistoryView = () => {
  const { id } = useParams();
  const [tournament, setTournament] = useState(null);

  useEffect(() => {
    const loadTournament = async () => {
      const { data, error } = await supabase
        .from('tournaments')
        .select('*')
        .eq('id', id)
        .single();
      if (!error && data) setTournament(data);
    };
    loadTournament();
  }, [id]);

  if (!tournament) {
    return (
      <div style={{ textAlign: 'center', marginTop: '4rem' }}>
        <h2 style={{ color: 'var(--text-secondary)' }}>Torneio não encontrado.</h2>
        <Link to="/" className="btn-primary" style={{ textDecoration: 'none', display: 'inline-block', marginTop: '1rem' }}>
          Voltar para o Início
        </Link>
      </div>
    );
  }

  const fmt = tournament.config.format;
  const formatLabel = fmt === 'knockout' ? 'Mata-Mata' : fmt === 'league' ? 'Pontos Corridos' : 'Grupos + Eliminatórias';
  const legsLabel = tournament.config.legsMode === 'double' ? ' • Ida e Volta' : '';

  return (
    <div style={{ marginTop: '1rem', animation: 'fadeIn 0.5s ease' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <Link to="/" style={{ color: 'var(--text-secondary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px', padding: '8px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)' }}>
          <ArrowLeft size={20} /> Voltar
        </Link>
        <div>
          <h2 style={{ margin: 0, color: 'var(--text-primary)' }}>Acervo Histórico: {tournament.config.name}</h2>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            {tournament.date} • {tournament.config.participants} Participantes • {formatLabel}{legsLabel}
          </p>
        </div>
      </div>

      {/* Champion highlight */}
      <div className="glass-panel" style={{
        marginBottom: '3rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column', padding: '3rem 1rem',
        background: 'linear-gradient(to bottom, rgba(0,255,135,0.1), rgba(0,0,0,0.4))',
        border: '1px solid var(--accent-primary)', boxShadow: '0 0 30px rgba(0,255,135,0.1)'
      }}>
        <Trophy size={64} color="#ffd700" style={{ marginBottom: '1rem', filter: 'drop-shadow(0 0 20px rgba(255,215,0,0.5))' }} />
        <h3 style={{ color: '#ffd700', margin: 0, fontSize: '1.2rem', textTransform: 'uppercase', letterSpacing: '2px' }}>Campeão</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginTop: '1.5rem' }}>
          <TeamLogo team={tournament.champion?.team} size={80} />
          <h1 style={{ fontSize: '3.5rem', margin: 0, color: 'white', textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>
            {tournament.champion?.name}
          </h1>
        </div>
      </div>

      {/* Knockout: participant list */}
      {tournament.players && fmt === 'knockout' && (
        <div style={{ marginBottom: '4rem' }}>
          <h3 style={{ color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
            Participantes do Torneio
          </h3>
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
      {(fmt === 'groups' || fmt === 'league') && tournament.groups_data && (
        <div style={{ marginBottom: '4rem' }}>
          <h3 style={{ color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '2rem' }}>
            {fmt === 'league' ? 'Classificação Final' : 'Fase de Grupos'}
          </h3>
          <TournamentGroups
            readOnly={true}
            leagueOnly={fmt === 'league'}
            historyGroups={tournament.groups_data}
            historyMatches={tournament.group_matches}
            players={tournament.players}
          />
        </div>
      )}

      {/* Knockout bracket — only for knockout/groups formats */}
      {fmt !== 'league' && (
        <div>
          <h3 style={{ color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '2rem', textAlign: 'center' }}>
            Fase Eliminatória
          </h3>
          {tournament.bracket_matches && tournament.bracket_matches.length > 0 ? (
            <TournamentBracket
              readOnly={true}
              historyMatches={tournament.bracket_matches}
              historyPlayers={tournament.players}
            />
          ) : (
            <div style={{ textAlign: 'center', padding: '2rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px' }}>
              <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
                Detalhes das partidas não disponíveis para este torneio (salvo em versão anterior).
              </p>
            </div>
          )}
        </div>
      )}

    </div>
  );
};

export default TournamentHistoryView;
