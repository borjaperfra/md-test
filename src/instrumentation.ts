export async function register() {
  // Only run in Node.js runtime (not Edge), and only once
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  const cronHeaders = { 'x-cron-secret': process.env.CRON_SECRET ?? '' };

  // Returns current hour and minute in Europe/Madrid timezone
  const getMadridTime = () => {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/Madrid', hour: 'numeric', minute: 'numeric', hour12: false,
    }).formatToParts(new Date());
    const h = Number(parts.find((p) => p.type === 'hour')?.value ?? 0);
    const m = Number(parts.find((p) => p.type === 'minute')?.value ?? 0);
    return { h, m };
  };

  // Snapshot fire times (h:m in Madrid): 23:00, 23:30, 23:55
  const SNAPSHOT_TIMES = [
    { h: 23, m: 0 },
    { h: 23, m: 30 },
    { h: 23, m: 55 },
  ];
  const snapshotFired = new Set<string>();

  const tick = async () => {
    try {
      await fetch(`${appUrl}/api/telegram/cron`, { method: 'POST', headers: cronHeaders });
    } catch (err) {
      console.error('[cron] Error calling cron endpoint:', err);
    }

    // Fire snapshot at designated times (once per key per day)
    const { h, m } = getMadridTime();
    for (const t of SNAPSHOT_TIMES) {
      if (h === t.h && m === t.m) {
        const key = `${new Date().toISOString().slice(0, 10)}-${t.h}:${t.m}`;
        if (!snapshotFired.has(key)) {
          snapshotFired.add(key);
          fetch(`${appUrl}/api/telegram/snapshot`, { method: 'POST', headers: cronHeaders })
            .then(() => console.log(`[snapshot] Triggered at Madrid ${t.h}:${String(t.m).padStart(2, '0')}`))
            .catch((err) => console.error('[snapshot] Error:', err));
        }
      }
    }
  };

  // Align to the next full minute, then repeat every 60s
  const msUntilNextMinute = (60 - new Date().getSeconds()) * 1000 - new Date().getMilliseconds();
  setTimeout(() => {
    tick();
    setInterval(tick, 60_000);
  }, msUntilNextMinute);

  console.log('[cron] Telegram scheduler started (every minute)');
}
