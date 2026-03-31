import { buildShortName, fotmobFetchJson } from './_fotmob.js';

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

const FALLBACK_SLOTS = ['GK', 'LB', 'CB', 'CB', 'RB', 'CM', 'CM', 'CM', 'LW', 'ST', 'RW'];

const SLOT_PREFERENCES = {
  GK: ['GK'],
  LB: ['LB', 'LWB', 'CB'],
  CB: ['CB', 'LB', 'RB', 'LWB', 'RWB'],
  RB: ['RB', 'RWB', 'CB'],
  CM: ['CM', 'CDM', 'CAM', 'LM', 'RM'],
  LW: ['LW', 'LM', 'RW', 'CAM', 'ST', 'CF'],
  ST: ['ST', 'CF', 'SS', 'CAM', 'RW', 'LW'],
  RW: ['RW', 'RM', 'LW', 'CAM', 'ST', 'CF'],
};

function mapPosition(positionId, usualPosId) {
  return POSITION_ID_MAP[positionId] || USUAL_POS_FALLBACK[usualPosId] || 'CM';
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

function buildSquadLineup(squadGroups) {
  if (!Array.isArray(squadGroups) || squadGroups.length === 0) return null;

  const seen = new Set();
  const roster = squadGroups
    .flatMap((group) => group?.members || [])
    .filter((member) => member?.name && member?.role !== 'coach')
    .map(normalizePlayer)
    .filter((player) => {
      const key = player.fotmobId || player.name;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

  if (roster.length === 0) return null;

  const remaining = [...roster];

  return FALLBACK_SLOTS.map((slot, index) => {
    const preferredPositions = SLOT_PREFERENCES[slot] || [slot];
    let playerIndex = remaining.findIndex((player) =>
      preferredPositions.includes(player.position)
    );

    if (playerIndex === -1 && slot === 'GK') {
      playerIndex = remaining.findIndex((player) => player.position === 'GK');
    }

    if (playerIndex === -1) {
      playerIndex = remaining.findIndex((player) => player.position !== 'GK' || slot === 'GK');
    }

    const picked =
      playerIndex === -1
        ? normalizePlayer(null, index)
        : remaining.splice(playerIndex, 1)[0];

    return {
      fotmobId: picked.fotmobId,
      name: picked.name,
      number: picked.number,
      position: picked.position || slot,
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
      formation = lastLineup.formation || formation;
      players = lastLineup.starters.map((player, index) => ({
        fotmobId: player?.id || null,
        name: player?.name || `Jogador ${index + 1}`,
        number: Number.parseInt(player?.shirtNumber, 10) || index + 1,
        position: mapPosition(player?.positionId, player?.usualPlayingPositionId),
      }));
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
