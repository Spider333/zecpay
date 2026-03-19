import { Employee, RosterEmployee } from './types';

export function employeesToRoster(employees: Employee[]): RosterEmployee[] {
  return employees.map(emp => ({
    name: emp.name,
    wallet: emp.wallet,
    defaultAmount: emp.amount,
    currency: emp.currency,
    payoutCurrency: emp.payoutCurrency,
  }));
}

export function rosterToEmployees(roster: RosterEmployee[]): Employee[] {
  return roster.map(r => ({
    name: r.name,
    wallet: r.wallet,
    amount: r.defaultAmount,
    currency: r.currency,
    payoutCurrency: r.payoutCurrency,
    testTxSent: false,
    verified: false,
    paid: false,
  }));
}
