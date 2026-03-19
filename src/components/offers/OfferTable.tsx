'use client';

import { Offer } from '@/lib/types';
import { useOfferPool } from '@/context/OfferPoolContext';
import { OfferRow } from './OfferRow';

interface OfferTableProps {
  offers: Offer[];
}

export function OfferTable({ offers }: OfferTableProps) {
  const { selectedIds, selectAll, clearSelection } = useOfferPool();
  const visible = offers.filter((o) => o.status !== 'discarded');
  const selectableIds = visible.map((o) => o.id);
  const allSelected = selectableIds.length > 0 && selectableIds.every((id) => selectedIds.includes(id));

  if (visible.length === 0) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-400">
        No offers yet. Add some offers to get started.
      </div>
    );
  }

  return (
    <div className="overflow-auto">
      <table className="w-full border-collapse">
        <thead className="sticky top-0 bg-white z-10">
          <tr className="border-b border-gray-200 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
            <th className="px-3 py-3 w-10">
              <input
                type="checkbox"
                title="Seleccionar todo"
                checked={allSelected}
                onChange={() => allSelected ? clearSelection() : selectAll()}
                className="h-4 w-4 cursor-pointer rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
            </th>
            <th className="px-3 py-3 w-8">Type</th>
            <th className="px-3 py-3">Title</th>
            <th className="px-3 py-3">Company</th>
            <th className="px-3 py-3">Category</th>
            <th className="px-3 py-3">Modality</th>
            <th className="px-3 py-3">Salary</th>
            <th className="px-3 py-3">URL</th>
            <th className="px-3 py-3">Status</th>
            <th className="px-3 py-3 w-10"></th>
          </tr>
        </thead>
        <tbody>
          {visible.map((offer) => (
            <OfferRow key={offer.id} offer={offer} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
