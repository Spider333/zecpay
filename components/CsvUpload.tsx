'use client';

import { useState, useCallback } from 'react';
import { parseCSV, SAMPLE_CSV } from '@/lib/csv-parser';
import { Employee } from '@/lib/types';

interface Props {
  onParsed: (employees: Employee[]) => void;
}

export default function CsvUpload({ onParsed }: Props) {
  const [errors, setErrors] = useState<string[]>([]);
  const [dragActive, setDragActive] = useState(false);

  const handleFile = useCallback((text: string) => {
    const result = parseCSV(text);
    setErrors(result.errors);
    if (result.employees.length > 0) {
      onParsed(result.employees);
    }
  }, [onParsed]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file) file.text().then(handleFile);
  }, [handleFile]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) file.text().then(handleFile);
  };

  const loadSample = () => handleFile(SAMPLE_CSV);

  return (
    <div className="space-y-4">
      <div
        onDragOver={e => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-xl p-12 text-center transition cursor-pointer ${
          dragActive ? 'border-amber-400 bg-amber-400/5' : 'border-zinc-700 hover:border-zinc-500'
        }`}
        onClick={() => document.getElementById('csv-input')?.click()}
      >
        <input
          id="csv-input"
          type="file"
          accept=".csv"
          onChange={handleFileInput}
          className="hidden"
        />
        <div className="text-zinc-400">
          <svg className="mx-auto h-12 w-12 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <p className="text-sm">Drop CSV file here or click to browse</p>
          <p className="text-xs text-zinc-600 mt-1">Columns: name, wallet, amount, currency, payout_currency</p>
        </div>
      </div>

      <button
        onClick={loadSample}
        className="w-full py-2 border border-zinc-700 text-zinc-400 hover:text-amber-400 hover:border-amber-400/50 rounded-lg text-sm transition"
      >
        Load sample CSV (demo)
      </button>

      {errors.length > 0 && (
        <div className="bg-red-900/20 border border-red-800 rounded-lg p-3">
          <p className="text-red-400 text-sm font-medium mb-1">Parse errors:</p>
          {errors.map((err, i) => (
            <p key={i} className="text-red-300 text-xs">{err}</p>
          ))}
        </div>
      )}
    </div>
  );
}
