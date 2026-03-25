const API_BASE = 'https://v3.football.api-sports.io';

/**
 * Position mapping — same logic as src/data/gridPositionMap.js
 * duplicated here because serverless functions can't import from src/.
 */
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

function mapGridToPosition(formation, row, col) {
  if (row === 1) return 'GK';
  const layers = formation.split('-').map(Number);
  const layerIndex = row - 2;
  if (layerIndex < 0 || layerIndex >= layers.length) return 'CM';
  const count = layers[layerIndex];
  const colIdx = col - 1;
  const totalLayers = layers.length;
  const isDefense = layerIndex === 0;
  const isAttack = layerIndex === totalLayers - 1;

  let map;
  if (isDefense) map = DEFENSE_MAPS[count];
  else if (isAttack) map = ATTACK_MAPS[count];
  else if (layerIndex === totalLayers - 2 && totalLayers >= 3)
    map = ATTACK_MID_MAPS[count] || MIDFIELD_MAPS[count];
  else map = MIDFIELD_MAPS[count];

  if (!map) return 'CM';
  return map[Math.min(colIdx, map.length - 1)] || 'CM';
}

async function apiFetch(path, apiKey) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'x-apisports-key': apiKey },
  });
  if (!res.ok) {
    const err = new Error(`API-Football ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

export default async function handler(req, res) {
  const { teamId } = req.query;

  if (!teamId || isNaN(Number(teamId))) {
    return res.status(400).json({ error: 'teamId inválido.' });
  }

  const apiKey = process.env.API_FOOTBALL_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key não configurada no servidor.' });
  }

  try {
    // Step 1 — get last fixture for this team
    const fixturesData = await apiFetch(`/fixtures?team=${teamId}&last=1`, apiKey);
    const fixtures = fixturesData.response;
    if (!fixtures || fixtures.length === 0) {
      return res.status(404).json({ error: 'Nenhuma partida recente encontrada para esse time.' });
    }

    const fixture = fixtures[0];
    const fixtureId = fixture.fixture.id;
    const isHome = fixture.teams.home.id === Number(teamId);
    const teamInfo = isHome ? fixture.teams.home : fixture.teams.away;
    const opponentInfo = isHome ? fixture.teams.away : fixture.teams.home;

    // Step 2 — get lineups for that fixture
    const lineupsData = await apiFetch(`/fixtures/lineups?fixture=${fixtureId}`, apiKey);
    const lineups = lineupsData.response;
    if (!lineups || lineups.length === 0) {
      return res.status(404).json({ error: 'Escalação não disponível para essa partida.' });
    }

    // Find the lineup for the requested team
    const teamLineup = lineups.find((l) => l.team.id === Number(teamId));
    if (!teamLineup) {
      return res.status(404).json({ error: 'Escalação do time não encontrada nessa partida.' });
    }

    const formation = teamLineup.formation || '4-3-3';
    const colors = teamLineup.team.colors || {};

    // Normalize colors (API returns without #)
    const primaryColor = colors.player?.primary ? `#${colors.player.primary}` : '#E63946';
    const numberColor = colors.player?.number ? `#${colors.player.number}` : '#FFFFFF';
    const secondaryColor = colors.player?.border ? `#${colors.player.border}` : '#FFFFFF';

    // Build short name from team name (first 3 uppercase chars)
    const shortName = teamInfo.name
      .replace(/^(FC|CF|SC|AC|AS|RC|CA|SE|CR|CD|UD|RCD|SD|US)\s+/i, '')
      .slice(0, 3)
      .toUpperCase();

    // Normalize players
    const startXI = teamLineup.startXI || [];
    const players = startXI.map((entry) => {
      const p = entry.player;
      const grid = p.grid || '1:1';
      const [gridRow, gridCol] = grid.split(':').map(Number);
      const position = mapGridToPosition(formation, gridRow, gridCol);
      return {
        name: p.name,
        number: p.number || 0,
        position,
      };
    });

    // Build fixture info
    const homeScore = fixture.goals?.home ?? '?';
    const awayScore = fixture.goals?.away ?? '?';
    const fixtureDate = fixture.fixture.date
      ? fixture.fixture.date.slice(0, 10)
      : null;

    res.setHeader('Cache-Control', 'public, s-maxage=21600, stale-while-revalidate=43200');
    return res.status(200).json({
      team: {
        name: teamInfo.name,
        shortName,
        primaryColor,
        secondaryColor,
        numberColor,
        formation,
        logo: teamInfo.logo,
      },
      players,
      fixture: {
        id: fixtureId,
        date: fixtureDate,
        home: fixture.teams.home.name,
        away: fixture.teams.away.name,
        score: `${homeScore}-${awayScore}`,
      },
    });
  } catch (err) {
    if (err.status === 429) {
      return res.status(429).json({ error: 'Limite de requisições atingido. Tente novamente mais tarde.' });
    }
    return res.status(502).json({ error: 'Erro ao consultar API externa.' });
  }
}
