'use client';

import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Employee } from '@/lib/types';
import { parseZip321Uri } from '@/lib/zip321';
import { usdToZec, formatZec } from '@/lib/price';

interface Props {
  uri: string;
  onBack: () => void;
  onNewBatch: () => void;
  employees: Employee[];
  zecUsdRate: number;
  onConfirmPayment: (index: number) => void;
  onMarkAllPaid: () => void;
  hasRoster?: boolean;
  onSaveRoster?: () => void;
  onDownloadReceipt?: () => void;
}

export default function PaymentUri({ uri, onBack, onNewBatch, employees, zecUsdRate, onConfirmPayment, onMarkAllPaid, hasRoster, onSaveRoster, onDownloadReceipt }: Props) {
  const [copied, setCopied] = useState(false);
  const [showZodlGuide, setShowZodlGuide] = useState(false);
  const parsed = parseZip321Uri(uri);

  const paidCount = employees.filter(e => e.paid).length;
  const allPaid = paidCount === employees.length;

  const zecEmployees = employees.map((e, i) => ({ emp: e, idx: i })).filter(({ emp }) => emp.payoutCurrency === 'ZEC');
  const usdcEmployees = employees.map((e, i) => ({ emp: e, idx: i })).filter(({ emp }) => emp.payoutCurrency === 'USDC');

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(uri);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({ title: 'ZecPay Payment', text: uri });
    } else {
      await copyToClipboard();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="text-zinc-400 hover:text-white text-sm">&larr; Back to preview</button>
        <span className="text-xs text-green-400 bg-green-400/10 px-2 py-1 rounded">ZIP-321 Ready</span>
      </div>

      {/* Zodl instructions */}
      <div className="border border-zinc-800 rounded-lg overflow-hidden">
        <button
          onClick={() => setShowZodlGuide(!showZodlGuide)}
          className="w-full flex items-center justify-between px-4 py-3 bg-zinc-900 text-sm text-zinc-300 hover:text-white transition"
        >
          <span>How to pay with Zodl</span>
          <span className="text-zinc-600">{showZodlGuide ? '−' : '+'}</span>
        </button>
        {showZodlGuide && (
          <div className="px-4 py-3 text-sm text-zinc-400 space-y-2 border-t border-zinc-800">
            <p><span className="text-amber-400 font-mono mr-2">1.</span>Open Zodl wallet on your phone</p>
            <p><span className="text-amber-400 font-mono mr-2">2.</span>Scan the QR code below (or tap &quot;Open in Zodl&quot;)</p>
            <p><span className="text-amber-400 font-mono mr-2">3.</span>Review the payment details and confirm</p>
            <p><span className="text-amber-400 font-mono mr-2">4.</span>Mark each payment as sent in the checklist below</p>
            <div className="mt-2 p-2 bg-blue-400/5 border border-blue-400/20 rounded text-xs text-blue-300">
              USDC recipients: Zodl uses NEAR Intents to auto-swap ZEC→USDC when the recipient also has Zodl. The memo signals USDC intent — no extra action needed.
            </div>
          </div>
        )}
      </div>

      {/* Split payment view */}
      {(usdcEmployees.length > 0) && (
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-3">
            <h3 className="text-xs text-amber-400 uppercase mb-2">ZEC Direct ({zecEmployees.length})</h3>
            {zecEmployees.map(({ emp }) => {
              const zec = emp.currency === 'ZEC' ? emp.amount : usdToZec(emp.amount, zecUsdRate);
              return (
                <div key={emp.wallet} className="flex justify-between text-xs py-1 text-zinc-400">
                  <span>{emp.name}</span>
                  <span className="text-amber-400 font-mono">{formatZec(zec)} ZEC</span>
                </div>
              );
            })}
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-3">
            <h3 className="text-xs text-blue-400 uppercase mb-2">USDC-Intent ({usdcEmployees.length})</h3>
            {usdcEmployees.map(({ emp }) => {
              const zec = emp.currency === 'ZEC' ? emp.amount : usdToZec(emp.amount, zecUsdRate);
              return (
                <div key={emp.wallet} className="flex justify-between text-xs py-1 text-zinc-400">
                  <span>{emp.name}</span>
                  <span className="text-blue-400 font-mono">{formatZec(zec)} ZEC</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* QR Code */}
      <div>
        <p className="text-xs text-zinc-500 mb-2 text-center">Scan with Zodl or any ZIP-321 wallet</p>
        <div className="flex justify-center p-6 bg-white rounded-xl">
          <QRCodeSVG value={uri} size={240} level="M" />
        </div>
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

      {/* Action buttons */}
      <div className="flex gap-2">
        <a
          href={uri}
          className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 text-center text-amber-400 font-semibold rounded-lg transition"
        >
          Open in Zodl
        </a>
        <button
          onClick={handleShare}
          className="px-4 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 rounded-lg transition text-sm"
          title="Share"
        >
          Share
        </button>
      </div>

      {/* Post-payment checklist */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-white">Payment Confirmation</h3>
          <div className="flex items-center gap-3">
            <span className="text-xs text-zinc-500">{paidCount}/{employees.length} confirmed</span>
            {!allPaid && (
              <button
                onClick={onMarkAllPaid}
                className="text-xs text-amber-400 hover:text-amber-300"
              >
                Mark All
              </button>
            )}
          </div>
        </div>
        <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-green-400 transition-all duration-300 rounded-full"
            style={{ width: `${(paidCount / employees.length) * 100}%` }}
          />
        </div>
        <div className="space-y-1">
          {employees.map((emp, i) => (
            <label key={i} className="flex items-center gap-2 py-1.5 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={emp.paid}
                onChange={() => onConfirmPayment(i)}
                className="accent-green-400"
              />
              <span className={emp.paid ? 'text-zinc-500 line-through' : 'text-zinc-300'}>{emp.name}</span>
              <span className={`text-xs ml-auto ${emp.payoutCurrency === 'USDC' ? 'text-blue-400' : 'text-amber-400'}`}>
                {emp.payoutCurrency}
              </span>
            </label>
          ))}
        </div>
        {allPaid && (
          <div className="text-center py-2 text-green-400 text-sm font-medium bg-green-400/5 rounded-lg">
            All payments confirmed
          </div>
        )}
        {allPaid && !hasRoster && onSaveRoster && (
          <button
            onClick={onSaveRoster}
            className="w-full text-xs text-amber-400 hover:text-amber-300 py-1"
          >
            Save team for next time?
          </button>
        )}
        {allPaid && onDownloadReceipt && (
          <button
            onClick={onDownloadReceipt}
            className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-amber-400 rounded-lg text-sm transition"
          >
            Download Receipt
          </button>
        )}
      </div>

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
