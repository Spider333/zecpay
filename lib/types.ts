export interface Employee {
  name: string;
  wallet: string;
  amount: number;
  currency: 'USD' | 'ZEC';
  payoutCurrency: 'ZEC' | 'USDC';
  testTxSent: boolean;
  verified: boolean;
}

export interface PayrollBatch {
  id: string;
  createdAt: string;
  employees: Employee[];
  zecUsdRate: number;
  rateLockTime: string;
  status: 'draft' | 'preview' | 'executed';
}
