/**
 * Maps API-Football grid notation (e.g. "2:3") + formation to specific
 * position abbreviations used by the app (GK, CB, LB, RB, CM, etc.).
 *
 * API-Football grid: row 1 = GK, row 2 = first line, ..., last row = attack.
 * Columns are numbered 1..N within each row.
 */

// Position templates for each row size + layer type
const DEFENSE_MAPS = {
  2: ['CB', 'CB'],
  3: ['CB', 'CB', 'CB'],
  4: ['LB', 'CB', 'CB', 'RB'],
  5: ['LWB', 'CB', 'CB', 'CB', 'RWB'],
};

const MIDFIELD_MAPS = {
  1: ['CDM'],
  2: ['CM', 'CM'],
  3: ['CM', 'CM', 'CM'],
  4: ['LM', 'CM', 'CM', 'RM'],
  5: ['LWB', 'CM', 'CDM', 'CM', 'RWB'],
};

const ATTACK_MID_MAPS = {
  1: ['CAM'],
  2: ['CAM', 'CAM'],
  3: ['LW', 'CAM', 'RW'],
  4: ['LW', 'CAM', 'CAM', 'RW'],
};

const ATTACK_MAPS = {
  1: ['ST'],
  2: ['ST', 'ST'],
  3: ['LW', 'ST', 'RW'],
  4: ['LW', 'ST', 'ST', 'RW'],
};

/**
 * Parse formation string "4-3-3" → [4, 3, 3]
 */
export function parseFormation(formation) {
  return formation.split('-').map(Number);
}

/**
 * Determine position for a player based on their grid location in the formation.
 *
 * @param {string} formation - e.g. "4-3-3"
 * @param {number} row - grid row (1-based; 1 = GK)
 * @param {number} col - grid column (1-based)
 * @returns {string} position abbreviation (GK, CB, LB, etc.)
 */
export function mapGridToPosition(formation, row, col) {
  if (row === 1) return 'GK';

  const layers = parseFormation(formation);
  const layerIndex = row - 2; // 0-based index into layers array
  if (layerIndex < 0 || layerIndex >= layers.length) return 'CM';

  const count = layers[layerIndex];
  const colIdx = col - 1; // 0-based
  const totalLayers = layers.length;
  const layerRole = getLayerRole(formation, layerIndex, totalLayers);

  let map;
  if (layerRole === 'defense') {
    map = DEFENSE_MAPS[count];
  } else if (layerRole === 'attack') {
    map = ATTACK_MAPS[count];
  } else if (layerRole === 'attackMid') {
    map = ATTACK_MID_MAPS[count] || MIDFIELD_MAPS[count];
  } else {
    map = MIDFIELD_MAPS[count];
  }

  if (!map) return 'CM';
  return map[Math.min(colIdx, map.length - 1)] || 'CM';
}

const FORMATION_ROLE_LAYOUTS = {
  '4-3-3': ['defense', 'midfield', 'attack'],
  '4-2-3-1': ['defense', 'midfield', 'attackMid', 'attack'],
  '4-4-2': ['defense', 'midfield', 'attack'],
  '4-1-4-1': ['defense', 'midfield', 'midfield', 'attack'],
  '4-1-2-1-2': ['defense', 'midfield', 'midfield', 'attackMid', 'attack'],
  '4-2-2-2': ['defense', 'midfield', 'attackMid', 'attack'],
  '4-2-4': ['defense', 'midfield', 'attack'],
  '3-4-3': ['defense', 'midfield', 'attack'],
  '3-1-2-1-3': ['defense', 'midfield', 'midfield', 'attackMid', 'attack'],
  '3-4-2-1': ['defense', 'midfield', 'attackMid', 'attack'],
  '3-5-2': ['defense', 'midfield', 'attack'],
  '3-2-2-3': ['defense', 'midfield', 'attackMid', 'attack'],
  '5-4-1': ['defense', 'midfield', 'attack'],
  '5-3-2': ['defense', 'midfield', 'attack'],
  '5-2-3': ['defense', 'midfield', 'attack'],
};

function getLayerRole(formation, layerIndex, totalLayers) {
  const mappedRole = FORMATION_ROLE_LAYOUTS[formation]?.[layerIndex];
  if (mappedRole) return mappedRole;

  if (layerIndex === 0) return 'defense';
  if (layerIndex === totalLayers - 1) return 'attack';
  if (layerIndex === totalLayers - 2 && totalLayers >= 3) return 'attackMid';
  return 'midfield';
}

/**
 * Find the closest matching formation key from the app's FORMATIONS database.
 * If exact match exists, returns it. Otherwise, tries common aliases.
 */
const FORMATION_ALIASES = {
  '4-3-3': '4-3-3',
  '4-2-3-1': '4-2-3-1',
  '4-4-2': '4-4-2',
  '4-1-2-1-2': '4-1-2-1-2',
  '4-2-2-2': '4-2-2-2',
  '4-1-4-1': '4-1-4-1',
  '4-2-4': '4-2-4',
  '3-1-2-1-3': '3-1-2-1-3',
  '3-5-2': '3-5-2',
  '3-4-2-1': '3-4-2-1',
  '3-4-3': '3-4-3',
  '3-4-3 (Losango)': '3-1-2-1-3',
  '3-2-2-3': '3-2-2-3',
  '5-4-1': '5-4-1',
  '5-3-2': '5-3-2',
  '5-2-3': '5-2-3',
  // Common API-Football formations that need mapping
  '4-5-1': '4-1-4-1',
  '3-1-4-2': '3-5-2',
  '4-3-1-2': '4-1-2-1-2',
  '4-1-3-2': '4-1-2-1-2',
  '4-4-1-1': '4-4-2',
  '4-3-2-1': '4-2-3-1',
  '3-4-1-2': '3-5-2',
  '3-3-4': '3-2-2-3',
};

export function resolveFormation(apiFormation, availableFormations) {
  if (availableFormations[apiFormation]) return apiFormation;
  if (FORMATION_ALIASES[apiFormation]) return FORMATION_ALIASES[apiFormation];

  // Fallback: find formation with same defender count
  const layers = parseFormation(apiFormation);
  const defCount = layers[0];
  const match = Object.keys(availableFormations).find(
    (k) => k.startsWith(`${defCount}-`)
  );
  return match || '4-3-3';
}
