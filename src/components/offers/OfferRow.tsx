'use client';

import { useState } from 'react';
import { Offer, OfferStatus } from '@/lib/types';
import { useOfferPool } from '@/context/OfferPoolContext';
import { OfferTypeIcon } from './OfferTypeIcon';
import { OfferStatusBadge } from './OfferStatusBadge';
import { InlineEditCell } from './InlineEditCell';
import { formatSalary, cn } from '@/lib/utils';
import { Trash2, ExternalLink } from 'lucide-react';

interface OfferRowProps {
  offer: Offer;
}

type EditableField = 'title' | 'company' | 'type' | 'modality' | 'salary' | 'url' | 'status';

const typeOptions = [
  { value: 'manfred', label: 'Manfred' },
  { value: 'client', label: 'Client (👀)' },
  { value: 'external', label: 'External' },
];

const modalityOptions = [
  { value: 'remote', label: 'Remote' },
  { value: 'hybrid', label: 'Hybrid' },
  { value: 'onsite', label: 'On-site' },
];

function rowBg(offer: Offer, isSelected: boolean): string {
  if (isSelected) return 'bg-indigo-50';
  if (offer.type === 'client') return 'bg-blue-50';
  if (offer.type === 'manfred') return 'bg-yellow-50';
  return 'bg-white';
}

export function OfferRow({ offer }: OfferRowProps) {
  const { selectedIds, toggleSelect, updateOffer } = useOfferPool();
  const [editingField, setEditingField] = useState<EditableField | null>(null);
  const isSelected = selectedIds.includes(offer.id);

  const handleSave = async (field: EditableField, value: string) => {
    setEditingField(null);
    if (value === String(offer[field])) return;
    await updateOffer(offer.id, { [field]: value });
  };

  const handleDiscard = async () => {
    const newStatus: OfferStatus = offer.status === 'discarded' ? 'pending' : 'discarded';
    await updateOffer(offer.id, { status: newStatus });
  };

  const handleFreelanceToggle = async () => {
    await updateOffer(offer.id, { isFreelance: !offer.isFreelance });
  };

  const cell = (
    field: EditableField,
    displayValue: string,
    type: 'text' | 'select' = 'text',
    options?: { value: string; label: string }[]
  ) => {
    if (editingField === field) {
      return (
        <InlineEditCell
          value={String(offer[field] ?? '')}
          type={type}
          options={options}
          onSave={(v) => handleSave(field, v)}
          onCancel={() => setEditingField(null)}
        />
      );
    }
    return (
      <span
        className="cursor-pointer rounded px-1 hover:bg-white/60"
        onClick={() => setEditingField(field)}
      >
        {displayValue}
      </span>
    );
  };

  return (
    <tr
      className={cn(
        'border-b border-gray-100 text-sm transition-colors',
        rowBg(offer, isSelected),
        offer.status === 'discarded' && 'opacity-40'
      )}
    >
      <td className="px-3 py-2">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => toggleSelect(offer.id)}
          className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          disabled={!isSelected && selectedIds.length >= 5}
        />
      </td>
      <td className="px-3 py-2 text-center">
        <OfferTypeIcon offer={offer} />
      </td>
      <td className="px-3 py-2 min-w-[200px]">
        <div className="flex items-center gap-1.5">
          {cell('title', offer.title)}
          {offer.isFreelance && (
            <span className="shrink-0 rounded-full bg-purple-100 px-1.5 py-0.5 text-[10px] font-semibold text-purple-700">
              Freelance
            </span>
          )}
        </div>
      </td>
      <td className="px-3 py-2 min-w-[140px]">
        {cell('company', offer.company)}
      </td>
      <td className="px-3 py-2">
        {cell('type', offer.type, 'select', typeOptions)}
      </td>
      <td className="px-3 py-2">
        {cell('modality', offer.modality, 'select', modalityOptions)}
      </td>
      <td className="px-3 py-2 whitespace-nowrap">
        {cell('salary', formatSalary(offer.salary))}
      </td>
      <td className="px-3 py-2 max-w-[180px]">
        {editingField === 'url' ? (
          <InlineEditCell
            value={offer.url}
            type="text"
            onSave={(v) => handleSave('url', v)}
            onCancel={() => setEditingField(null)}
          />
        ) : (
          <div className="flex items-center gap-1 min-w-0">
            {offer.url ? (
              <a
                href={offer.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-indigo-500 hover:text-indigo-700 truncate text-xs"
                title={offer.url}
                onClick={(e) => e.stopPropagation()}
              >
                <ExternalLink className="h-3 w-3 shrink-0" />
                <span className="truncate">{new URL(offer.url).hostname.replace('www.', '')}</span>
              </a>
            ) : (
              <button
                className="text-xs text-gray-300 hover:text-gray-500"
                onClick={() => setEditingField('url')}
              >
                —
              </button>
            )}
          </div>
        )}
      </td>
      <td className="px-3 py-2">
        <OfferStatusBadge status={offer.status} />
      </td>
      <td className="px-3 py-2">
        <div className="flex items-center gap-2">
          <button
            onClick={handleFreelanceToggle}
            title={offer.isFreelance ? 'Mark as permanent' : 'Mark as freelance'}
            className={cn(
              'text-xs font-medium transition-colors',
              offer.isFreelance ? 'text-purple-500 hover:text-purple-700' : 'text-gray-300 hover:text-purple-400'
            )}
          >
            F
          </button>
          <button
            onClick={handleDiscard}
            title={offer.status === 'discarded' ? 'Restore' : 'Discard'}
            className="text-gray-300 hover:text-red-500 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}
