'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useOfferPool } from '@/context/OfferPoolContext';
import { SortableOfferCard, EmptySlot } from './SortableOfferCard';
import { Button } from '@/components/ui/Button';
import { Toast } from '@/components/ui/Toast';

export function SelectedOffersPanel() {
  const { offers, selectedIds, reorderSelected, suggestFiveOffers, clearSelection, persistSelection } =
    useOfferPool();
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const router = useRouter();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const selectedOffers = selectedIds
    .map((id) => offers.find((o) => o.id === id))
    .filter(Boolean) as typeof offers;

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const fromIndex = selectedIds.indexOf(String(active.id));
    const toIndex = selectedIds.indexOf(String(over.id));
    reorderSelected(fromIndex, toIndex);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await persistSelection(selectedIds);
      router.push('/generator');
    } catch {
      setToast('Error al guardar la selección');
      setSaving(false);
    }
  };

  const slots = Array.from({ length: 5 }, (_, i) => selectedOffers[i] ?? null);

  return (
    <div className="border-t border-gray-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-700">
          Selected ({selectedIds.length}/5)
        </h2>
        <div className="flex gap-2">
          {selectedIds.length > 0 && (
            <Button variant="ghost" size="sm" onClick={async () => {
              clearSelection();
              await persistSelection([]);
              router.refresh();
            }}>
              Limpiar
            </Button>
          )}
          <Button variant="secondary" size="sm" onClick={suggestFiveOffers}>
            Sugerir 5
          </Button>
          <Button size="sm" onClick={handleSave} loading={saving} disabled={selectedIds.length === 0}>
            Guardar selección
          </Button>
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={selectedIds}
          strategy={verticalListSortingStrategy}
        >
          <div className="flex flex-col gap-1.5">
            {slots.map((offer, i) =>
              offer ? (
                <SortableOfferCard key={offer.id} offer={offer} index={i} />
              ) : (
                <EmptySlot key={`empty-${i}`} index={i} />
              )
            )}
          </div>
        </SortableContext>
      </DndContext>

      {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}
    </div>
  );
}
