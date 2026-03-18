'use client';

import { useState, useRef, useEffect } from 'react';
import { Offer } from '@/lib/types';
import { useOfferPool } from '@/context/OfferPoolContext';
import { Button } from '@/components/ui/Button';
import { Toast } from '@/components/ui/Toast';
import { Search, Square } from 'lucide-react';

function formatElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

export function SearchOffersButton() {
  const { addOffer } = useOfferPool();
  const [searching, setSearching] = useState(false);
  const [currentSource, setCurrentSource] = useState('');
  const [found, setFound] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [toast, setToast] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleSearch = async () => {
    const controller = new AbortController();
    abortRef.current = controller;

    setSearching(true);
    setCurrentSource('Iniciando…');
    setFound(0);
    setElapsed(0);

    timerRef.current = setInterval(() => setElapsed((s) => s + 1), 1000);

    let totalFound = 0;
    let stopped = false;

    try {
      const res = await fetch('/api/offers/search', {
        method: 'POST',
        signal: controller.signal,
      });

      if (!res.ok || !res.body) throw new Error('Error al iniciar búsqueda');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const msg = JSON.parse(line);

            if (msg.searching) {
              setCurrentSource(msg.searching);
            } else if (msg.offers) {
              for (const offer of msg.offers as Offer[]) {
                addOffer(offer);
              }
              totalFound += msg.count ?? 0;
              setFound(totalFound);
            } else if (msg.done) {
              totalFound = msg.total ?? totalFound;
              setFound(totalFound);
            }
          } catch {
            // skip malformed line
          }
        }
      }
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'name' in err && (err as { name: string }).name === 'AbortError') {
        stopped = true;
      } else {
        setToast(`Error: ${err instanceof Error ? err.message : 'desconocido'}`);
      }
    } finally {
      stopTimer();
      setSearching(false);
      setCurrentSource('');

      if (!stopped || totalFound > 0) {
        setToast(
          totalFound > 0
            ? `✓ ${totalFound} oferta${totalFound === 1 ? '' : 's'} encontrada${totalFound === 1 ? '' : 's'}${stopped ? ' (búsqueda detenida)' : ''}`
            : stopped ? 'Búsqueda detenida' : 'No se encontraron nuevas ofertas con salario'
        );
      }
    }
  };

  const handleStop = () => {
    abortRef.current?.abort();
  };

  if (searching) {
    return (
      <>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-600 shadow-sm">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-indigo-500" />
            <span className="max-w-[160px] truncate">{currentSource}</span>
            {found > 0 && (
              <span className="font-medium text-indigo-600">· {found} ofertas</span>
            )}
            <span className="font-mono text-gray-400">{formatElapsed(elapsed)}</span>
          </div>
          <Button size="sm" variant="secondary" onClick={handleStop} title="Detener y guardar resultados">
            <Square className="h-3 w-3 fill-current" />
            Detener
          </Button>
        </div>
        {toast && <Toast message={toast} duration={5000} onDismiss={() => setToast(null)} />}
      </>
    );
  }

  return (
    <>
      <Button size="sm" onClick={handleSearch}>
        <Search className="h-3.5 w-3.5" />
        Buscar ofertas
      </Button>
      {toast && <Toast message={toast} duration={5000} onDismiss={() => setToast(null)} />}
    </>
  );
}
