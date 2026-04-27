import React, { useState } from 'react';

const TeamLogo = ({ team, size = 40 }) => {
  const [hasError, setHasError] = useState(false);

  // Get first 3 letters for the fallback
  const getInitials = (name) => {
    if (!name) return 'FC';
    const clean = name.replace(/fc|sc|ac|cf/gi, '').trim();
    return clean.substring(0, 3).toUpperCase();
  };

  if (!team) {
    return (
      <div style={{
        width: size, height: size, borderRadius: '50%',
        background: 'rgba(255,255,255,0.1)', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        border: '1px dashed var(--border-color)'
      }}>
        <span style={{ fontSize: size * 0.35, color: 'var(--text-secondary)' }}>?</span>
      </div>
    );
  }

  if (hasError || !team.logo) {
    // Generate a consistent pseudo-random color based on team name
    const colors = ['#e63946', '#457b9d', '#1d3557', '#2a9d8f', '#e9c46a', '#f4a261', '#6d597a', '#b56576'];
    const colorIndex = team.name.length % colors.length;
    
    return (
      <div style={{
        width: size, height: size, borderRadius: '50%',
        background: `linear-gradient(135deg, ${colors[colorIndex]}, #000)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: '1px solid rgba(255,255,255,0.2)',
        boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
        flexShrink: 0
      }}>
        <span style={{ 
          fontSize: size * 0.35, 
          fontWeight: 700, 
          color: 'white',
          fontFamily: 'Outfit',
          letterSpacing: '1px'
        }}>
          {getInitials(team.name)}
        </span>
      </div>
    );
  }

  return (
    <img 
      src={team.logo} 
      alt={team.name} 
      onError={() => setHasError(true)}
      style={{ 
        width: size, 
        height: size, 
        objectFit: 'contain',
        filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.3))'
      }} 
    />
  );
};

export default TeamLogo;
