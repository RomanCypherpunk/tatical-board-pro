import { buildShortName, fotmobFetchJson } from './_fotmob.js';
import FORMATIONS from '../src/data/formations.js';
import { mapGridToPosition, resolveFormation } from '../src/data/gridPositionMap.js';

/** FotMob positionId -> tactical abbreviation */
const POSITION_ID_MAP = {
  11: 'GK',
  31: 'RWB',
  32: 'RB',
  33: 'CB',
  34: 'CB',
  35: 'CB',
  36: 'CB',
  37: 'CB',
  38: 'LB',
  39: 'LWB',
  60: 'CDM',
  61: 'CDM',
  62: 'CDM',
  63: 'CDM',
  64: 'CDM',
  65: 'CDM',
  66: 'CDM',
  67: 'CDM',
  74: 'CM',
  75: 'CM',
  76: 'CM',
  77: 'CM',
  78: 'CM',
  80: 'LW',
  81: 'RW',
  82: 'CAM',
  83: 'LM',
  84: 'RM',
  85: 'CAM',
  86: 'CAM',
  87: 'RM',
  100: 'CF',
  101: 'CF',
  102: 'CF',
  110: 'ST',
  111: 'ST',
  112: 'ST',
  113: 'SS',
  114: 'CF',
  115: 'ST',
  116: 'ST',
};

const USUAL_POS_FALLBACK = {
  0: 'GK',
  1: 'CB',
  2: 'CM',
  3: 'ST',
};

const SQUAD_FALLBACK_TEMPLATE = [
  { slot: 'GK', group: 'keepers' },
  { slot: 'RB', group: 'defenders' },
  { slot: 'CB', group: 'defenders' },
  { slot: 'CB', group: 'defenders' },
  { slot: 'LB', group: 'defenders' },
  { slot: 'CM', group: 'midfielders' },
  { slot: 'CDM', group: 'midfielders' },
  { slot: 'CM', group: 'midfielders' },
  { slot: 'RW', group: 'attackers' },
  { slot: 'ST', group: 'attackers' },
  { slot: 'LW', group: 'attackers' },
];

function mapPosition(positionId, usualPosId) {
  return POSITION_ID_MAP[positionId] || USUAL_POS_FALLBACK[usualPosId] || 'CM';
}

function parseFormation(formation) {
  return String(formation || '')
    .split('-')
    .map((value) => Number.parseInt(value, 10))
    .filter((value) => Number.isFinite(value) && value > 0);
}

