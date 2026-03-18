'use client';

import { useState, useRef, useEffect } from 'react';

interface InlineEditCellProps {
  value: string;
  type?: 'text' | 'select';
  options?: { value: string; label: string }[];
  onSave: (value: string) => void;
  onCancel: () => void;
}

export function InlineEditCell({
  value,
  type = 'text',
  options,
  onSave,
  onCancel,
}: InlineEditCellProps) {
  const [current, setCurrent] = useState(value);
  const ref = useRef<HTMLInputElement & HTMLSelectElement>(null);

  useEffect(() => {
    ref.current?.focus();
    if (type === 'text' && ref.current instanceof HTMLInputElement) {
      ref.current.select();
    }
  }, [type]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onSave(current);
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };

  if (type === 'select' && options) {
    return (
      <select
        ref={ref as React.RefObject<HTMLSelectElement>}
        value={current}
        onChange={(e) => setCurrent(e.target.value)}
        onBlur={() => onSave(current)}
        onKeyDown={handleKeyDown}
        className="w-full rounded border border-indigo-400 bg-white px-1.5 py-0.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    );
  }

  return (
    <input
      ref={ref as React.RefObject<HTMLInputElement>}
      type="text"
      value={current}
      onChange={(e) => setCurrent(e.target.value)}
      onBlur={() => onSave(current)}
      onKeyDown={handleKeyDown}
      className="w-full rounded border border-indigo-400 bg-white px-1.5 py-0.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
    />
  );
}
