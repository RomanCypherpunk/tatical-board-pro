export function normalizeFotmobId(value) {
  if (value === null || value === undefined) return null;

  const text = String(value).trim();
  if (!text) return null;

  const match = text.match(/(?:players\/)?(\d{3,})/i);
  if (match) return match[1];

  return /^\d+$/.test(text) ? text : null;
}

export function buildFotmobPlayerPhotoPath(value) {
  const fotmobId = normalizeFotmobId(value);
  return fotmobId ? `/api/player-image?playerId=${fotmobId}` : null;
}

export function buildFotmobPlayerPhotoUrl(value) {
  const path = buildFotmobPlayerPhotoPath(value);
  if (!path) return null;

  if (typeof window === 'undefined') return path;
  return new URL(path, window.location.origin).toString();
}
