'use client';

import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Employee } from '@/lib/types';
import { generateTestUri } from '@/lib/zip321';
import { usdToZec, formatZec } from '@/lib/price';

interface Props {
  employees: Employee[];
  zecUsdRate: number;
  onUpdateEmployee: (index: number, updates: Partial<Employee>) => void;
  onComplete: () => void;
  onBack: () => void;
}

export default function TestMode({ employees, zecUsdRate, onUpdateEmployee, onComplete, onBack }: Props) {
  const [expandedQr, setExpandedQr] = useState<number | null>(null);

  const verifiedCount = employees.filter(e => e.verified).length;
  const allVerified = verifiedCount === employees.length;

  return (
    <div className="space-y-4 animate-slide-up">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="text-zinc-400 hover:text-white text-sm transition-colors">&larr; Back</button>
        <span className="text-xs text-amber-400 bg-amber-400/10 px-2 py-1 rounded">Test Mode</span>
      </div>

      {/* Info banner */}
      <div className="glass rounded-xl p-4 text-sm text-amber-200 border-amber-400/20">
        Send <span className="font-mono font-bold">0.001 ZEC</span> test to each employee to verify wallets before full payout.
      </div>

      {/* Progress */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-zinc-500">
          <span>Verification progress</span>
          <span className="text-amber-400">{verifiedCount}/{employees.length} verified</span>
        </div>
        <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-amber-400 transition-all duration-300 rounded-full"
            style={{ width: `${(verifiedCount / employees.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Employee cards */}
      <div className="space-y-2">
        {employees.map((emp, i) => {
          const zec = emp.currency === 'ZEC' ? emp.amount : usdToZec(emp.amount, zecUsdRate);
          const isExpanded = expandedQr === i;

          return (
            <div key={i} className="glass rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-white font-medium">{emp.name}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded ${
                      emp.payoutCurrency === 'ZEC' ? 'bg-amber-400/10 text-amber-400' : 'bg-blue-400/10 text-blue-400'
                    }`}>
                      {emp.payoutCurrency}
                    </span>
                  </div>
                  <p className="text-xs font-mono text-zinc-500 truncate">{emp.wallet}</p>
                  <p className="text-xs text-zinc-400 mt-1">{formatZec(zec)} ZEC (~${(emp.currency === 'USD' ? emp.amount : emp.amount * zecUsdRate).toFixed(2)})</p>
                </div>
                <div className={`w-3 h-3 rounded-full flex-shrink-0 transition-colors duration-300 ${
                  emp.verified ? 'bg-green-400' : emp.testTxSent ? 'bg-amber-400' : 'bg-zinc-600'
                }`} />
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 flex-wrap">
                <button
                  onClick={() => setExpandedQr(isExpanded ? null : i)}
                  className="text-xs px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded transition-colors"
                >
                  {isExpanded ? 'Hide QR' : 'Show QR'}
                </button>
                <label className="flex items-center gap-1.5 text-xs text-zinc-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={emp.testTxSent}
                    onChange={(e) => onUpdateEmployee(i, { testTxSent: e.target.checked })}
                    className="accent-amber-400"
                  />
                  Sent
                </label>
                <label className={`flex items-center gap-1.5 text-xs cursor-pointer ${emp.testTxSent ? 'text-zinc-400' : 'text-zinc-600'}`}>
                  <input
                    type="checkbox"
                    checked={emp.verified}
                    disabled={!emp.testTxSent}
                    onChange={(e) => onUpdateEmployee(i, { verified: e.target.checked })}
                    className="accent-green-400"
                  />
                  Verified
                </label>
              </div>

              {/* QR */}
              {isExpanded && (
                <div className="flex justify-center p-4 bg-white rounded-lg shadow-[0_0_30px_rgba(0,0,0,0.2)]">
                  <QRCodeSVG value={generateTestUri(emp)} size={180} level="M" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Proceed button */}
      <button
        onClick={onComplete}
        disabled={!allVerified}
        className={`w-full py-3 font-semibold rounded-lg transition-all duration-200 text-lg ${
          allVerified
            ? 'bg-green-500 hover:bg-green-400 hover:shadow-[0_0_20px_rgba(34,197,94,0.25)] text-zinc-900'
            : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
        }`}
      >
        {allVerified ? 'Proceed to Payment' : `Verify all ${employees.length} wallets to proceed`}
      </button>
    </div>
  );
}
