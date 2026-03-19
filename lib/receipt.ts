import { BatchRecord } from './types';

export async function hashBatchRecord(record: Omit<BatchRecord, 'hash'>): Promise<string> {
  const payload = JSON.stringify({
    batchId: record.batch.id,
    completedAt: record.completedAt,
    totalZec: record.totalZec,
    totalUsd: record.totalUsd,
    employees: record.batch.employees.map(e => ({
      name: e.name,
      wallet: e.wallet,
      amount: e.amount,
      currency: e.currency,
      payoutCurrency: e.payoutCurrency,
    })),
  });
  const data = new TextEncoder().encode(payload);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export function generateReceipt(record: BatchRecord): string {
  return JSON.stringify({
    type: 'ZecPay Batch Receipt',
    batchId: record.batch.id,
    completedAt: record.completedAt,
    employeeCount: record.batch.employees.length,
    totalZec: record.totalZec,
    totalUsd: record.totalUsd,
    zecUsdRate: record.batch.zecUsdRate,
    employees: record.batch.employees.map(e => ({
      name: e.name,
      wallet: e.wallet,
      amount: e.amount,
      currency: e.currency,
      payoutCurrency: e.payoutCurrency,
    })),
    integrityHash: record.hash,
  }, null, 2);
}

export function downloadReceipt(record: BatchRecord): void {
  const json = generateReceipt(record);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `zecpay-receipt-${record.batch.id.slice(0, 8)}-${record.completedAt.split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
