/**
 * One-time script: clears test ScheduledMessages and imports today's
 * real @getmanfred offers (post #2945, March 19 2026).
 *
 * Run with:
 *   npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/import-today.ts
 */

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as dotenv from 'dotenv';
dotenv.config();

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter } as never);

async function main() {
  // ── 1) Delete all existing ScheduledMessages ─────────────────────────────
  const deletedMsgs = await prisma.scheduledMessage.deleteMany({});
  console.log(`Deleted ${deletedMsgs.count} scheduled messages`);

  // ── 2) Delete the 5 offers created by mistake in the previous import ──────
  const deletedOffers = await prisma.offer.deleteMany({
    where: {
      shortUrl: {
        in: [
          'https://mnfrd.co/4sQF1AD',
          'https://mnfrd.co/4uFpWUm',
          'https://mnfrd.co/4shq76E',
          'https://mnfrd.co/4bqX7lt',
          'https://mnfrd.co/4snDQZI',
        ],
      },
    },
  });
  console.log(`Deleted ${deletedOffers.count} erroneously created offers`);

  // ── 3) Create ScheduledMessage with inline offersSnapshot ─────────────────
  // Offer data stored as a snapshot — NOT in the Offer table, so it won't
  // appear in the generator pool.
  const offersSnapshot = JSON.stringify([
    { id: 'snap-1', title: '.Net Developer',          company: 'I NEED TOURS',    salary: '38-45K',       shortUrl: 'https://mnfrd.co/4sQF1AD' },
    { id: 'snap-2', title: 'Senior Backend Engineer', company: 'DualEntry',        salary: 'Up to $175K',  shortUrl: 'https://mnfrd.co/4uFpWUm' },
    { id: 'snap-3', title: 'Senior Frontend Engineer',company: 'JOIN',             salary: 'Up to €80K',   shortUrl: 'https://mnfrd.co/4shq76E' },
    { id: 'snap-4', title: 'PHP Developer',           company: 'PrimeIT España',   salary: 'Up to €40K',   shortUrl: 'https://mnfrd.co/4bqX7lt' },
    { id: 'snap-5', title: 'Data Engineer',           company: 'Mática Partners',  salary: 'Up to €32K',   shortUrl: 'https://mnfrd.co/4snDQZI' },
  ]);

  const msg = await prisma.scheduledMessage.create({
    data: {
      message: 'Manfred Daily - 19 marzo 2026',
      offersSnapshot,
      status: 'sent',
      sentAt: new Date('2026-03-19T09:30:00.000Z'), // 10:30 CET
      telegramId: '2945',
    },
  });
  console.log(`Created ScheduledMessage id=${msg.id}, telegramId=2945`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
