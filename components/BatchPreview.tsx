'use client';

import { Employee } from '@/lib/types';
import { usdToZec, formatZec } from '@/lib/price';
import { getTotalZec } from '@/lib/zip321';

interface Props {
  employees: Employee[];
  zecUsdRate: number;
  rateLockTime: string;
  onGenerate: () => void;
  onBack: () => void;
}

function truncateAddr(addr: string): string {
  if (addr.length <= 16) return addr;
  return `${addr.slice(0, 8)}...${addr.slice(-8)}`;
}

export default function BatchPreview({ employees, zecUsdRate, rateLockTime, onGenerate, onBack }: Props) {
  const totalZec = getTotalZec(employees, zecUsdRate);
  const totalUsd = employees.reduce((s, e) => s + (e.currency === 'USD' ? e.amount : e.amount * zecUsdRate), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="text-zinc-400 hover:text-white text-sm">&larr; Back</button>
        <div className="text-right text-xs text-zinc-500">
          <p>ZEC/USD: <span className="text-amber-400 font-mono">${zecUsdRate.toFixed(2)}</span></p>
          <p>Locked: {new Date(rateLockTime).toLocaleTimeString()}</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-zinc-500 text-xs uppercase border-b border-zinc-800">
              <th className="text-left py-2 pr-4">Name</th>
              <th className="text-left py-2 pr-4">Wallet</th>
              <th className="text-right py-2 pr-4">Amount</th>
              <th className="text-right py-2 pr-4">ZEC</th>
              <th className="text-center py-2">Payout</th>
            </tr>
          </thead>
          <tbody>
            {employees.map((emp, i) => {
              const zec = emp.currency === 'ZEC' ? emp.amount : usdToZec(emp.amount, zecUsdRate);
              return (
                <tr key={i} className="border-b border-zinc-800/50 hover:bg-zinc-900/50">
                  <td className="py-2.5 pr-4 text-white">{emp.name}</td>
                  <td className="py-2.5 pr-4 font-mono text-zinc-400 text-xs">{truncateAddr(emp.wallet)}</td>
                  <td className="py-2.5 pr-4 text-right text-zinc-300">
                    {emp.currency === 'USD' ? `$${emp.amount.toFixed(2)}` : `${formatZec(emp.amount)} ZEC`}
                  </td>
                  <td className="py-2.5 pr-4 text-right text-amber-400 font-mono">{formatZec(zec)}</td>
                  <td className="py-2.5 text-center">
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      emp.payoutCurrency === 'ZEC' ? 'bg-amber-400/10 text-amber-400' : 'bg-blue-400/10 text-blue-400'
                    }`}>
                      {emp.payoutCurrency}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex justify-between items-center p-4 bg-zinc-900 rounded-lg border border-zinc-800">
        <div>
          <p className="text-xs text-zinc-500 uppercase">Total</p>
          <p className="text-xl font-bold text-amber-400 font-mono">{formatZec(totalZec)} ZEC</p>
          <p className="text-xs text-zinc-500">~${totalUsd.toFixed(2)} USD</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-zinc-500">{employees.length} recipients</p>
        </div>
      </div>

      <button
        onClick={onGenerate}
        className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-zinc-900 font-semibold rounded-lg transition text-lg"
      >
        Generate Payment URI
      </button>
    </div>
  );
}
