import { describe, it, expect, vi, beforeEach } from 'vitest';
import { hashBatchRecord, generateReceipt, downloadReceipt } from '../receipt';
import { BatchRecord, PayrollBatch, Employee } from '../types';

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

function makeBatchRecord(overrides: Partial<BatchRecord> = {}): BatchRecord {
  const batch: PayrollBatch = {
    id: 'batch-abc-123-def-456',
    createdAt: '2026-03-01T10:00:00Z',
    employees: [makeEmployee(), makeEmployee({ name: 'Bob', amount: 750 })],
    zecUsdRate: 50,
    rateLockTime: '2026-03-01T10:00:00Z',
    status: 'executed',
  };
  return {
    batch,
    completedAt: '2026-03-01T12:00:00Z',
    totalZec: 25,
    totalUsd: 1250,
    hash: 'a'.repeat(64),
    ...overrides,
  };
}

describe('hashBatchRecord', () => {
  it('returns 64-char hex string', async () => {
    const record = makeBatchRecord();
    const { hash: _, ...withoutHash } = record;
    const result = await hashBatchRecord(withoutHash);
    expect(result).toMatch(/^[0-9a-f]{64}$/);
  });

  it('is deterministic', async () => {
    const record = makeBatchRecord();
    const { hash: _, ...withoutHash } = record;
    const h1 = await hashBatchRecord(withoutHash);
    const h2 = await hashBatchRecord(withoutHash);
    expect(h1).toBe(h2);
  });

  it('changes when data changes', async () => {
    const r1 = makeBatchRecord();
    const r2 = makeBatchRecord({ totalZec: 99 });
    const { hash: _1, ...w1 } = r1;
    const { hash: _2, ...w2 } = r2;
    const h1 = await hashBatchRecord(w1);
    const h2 = await hashBatchRecord(w2);
    expect(h1).not.toBe(h2);
  });
});

describe('generateReceipt', () => {
  it('returns valid JSON with all fields', () => {
    const record = makeBatchRecord();
    const json = generateReceipt(record);
    const parsed = JSON.parse(json);
    expect(parsed).toHaveProperty('type', 'ZecPay Batch Receipt');
    expect(parsed).toHaveProperty('batchId');
    expect(parsed).toHaveProperty('completedAt');
    expect(parsed).toHaveProperty('employeeCount');
    expect(parsed).toHaveProperty('totalZec');
    expect(parsed).toHaveProperty('totalUsd');
    expect(parsed).toHaveProperty('zecUsdRate');
    expect(parsed).toHaveProperty('employees');
    expect(parsed).toHaveProperty('integrityHash');
  });

  it('includes integrityHash matching record.hash', () => {
    const record = makeBatchRecord({ hash: 'deadbeef'.repeat(8) });
    const parsed = JSON.parse(generateReceipt(record));
    expect(parsed.integrityHash).toBe(record.hash);
  });

  it('employee count matches', () => {
    const record = makeBatchRecord();
    const parsed = JSON.parse(generateReceipt(record));
    expect(parsed.employeeCount).toBe(record.batch.employees.length);
  });
});

describe('downloadReceipt', () => {
  let clickSpy: ReturnType<typeof vi.fn>;
  let anchorEl: Record<string, unknown>;

  beforeEach(() => {
    clickSpy = vi.fn();
    anchorEl = { href: '', download: '', click: clickSpy };

    vi.stubGlobal('document', {
      createElement: vi.fn(() => anchorEl),
      body: {
        appendChild: vi.fn(),
        removeChild: vi.fn(),
      },
    });
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn(() => 'blob:mock-url'),
      revokeObjectURL: vi.fn(),
    });
  });

  it('triggers file download', () => {
    const record = makeBatchRecord();
    downloadReceipt(record);
    expect(document.createElement).toHaveBeenCalledWith('a');
    expect(document.body.appendChild).toHaveBeenCalledWith(anchorEl);
    expect(clickSpy).toHaveBeenCalled();
    expect(document.body.removeChild).toHaveBeenCalledWith(anchorEl);
    expect(URL.createObjectURL).toHaveBeenCalled();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
  });

  it('filename contains batch ID and date', () => {
    const record = makeBatchRecord();
    downloadReceipt(record);
    const filename = anchorEl.download as string;
    expect(filename).toContain('batch-ab');
    expect(filename).toContain('2026-03-01');
    expect(filename).toMatch(/^zecpay-receipt-.*\.json$/);
  });
});
