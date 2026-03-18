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
