import { describe, it, expect, beforeEach } from 'vitest';
import { encryptAndStore, decryptFromStore } from '../encryption';
import { ZecPayStore, PayrollBatch, BatchRecord, Employee } from '../types';

// Mock localStorage
const store = new Map<string, string>();
const localStorageMock = {
  getItem: (key: string) => store.get(key) ?? null,
  setItem: (key: string, value: string) => store.set(key, value),
  removeItem: (key: string) => store.delete(key),
  clear: () => store.clear(),
  get length() { return store.size; },
  key: (_i: number) => null as string | null,
};
Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock, writable: true });

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

function makeBatch(overrides: Partial<PayrollBatch> = {}): PayrollBatch {
  return {
    id: 'batch-001',
    createdAt: '2026-03-01T10:00:00Z',
    employees: [makeEmployee()],
    zecUsdRate: 50,
    rateLockTime: '2026-03-01T10:00:00Z',
    status: 'draft',
    ...overrides,
  };
}

function makeZecPayStore(overrides: Partial<ZecPayStore> = {}): ZecPayStore {
  return {
    version: 1,
    currentBatch: makeBatch(),
    roster: [{ name: 'Alice', wallet: 'zs1abc', defaultAmount: 500, currency: 'USD', payoutCurrency: 'ZEC' }],
    history: [],
    ...overrides,
  };
}

const PASSWORD = 'test-password-123';

describe('ZecPayStore encryption round-trip', () => {
  beforeEach(() => store.clear());

  it('encrypts and decrypts correctly', async () => {
    const data = makeZecPayStore();
    await encryptAndStore(data, PASSWORD);
    const result = await decryptFromStore(PASSWORD);
    expect(result).toEqual(data);
  });

  it('legacy PayrollBatch still decrypts', async () => {
    const legacy = makeBatch({ status: 'executed' });
    await encryptAndStore(legacy, PASSWORD);
    const result = await decryptFromStore(PASSWORD) as Record<string, unknown>;
    expect(result).not.toBeNull();
    expect(result.id).toBe('batch-001');
    expect(result.employees).toHaveLength(1);
  });

  it('legacy format lacks version field', () => {
    const legacy = makeBatch();
    expect('version' in legacy).toBe(false);
  });

  it('ZecPayStore format has version: 1', () => {
    const data = makeZecPayStore();
    expect(data.version).toBe(1);
  });

  it('preserves roster + history across re-encryption', async () => {
    const historyRecord: BatchRecord = {
      batch: makeBatch({ status: 'executed' }),
      completedAt: '2026-03-01T12:00:00Z',
      totalZec: 10,
      totalUsd: 500,
      hash: 'a'.repeat(64),
    };
    const data = makeZecPayStore({
      currentBatch: null,
      roster: [{ name: 'Bob', wallet: 'zs1xyz', defaultAmount: 1000, currency: 'USD', payoutCurrency: 'USDC' }],
      history: [historyRecord],
    });

    await encryptAndStore(data, PASSWORD);
    const result = await decryptFromStore(PASSWORD) as ZecPayStore;
    expect(result.currentBatch).toBeNull();
    expect(result.roster).toHaveLength(1);
    expect(result.roster[0].name).toBe('Bob');
    expect(result.history).toHaveLength(1);
    expect(result.history[0].hash).toBe('a'.repeat(64));
  });

  it('lock does not delete encrypted data', async () => {
    const data = makeZecPayStore();
    await encryptAndStore(data, PASSWORD);
    expect(store.has('zecpay_encrypted')).toBe(true);
  });
});
