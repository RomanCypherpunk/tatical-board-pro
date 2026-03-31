export default async function handler(req, res) {
  const { playerId } = req.query;

  if (!playerId) {
    return res.status(400).json({ error: 'playerId e obrigatorio.' });
  }

  try {
    const upstream = await fetch(
      `https://images.fotmob.com/image_resources/playerimages/${encodeURIComponent(playerId)}.png`,
      {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
          Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
          Referer: 'https://www.fotmob.com/',
        },
      }
    );

    if (!upstream.ok) {
      return res.status(upstream.status).end();
    }

    const arrayBuffer = await upstream.arrayBuffer();

    res.setHeader(
      'Cache-Control',
      'public, s-maxage=86400, stale-while-revalidate=604800'
    );
    res.setHeader('Content-Type', upstream.headers.get('content-type') || 'image/png');
    return res.status(200).send(Buffer.from(arrayBuffer));
  } catch {
    return res.status(502).json({ error: 'Nao foi possivel carregar a foto do jogador.' });
  }
}
