'use client';

import { useState, useEffect } from 'react';
import { Offer } from '@/lib/types';
import { OfferPoolProvider, useOfferPool } from '@/context/OfferPoolContext';
import { OfferTable } from '@/components/offers/OfferTable';
import { SelectedOffersPanel } from '@/components/offers/SelectedOffersPanel';
import { AddOfferForm } from '@/components/offers/AddOfferForm';
import { ImportBrowserModal } from '@/components/offers/ImportBrowserModal';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { formatDate } from '@/lib/utils';
import { Plus, Trash2, Archive, RotateCcw } from 'lucide-react';

interface OfferPoolClientProps {
  offers: Offer[];
}

function ArchivedOffers() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [restoring, setRestoring] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/offers?archived=true')
      .then((r) => r.json())
      .then(setOffers)
      .finally(() => setLoading(false));
  }, []);

  const handleRestore = async (id: string) => {
    setRestoring(id);
    await fetch(`/api/offers/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ publishedAt: null, status: 'pending' }),
    });
    setOffers((prev) => prev.filter((o) => o.id !== id));
    setRestoring(null);
  };

  if (loading) return <p className="px-6 py-8 text-sm text-gray-400">Cargando archivo…</p>;
  if (offers.length === 0) return <p className="px-6 py-8 text-sm text-gray-400">No hay ofertas archivadas.</p>;

  return (
    <div className="flex-1 overflow-auto divide-y divide-gray-100">
      {offers.map((o) => (
        <div key={o.id} className="flex items-center justify-between px-6 py-3 hover:bg-gray-50">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-gray-700">{o.title}</p>
            <p className="text-xs text-gray-400">
              {o.company} · {o.publishedAt ? new Date(o.publishedAt).toLocaleDateString('es-ES') : ''}
            </p>
          </div>
          <button
            onClick={() => handleRestore(o.id)}
            disabled={restoring === o.id}
            className="ml-4 flex shrink-0 items-center gap-1 text-xs text-indigo-500 hover:text-indigo-700 disabled:opacity-40"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Restaurar
          </button>
        </div>
      ))}
    </div>
  );
}

function PoolContent() {
  const { offers, clearAllOffers, refreshPool } = useOfferPool();
  const today = formatDate(new Date());
  const [showAddForm, setShowAddForm] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showArchive, setShowArchive] = useState(false);

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
            <button
              onClick={() => setShowArchive((v) => !v)}
              className={`flex items-center gap-1.5 text-xs font-medium ${showArchive ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <Archive className="h-3.5 w-3.5" />
              {showArchive ? 'Ver activas' : 'Ver archivo'}
            </button>
            {!showArchive && (
              <>
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
              </>
            )}
          </div>
        }
      />

      {!showArchive && showAddForm && <AddOfferForm onClose={() => setShowAddForm(false)} />}
      {!showArchive && showImportModal && (
        <ImportBrowserModal
          onClose={() => setShowImportModal(false)}
          onImported={refreshPool}
        />
      )}

      {showArchive ? (
        <ArchivedOffers />
      ) : (
        <>
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
        </>
      )}
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
