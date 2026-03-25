const API_BASE = 'https://v3.football.api-sports.io';

export default async function handler(req, res) {
  const { q } = req.query;

  if (!q || q.length < 3) {
    return res.status(400).json({ error: 'Busca deve ter pelo menos 3 caracteres.' });
  }

  const apiKey = process.env.API_FOOTBALL_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key não configurada no servidor.' });
  }

  try {
    const response = await fetch(`${API_BASE}/teams?search=${encodeURIComponent(q)}`, {
      headers: { 'x-apisports-key': apiKey },
    });

    if (!response.ok) {
      if (response.status === 429) {
        return res.status(429).json({ error: 'Limite de requisições atingido. Tente novamente mais tarde.' });
      }
      return res.status(502).json({ error: 'Erro ao consultar API externa.' });
    }

    const data = await response.json();
    const results = (data.response || []).slice(0, 10).map((item) => ({
      id: item.team.id,
      name: item.team.name,
      logo: item.team.logo,
      country: item.team.country,
    }));

    res.setHeader('Cache-Control', 'public, s-maxage=43200, stale-while-revalidate=86400');
    return res.status(200).json({ results });
  } catch (err) {
    return res.status(502).json({ error: 'Erro de conexão com a API externa.' });
  }
}
