import { prisma } from '@/lib/prisma';
import { OfferPoolClient } from './OfferPoolClient';
import { Offer } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function OffersPage() {
  const offers = await prisma.offer.findMany({
    where: { publishedAt: null },
    orderBy: { createdAt: 'desc' },
  });

  return <OfferPoolClient offers={offers as Offer[]} />;
}
