import { Employee } from './types';
import { usdToZec } from './price';

/**
 * Generate a ZIP-321 compliant multi-payment URI.
 * Spec: https://zips.z.cash/zip-0321
 *
 * Format: zcash:?address=<addr>&amount=<zec>&memo=<base64url>
 *         &address.1=<addr>&amount.1=<zec>&memo.1=<base64url>
 *         ...
 */
export function generateZip321Uri(
  employees: Employee[],
  zecUsdRate: number,
  options?: { includeMemo?: boolean; batchLabel?: string }
): string {
  if (employees.length === 0) return '';

  const params: string[] = [];

  employees.forEach((emp, idx) => {
    const suffix = idx === 0 ? '' : `.${idx}`;
    const zecAmount =
      emp.currency === 'ZEC' ? emp.amount : usdToZec(emp.amount, zecUsdRate);

    params.push(`address${suffix}=${emp.wallet}`);
    params.push(`amount${suffix}=${zecAmount.toFixed(8)}`);

    if (options?.includeMemo) {
      const memoText = buildMemo(emp, options.batchLabel);
      const encoded = base64urlEncode(memoText);
      params.push(`memo${suffix}=${encoded}`);
    }
  });

  return `zcash:?${params.join('&')}`;
}

function buildMemo(emp: Employee, batchLabel?: string): string {
  const parts = [`ZecPay: ${emp.name}`];
  if (batchLabel) parts.push(batchLabel);
  if (emp.payoutCurrency === 'USDC') {
    parts.push('USDC-intent');
  }
  return parts.join(' | ');
}

function base64urlEncode(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  bytes.forEach(b => (binary += String.fromCharCode(b)));
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Parse a ZIP-321 URI back into components (for verification).
 */
export function parseZip321Uri(uri: string): { address: string; amount: string; memo?: string }[] {
  if (!uri.startsWith('zcash:?')) return [];

  const paramStr = uri.slice(7);
  const params = new URLSearchParams(paramStr);
  const results: { address: string; amount: string; memo?: string }[] = [];

  // First payment (no suffix)
  const addr0 = params.get('address');
  const amt0 = params.get('amount');
  if (addr0 && amt0) {
    results.push({ address: addr0, amount: amt0, memo: decodeMemo(params.get('memo')) });
  }

  // Subsequent payments (.1, .2, ...)
  for (let i = 1; i < 100; i++) {
    const addr = params.get(`address.${i}`);
    const amt = params.get(`amount.${i}`);
    if (!addr || !amt) break;
    results.push({ address: addr, amount: amt, memo: decodeMemo(params.get(`memo.${i}`)) });
  }

  return results;
}

function decodeMemo(encoded: string | null): string | undefined {
  if (!encoded) return undefined;
  try {
    const padded = encoded.replace(/-/g, '+').replace(/_/g, '/');
    const binary = atob(padded);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return new TextDecoder().decode(bytes);
  } catch {
    return undefined;
  }
}

/**
 * Generate a ZIP-321 URI for a single test transaction.
 */
export function generateTestUri(employee: Employee, testAmountZec = 0.001): string {
  const memo = `ZecPay test: ${employee.name}`;
  const encoded = base64urlEncode(memo);
  return `zcash:?address=${employee.wallet}&amount=${testAmountZec.toFixed(8)}&memo=${encoded}`;
}

export function getTotalZec(employees: Employee[], zecUsdRate: number): number {
  return employees.reduce((sum, emp) => {
    const zec = emp.currency === 'ZEC' ? emp.amount : usdToZec(emp.amount, zecUsdRate);
    return sum + zec;
  }, 0);
}