function ensureHash(color) {
  if (!color) return null;

  const normalized = String(color).trim();
  const rgbaMatch = normalized.match(/rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);

  if (rgbaMatch) {
    const hex = [rgbaMatch[1], rgbaMatch[2], rgbaMatch[3]]
      .map((part) => Number.parseInt(part, 10).toString(16).padStart(2, '0'))
      .join('');
    return `#${hex}`;
  }

  const hexMatch = normalized.match(/#([0-9a-fA-F]{3,8})/);
  if (hexMatch) return `#${hexMatch[1]}`;
  if (/^[0-9a-fA-F]{6}$/.test(normalized)) return `#${normalized}`;

  return normalized;
}

function normalizePlayer(member, fallbackIndex = 0) {
  return {
    fotmobId: member?.id || null,
    name: member?.name || `Jogador ${fallbackIndex + 1}`,
    number: Number.parseInt(member?.shirtNumber || member?.shirt, 10) || fallbackIndex + 1,
    position: mapPosition(member?.positionId, member?.usualPlayingPositionId),
  };
}

function buildPlayersFromLastLineup(starters, formation) {
  if (!Array.isArray(starters) || starters.length === 0) return [];

  const rows = parseFormation(formation);
  const normalizedStarters = starters.map((player, index) => normalizePlayer(player, index));
  const goalkeeperIndex = normalizedStarters.findIndex((player) => player.position === 'GK');
  const goalkeeper =
    goalkeeperIndex >= 0 ? normalizedStarters[goalkeeperIndex] : normalizedStarters[0];
  const outfieldPlayers = normalizedStarters.filter((_, index) => index !== goalkeeperIndex);

  if (rows.reduce((sum, count) => sum + count, 0) !== outfieldPlayers.length) {
    return normalizedStarters;
  }

  const slottedPlayers = [goalkeeper];
  let offset = 0;

  rows.forEach((count, rowIndex) => {
    const rowPlayers = outfieldPlayers.slice(offset, offset + count).reverse();

    rowPlayers.forEach((player, colIndex) => {
      slottedPlayers.push({
        ...player,
        position: mapGridToPosition(formation, rowIndex + 2, colIndex + 1),
      });
    });

    offset += count;
  });

  return slottedPlayers;
}

function classifySquadGroup(title) {
  const normalized = String(title || '').toLowerCase();

  if (normalized.includes('keeper') || normalized.includes('goalkeeper')) return 'keepers';
  if (normalized.includes('defender') || normalized.includes('back')) return 'defenders';
  if (normalized.includes('midfielder') || normalized.includes('midfield')) return 'midfielders';
  if (
    normalized.includes('attacker') ||
    normalized.includes('forward') ||
    normalized.includes('striker')
  ) {
    return 'attackers';
  }

  return null;
}

function buildSquadLineup(squadGroups) {
  if (!Array.isArray(squadGroups) || squadGroups.length === 0) return null;

  const grouped = {
    keepers: [],
    defenders: [],
    midfielders: [],
    attackers: [],
  };
  const overflow = [];
  const seen = new Set();

  squadGroups.forEach((group) => {
    const bucket = classifySquadGroup(group?.title);
    const members = Array.isArray(group?.members) ? group.members : [];

    members.forEach((member, index) => {
      if (!member?.name || member?.role === 'coach') return;

      const key = member.id || member.name;
      if (seen.has(key)) return;
      seen.add(key);

      const normalizedPlayer = normalizePlayer(member, index);

      if (bucket) {
        grouped[bucket].push(normalizedPlayer);
      } else {
        overflow.push(normalizedPlayer);
      }
    });
  });

  const totalPlayers =
    grouped.keepers.length +
    grouped.defenders.length +
    grouped.midfielders.length +
    grouped.attackers.length +
    overflow.length;

  if (totalPlayers === 0) return null;

  return SQUAD_FALLBACK_TEMPLATE.map(({ slot, group }, index) => {
    const primaryPool = grouped[group];
    const player =
      primaryPool.shift() ||
      overflow.shift() ||
      grouped.defenders.shift() ||
      grouped.midfielders.shift() ||
      grouped.attackers.shift() ||
      grouped.keepers.shift() ||
      normalizePlayer(null, index);

    return {
      fotmobId: player.fotmobId,
      name: player.name,
      number: player.number,
      position: slot,
    };
  });
}

export default async function handler(req, res) {
  const { teamId } = req.query;

  if (!teamId) {
    return res.status(400).json({ error: 'teamId e obrigatorio.' });
  }

  try {
    const teamData = await fotmobFetchJson(`/data/teams?id=${teamId}`);

    const teamName = teamData?.details?.name || 'Desconhecido';
    const shortName = buildShortName(teamName, teamData?.details?.shortName);
    const logo = `https://images.fotmob.com/image_resources/logo/teamlogo/${teamId}.png`;

    const teamColors = teamData?.overview?.teamColors || {};
    const primaryColor = ensureHash(teamColors?.darkMode) || '#14C96B';
    const secondaryColor =
      ensureHash(teamColors?.lightMode) || ensureHash(teamColors?.fontDarkMode) || '#FFFFFF';
    const numberColor =
      ensureHash(teamColors?.fontDarkMode) || ensureHash(teamColors?.fontLightMode) || '#FFFFFF';

    const lastLineup = teamData?.overview?.lastLineupStats;

    let formation = '4-3-3';
    let players = [];
    let isSquadFallback = false;

    if (lastLineup?.starters?.length) {
      formation = resolveFormation(lastLineup.formation || formation, FORMATIONS);
      players = buildPlayersFromLastLineup(lastLineup.starters, formation);
    } else {
      players = buildSquadLineup(teamData?.squad?.squad);
      isSquadFallback = true;

      if (!players) {
        return res.status(404).json({
          error: 'Elenco nao disponivel para este time.',
          team: { name: teamName, shortName, logo },
        });
      }
    }

    const lastMatch = !isSquadFallback ? teamData?.overview?.lastMatch : null;
    const fixture = lastMatch
      ? {
          id: String(lastMatch?.id || ''),
          date: lastMatch?.status?.utcTime?.slice(0, 10) || '',
          home: lastMatch?.home?.name || '',
          away: lastMatch?.away?.name || '',
          score: `${lastMatch?.home?.score ?? '?'}-${lastMatch?.away?.score ?? '?'}`,
        }
      : null;

    const result = {
      team: {
        name: teamName,
        shortName,
        primaryColor,
        secondaryColor,
        numberColor,
        formation,
        logo,
        isNationalTeam: Boolean(teamData?.squad?.isNationalTeam),
      },
      players,
      fixture,
    };

    res.setHeader(
      'Cache-Control',
      'public, s-maxage=21600, stale-while-revalidate=43200'
    );
    return res.status(200).json(result);
  } catch (err) {
    return res.status(502).json({
      error: err.message || 'Erro ao consultar FotMob.',
    });
  }
}
