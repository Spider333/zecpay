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
      </div>
    </div>
  );
}
