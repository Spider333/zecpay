export interface Employee {
  name: string;
  wallet: string;
  amount: number;
  currency: 'USD' | 'ZEC';
  payoutCurrency: 'ZEC' | 'USDC';
  testTxSent: boolean;
  verified: boolean;
  paid: boolean;
}

export interface PayrollSchedule {
  startDate: string;       // ISO date
  frequency: 'biweekly' | 'monthly' | 'custom';
  customDays?: number;
  lastProcessedDate?: string;
}

export interface PayrollBatch {
  id: string;
  createdAt: string;
  employees: Employee[];
  zecUsdRate: number;
  rateLockTime: string;
  status: 'draft' | 'preview' | 'executed';
  schedule?: PayrollSchedule;
}

export interface RosterEmployee {
  name: string;
  wallet: string;
  defaultAmount: number;
  currency: 'USD' | 'ZEC';
  payoutCurrency: 'ZEC' | 'USDC';
}

export interface BatchRecord {
  batch: PayrollBatch;
  completedAt: string;
  totalZec: number;
  totalUsd: number;
  hash: string;
}

export interface ZecPayStore {
  version: 1;
  currentBatch: PayrollBatch | null;
  roster: RosterEmployee[];
  history: BatchRecord[];
}
