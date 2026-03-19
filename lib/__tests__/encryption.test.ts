import { describe, it, expect, beforeEach } from 'vitest';
import { encryptAndStore, decryptFromStore, hasStoredData, clearStoredData } from '../encryption';

// Mock localStorage with in-memory Map
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

describe('encryption round-trip', () => {
  beforeEach(() => {
    store.clear();
  });

  it('encrypts and decrypts to identical object', async () => {
    const data = { employees: [{ name: 'Alice', amount: 500 }], rate: 50 };
    await encryptAndStore(data, 'testpass123');
    const result = await decryptFromStore('testpass123');
    expect(result).toEqual(data);
  });

  it('returns null with wrong password', async () => {
    await encryptAndStore({ secret: 'data' }, 'correctpass');
    const result = await decryptFromStore('wrongpass');
    expect(result).toBeNull();
  });
});

describe('hasStoredData', () => {
  beforeEach(() => {
    store.clear();
  });

  it('returns false when nothing stored', () => {
    expect(hasStoredData()).toBe(false);
  });

  it('returns true after encrypting', async () => {
    await encryptAndStore({ test: 1 }, 'pass');
    expect(hasStoredData()).toBe(true);
  });
});

describe('clearStoredData', () => {
  it('removes all stored data', async () => {
    await encryptAndStore({ test: 1 }, 'pass');
    expect(hasStoredData()).toBe(true);
    clearStoredData();
    expect(hasStoredData()).toBe(false);
  });
});
