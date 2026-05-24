import React, { useState } from 'react';
import { Trophy, Eye, Lock, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const LoginGate = () => {
  const { loginAsGuest, loginAsAdmin } = useAuth();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAdmin = (e) => {
    e.preventDefault();
    if (!password) { setError('Digite a senha.'); return; }
    setLoading(true);
    setTimeout(() => {
      const ok = loginAsAdmin(password);
      if (!ok) {
        setError('Senha incorreta.');
        setLoading(false);
      }
    }, 400);
  };

  const navStyle = (active) => ({
    flex: 1, padding: '12px', borderRadius: '8px', cursor: 'pointer',
    fontFamily: 'Outfit', fontWeight: 600, fontSize: '0.95rem',
    transition: 'all 0.2s', border: 'none', outline: 'none',
  });

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg-primary)', padding: '2rem',
      backgroundImage: 'radial-gradient(ellipse at 20% 50%, rgba(0,255,135,0.04) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(96,239,255,0.04) 0%, transparent 60%)',
    }}>

      {/* Logo */}
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          background: 'var(--accent-primary)', padding: '16px', borderRadius: '20px',
          marginBottom: '1.25rem',
          boxShadow: '0 0 40px rgba(0,255,135,0.25)',
        }}>
          <Trophy size={40} color="#000" />
        </div>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: 0, letterSpacing: '0.5px' }}>
          EA FC 26 Manager
        </h1>
        <p style={{ color: 'var(--text-secondary)', margin: '0.5rem 0 0', fontSize: '0.95rem' }}>
          Selecione como deseja entrar
        </p>
      </div>

      {/* Cards */}
      <div style={{ display: 'flex', gap: '1.5rem', width: '100%', maxWidth: '680px', flexWrap: 'wrap' }}>

        {/* Guest Card */}
        <div style={{
          flex: '1 1 280px', padding: '2rem',
          background: 'rgba(96,239,255,0.04)',
          border: '1px solid rgba(96,239,255,0.2)',
          borderRadius: '20px', display: 'flex', flexDirection: 'column', gap: '1rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '0.5rem' }}>
            <div style={{
              background: 'rgba(96,239,255,0.12)', padding: '10px', borderRadius: '12px',
            }}>
              <Eye size={24} color="var(--accent-secondary)" />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>Convidado</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Somente visualização</div>
            </div>
          </div>

          <ul style={{ margin: 0, padding: '0 0 0 1.25rem', color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: '1.8' }}>
            <li>Ver torneios e histórico</li>
            <li>Ver jogadores e seeds</li>
            <li>Ver estatísticas e brackets</li>
          </ul>

          <button
            onClick={loginAsGuest}
            style={{
              ...navStyle(),
              background: 'rgba(96,239,255,0.1)',
              border: '1px solid rgba(96,239,255,0.3)',
              color: 'var(--accent-secondary)',
              marginTop: 'auto',
            }}
          >
            Entrar como Convidado
          </button>
        </div>

        {/* Admin Card */}
        <div style={{
          flex: '1 1 280px', padding: '2rem',
          background: 'rgba(0,255,135,0.04)',
          border: '1px solid rgba(0,255,135,0.2)',
          borderRadius: '20px', display: 'flex', flexDirection: 'column', gap: '1rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '0.5rem' }}>
            <div style={{
              background: 'rgba(0,255,135,0.12)', padding: '10px', borderRadius: '12px',
            }}>
              <Lock size={24} color="var(--accent-primary)" />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>Administrador</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Acesso completo</div>
            </div>
          </div>

          <ul style={{ margin: 0, padding: '0 0 0 1.25rem', color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: '1.8' }}>
            <li>Criar e editar torneios</li>
            <li>Registrar placares</li>
            <li>Gerenciar jogadores</li>
          </ul>

          <form onSubmit={handleAdmin} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: 'auto' }}>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Senha de admin"
                value={password}
                onChange={e => { setPassword(e.target.value); setError(''); }}
                style={{
                  width: '100%', padding: '11px 40px 11px 14px',
                  borderRadius: '8px', border: `1px solid ${error ? 'rgba(255,75,75,0.5)' : 'rgba(0,255,135,0.2)'}`,
                  background: 'rgba(255,255,255,0.04)', color: 'white',
                  fontFamily: 'Outfit', fontSize: '0.95rem', outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(s => !s)}
                style={{
                  position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)',
                  display: 'flex', alignItems: 'center', padding: 0,
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {error && <div style={{ fontSize: '0.8rem', color: '#ff4b4b' }}>{error}</div>}
            <button
              type="submit"
              disabled={loading}
              style={{
                ...navStyle(),
                background: loading ? 'rgba(0,255,135,0.05)' : 'rgba(0,255,135,0.12)',
                border: '1px solid rgba(0,255,135,0.3)',
                color: 'var(--accent-primary)',
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? 'Verificando...' : 'Entrar como Admin'}
            </button>
          </form>
        </div>
      </div>

      <p style={{ marginTop: '2rem', fontSize: '0.78rem', color: 'rgba(255,255,255,0.2)' }}>
        EA FC 26 Tournament Manager
      </p>
    </div>
  );
};

export default LoginGate;
