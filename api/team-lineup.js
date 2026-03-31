const FOTMOB_BASE = 'https://www.fotmob.com/api';

const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  Accept: '*/*',
  'Accept-Language': 'en-US,en;q=0.9,pt-BR;q=0.8',
  Referer: 'https://www.fotmob.com/',
  Origin: 'https://www.fotmob.com',
};

/** FotMob positionId → tactical abbreviation */
const POSITION_ID_MAP = {
  11: 'GK',
  31: 'RWB', 32: 'RB',
  33: 'CB', 34: 'CB', 35: 'CB', 36: 'CB', 37: 'CB',
  38: 'LB', 39: 'LWB',
  60: 'CDM', 61: 'CDM', 62: 'CDM', 63: 'CDM', 64: 'CDM', 65: 'CDM', 66: 'CDM', 67: 'CDM',
  74: 'CM', 75: 'CM', 76: 'CM', 77: 'CM', 78: 'CM',
  80: 'LW', 81: 'RW', 82: 'CAM', 83: 'LM', 84: 'RM', 85: 'CAM', 86: 'CAM', 87: 'RM',
  100: 'CF', 101: 'CF', 102: 'CF',
  110: 'ST', 111: 'ST', 112: 'ST', 113: 'SS', 114: 'CF', 115: 'ST', 116: 'ST',
};

const USUAL_POS_FALLBACK = { 0: 'GK', 1: 'CB', 2: 'CM', 3: 'ST' };

function mapPosition(positionId, usualPosId) {
  return POSITION_ID_MAP[positionId] || USUAL_POS_FALLBACK[usualPosId] || 'CM';
}

