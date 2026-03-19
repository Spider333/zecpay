'use client';

import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { parseZip321Uri } from '@/lib/zip321';

interface Props {
  uri: string;
  onBack: () => void;
  onNewBatch: () => void;
}

export default function PaymentUri({ uri, onBack, onNewBatch }: Props) {
  const [copied, setCopied] = useState(false);
  const parsed = parseZip321Uri(uri);

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(uri);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="text-zinc-400 hover:text-white text-sm">&larr; Back to preview</button>
        <span className="text-xs text-green-400 bg-green-400/10 px-2 py-1 rounded">ZIP-321 Ready</span>
      </div>

      {/* QR Code */}
      <div className="flex justify-center p-6 bg-white rounded-xl">
        <QRCodeSVG value={uri} size={240} level="M" />
      </div>

      {/* URI Display */}
      <div className="relative">
        <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-4 font-mono text-xs text-amber-400 break-all max-h-32 overflow-y-auto">
          {uri}
        </div>
        <button
          onClick={copyToClipboard}
          className={`absolute top-2 right-2 px-3 py-1 rounded text-xs font-medium transition ${
            copied ? 'bg-green-500 text-white' : 'bg-zinc-700 hover:bg-zinc-600 text-zinc-300'
          }`}
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>

      {/* Deep link */}
      <a
        href={uri}
        className="block w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-center text-amber-400 font-semibold rounded-lg transition"
      >
        Open in Zcash Wallet
      </a>

      {/* Parsed verification */}
      <details className="text-xs">
        <summary className="text-zinc-500 cursor-pointer hover:text-zinc-300">Verify parsed URI ({parsed.length} payments)</summary>
        <div className="mt-2 space-y-1 bg-zinc-900 rounded-lg p-3">
          {parsed.map((p, i) => (
            <div key={i} className="flex justify-between text-zinc-400">
              <span className="font-mono">{p.address.slice(0, 12)}...</span>
              <span className="text-amber-400">{p.amount} ZEC</span>
            </div>
          ))}
        </div>
      </details>

      <button
        onClick={onNewBatch}
        className="w-full py-2 border border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500 rounded-lg text-sm transition"
      >
        New Batch
      </button>
    </div>
  );
}
