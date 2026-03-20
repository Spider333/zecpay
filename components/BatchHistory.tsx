'use client';

import { useState } from 'react';
import { BatchRecord } from '@/lib/types';
import { formatZec } from '@/lib/price';

interface Props {
  history: BatchRecord[];
  onBack: () => void;
  onDownloadReceipt: (record: BatchRecord) => void;
}

export default function BatchHistory({ history, onBack, onDownloadReceipt }: Props) {
  const [expanded, setExpanded] = useState<number | null>(null);

  if (history.length === 0) {
    return (
      <div className="space-y-4 animate-fade-in">
        <button onClick={onBack} className="text-zinc-400 hover:text-white text-sm transition-colors">&larr; Back</button>
        <div className="text-center py-16">
          <p className="text-zinc-500 text-lg mb-2">No completed payrolls yet</p>
          <p className="text-zinc-600 text-sm">Completed batches will appear here with downloadable receipts.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="text-zinc-400 hover:text-white text-sm transition-colors">&larr; Back</button>
        <span className="text-xs text-zinc-500">{history.length} batch{history.length !== 1 ? 'es' : ''}</span>
      </div>

      <div className="space-y-3">
        {history.map((record, i) => {
          const date = new Date(record.completedAt);
          const isExpanded = expanded === i;
          return (
            <div key={record.batch.id + i} className="glass rounded-xl overflow-hidden">
              <button
                onClick={() => setExpanded(isExpanded ? null : i)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-zinc-800/30 transition-colors text-left"
              >
                <div>
                  <p className="text-sm text-white">
                    {date.toLocaleDateString()} <span className="text-zinc-500 text-xs">{date.toLocaleTimeString()}</span>
                  </p>
                  <p className="text-xs text-zinc-500">{record.batch.employees.length} employees</p>
                </div>
                <div className="text-right">
                  <p className="text-amber-400 font-mono text-sm">{formatZec(record.totalZec)} ZEC</p>
                  <p className="text-zinc-500 text-xs">~${record.totalUsd.toFixed(2)}</p>
                </div>
              </button>
              {isExpanded && (
                <div className="px-4 py-3 border-t border-zinc-800/50 space-y-2 animate-slide-up">
                  {record.batch.employees.map((emp, j) => (
                    <div key={j} className="flex justify-between text-xs text-zinc-400">
                      <span>{emp.name}</span>
                      <span>
                        {emp.currency === 'USD' ? `$${emp.amount.toFixed(2)}` : `${formatZec(emp.amount)} ZEC`}
                        <span className={`ml-2 ${emp.payoutCurrency === 'USDC' ? 'text-blue-400' : 'text-amber-400'}`}>
                          {emp.payoutCurrency}
                        </span>
                      </span>
                    </div>
                  ))}
                  <div className="pt-2 flex items-center justify-between border-t border-zinc-800/50">
                    <span className="text-xs text-zinc-600 font-mono bg-zinc-950/50 px-2 py-0.5 rounded">#{record.hash.slice(0, 12)}...</span>
                    <button
                      onClick={() => onDownloadReceipt(record)}
                      className="text-xs text-amber-400 hover:text-amber-300 transition-colors"
                    >
                      Download Receipt
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
