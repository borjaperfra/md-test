import { prisma } from '@/lib/prisma';
import { FeedbackList } from './FeedbackList';
import { PageHeader } from '@/components/layout/PageHeader';

export const dynamic = 'force-dynamic';

export default async function FeedbackPage() {
  const items = await prisma.feedback.findMany({ orderBy: { createdAt: 'desc' } });
  return (
    <div className="flex h-full flex-col">
      <PageHeader title="Feedback" />
      <FeedbackList initialItems={items} />
    </div>
  );
}
