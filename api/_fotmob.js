export const FOTMOB_BASE = 'https://www.fotmob.com/api';

const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  Accept: '*/*',
  'Accept-Language': 'en-US,en;q=0.9,pt-BR;q=0.8',
  Referer: 'https://www.fotmob.com/',
  Origin: 'https://www.fotmob.com',
};

const TOKEN_PROXY = 'http://46.101.91.154:6006/';

export async function fotmobFetch(path, extraHeaders = {}) {
  const url = `${FOTMOB_BASE}${path}`;

  let response = await fetch(url, {
    headers: { ...HEADERS, ...extraHeaders },
  });

  if (response.status === 403) {
    try {
      const tokenResponse = await fetch(TOKEN_PROXY, {
        signal: AbortSignal.timeout(4000),
      });
      const tokenData = await tokenResponse.json();

      if (tokenData['x-mas']) {
        response = await fetch(url, {
          headers: {
            ...HEADERS,
            ...extraHeaders,
            'x-mas': tokenData['x-mas'],
          },
        });
      }
    } catch {
      // Keep the original response when the proxy is unavailable.
    }
  }

  if (!response.ok) {
    throw new Error(`FotMob retornou status ${response.status}`);
  }

  return response;
}

export async function fotmobFetchJson(path, extraHeaders = {}) {
  const response = await fotmobFetch(path, extraHeaders);
  return response.json();
}

function sanitizeToken(value) {
  return String(value || '')
    .trim()
    .replace(/[^A-Za-z0-9]/g, '')
    .toUpperCase();
}

export function buildShortName(name, preferred) {
  const sanitizedPreferred = sanitizeToken(preferred);
  if (sanitizedPreferred.length >= 2 && sanitizedPreferred.length <= 4) {
    return sanitizedPreferred;
  }

  const words = String(name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (words.length > 1) {
    return words
      .slice(0, 3)
      .map((word) => sanitizeToken(word).slice(0, 1))
      .join('')
      .slice(0, 4)
      .toUpperCase();
  }

  const compact = sanitizeToken(name);
  return compact.slice(0, 3) || 'CLB';
}
