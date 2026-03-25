const API_BASE = 'https://v3.football.api-sports.io';

/**
 * Slot templates for 4-3-3 formation (default).
 * Used to assign positions to squad players.
 */
const SLOTS_433 = [
  { pos: 'GK', group: 'Goalkeeper' },
  { pos: 'LB', group: 'Defender' },
  { pos: 'CB', group: 'Defender' },
  { pos: 'CB', group: 'Defender' },
  { pos: 'RB', group: 'Defender' },
  { pos: 'CM', group: 'Midfielder' },
  { pos: 'CM', group: 'Midfielder' },
  { pos: 'CM', group: 'Midfielder' },
  { pos: 'LW', group: 'Attacker' },
  { pos: 'ST', group: 'Attacker' },
  { pos: 'RW', group: 'Attacker' },
];

/**
 * Map API-Football position strings to our group keys.
 */
function normalizeGroup(apiPosition) {
  if (!apiPosition) return 'Midfielder';
  const p = apiPosition.toLowerCase();
  if (p.includes('goal')) return 'Goalkeeper';
  if (p.includes('def')) return 'Defender';
  if (p.includes('mid')) return 'Midfielder';
  if (p.includes('att') || p.includes('for')) return 'Attacker';
  return 'Midfielder';
}

async function apiFetch(path, apiKey) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'x-apisports-key': apiKey },
  });
  if (!res.ok) {
    const err = new Error(`API-Football HTTP ${res.status}`);
    err.status = res.status;
    throw err;
  }
  const data = await res.json();
  if (data.errors && Object.keys(data.errors).length > 0) {
    const msg = Object.values(data.errors).join('; ');
    const err = new Error(msg);
    err.status = 403;
    throw err;
  }
  return data;
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
    // Fetch full squad — available on free plan
    const squadData = await apiFetch(`/players/squads?team=${teamId}`, apiKey);
    const squads = squadData.response;

    if (!squads || squads.length === 0 || !squads[0].players?.length) {
      return res.status(404).json({ error: 'Elenco não encontrado para esse time.' });
    }

    const allPlayers = squads[0].players;

    // Group players by position
    const groups = {
      Goalkeeper: [],
      Defender: [],
      Midfielder: [],
      Attacker: [],
    };

    for (const p of allPlayers) {
      const g = normalizeGroup(p.position);
      groups[g].push(p);
    }

    // Pick 11 starters based on 4-3-3 slot template
    const picked = [];
    const used = new Set();

    for (const slot of SLOTS_433) {
      const pool = groups[slot.group];
      const player = pool.find((p) => !used.has(p.id));
      if (player) {
        used.add(player.id);
        picked.push({
          name: player.name,
          number: player.number || 0,
          position: slot.pos,
        });
      } else {
        // Fallback: pick any unused player
        const fallback = allPlayers.find((p) => !used.has(p.id));
        if (fallback) {
          used.add(fallback.id);
          picked.push({
            name: fallback.name,
            number: fallback.number || 0,
            position: slot.pos,
          });
        }
      }
    }

    // Build short name
    const teamName = squads[0].team?.name || 'Time';
    const shortName = teamName
      .replace(/^(FC|CF|SC|AC|AS|RC|CA|SE|CR|CD|UD|RCD|SD|US)\s+/i, '')
      .slice(0, 3)
      .toUpperCase();

    res.setHeader('Cache-Control', 'public, s-maxage=43200, stale-while-revalidate=86400');
    return res.status(200).json({
      team: {
        name: teamName,
        shortName,
        primaryColor: null,
        secondaryColor: null,
        numberColor: null,
        formation: '4-3-3',
        logo: squads[0].team?.logo || null,
      },
      players: picked,
      fixture: null,
    });
  } catch (err) {
    if (err.status === 429) {
      return res.status(429).json({ error: 'Limite de requisições atingido. Tente novamente mais tarde.' });
    }
    return res.status(502).json({ error: err.message || 'Erro ao consultar API externa.' });
  }
}
