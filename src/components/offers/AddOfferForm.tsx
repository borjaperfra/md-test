'use client';

import { useState, useRef } from 'react';
import { Offer, OfferType, Modality } from '@/lib/types';
import { useOfferPool } from '@/context/OfferPoolContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Spinner } from '@/components/ui/Spinner';
import { ArrowLeft, X, Sparkles, Square } from 'lucide-react';

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

interface ExtractedData {
  title: string;
  company: string;
  type: OfferType;
  modality: Modality;
  salary: string | null;
  isFreelance: boolean;
  location: string | null;
}

interface AddOfferFormProps {
  onClose: () => void;
}

const emptyManual = (): ExtractedData & { url: string } => ({
  url: '', title: '', company: '', type: 'external', modality: 'remote',
  salary: null, isFreelance: false, location: null,
});

export function AddOfferForm({ onClose }: AddOfferFormProps) {
  const { addAndSelect } = useOfferPool();

  const [mode, setMode] = useState<'url' | 'manual'>('url');
  const [url, setUrl] = useState('');
  const [reading, setReading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [extracted, setExtracted] = useState<ExtractedData | null>(null);
  const [manual, setManual] = useState(emptyManual());
  const abortRef = useRef<AbortController | null>(null);

  const handleRead = async () => {
    if (!url.trim()) return;
    const controller = new AbortController();
    abortRef.current = controller;

    setReading(true);
    setError(null);
    setExtracted(null);

    try {
      const res = await fetch('/api/offers/fetch-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
        signal: controller.signal,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Error al leer la oferta');
      setExtracted(data);
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'name' in err && (err as { name: string }).name === 'AbortError') {
        // cancelled — no error shown
      } else {
        setError(err instanceof Error ? err.message : 'Error desconocido');
      }
    } finally {
      setReading(false);
    }
  };

  const handleCancelRead = () => {
    abortRef.current?.abort();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!extracted) return;
    setSaving(true);
    setError(null);

    try {
      const res = await fetch('/api/offers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, ...extracted }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Error al guardar');
      addAndSelect(data as Offer);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setSaving(false);
    }
  };

  const patch = (field: string, value: string | boolean | null) =>
    setExtracted((prev) => prev && { ...prev, [field]: value });

  const patchManual = (field: string, value: string | boolean | null) =>
    setManual((prev) => ({ ...prev, [field]: value }));

  const handleSubmitManual = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const { url: manualUrl, ...rest } = manual;
      const res = await fetch('/api/offers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: manualUrl, ...rest }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Error al guardar');
      addAndSelect(data as Offer);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setSaving(false);
    }
  };

  const offerFields = (
    data: ExtractedData & { url?: string },
    onChange: (field: string, value: string | boolean | null) => void,
    includeUrl = false,
  ) => (
    <div className="flex flex-wrap items-end gap-3">
      {includeUrl && (
        <div className="w-72">
          <label className="mb-1 block text-xs font-medium text-gray-600">URL *</label>
          <Input
            placeholder="https://..."
            value={(data as { url?: string }).url ?? ''}
            onChange={(e) => onChange('url', e.target.value)}
            required
          />
        </div>
      )}
      <div className="w-56">
        <label className="mb-1 block text-xs font-medium text-gray-600">Título *</label>
        <Input value={data.title} onChange={(e) => onChange('title', e.target.value)} required />
      </div>
      <div className="w-40">
        <label className="mb-1 block text-xs font-medium text-gray-600">Empresa *</label>
        <Input value={data.company} onChange={(e) => onChange('company', e.target.value)} required />
      </div>
      <div className="w-32">
        <label className="mb-1 block text-xs font-medium text-gray-600">Tipo</label>
        <Select options={typeOptions} value={data.type} onChange={(e) => onChange('type', e.target.value)} />
      </div>
      <div className="w-28">
        <label className="mb-1 block text-xs font-medium text-gray-600">Modalidad</label>
        <Select options={modalityOptions} value={data.modality} onChange={(e) => onChange('modality', e.target.value)} />
      </div>
      {data.modality !== 'remote' && (
        <div className="w-28">
          <label className="mb-1 block text-xs font-medium text-gray-600">Ciudad</label>
          <Input
            placeholder="Valencia"
            value={data.location ?? ''}
            onChange={(e) => onChange('location', e.target.value || null)}
          />
        </div>
      )}
      <div className="w-28">
        <label className="mb-1 block text-xs font-medium text-gray-600">Salario</label>
        <Input
          placeholder="70K / €20/h"
          value={data.salary ?? ''}
          onChange={(e) => onChange('salary', e.target.value || null)}
        />
      </div>
      <div className="flex items-center gap-1.5 pb-1">
        <input
          type="checkbox"
          id="isFreelance"
          checked={data.isFreelance}
          onChange={(e) => onChange('isFreelance', e.target.checked)}
          className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
        />
        <label htmlFor="isFreelance" className="cursor-pointer text-xs font-medium text-gray-600">
          Freelance
        </label>
      </div>
    </div>
  );

  return (
    <div className="border-b border-gray-200 bg-white px-6 py-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-semibold text-gray-800">Añadir oferta</h2>
          <div className="flex rounded-lg border border-gray-200 p-0.5 text-xs">
            <button
              onClick={() => { setMode('url'); setExtracted(null); setError(null); }}
              className={`rounded px-3 py-1 font-medium transition-colors ${mode === 'url' ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Desde URL
            </button>
            <button
              onClick={() => { setMode('manual'); setExtracted(null); setError(null); }}
              className={`rounded px-3 py-1 font-medium transition-colors ${mode === 'manual' ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Manual
            </button>
          </div>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* ── URL mode ── */}
      {mode === 'url' && (
        <>
          <div className="flex items-end gap-3">
            <div className="w-96">
              <label className="mb-1 block text-xs font-medium text-gray-600">URL de la oferta</label>
              <Input
                placeholder="https://getmanfred.com/... o cualquier job board"
                value={url}
                onChange={(e) => { setUrl(e.target.value); setExtracted(null); setError(null); }}
                onKeyDown={(e) => e.key === 'Enter' && !extracted && handleRead()}
                disabled={reading}
              />
            </div>
            {!extracted ? (
              <Button onClick={handleRead} loading={reading} disabled={!url.trim()} size="sm">
                {!reading && <Sparkles className="h-3.5 w-3.5" />}
                Leer oferta
              </Button>
            ) : (
              <button
                onClick={() => { setExtracted(null); setError(null); }}
                className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 pb-1"
              >
                <ArrowLeft className="h-3 w-3" />
                Cambiar URL
              </button>
            )}
          </div>

          {reading && (
            <div className="mt-3 flex items-center gap-2 text-sm text-gray-500">
              <Spinner className="h-4 w-4 text-indigo-500" />
              <span>Leyendo la oferta con IA…</span>
              <button
                onClick={handleCancelRead}
                className="ml-1 flex items-center gap-1 rounded border border-gray-200 px-2 py-0.5 text-xs text-gray-500 hover:border-red-300 hover:text-red-500"
              >
                <Square className="h-2.5 w-2.5 fill-current" />
                Cancelar
              </button>
            </div>
          )}

          {error && <p className="mt-2 text-xs text-red-600">{error}</p>}

          {extracted && (
            <form onSubmit={handleSubmit} className="mt-4 border-t border-gray-100 pt-4">
              <p className="mb-3 flex items-center gap-1.5 text-xs font-medium text-green-700">
                <Sparkles className="h-3 w-3" />
                Datos extraídos — revisa y edita si es necesario
              </p>
              {offerFields(extracted, patch)}
              <div className="mt-3 flex items-center gap-2">
                <Button type="submit" size="sm" loading={saving}>Añadir oferta</Button>
                <button
                  type="button"
                  onClick={() => { setExtracted(null); setError(null); }}
                  className="text-xs text-gray-400 hover:text-gray-600"
                >
                  Descartar
                </button>
              </div>
            </form>
          )}
        </>
      )}

      {/* ── Manual mode ── */}
      {mode === 'manual' && (
        <form onSubmit={handleSubmitManual} className="mt-1">
          {offerFields(manual, patchManual, true)}
          <div className="mt-3 flex items-center gap-2">
            <Button type="submit" size="sm" loading={saving} disabled={!manual.title.trim() || !manual.company.trim() || !manual.url.trim()}>
              Añadir oferta
            </Button>
          </div>
          {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
        </form>
      )}
    </div>
  );
}
