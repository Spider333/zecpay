import { describe, it, expect } from 'vitest';
import { generateZip321Uri, parseZip321Uri, getTotalZec, generateTestUri } from '../zip321';
import { Employee } from '../types';

const makeEmployee = (overrides: Partial<Employee> = {}): Employee => ({
  name: 'Alice',
  wallet: 'zs1j29m7zdhhyy2eqfzlfejzl7e0fz09c6rjgkhrdx63hjsck53gfyjhtaatgcwkttcp3gngmdfrlsy',
  amount: 500,
  currency: 'USD',
  payoutCurrency: 'ZEC',
  testTxSent: false,
  verified: false,
  paid: false,
  ...overrides,
});

describe('generateZip321Uri', () => {
  it('generates correct URI for single employee', () => {
    const uri = generateZip321Uri([makeEmployee()], 50);
    expect(uri).toMatch(/^zcash:\?address=/);
    expect(uri).toContain('amount=10.00000000');
  });

  it('uses correct suffix for multi-employee URIs', () => {
    const emps = [
      makeEmployee({ name: 'Alice' }),
      makeEmployee({ name: 'Bob', wallet: 'zs1qzy3yfd0ghxzled4d3cjyagvqp0n4zfzwkdghtlmlt6mk2603rs2j0awmrhk69twfh4gdxv96ee' }),
    ];
    const uri = generateZip321Uri(emps, 50);
    expect(uri).toContain('address=');
    expect(uri).toContain('address.1=');
    expect(uri).not.toContain('address.0=');
  });

  it('converts USD to ZEC correctly ($500 at $50/ZEC = 10 ZEC)', () => {
    const uri = generateZip321Uri([makeEmployee({ amount: 500, currency: 'USD' })], 50);
    expect(uri).toContain('amount=10.00000000');
  });

  it('passes through ZEC amounts without conversion', () => {
    const uri = generateZip321Uri([makeEmployee({ amount: 3.5, currency: 'ZEC' })], 50);
    expect(uri).toContain('amount=3.50000000');
  });

  it('includes base64url-encoded memo when option set', () => {
    const uri = generateZip321Uri([makeEmployee()], 50, { includeMemo: true });
    expect(uri).toContain('memo=');
  });

  it('returns empty string for empty array', () => {
    expect(generateZip321Uri([], 50)).toBe('');
  });
});

describe('parseZip321Uri', () => {
  it('parses single-payment URI', () => {
    const uri = generateZip321Uri([makeEmployee()], 50);
    const parsed = parseZip321Uri(uri);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].address).toBe(makeEmployee().wallet);
    expect(parsed[0].amount).toBe('10.00000000');
  });

  it('returns empty array for non-zcash URI', () => {
    expect(parseZip321Uri('bitcoin:?addr=abc')).toEqual([]);
  });
});

describe('round-trip generate → parse', () => {
  it('preserves addresses and amounts', () => {
    const emps = [
      makeEmployee({ amount: 500 }),
      makeEmployee({
        name: 'Bob',
        wallet: 'zs1qzy3yfd0ghxzled4d3cjyagvqp0n4zfzwkdghtlmlt6mk2603rs2j0awmrhk69twfh4gdxv96ee',
        amount: 750,
      }),
    ];
    const uri = generateZip321Uri(emps, 50);
    const parsed = parseZip321Uri(uri);
    expect(parsed).toHaveLength(2);
    expect(parsed[0].address).toBe(emps[0].wallet);
    expect(parsed[1].address).toBe(emps[1].wallet);
    expect(parseFloat(parsed[0].amount)).toBeCloseTo(10, 5);
    expect(parseFloat(parsed[1].amount)).toBeCloseTo(15, 5);
  });
});

describe('getTotalZec', () => {
  it('sums mixed USD/ZEC employees correctly', () => {
    const emps = [
      makeEmployee({ amount: 500, currency: 'USD' }),   // 500/50 = 10 ZEC
      makeEmployee({ amount: 5, currency: 'ZEC' }),      // 5 ZEC
    ];
    const total = getTotalZec(emps, 50);
    expect(total).toBeCloseTo(15, 5);
  });

  it('returns 0 for empty array', () => {
    expect(getTotalZec([], 50)).toBe(0);
  });
});

describe('generateTestUri', () => {
  it('generates URI with default 0.001 ZEC test amount', () => {
    const uri = generateTestUri(makeEmployee());
    expect(uri).toMatch(/^zcash:\?address=/);
    expect(uri).toContain('amount=0.00100000');
    expect(uri).toContain('memo=');
  });

  it('includes employee name in memo', () => {
    const uri = generateTestUri(makeEmployee({ name: 'Bob' }));
    // Decode the memo to verify
    const parsed = parseZip321Uri(uri);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].memo).toContain('ZecPay test: Bob');
  });

  it('respects custom test amount', () => {
    const uri = generateTestUri(makeEmployee(), 0.005);
    expect(uri).toContain('amount=0.00500000');
  });
});
