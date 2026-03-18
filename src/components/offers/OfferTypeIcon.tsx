import { Offer } from '@/lib/types';
import { parseSalary } from '@/lib/parseSalary';

interface OfferTypeIconProps {
  offer: Offer;
}

export function OfferTypeIcon({ offer }: OfferTypeIconProps) {
  const typeIcon = offer.type === 'manfred' ? 'Ⓜ️' : offer.type === 'client' ? '👀' : null;
  const isHot = offer.type !== 'manfred' && parseSalary(offer.salary) >= 80000;

  if (!typeIcon && !isHot) return null;

  return (
    <span className="flex items-center gap-0.5" title={offer.type}>
      {typeIcon && <span>{typeIcon}</span>}
      {isHot && <span title="≥80K">🌶️</span>}
    </span>
  );
}
