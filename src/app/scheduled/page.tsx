import { prisma } from '@/lib/prisma';
import { ScheduledClient } from './ScheduledClient';
import { PageHeader } from '@/components/layout/PageHeader';

export const dynamic = 'force-dynamic';

export default async function ScheduledPage() {
  const messages = await prisma.scheduledMessage.findMany({
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Mensajes Programados" />
      <ScheduledClient messages={messages} />
    </div>
  );
}
