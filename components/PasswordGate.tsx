'use client';

import { useState } from 'react';
import { hasStoredData } from '@/lib/encryption';

interface Props {
  onUnlock: (password: string) => void;
}

export default function PasswordGate({ onUnlock }: Props) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const hasData = typeof window !== 'undefined' && hasStoredData();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 4) {
      setError('Password must be at least 4 characters');
      return;
    }
    onUnlock(password);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950">
      <div className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-amber-400 mb-2">ZecPay</h1>
          <p className="text-zinc-400 text-sm">
            Shielded payroll with Zcash
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-zinc-300 text-sm mb-2">
              {hasData ? 'Enter your password to decrypt' : 'Set a password to encrypt your data'}
            </label>
            <input
              type="password"
              value={password}
              onChange={e => { setPassword(e.target.value); setError(''); }}
              placeholder="Enter password..."
              className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400"
              autoFocus
            />
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button
            type="submit"
            className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-zinc-900 font-semibold rounded-lg transition"
          >
            {hasData ? 'Unlock' : 'Start'}
          </button>
        </form>

        <p className="text-zinc-600 text-xs text-center mt-6">
          All data is encrypted locally. Nothing leaves your browser.
        </p>

        {/* User Guide */}
        <div className="mt-10 border-t border-zinc-800 pt-8">
          <h2 className="text-sm font-semibold text-zinc-300 mb-4 text-center">How it works</h2>
          <ol className="space-y-3 text-xs text-zinc-500">
            <li className="flex gap-3">
              <span className="text-amber-400 font-bold shrink-0">1.</span>
              <span><span className="text-zinc-300">Upload a CSV</span> with employee names, Zcash wallets, amounts, and payout currency (ZEC or USDC).</span>
            </li>
            <li className="flex gap-3">
              <span className="text-amber-400 font-bold shrink-0">2.</span>
              <span><span className="text-zinc-300">Preview the batch</span> — review totals, lock the ZEC/USD rate, and save your team as a reusable roster.</span>
            </li>
            <li className="flex gap-3">
              <span className="text-amber-400 font-bold shrink-0">3.</span>
              <span><span className="text-zinc-300">Send test transactions</span> (optional) — verify each wallet with a tiny 0.001 ZEC payment before running payroll.</span>
            </li>
            <li className="flex gap-3">
              <span className="text-amber-400 font-bold shrink-0">4.</span>
              <span><span className="text-zinc-300">Generate a ZIP-321 payment URI</span> — scan it with your Zcash wallet to execute shielded payments in one go.</span>
            </li>
            <li className="flex gap-3">
              <span className="text-amber-400 font-bold shrink-0">5.</span>
              <span><span className="text-zinc-300">Confirm &amp; download receipt</span> — mark employees as paid, get a JSON receipt with an integrity hash for your records.</span>
            </li>
          </ol>

          <div className="mt-6 grid grid-cols-2 gap-3 text-xs">
            <div className="bg-zinc-900/50 rounded-lg p-3">
              <p className="text-zinc-300 font-medium mb-1">Employee Roster</p>
              <p className="text-zinc-500">Save your team once, load them for every future payroll — no CSV needed.</p>
            </div>
            <div className="bg-zinc-900/50 rounded-lg p-3">
              <p className="text-zinc-300 font-medium mb-1">Batch History</p>
              <p className="text-zinc-500">Every completed payroll is logged with totals, timestamps, and a SHA-256 integrity hash.</p>
            </div>
            <div className="bg-zinc-900/50 rounded-lg p-3">
              <p className="text-zinc-300 font-medium mb-1">Scheduling</p>
              <p className="text-zinc-500">Set biweekly or monthly schedules and get notified when payroll is due.</p>
            </div>
            <div className="bg-zinc-900/50 rounded-lg p-3">
              <p className="text-zinc-300 font-medium mb-1">Local Encryption</p>
              <p className="text-zinc-500">AES-256 encryption via your password. No server, no accounts — fully offline.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
