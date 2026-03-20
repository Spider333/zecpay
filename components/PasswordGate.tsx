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
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 animate-fade-in">
      <div className="w-full max-w-md p-8">
        <div className="text-center mb-8 animate-slide-up">
          <h1 className="text-5xl font-bold tracking-tight bg-gradient-to-r from-amber-400 to-amber-500 bg-clip-text text-transparent mb-2" style={{ textShadow: '0 0 40px rgba(251,191,36,0.15)' }}>ZecPay</h1>
          <p className="text-zinc-400 text-sm">
            Shielded payroll with Zcash
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 animate-slide-up delay-1">
          <div>
            <label className="block text-zinc-300 text-sm mb-2">
              {hasData ? 'Enter your password to decrypt' : 'Set a password to encrypt your data'}
            </label>
            <input
              type="password"
              value={password}
              onChange={e => { setPassword(e.target.value); setError(''); }}
              placeholder="Enter password..."
              className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400 focus:shadow-[0_0_0_3px_rgba(251,191,36,0.1)] transition-shadow duration-200"
              autoFocus
            />
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button
            type="submit"
            className="w-full py-3 bg-amber-500 hover:bg-amber-400 hover:shadow-[0_0_20px_rgba(245,158,11,0.25)] text-zinc-900 font-semibold rounded-lg transition-all duration-200"
          >
            {hasData ? 'Unlock' : 'Start'}
          </button>
        </form>

        <p className="text-zinc-600 text-xs text-center mt-6 flex items-center justify-center gap-1.5">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
          All data is encrypted locally. Nothing leaves your browser.
        </p>

        {/* User Guide */}
        <div className="mt-10 border-t border-zinc-800 pt-8 animate-slide-up delay-2">
          <h2 className="text-sm font-semibold text-zinc-300 mb-4 text-center">How it works</h2>
          <ol className="space-y-3 text-xs text-zinc-500">
            <li className="flex gap-3">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-amber-400/10 text-amber-400 font-bold text-[10px] shrink-0">1</span>
              <span><span className="text-zinc-300">Upload a CSV</span> with employee names, Zcash wallets, amounts, and payout currency (ZEC or USDC).</span>
            </li>
            <li className="flex gap-3">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-amber-400/10 text-amber-400 font-bold text-[10px] shrink-0">2</span>
              <span><span className="text-zinc-300">Preview the batch</span> — review totals, lock the ZEC/USD rate, and save your team as a reusable roster.</span>
            </li>
            <li className="flex gap-3">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-amber-400/10 text-amber-400 font-bold text-[10px] shrink-0">3</span>
              <span><span className="text-zinc-300">Send test transactions</span> (optional) — verify each wallet with a tiny 0.001 ZEC payment before running payroll.</span>
            </li>
            <li className="flex gap-3">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-amber-400/10 text-amber-400 font-bold text-[10px] shrink-0">4</span>
              <span><span className="text-zinc-300">Generate a ZIP-321 payment URI</span> — scan it with your Zcash wallet to execute shielded payments in one go.</span>
            </li>
            <li className="flex gap-3">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-amber-400/10 text-amber-400 font-bold text-[10px] shrink-0">5</span>
              <span><span className="text-zinc-300">Confirm &amp; download receipt</span> — mark employees as paid, get a JSON receipt with an integrity hash for your records.</span>
            </li>
          </ol>

          <div className="mt-6 grid grid-cols-2 gap-3 text-xs">
            <div className="glass rounded-xl p-3 hover:-translate-y-0.5 transition-transform duration-200 animate-slide-up delay-2">
              <p className="text-zinc-300 font-medium mb-1">Employee Roster</p>
              <p className="text-zinc-500">Save your team once, load them for every future payroll — no CSV needed.</p>
            </div>
            <div className="glass rounded-xl p-3 hover:-translate-y-0.5 transition-transform duration-200 animate-slide-up delay-3">
              <p className="text-zinc-300 font-medium mb-1">Batch History</p>
              <p className="text-zinc-500">Every completed payroll is logged with totals, timestamps, and a SHA-256 integrity hash.</p>
            </div>
            <div className="glass rounded-xl p-3 hover:-translate-y-0.5 transition-transform duration-200 animate-slide-up delay-4">
              <p className="text-zinc-300 font-medium mb-1">Scheduling</p>
              <p className="text-zinc-500">Set biweekly or monthly schedules and get notified when payroll is due.</p>
            </div>
            <div className="glass rounded-xl p-3 hover:-translate-y-0.5 transition-transform duration-200 animate-slide-up delay-5">
              <p className="text-zinc-300 font-medium mb-1">Local Encryption</p>
              <p className="text-zinc-500">AES-256 encryption via your password. No server, no accounts — fully offline.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
