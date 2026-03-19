'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import { Offer, OfferPatch } from '@/lib/types';
import { suggestFive } from '@/lib/suggestFive';

interface OfferPoolContextValue {
  offers: Offer[];
  selectedIds: string[];
  toggleSelect: (id: string) => void;
  reorderSelected: (fromIndex: number, toIndex: number) => void;
  updateOffer: (id: string, patch: OfferPatch) => Promise<void>;
  suggestFiveOffers: () => void;
  clearSelection: () => void;
  selectAll: () => void;
  persistSelection: (ids: string[]) => Promise<void>;
  addOffer: (offer: Offer) => void;
  addAndSelect: (offer: Offer) => void;
  clearAllOffers: () => Promise<void>;
  refreshPool: () => Promise<void>;
}

const OfferPoolContext = createContext<OfferPoolContextValue | null>(null);

export function OfferPoolProvider({
  children,
  initialOffers,
}: {
  children: ReactNode;
  initialOffers: Offer[];
}) {
  const [offers, setOffers] = useState<Offer[]>(initialOffers);
  const [selectedIds, setSelectedIds] = useState<string[]>(
    initialOffers
      .filter((o) => o.status === 'selected')
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      .map((o) => o.id)
  );

  const toggleSelect = useCallback(
    (id: string) => {
      setSelectedIds((prev) => {
        if (prev.includes(id)) {
          return prev.filter((i) => i !== id);
        }
        if (prev.length >= 5) return prev;
        return [...prev, id];
      });
    },
    []
  );

  const reorderSelected = useCallback(
    (fromIndex: number, toIndex: number) => {
      setSelectedIds((prev) => {
        const next = [...prev];
        const [moved] = next.splice(fromIndex, 1);
        next.splice(toIndex, 0, moved);
        return next;
      });
    },
    []
  );

  const updateOffer = useCallback(async (id: string, patch: OfferPatch) => {
    const res = await fetch(`/api/offers/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    });
    if (!res.ok) throw new Error('Failed to update offer');
    const updated: Offer = await res.json();
    setOffers((prev) => prev.map((o) => (o.id === id ? updated : o)));
  }, []);

  const suggestFiveOffers = useCallback(() => {
    const ids = suggestFive(offers);
    setSelectedIds(ids);
  }, [offers]);

  const clearSelection = useCallback(() => {
    setSelectedIds([]);
  }, []);

  const selectAll = useCallback(() => {
    setOffers((prev) => {
      const ids = prev.filter((o) => o.status !== 'discarded').map((o) => o.id);
      setSelectedIds(ids);
      return prev;
    });
  }, []);

  const addOffer = useCallback((offer: Offer) => {
    setOffers((prev) => [offer, ...prev]);
  }, []);

  const clearAllOffers = useCallback(async () => {
    await fetch('/api/offers', { method: 'DELETE' });
    setOffers([]);
    setSelectedIds([]);
  }, []);

  const refreshPool = useCallback(async () => {
    const res = await fetch('/api/offers');
    if (!res.ok) return;
    const fresh: Offer[] = await res.json();
    setOffers(fresh);
  }, []);

  const addAndSelect = useCallback((offer: Offer) => {
    setOffers((prev) => [offer, ...prev]);
    setSelectedIds((prev) => (prev.includes(offer.id) ? prev : [...prev, offer.id]));
  }, []);

  const persistSelection = useCallback(async (ids: string[]) => {
    const res = await fetch('/api/offers/select', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids }),
    });
    if (!res.ok) throw new Error('Failed to persist selection');
    const updated: Offer[] = await res.json();
    setOffers((prev) =>
      prev.map((o) => {
        const u = updated.find((u) => u.id === o.id);
        if (u) return u;
        if (o.status === 'selected') return { ...o, status: 'pending', order: null };
        return o;
      })
    );
  }, []);

  return (
    <OfferPoolContext.Provider
      value={{
        offers,
        selectedIds,
        toggleSelect,
        reorderSelected,
        updateOffer,
        suggestFiveOffers,
        clearSelection,
        selectAll,
        persistSelection,
        addOffer,
        addAndSelect,
        clearAllOffers,
        refreshPool,
      }}
    >
      {children}
    </OfferPoolContext.Provider>
  );
}

export function useOfferPool() {
  const ctx = useContext(OfferPoolContext);
  if (!ctx) throw new Error('useOfferPool must be used within OfferPoolProvider');
  return ctx;
}
