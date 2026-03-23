// Parses a Telegram view count string like "2.75K", "1.2M", "423" → number
function parseViewCount(raw: string): number {
  const s = raw.trim();
  if (s.endsWith('K')) return Math.round(parseFloat(s) * 1_000);
  if (s.endsWith('M')) return Math.round(parseFloat(s) * 1_000_000);
  return parseInt(s, 10) || 0;
}

// Scrapes view count for a channel post from the public Telegram web preview.
// Works for public channels without any authentication.
export async function getMessageViews(telegramMessageId: string): Promise<number | null> {
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!chatId || !telegramMessageId) return null;

  // Strip leading @ to build the URL
  const channelName = chatId.replace(/^@/, '');

  try {
    const res = await fetch(
      `https://t.me/s/${channelName}/${telegramMessageId}`,
      { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' } }
    );
    if (!res.ok) return null;

    const html = await res.text();
    const match = html.match(/class="tgme_widget_message_views">([^<]+)</);
    if (!match) return null;

    return parseViewCount(match[1]);
  } catch {
    return null;
  }
}

export async function getChannelMemberCount(): Promise<number | null> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return null;
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/getChatMemberCount?chat_id=${encodeURIComponent(chatId)}`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.ok ? (data.result as number) : null;
  } catch {
    return null;
  }
}

export async function deleteTelegramMessage(messageId: string): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return false;
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/deleteMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, message_id: Number(messageId) }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function sendTelegramMessage(text: string): Promise<string> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) throw new Error('TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID not set');

  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, disable_web_page_preview: true }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.description ?? `Telegram error ${res.status}`);
  }

  const data = await res.json();
  return String(data.result.message_id);
}
