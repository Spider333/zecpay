'use client';

import { useState, useEffect, useCallback } from 'react';
import { Employee, PayrollBatch, PayrollSchedule } from '@/lib/types';
import { fetchZecPrice } from '@/lib/price';
import { generateZip321Uri } from '@/lib/zip321';
import { encryptAndStore, decryptFromStore, clearStoredData } from '@/lib/encryption';
import { isPayrollDue } from '@/lib/schedule';
import PasswordGate from '@/components/PasswordGate';
import CsvUpload from '@/components/CsvUpload';
import BatchPreview from '@/components/BatchPreview';
import PaymentUri from '@/components/PaymentUri';
import TestMode from '@/components/TestMode';
import ScheduleConfig from '@/components/ScheduleConfig';

type Screen = 'password' | 'upload' | 'preview' | 'testmode' | 'payment';

export default function Home() {
  const [screen, setScreen] = useState<Screen>('password');
  const [password, setPassword] = useState('');
  const [batch, setBatch] = useState<PayrollBatch | null>(null);
  const [zecRate, setZecRate] = useState(0);
  const [rateLockTime, setRateLockTime] = useState('');
  const [uri, setUri] = useState('');
  const [loading, setLoading] = useState(false);
  const [decryptError, setDecryptError] = useState('');
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleDueBanner, setScheduleDueBanner] = useState(false);

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

  const persistBatch = useCallback(async (updated: PayrollBatch) => {
    setBatch(updated);
    if (password) {
      await encryptAndStore(updated, password);
    }
  }, [password]);

  const handleUnlock = useCallback(async (pwd: string) => {
    setPassword(pwd);
    setDecryptError('');

    try {
      const stored = await decryptFromStore(pwd);
      if (stored && (stored as PayrollBatch).employees) {
        const restoredBatch = stored as PayrollBatch;
        setBatch(restoredBatch);
        await loadRate();
        // Check if payroll is due
        if (restoredBatch.schedule && isPayrollDue(restoredBatch.schedule)) {
          setScheduleDueBanner(true);
        }
        setScreen('preview');
        return;
      }
    } catch {
      // No stored data or wrong password
    }

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
    await persistBatch(newBatch);
    setScreen('preview');
  }, [zecRate, rateLockTime, persistBatch]);

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

  const handleUpdateEmployee = useCallback(async (index: number, updates: Partial<Employee>) => {
    if (!batch) return;
    const updatedEmployees = batch.employees.map((emp, i) =>
      i === index ? { ...emp, ...updates } : emp
    );
    await persistBatch({ ...batch, employees: updatedEmployees });
  }, [batch, persistBatch]);

  const handleConfirmPayment = useCallback(async (index: number) => {
    if (!batch) return;
    const updatedEmployees = batch.employees.map((emp, i) =>
      i === index ? { ...emp, paid: !emp.paid } : emp
    );
    const allPaid = updatedEmployees.every(e => e.paid);
    await persistBatch({
      ...batch,
      employees: updatedEmployees,
      status: allPaid ? 'executed' : batch.status,
      schedule: allPaid && batch.schedule
        ? { ...batch.schedule, lastProcessedDate: new Date().toISOString().split('T')[0] }
        : batch.schedule,
    });
  }, [batch, persistBatch]);

  const handleMarkAllPaid = useCallback(async () => {
    if (!batch) return;
    const updatedEmployees = batch.employees.map(emp => ({ ...emp, paid: true }));
    await persistBatch({
      ...batch,
      employees: updatedEmployees,
      status: 'executed',
      schedule: batch.schedule
        ? { ...batch.schedule, lastProcessedDate: new Date().toISOString().split('T')[0] }
        : undefined,
    });
  }, [batch, persistBatch]);

  const handleSaveSchedule = useCallback(async (schedule: PayrollSchedule) => {
    if (!batch) return;
    await persistBatch({ ...batch, schedule });
    setShowScheduleModal(false);
    // Request notification permission on first schedule save
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, [batch, persistBatch]);

  const handleRemoveSchedule = useCallback(async () => {
    if (!batch) return;
    const { schedule: _, ...rest } = batch;
    await persistBatch(rest as PayrollBatch);
    setShowScheduleModal(false);
    setScheduleDueBanner(false);
  }, [batch, persistBatch]);

  // Fire browser notification when payroll due
  useEffect(() => {
    if (scheduleDueBanner && typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      new Notification('ZecPay — Payroll Due', { body: 'Your scheduled payroll is due today.' });
    }
  }, [scheduleDueBanner]);

  // Refresh rate periodically
  useEffect(() => {
    if (screen === 'preview' || screen === 'upload' || screen === 'testmode') {
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
          <span className="text-xs text-zinc-600 bg-zinc-900 px-2 py-0.5 rounded">v0.2</span>
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

      {/* Due banner */}
      {scheduleDueBanner && screen === 'preview' && (
        <div className="bg-amber-400/10 border-b border-amber-400/30 px-6 py-2 text-amber-300 text-sm text-center">
          Payroll is due today — review and process payments below
          <button onClick={() => setScheduleDueBanner(false)} className="ml-3 text-amber-500 text-xs">Dismiss</button>
        </div>
      )}

      {/* Main */}
      <main className="max-w-2xl mx-auto p-6">
        {/* Steps indicator */}
        <div className="flex items-center gap-2 mb-6 text-xs text-zinc-600">
          {['Upload CSV', 'Preview', 'Test', 'Payment'].map((step, i) => {
            const stepScreens: Screen[] = ['upload', 'preview', 'testmode', 'payment'];
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
            onTestMode={() => setScreen('testmode')}
            schedule={batch.schedule}
            onOpenSchedule={() => setShowScheduleModal(true)}
          />
        )}
        {screen === 'testmode' && batch && (
          <TestMode
            employees={batch.employees}
            zecUsdRate={zecRate}
            onUpdateEmployee={handleUpdateEmployee}
            onComplete={handleGenerate}
            onBack={() => setScreen('preview')}
          />
        )}
        {screen === 'payment' && batch && (
          <PaymentUri
            uri={uri}
            onBack={() => setScreen('preview')}
            onNewBatch={handleNewBatch}
            employees={batch.employees}
            zecUsdRate={zecRate}
            onConfirmPayment={handleConfirmPayment}
            onMarkAllPaid={handleMarkAllPaid}
          />
        )}
      </main>

      {/* Schedule modal */}
      {showScheduleModal && (
        <ScheduleConfig
          schedule={batch?.schedule}
          onSave={handleSaveSchedule}
          onRemove={batch?.schedule ? handleRemoveSchedule : undefined}
          onClose={() => setShowScheduleModal(false)}
        />
      )}

      {/* Footer */}
      <footer className="mt-auto border-t border-zinc-800 px-6 py-4 text-center text-xs text-zinc-600">
        ZecPay — CSV to ZIP-321 shielded payroll. All data encrypted locally.
      </footer>
    </div>
  );
}
