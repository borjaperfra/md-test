import { prisma } from '@/lib/prisma';
import { GeneratorClient } from './GeneratorClient';
import { PageHeader } from '@/components/layout/PageHeader';
import { Offer } from '@/lib/types';
import { getTodayEnding } from '@/lib/getEnding';

export const dynamic = 'force-dynamic';

export default async function GeneratorPage() {
  const [selectedOffers, ending] = await Promise.all([
    prisma.offer.findMany({
      where: { status: 'selected' },
      orderBy: { order: 'asc' },
    }),
    Promise.resolve(getTodayEnding()),
  ]);

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Generador de Mensaje" />
      <GeneratorClient offers={selectedOffers as Offer[]} todayEnding={ending.main} />
    </div>
  );
}
