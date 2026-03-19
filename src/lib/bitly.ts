export async function getClickCount(shortUrl: string): Promise<number> {
  const token = process.env.BITLY_API_KEY;
  if (!token) {
    console.warn('[bitly] BITLY_API_KEY not set');
    return 0;
  }
  try {
    const { hostname, pathname } = new URL(shortUrl);
    const bitlinkId = `${hostname}${pathname}`;
    const url = `https://api-ssl.bitly.com/v4/bitlinks/${encodeURIComponent(bitlinkId)}/clicks/summary?unit=day&units=-1`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) {
      const body = await res.text();
      console.error(`[bitly] ${res.status} for ${bitlinkId}:`, body);
      return 0;
    }
    const data = await res.json();
    return (data.total_clicks as number) ?? 0;
  } catch (err) {
    console.error('[bitly] fetch error for', shortUrl, err);
    return 0;
  }
}

export async function shortenUrl(url: string): Promise<string | null> {
  const token = process.env.BITLY_API_KEY;
  if (!token) return null;

  try {
    const res = await fetch('https://api-ssl.bitly.com/v4/shorten', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ long_url: url }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return (data.link as string) ?? null;
  } catch {
    return null;
  }
}
