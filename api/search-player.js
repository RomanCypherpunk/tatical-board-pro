import { fotmobFetchJson } from './_fotmob.js';

const POSITION_ALIASES = new Map([
  ['GK', 'GK'],
  ['GOALKEEPER', 'GK'],
  ['KEEPER', 'GK'],
  ['G', 'GK'],
  ['RB', 'RB'],
  ['RIGHT BACK', 'RB'],
  ['RIGHT-BACK', 'RB'],
  ['LB', 'LB'],
  ['LEFT BACK', 'LB'],
  ['LEFT-BACK', 'LB'],
  ['CB', 'CB'],
  ['CENTER BACK', 'CB'],
  ['CENTRE BACK', 'CB'],
  ['CENTER-BACK', 'CB'],
  ['CENTRE-BACK', 'CB'],
  ['DEFENDER', 'CB'],
  ['RWB', 'RWB'],
  ['RIGHT WING BACK', 'RWB'],
  ['RIGHT WING-BACK', 'RWB'],
  ['LWB', 'LWB'],
  ['LEFT WING BACK', 'LWB'],
  ['LEFT WING-BACK', 'LWB'],
  ['CDM', 'CDM'],
  ['DM', 'CDM'],
  ['DEFENSIVE MIDFIELDER', 'CDM'],
  ['MIDFIELDER', 'CM'],
  ['MIDFIELD', 'CM'],
  ['CM', 'CM'],
  ['M', 'CM'],
  ['CAM', 'CAM'],
  ['AM', 'CAM'],
  ['ATTACKING MIDFIELDER', 'CAM'],
  ['LM', 'LM'],
  ['LEFT MIDFIELDER', 'LM'],
  ['RM', 'RM'],
  ['RIGHT MIDFIELDER', 'RM'],
  ['LW', 'LW'],
  ['LEFT WINGER', 'LW'],
  ['RW', 'RW'],
  ['RIGHT WINGER', 'RW'],
  ['CF', 'CF'],
  ['CENTER FORWARD', 'CF'],
  ['CENTRE FORWARD', 'CF'],
  ['CENTER-FORWARD', 'CF'],
  ['CENTRE-FORWARD', 'CF'],
  ['SS', 'SS'],
  ['SECOND STRIKER', 'SS'],
  ['ST', 'ST'],
  ['STRIKER', 'ST'],
  ['FORWARD', 'ST'],
  ['ATTACKER', 'ST'],
  ['F', 'ST'],
]);

function normalizePosition(value) {
  const raw = String(value || '')
    .replace(/[._-]+/g, ' ')
    .trim()
    .toUpperCase();

  if (!raw) return null;
  if (POSITION_ALIASES.has(raw)) return POSITION_ALIASES.get(raw);

  for (const [alias, position] of POSITION_ALIASES.entries()) {
    if (raw.includes(alias)) return position;
  }

  return null;
}

function buildSubtitle(item) {
  const parts = [
    item.teamName,
    item.clubName,
    item.team?.name,
    item.currentTeamName,
    item.countryName,
    item.country,
    item.leagueName,
  ]
    .map((value) => String(value || '').trim())
    .filter(Boolean);

  return [...new Set(parts)].slice(0, 2).join(' • ');
}

function isPlayerSuggestion(item) {
  const type = String(item?.type || '').toLowerCase();
  const section = String(item?.__section || '').toLowerCase();

  if (type === 'player' || type === 'person') return true;
  if (type === 'team' || type === 'league') return false;

  return section.includes('player') || section.includes('person');
}

export default async function handler(req, res) {
  const { q } = req.query;

  if (!q || q.length < 2) {
    return res.status(400).json({ error: 'Busca deve ter pelo menos 2 caracteres.' });
  }

  try {
    const data = await fotmobFetchJson(
      `/data/search/suggest?term=${encodeURIComponent(q)}&hits=30&lang=en`
    );

    const suggestions = Array.isArray(data)
      ? data.flatMap((section) =>
          (section?.suggestions || []).map((item) => ({
            ...item,
            __section: section?.title || section?.type || '',
          }))
        )
      : (data?.suggestions || []).map((item) => ({
          ...item,
          __section: data?.title || data?.type || '',
        }));

    const players = suggestions
      .filter(isPlayerSuggestion)
      .reduce((acc, item) => {
        const fotmobId = item?.id ? String(item.id) : null;
        if (!fotmobId || acc.some((player) => player.fotmobId === fotmobId)) return acc;

        acc.push({
          fotmobId,
          name: item.name || '',
          number:
            Number.parseInt(item.shirtNumber || item.squadNumber || item.number, 10) || null,
          position:
            normalizePosition(
              item.positionStr ||
                item.position ||
                item.positionName ||
                item.role ||
                item.positionLabel
            ) || null,
          subtitle: buildSubtitle(item),
          photo: `/api/player-image?playerId=${fotmobId}`,
        });

        return acc;
      }, [])
      .slice(0, 12);

    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=7200');
    return res.status(200).json({ results: players });
  } catch (err) {
    return res
      .status(502)
      .json({ error: err.message || 'Erro ao buscar jogadores no FotMob.' });
  }
}
