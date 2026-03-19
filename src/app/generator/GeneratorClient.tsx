'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Offer } from '@/lib/types';
import { SelectedOffersList } from '@/components/generator/SelectedOffersList';
import { MessageEditor } from '@/components/generator/MessageEditor';
import { TelegramButton } from '@/components/generator/TelegramButton';
import { Button } from '@/components/ui/Button';
import { Toast } from '@/components/ui/Toast';
import { Spinner } from '@/components/ui/Spinner';
import { Sparkles, RefreshCw, Trash2 } from 'lucide-react';

interface GeneratorClientProps {
  offers: Offer[];
  todayEnding: string;
}

export function GeneratorClient({ offers, todayEnding }: GeneratorClientProps) {
  const router = useRouter();
  const [greeting, setGreeting] = useState('');
  const [greetingLoading, setGreetingLoading] = useState(true);
  const [clearing, setClearing] = useState(false);
  const [ending, setEnding] = useState(todayEnding);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [message, setMessage] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const loadGreeting = async (date?: string) => {
    setGreetingLoading(true);
    try {
      const d = date ?? selectedDate;
      const res = await fetch(`/api/message/greeting?date=${d}`);
      const data = await res.json();
      setGreeting(data.greeting ?? '');
    } catch {
      setGreeting('');
    } finally {
      setGreetingLoading(false);
    }
  };

  useEffect(() => { loadGreeting(selectedDate); }, []);

  const handleClearSelected = async () => {
    if (!confirm(`¿Deseleccionar las ${offers.length} ofertas?`)) return;
    setClearing(true);
    try {
      await Promise.all(
        offers.map((o) =>
          fetch(`/api/offers/${o.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'pending' }),
          })
        )
      );
      router.refresh();
    } finally {
      setClearing(false);
    }
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch('/api/message/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          offerIds: offers.map((o) => o.id),
          greeting,
          ending,
        }),
      });
      if (!res.ok) throw new Error('Generation failed');
      const data = await res.json();
      setMessage(data.message);
    } catch {
      setToast('Error generating message');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message);
    setToast('Copied to clipboard!');
  };

  return (
    <div className="flex flex-col gap-5 p-6 max-w-2xl">
      <div>
        <div className="mb-1 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
            Ofertas seleccionadas
          </h2>
          {offers.length > 0 && (
            <button
              onClick={handleClearSelected}
              disabled={clearing}
              className="flex items-center gap-1 text-xs text-red-400 hover:text-red-600 disabled:opacity-40"
            >
              <Trash2 className="h-3 w-3" />
              Limpiar selección
            </button>
          )}
        </div>
        <SelectedOffersList offers={offers} />
      </div>

      {/* Saludo diario */}
      <div>
        <div className="mb-1 flex items-center justify-between">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Saludo del día
          </label>
          <button
            onClick={loadGreeting}
            disabled={greetingLoading}
            className="flex items-center gap-1 text-xs text-indigo-500 hover:text-indigo-700 disabled:opacity-40"
          >
            <RefreshCw className={`h-3 w-3 ${greetingLoading ? 'animate-spin' : ''}`} />
            Regenerar
          </button>
        </div>
        <div className="relative">
          {greetingLoading && (
            <div className="absolute inset-0 flex items-center gap-2 px-3 text-xs text-gray-400">
              <Spinner className="h-3 w-3" />
              Generando saludo…
            </div>
          )}
          <input
            type="text"
            value={greeting}
            onChange={(e) => setGreeting(e.target.value)}
            className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-700 placeholder-gray-300 focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
            placeholder="Saludo de apertura…"
          />
        </div>
      </div>

      {/* Ending del día */}
      <div>
        <div className="mb-1 flex items-center justify-between">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Ending del día
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={async (e) => {
              if (!e.target.value) return;
              const d = e.target.value;
              setSelectedDate(d);
              const [endRes] = await Promise.all([
                fetch(`/api/message/ending?date=${d}`),
                loadGreeting(d),
              ]);
              const endData = await endRes.json();
              setEnding(endData.main ?? '');
            }}
            className="rounded border border-gray-200 px-2 py-0.5 text-xs text-gray-600 focus:border-indigo-400 focus:outline-none"
          />
        </div>
        <textarea
          value={ending}
          onChange={(e) => setEnding(e.target.value)}
          rows={3}
          className="w-full rounded-md border border-gray-200 px-3 py-2 text-xs text-gray-700 placeholder-gray-400 focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400 resize-y"
          placeholder="Dato histórico del día…"
        />
      </div>

      <Button onClick={handleGenerate} loading={isGenerating} disabled={offers.length === 0}>
        <Sparkles className="h-4 w-4" />
        Generar Mensaje
      </Button>

      {message && (
        <>
          <MessageEditor message={message} onChange={setMessage} onCopy={handleCopy} />
          <TelegramButton message={message} date={selectedDate} offerIds={offers.map((o) => o.id)} />
        </>
      )}

      {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}
    </div>
  );
}
