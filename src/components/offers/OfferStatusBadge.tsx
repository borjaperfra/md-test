import { Badge } from '@/components/ui/Badge';
import { OfferStatus } from '@/lib/types';

const variantMap = {
  pending: 'gray',
  selected: 'indigo',
  discarded: 'red',
} as const;

const labelMap: Record<OfferStatus, string> = {
  pending: 'Pending',
  selected: 'Selected',
  discarded: 'Discarded',
};

export function OfferStatusBadge({ status }: { status: OfferStatus }) {
  return <Badge variant={variantMap[status]}>{labelMap[status]}</Badge>;
}
