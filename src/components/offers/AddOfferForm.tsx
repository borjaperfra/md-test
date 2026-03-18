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
}

interface AddOfferFormProps {
  onClose: () => void;
}

export function AddOfferForm({ onClose }: AddOfferFormProps) {
  const { addAndSelect } = useOfferPool();

  const [url, setUrl] = useState('');
  const [reading, setReading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [extracted, setExtracted] = useState<ExtractedData | null>(null);
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

  const patch = (field: keyof ExtractedData, value: string | boolean) =>
    setExtracted((prev) => prev && { ...prev, [field]: value });

  return (
    <div className="border-b border-gray-200 bg-white px-6 py-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-800">Añadir oferta</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Step 1: URL input */}
      <div className="flex items-end gap-3">
        <div className="w-96">
          <label className="mb-1 block text-xs font-medium text-gray-600">
            URL de la oferta
          </label>
          <Input
            placeholder="https://getmanfred.com/... o cualquier job board"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              setExtracted(null);
              setError(null);
            }}
            onKeyDown={(e) => e.key === 'Enter' && !extracted && handleRead()}
            disabled={reading}
          />
        </div>

        {!extracted ? (
          <Button
            onClick={handleRead}
            loading={reading}
            disabled={!url.trim()}
            size="sm"
          >
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

      {/* Reading state */}
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

      {/* Error */}
      {error && (
        <p className="mt-2 text-xs text-red-600">{error}</p>
      )}

      {/* Step 2: Review extracted data */}
      {extracted && (
        <form onSubmit={handleSubmit} className="mt-4 border-t border-gray-100 pt-4">
          <p className="mb-3 flex items-center gap-1.5 text-xs font-medium text-green-700">
            <Sparkles className="h-3 w-3" />
            Datos extraídos — revisa y edita si es necesario
          </p>

          <div className="flex flex-wrap items-end gap-3">
            <div className="w-56">
              <label className="mb-1 block text-xs font-medium text-gray-600">Título *</label>
              <Input
                value={extracted.title}
                onChange={(e) => patch('title', e.target.value)}
                required
              />
            </div>

            <div className="w-40">
              <label className="mb-1 block text-xs font-medium text-gray-600">Empresa *</label>
              <Input
                value={extracted.company}
                onChange={(e) => patch('company', e.target.value)}
                required
              />
            </div>

            <div className="w-32">
              <label className="mb-1 block text-xs font-medium text-gray-600">Tipo</label>
              <Select
                options={typeOptions}
                value={extracted.type}
                onChange={(e) => patch('type', e.target.value)}
              />
            </div>

            <div className="w-28">
              <label className="mb-1 block text-xs font-medium text-gray-600">Modalidad</label>
              <Select
                options={modalityOptions}
                value={extracted.modality}
                onChange={(e) => patch('modality', e.target.value)}
              />
            </div>

            <div className="w-28">
              <label className="mb-1 block text-xs font-medium text-gray-600">Salario</label>
              <Input
                placeholder="70K / €20/h"
                value={extracted.salary ?? ''}
                onChange={(e) => patch('salary', e.target.value || null as unknown as string)}
              />
            </div>

            <div className="flex items-center gap-1.5 pb-1">
              <input
                type="checkbox"
                id="isFreelance"
                checked={extracted.isFreelance}
                onChange={(e) => patch('isFreelance', e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <label htmlFor="isFreelance" className="cursor-pointer text-xs font-medium text-gray-600">
                Freelance
              </label>
            </div>

            <Button type="submit" size="sm" loading={saving}>
              Añadir oferta
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
