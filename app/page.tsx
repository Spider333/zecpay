'use client';

import { useState, useEffect, useCallback } from 'react';
import { Employee, PayrollBatch } from '@/lib/types';
import { fetchZecPrice } from '@/lib/price';
import { generateZip321Uri } from '@/lib/zip321';
import { encryptAndStore, decryptFromStore, clearStoredData } from '@/lib/encryption';
import PasswordGate from '@/components/PasswordGate';
import CsvUpload from '@/components/CsvUpload';
import BatchPreview from '@/components/BatchPreview';
import PaymentUri from '@/components/PaymentUri';

type Screen = 'password' | 'upload' | 'preview' | 'payment';

export default function Home() {
  const [screen, setScreen] = useState<Screen>('password');
  const [password, setPassword] = useState('');
  const [batch, setBatch] = useState<PayrollBatch | null>(null);
  const [zecRate, setZecRate] = useState(0);
  const [rateLockTime, setRateLockTime] = useState('');
  const [uri, setUri] = useState('');
  const [loading, setLoading] = useState(false);
  const [decryptError, setDecryptError] = useState('');

  const loadRate = useCallback(async () => {
    setLoading(true);
    try {
      const rate = await fetchZecPrice();
      setZecRate(rate);
      setRateLockTime(new Date().toISOString());
    } finally {
      setLoading(false);
    }
  }, []);

  const handleUnlock = useCallback(async (pwd: string) => {
    setPassword(pwd);
    setDecryptError('');

    // Try to decrypt existing data
    try {
      const stored = await decryptFromStore(pwd);
      if (stored && (stored as PayrollBatch).employees) {
        setBatch(stored as PayrollBatch);
        await loadRate();
        setScreen('preview');
        return;
      }
    } catch {
      // No stored data or wrong password
    }

    // If there was stored data but decryption returned null, wrong password
    if (typeof window !== 'undefined' && localStorage.getItem('zecpay_encrypted')) {
      setDecryptError('Wrong password. Try again or clear data.');
      return;
    }

    await loadRate();
    setScreen('upload');
  }, [loadRate]);

  const handleParsed = useCallback(async (employees: Employee[]) => {
    const newBatch: PayrollBatch = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      employees,
      zecUsdRate: zecRate,
      rateLockTime,
      status: 'preview',
    };
    setBatch(newBatch);
    if (password) {
      await encryptAndStore(newBatch, password);
    }
    setScreen('preview');
  }, [zecRate, rateLockTime, password]);

  const handleGenerate = useCallback(() => {
    if (!batch) return;
    const paymentUri = generateZip321Uri(batch.employees, zecRate, {
      includeMemo: true,
      batchLabel: `Batch ${batch.id.slice(0, 8)}`,
    });
    setUri(paymentUri);
    setScreen('payment');
  }, [batch, zecRate]);

  const handleNewBatch = useCallback(() => {
    setBatch(null);
    setUri('');
    clearStoredData();
    setScreen('upload');
  }, []);

  // Refresh rate periodically
  useEffect(() => {
    if (screen === 'preview' || screen === 'upload') {
      const interval = setInterval(loadRate, 5 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [screen, loadRate]);

  if (screen === 'password') {
    return (
      <div>
        <PasswordGate onUnlock={handleUnlock} />
        {decryptError && (
          <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-red-900/90 border border-red-700 text-red-200 px-4 py-2 rounded-lg text-sm flex gap-3 items-center">
            <span>{decryptError}</span>
            <button
              onClick={() => { clearStoredData(); setDecryptError(''); }}
              className="text-red-400 hover:text-white underline text-xs"
            >
              Clear data
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <header className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-amber-400">ZecPay</h1>
          <span className="text-xs text-zinc-600 bg-zinc-900 px-2 py-0.5 rounded">v0.1</span>
        </div>
        <div className="flex items-center gap-4 text-xs text-zinc-500">
          {zecRate > 0 && (
            <span>ZEC: <span className="text-amber-400 font-mono">${zecRate.toFixed(2)}</span></span>
          )}
          <button
            onClick={loadRate}
            className="hover:text-amber-400 transition"
            title="Refresh rate"
          >
            {loading ? '...' : 'Refresh'}
          </button>
          <button
            onClick={() => { clearStoredData(); setPassword(''); setScreen('password'); }}
            className="hover:text-red-400 transition"
          >
            Lock
          </button>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-2xl mx-auto p-6">
        {/* Steps indicator */}
        <div className="flex items-center gap-2 mb-6 text-xs text-zinc-600">
          {['Upload CSV', 'Preview', 'Payment'].map((step, i) => {
            const stepScreens: Screen[] = ['upload', 'preview', 'payment'];
            const isActive = stepScreens.indexOf(screen) >= i;
            return (
              <span key={step} className="flex items-center gap-2">
                {i > 0 && <span className="text-zinc-800">/</span>}
                <span className={isActive ? 'text-amber-400' : ''}>{step}</span>
              </span>
            );
          })}
        </div>

        {screen === 'upload' && <CsvUpload onParsed={handleParsed} />}
        {screen === 'preview' && batch && (
          <BatchPreview
            employees={batch.employees}
            zecUsdRate={zecRate}
            rateLockTime={rateLockTime}
            onGenerate={handleGenerate}
            onBack={() => setScreen('upload')}
          />
        )}
        {screen === 'payment' && (
          <PaymentUri
            uri={uri}
            onBack={() => setScreen('preview')}
            onNewBatch={handleNewBatch}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-zinc-800 px-6 py-4 text-center text-xs text-zinc-600">
        ZecPay — CSV to ZIP-321 shielded payroll. All data encrypted locally.
      </footer>
    </div>
  );
}
