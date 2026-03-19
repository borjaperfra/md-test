'use client';

import { useState } from 'react';
import { Offer } from '@/lib/types';
import { OfferPoolProvider, useOfferPool } from '@/context/OfferPoolContext';
import { OfferTable } from '@/components/offers/OfferTable';
import { SelectedOffersPanel } from '@/components/offers/SelectedOffersPanel';
import { AddOfferForm } from '@/components/offers/AddOfferForm';
import { ImportBrowserModal } from '@/components/offers/ImportBrowserModal';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { formatDate } from '@/lib/utils';
import { Plus, Trash2 } from 'lucide-react';

interface OfferPoolClientProps {
  offers: Offer[];
}

function PoolContent() {
  const { offers, clearAllOffers, refreshPool } = useOfferPool();
  const today = formatDate(new Date());
  const [showAddForm, setShowAddForm] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

  const handleClearAll = async () => {
    if (!confirm(`¿Borrar las ${offers.length} ofertas de la tabla? Esta acción no se puede deshacer.`)) return;
    await clearAllOffers();
  };

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title="Pool de Ofertas"
        action={
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-500">{today}</span>
            <Button size="sm" variant="secondary" onClick={() => setShowAddForm((v) => !v)}>
              <Plus className="h-3.5 w-3.5" />
              Añadir oferta
            </Button>
            {offers.length > 0 && (
              <Button size="sm" variant="secondary" onClick={handleClearAll} className="text-red-500 hover:text-red-600">
                <Trash2 className="h-3.5 w-3.5" />
                Borrar todas
              </Button>
            )}
          </div>
        }
      />

      {showAddForm && <AddOfferForm onClose={() => setShowAddForm(false)} />}
      {showImportModal && (
        <ImportBrowserModal
          onClose={() => setShowImportModal(false)}
          onImported={refreshPool}
        />
      )}

      <div className="flex items-center gap-4 border-b border-gray-100 bg-gray-50 px-6 py-1.5 text-xs text-gray-500">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm border border-yellow-200 bg-yellow-100" />
          Manfred
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm border border-blue-200 bg-blue-100" />
          Client (pagada)
        </span>
        <span>Ⓜ️ = Manfred · 👀 = Client · 🌶️ = ≥80K</span>
      </div>

      <div className="flex-1 overflow-auto">
        <OfferTable offers={offers} />
      </div>

      <SelectedOffersPanel />
    </div>
  );
}

export function OfferPoolClient({ offers }: OfferPoolClientProps) {
  return (
    <OfferPoolProvider initialOffers={offers}>
      <PoolContent />
    </OfferPoolProvider>
  );
}
