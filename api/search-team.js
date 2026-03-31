import { fotmobFetchJson } from './_fotmob.js';

function buildSubtitle(item) {
  if (item.leagueId === 0) return 'Selecao nacional';
  return item.leagueName || item.country || item.countryCode || item.ccode || '';
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
      ? data.flatMap((section) => section?.suggestions || [])
      : data?.suggestions || [];

    const teams = suggestions
      .filter((item) => item.type === 'team')
      .reduce((acc, item) => {
        if (acc.some((team) => team.id === String(item.id))) return acc;

        acc.push({
          id: String(item.id),
          name: item.name || '',
          logo: `https://images.fotmob.com/image_resources/logo/teamlogo/${item.id}.png`,
          country: buildSubtitle(item),
        });
        return acc;
      }, [])
      .slice(0, 12);

    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=7200');
    return res.status(200).json({ results: teams });
  } catch (err) {
    return res
      .status(502)
      .json({ error: err.message || 'Erro ao buscar times no FotMob.' });
  }
}
