'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Offer } from '@/lib/types';
import { useOfferPool } from '@/context/OfferPoolContext';
import { GripVertical, X } from 'lucide-react';
import { OfferTypeIcon } from './OfferTypeIcon';
import { cn } from '@/lib/utils';

interface SortableOfferCardProps {
  offer: Offer;
  index: number;
}

export function SortableOfferCard({ offer, index }: SortableOfferCardProps) {
  const { toggleSelect } = useOfferPool();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: offer.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm',
        isDragging && 'opacity-50 shadow-md'
      )}
    >
      <span className="text-xs text-gray-400 w-4 shrink-0">{index + 1}</span>
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab text-gray-300 hover:text-gray-500 active:cursor-grabbing"
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <OfferTypeIcon offer={offer} />
      <div className="flex-1 min-w-0">
        <p className="truncate font-medium text-gray-900">{offer.title}</p>
        <p className="truncate text-xs text-gray-500">{offer.company}</p>
      </div>
      <button
        onClick={() => toggleSelect(offer.id)}
        className="text-gray-300 hover:text-red-500 transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export function EmptySlot({ index }: { index: number }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-dashed border-gray-200 px-3 py-2 text-sm text-gray-400">
      <span className="text-xs w-4 shrink-0">{index + 1}</span>
      <span>Empty slot</span>
    </div>
  );
}
