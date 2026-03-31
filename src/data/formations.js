import { mapGridToPosition } from './gridPositionMap';

const FORMATION_KEYS = [
  '4-4-2',
  '4-3-3',
  '4-2-3-1',
  '3-5-2',
  '3-4-3',
  '4-1-4-1',
  '4-4-1-1',
  '4-3-2-1',
  '5-3-2',
  '5-4-1',
  '4-2-4',
  '3-4-1-2',
  '4-1-2-1-2',
  '4-2-2-2',
  '3-3-4',
];

const ROW_X_MAPS = {
  defense: {
    1: [50],
    2: [38, 62],
    3: [27, 50, 73],
    4: [18, 39, 61, 82],
    5: [10, 30, 50, 70, 90],
  },
  midfield: {
    1: [50],
    2: [38, 62],
    3: [28, 50, 72],
    4: [16, 39, 61, 84],
    5: [10, 30, 50, 70, 90],
  },
  attackMid: {
    1: [50],
    2: [37, 63],
    3: [20, 50, 80],
    4: [14, 38, 62, 86],
  },
  attack: {
    1: [50],
    2: [38, 62],
    3: [16, 50, 84],
    4: [10, 37, 63, 90],
  },
};

function parseFormation(formation) {
  return formation.split('-').map(Number);
}

function getRowRole(index, totalRows) {
  if (index === 0) return 'defense';
  if (index === totalRows - 1) return 'attack';
  if (totalRows >= 3 && index === totalRows - 2) return 'attackMid';
  return 'midfield';
}

function getRowY(index, totalRows) {
  const start = 78;
  const end = 24;

  if (totalRows === 1) return 52;
  return start - (index * (start - end)) / (totalRows - 1);
}

function distributeRow(count, role) {
  const mapped = ROW_X_MAPS[role]?.[count];
  if (mapped) return mapped;

  const padding = role === 'attack' ? 12 : 14;
  const step = count === 1 ? 0 : (100 - padding * 2) / (count - 1);
  return Array.from({ length: count }, (_, idx) =>
    Number((padding + idx * step).toFixed(1))
  );
}

function createFormation(formation) {
  const rows = parseFormation(formation);
  const positions = [{ x: 50, y: 92, pos: 'GK' }];

  rows.forEach((count, rowIdx) => {
    const role = getRowRole(rowIdx, rows.length);
    const y = Number(getRowY(rowIdx, rows.length).toFixed(1));
    const xs = distributeRow(count, role);

    xs.forEach((x, colIdx) => {
      positions.push({
        x,
        y,
        pos: mapGridToPosition(formation, rowIdx + 2, colIdx + 1),
      });
    });
  });

  return { positions };
}

const FORMATIONS = Object.fromEntries(
  FORMATION_KEYS.map((formation) => [formation, createFormation(formation)])
);

export default FORMATIONS;
