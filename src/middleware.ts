import { withAuth } from 'next-auth/middleware';

export default withAuth({
  pages: { signIn: '/login' },
});

export const config = {
  // Protect everything except: login page, NextAuth routes, cron/snapshot (protected by CRON_SECRET), static assets
  matcher: [
    '/((?!login|api/auth|api/telegram/cron|api/telegram/snapshot|_next/static|_next/image|favicon\\.ico|.*\\.png$).*)',
  ],
};