/** Normalize any color format to #RRGGBB */
function ensureHash(color) {
  if (!color) return null;
  color = String(color).trim();
  // Handle rgba(r, g, b, a) or rgb(r, g, b)
  const rgbaMatch = color.match(/rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
  if (rgbaMatch) {
    const hex = [rgbaMatch[1], rgbaMatch[2], rgbaMatch[3]]
      .map((n) => parseInt(n, 10).toString(16).padStart(2, '0'))
      .join('');
    return `#${hex}`;
  }
  const hexMatch = color.match(/#([0-9a-fA-F]{3,8})/);
  if (hexMatch) return `#${hexMatch[1]}`;
  if (/^[0-9a-fA-F]{6}$/.test(color)) return `#${color}`;
  return color;
}

/**
 * Build 11 players from squad groups (fallback for national teams or
 * teams whose lastLineupStats is unavailable).
 * Returns null if squad data is insufficient.
 */
function buildSquadLineup(squadData) {
  if (!Array.isArray(squadData) || squadData.length === 0) return null;

  let keepers = [], defenders = [], midfielders = [], forwards = [];

  for (const group of squadData) {
    const t = (group.title || '').toLowerCase();
    if (t.includes('keep') || t.includes('goalie') || t.includes('goleiro') || t.includes('portero')) {
      keepers = group.members || [];
    } else if (t.includes('defend') || t.includes('lateral') || t.includes('zugueiro') || t.includes('back')) {
      defenders = group.members || [];
    } else if (t.includes('mid') || t.includes('meio') || t.includes('volante') || t.includes('centrocam')) {
      midfielders = group.members || [];
    } else if (t.includes('forward') || t.includes('attack') || t.includes('atacan') || t.includes('ponta') || t.includes('striker') || t.includes('winger')) {
      forwards = group.members || [];
    }
  }

  if (keepers.length === 0 && defenders.length === 0) return null;

  // Default 4-3-3 positions for squad fallback
  const squadPositions = ['GK', 'RB', 'CB', 'CB', 'LB', 'CM', 'CM', 'CM', 'RW', 'ST', 'LW'];

  const pool = [
    ...keepers.slice(0, 1),
    ...defenders.slice(0, 4),
    ...midfielders.slice(0, 3),
    ...forwards.slice(0, 3),
  ];

  // Pad if a group was short
  let padIdx = 0;
  const allMembers = [...keepers, ...defenders, ...midfielders, ...forwards];
  while (pool.length < 11 && padIdx < allMembers.length) {
    if (!pool.includes(allMembers[padIdx])) pool.push(allMembers[padIdx]);
    padIdx++;
  }

  return pool.slice(0, 11).map((p, i) => ({
    fotmobId: p.id || null,
    name: p.name || `Jogador ${i + 1}`,
    number: parseInt(p.shirtNumber || p.shirt, 10) || i + 1,
    position: squadPositions[i] || 'CM',
  }));
}

export default async function handler(req, res) {
  const { teamId } = req.query;

  if (!teamId) {
    return res.status(400).json({ error: 'teamId e obrigatorio.' });
  }

  try {
    // Single API call — /api/data/teams has colors, squad AND last lineup
    const teamRes = await fetch(
      `${FOTMOB_BASE}/data/teams?id=${teamId}`,
      { headers: HEADERS }
    );

    if (!teamRes.ok) {
      throw new Error(`FotMob retornou status ${teamRes.status}`);
    }

    const teamData = await teamRes.json();

    // ── Team identity ──
    const teamName = teamData?.details?.name || 'Desconhecido';
    const shortName =
      teamData?.details?.shortName ||
      teamName
        .replace(/^(FC|CF|SC|AC|AS|RC|CA|SE|CR|CD|UD|RCD|SD|US)\s+/i, '')
        .slice(0, 3)
        .toUpperCase();
    const logo = `https://images.fotmob.com/image_resources/logo/teamlogo/${teamId}.png`;

    // ── Colors ──
    const teamColors = teamData?.overview?.teamColors || {};
    const primaryColor =
      ensureHash(teamColors?.darkMode) || '#E63946';
    const secondaryColor =
      ensureHash(teamColors?.fontDarkMode) || '#FFFFFF';
    const numberColor = secondaryColor;

    // ── Last lineup (formation + starters) ──
    const lastLineup = teamData?.overview?.lastLineupStats;
    let formation, players, isSquadFallback;

    if (lastLineup && lastLineup.starters && lastLineup.starters.length > 0) {
      // Primary path: real lineup from last match
      isSquadFallback = false;
      formation = lastLineup.formation || '4-3-3';
      players = lastLineup.starters.map((p) => ({
        fotmobId: p.id || null,
        name: p.name || 'Desconhecido',
        number: parseInt(p.shirtNumber, 10) || 0,
        position: mapPosition(p.positionId, p.usualPlayingPositionId),
      }));
    } else {
      // Fallback: build 11 from squad groups (national teams / no recent match)
      const squadLineup = buildSquadLineup(teamData?.squad?.squad);
      if (!squadLineup) {
        return res.status(404).json({
          error: 'Escalacao nao disponivel para este time.',
          team: { name: teamName, shortName, logo },
        });
      }
      isSquadFallback = true;
      formation = '4-3-3';
      players = squadLineup;
    }

    // ── Last match info (only for real lineup) ──
    const lastMatch = !isSquadFallback ? teamData?.overview?.lastMatch : null;
    let fixtureDate = '';
    let homeTeamName = '';
    let awayTeamName = '';
    let scoreStr = '';

    if (lastMatch) {
      fixtureDate = lastMatch.status?.utcTime?.slice(0, 10) || '';
      homeTeamName = lastMatch.home?.name || '';
      awayTeamName = lastMatch.away?.name || '';
      const homeScore = lastMatch.home?.score ?? '?';
      const awayScore = lastMatch.away?.score ?? '?';
      scoreStr = `${homeScore}-${awayScore}`;
    }

    const result = {
      team: {
        name: teamName,
        shortName,
        primaryColor,
        secondaryColor,
        numberColor,
        formation,
        logo,
      },
      players,
      fixture: isSquadFallback ? null : {
        id: String(lastMatch?.id || ''),
        date: fixtureDate,
        home: homeTeamName,
        away: awayTeamName,
        score: scoreStr,
      },
    };

    res.setHeader('Cache-Control', 'public, s-maxage=21600, stale-while-revalidate=43200');
    return res.status(200).json(result);
  } catch (err) {
    return res.status(502).json({
      error: err.message || 'Erro ao consultar FotMob.',
    });
  }
}
