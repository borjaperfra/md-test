import { PageHeader } from '@/components/layout/PageHeader';
import { AnalyticsClient } from './AnalyticsClient';

export const dynamic = 'force-dynamic';

export default function AnalyticsPage() {
  return (
    <div className="flex h-full flex-col">
      <PageHeader title="Analítica" />
      <div className="flex-1 overflow-hidden">
        <AnalyticsClient />
      </div>
    </div>
  );
}
