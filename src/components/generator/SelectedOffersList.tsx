import { Offer } from '@/lib/types';
import { OfferTypeIcon } from '@/components/offers/OfferTypeIcon';
import { formatSalary } from '@/lib/utils';

interface SelectedOffersListProps {
  offers: Offer[];
}

export function SelectedOffersList({ offers }: SelectedOffersListProps) {
  if (offers.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 p-6 text-center text-sm text-gray-400">
        No offers selected. Go to the Pool to select up to 5 offers.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {offers.map((offer, i) => (
        <div
          key={offer.id}
          className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm"
        >
          <span className="text-xs font-medium text-gray-400 w-5">{i + 1}.</span>
          <OfferTypeIcon offer={offer} />
          <div className="flex-1 min-w-0">
            <span className="font-medium text-gray-900">{offer.title}</span>
            <span className="text-gray-500"> @ {offer.company}</span>
          </div>
          <div className="text-xs text-gray-400">
            {offer.modality} · {formatSalary(offer.salary)}
          </div>
        </div>
      ))}
    </div>
  );
}
