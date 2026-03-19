import { Employee } from './types';

export function parseCSV(text: string): { employees: Employee[]; errors: string[] } {
  const lines = text.trim().split('\n');
  const errors: string[] = [];
  const employees: Employee[] = [];

  if (lines.length < 2) {
    return { employees: [], errors: ['CSV must have a header row and at least one data row'] };
  }

  const header = lines[0].toLowerCase().split(',').map(h => h.trim());
  const nameIdx = header.indexOf('name');
  const walletIdx = header.indexOf('wallet');
  const amountIdx = header.indexOf('amount');
  const currencyIdx = header.indexOf('currency');
  const payoutIdx = header.indexOf('payout_currency');

  if (nameIdx === -1 || walletIdx === -1 || amountIdx === -1) {
    return { employees: [], errors: ['CSV must have columns: name, wallet, amount'] };
  }

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const cols = line.split(',').map(c => c.trim());
    const name = cols[nameIdx];
    const wallet = cols[walletIdx];
    const amountStr = cols[amountIdx];
    const currency = (cols[currencyIdx]?.toUpperCase() || 'USD') as 'USD' | 'ZEC';
    const payoutCurrency = (cols[payoutIdx]?.toUpperCase() || 'ZEC') as 'ZEC' | 'USDC';

    if (!name) {
      errors.push(`Row ${i + 1}: missing name`);
      continue;
    }

    if (!validateWallet(wallet)) {
      errors.push(`Row ${i + 1}: invalid wallet address "${wallet}"`);
      continue;
    }

    const amount = parseFloat(amountStr);
    if (isNaN(amount) || amount <= 0) {
      errors.push(`Row ${i + 1}: invalid amount "${amountStr}"`);
      continue;
    }

    if (currency !== 'USD' && currency !== 'ZEC') {
      errors.push(`Row ${i + 1}: currency must be USD or ZEC`);
      continue;
    }

    employees.push({
      name,
      wallet,
      amount,
      currency,
      payoutCurrency,
      testTxSent: false,
      verified: false,
      paid: false,
    });
  }

  return { employees, errors };
}

function validateWallet(addr: string): boolean {
  if (!addr) return false;
  // Zcash unified addresses (u1...), shielded (zs...), transparent (t1...)
  if (addr.startsWith('u1') && addr.length >= 50) return true;
  if (addr.startsWith('zs') && addr.length >= 50) return true;
  if (addr.startsWith('t1') && addr.length >= 30) return true;
  return false;
}

export const SAMPLE_CSV = `name,wallet,amount,currency,payout_currency
Alice Johnson,zs1j29m7zdhhyy2eqfzlfejzl7e0fz09c6rjgkhrdx63hjsck53gfyjhtaatgcwkttcp3gngmdfrlsy,500,USD,ZEC
Bob Smith,zs1qzy3yfd0ghxzled4d3cjyagvqp0n4zfzwkdghtlmlt6mk2603rs2j0awmrhk69twfh4gdxv96ee,750,USD,ZEC
Carol Dev,zs1x0cxs5nqhcsxymkg9p97y5xm5x2wrw5s6lzrnllfezvx0n6gz3ts6qlmdnpqxzl7ze3gf0saau3,300,USD,ZEC
Dave Ops,u1qry0s5rgk80y7dcfxnqk8xap3xnfkd8zk8x3p0snfg7fhqrj0a3ght09skhw5d2m6ctq3nhxzv,1000,USD,ZEC
Eve Designer,zs1sgcy20kfntjrp28mj5jmfe0m3w34k7p4r3h0h0r4xq93kxqv0skvyg5nyjf4pz5z3e8f3vl9km,200,ZEC,ZEC`;
