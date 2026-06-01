/**
 * Seeding and Pot Management Utilities
 */

/**
 * Gets a player's seed number safely.
 * Smaller number = stronger player (e.g. Seed 1 is the best).
 */
export const getPlayerSeed = (player) => {
  if (!player) return 999;
  const s = player.lastRank ?? player.seed;
  return s != null && s !== '' ? parseInt(s, 10) : 999;
};

/**
 * Sorts an array of players by their seed ascending.
 */
export const sortBySeed = (players) => {
  return [...players].sort((a, b) => getPlayerSeed(a) - getPlayerSeed(b));
};

/**
 * Standard Fisher-Yates shuffle algorithm.
 */
export const shuffleArray = (array) => {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

/**
 * Gets a player's pot number dynamically relative to a tournament list.
 */
export const getPotNumber = (player, allPlayers, format, numGroups = 2) => {
  const sorted = sortBySeed(allPlayers);
  const idx = sorted.findIndex(p => p.id === player.id || p.name === player.name);
  if (idx === -1) return getAbsolutePot(getPlayerSeed(player));
  
  const potSize = format === 'groups' ? numGroups : 2;
  return Math.floor(idx / potSize) + 1;
};

/**
 * Fallback / Absolute pot based purely on seed number (useful for player lists).
 * Pot 1: Seeds 1-2
 * Pot 2: Seeds 3-4
 * Pot 3: Seeds 5-6
 * Pot 4: Seeds 7+
 */
export const getAbsolutePot = (seed) => {
  if (seed == null || seed === '') return 4;
  const s = parseInt(seed, 10);
  if (s <= 2) return 1;
  if (s <= 4) return 2;
  if (s <= 6) return 3;
  return 4;
};

/**
 * Returns style information, badge labels, and medal icons for a pot.
 */
export const getPotStyle = (potNumber) => {
  switch (potNumber) {
    case 1:
      return {
        background: 'rgba(255, 215, 0, 0.08)',
        border: '1px solid rgba(255, 215, 0, 0.3)',
        color: '#FFD700',
        icon: '🥇',
        label: 'Pote 1'
      };
    case 2:
      return {
        background: 'rgba(226, 232, 240, 0.08)',
        border: '1px solid rgba(226, 232, 240, 0.3)',
        color: '#e2e8f0',
        icon: '🥈',
        label: 'Pote 2'
      };
    case 3:
      return {
        background: 'rgba(205, 127, 50, 0.08)',
        border: '1px solid rgba(205, 127, 50, 0.3)',
        color: '#CD7F32',
        icon: '🥉',
        label: 'Pote 3'
      };
    default:
      return {
        background: 'rgba(148, 163, 184, 0.08)',
        border: '1px solid rgba(148, 163, 184, 0.3)',
        color: '#94a3b8',
        icon: '🛡️',
        label: `Pote ${potNumber}`
      };
  }
};
