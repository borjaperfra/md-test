function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const config = {
  get databaseUrl() {
    return requireEnv('DATABASE_URL');
  },
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
  telegramBotToken: process.env.TELEGRAM_BOT_TOKEN ?? '',
  telegramChannelId: process.env.TELEGRAM_CHANNEL_ID ?? '',
  bitlyApiKey: process.env.BITLY_API_KEY ?? '',
  anthropicApiKey: process.env.ANTHROPIC_API_KEY ?? '',
};
