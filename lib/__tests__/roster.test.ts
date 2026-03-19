import { describe, it, expect } from 'vitest';
import { employeesToRoster, rosterToEmployees } from '../roster';
import { Employee, RosterEmployee } from '../types';

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

describe('employeesToRoster', () => {
  it('preserves fields with amount → defaultAmount', () => {
    const emp = makeEmployee();
    const [roster] = employeesToRoster([emp]);
    expect(roster.name).toBe(emp.name);
    expect(roster.wallet).toBe(emp.wallet);
    expect(roster.defaultAmount).toBe(emp.amount);
    expect(roster.currency).toBe(emp.currency);
    expect(roster.payoutCurrency).toBe(emp.payoutCurrency);
  });

  it('preserves payoutCurrency for both ZEC and USDC', () => {
    const zecEmp = makeEmployee({ payoutCurrency: 'ZEC' });
    const usdcEmp = makeEmployee({ payoutCurrency: 'USDC' });
    const roster = employeesToRoster([zecEmp, usdcEmp]);
    expect(roster[0].payoutCurrency).toBe('ZEC');
    expect(roster[1].payoutCurrency).toBe('USDC');
  });
});

describe('rosterToEmployees', () => {
  it('sets defaults: testTxSent=false, verified=false, paid=false', () => {
    const roster: RosterEmployee = {
      name: 'Bob',
      wallet: 'zs1abc',
      defaultAmount: 1000,
      currency: 'USD',
      payoutCurrency: 'USDC',
    };
    const [emp] = rosterToEmployees([roster]);
    expect(emp.testTxSent).toBe(false);
    expect(emp.verified).toBe(false);
    expect(emp.paid).toBe(false);
    expect(emp.amount).toBe(1000);
  });
});

describe('round-trip Employee → Roster → Employee', () => {
  it('data survives conversion cycle', () => {
    const original = makeEmployee({ name: 'Carol', amount: 750, payoutCurrency: 'USDC' });
    const roster = employeesToRoster([original]);
    const [roundTripped] = rosterToEmployees(roster);
    expect(roundTripped.name).toBe(original.name);
    expect(roundTripped.wallet).toBe(original.wallet);
    expect(roundTripped.amount).toBe(original.amount);
    expect(roundTripped.currency).toBe(original.currency);
    expect(roundTripped.payoutCurrency).toBe(original.payoutCurrency);
    expect(roundTripped.testTxSent).toBe(false);
    expect(roundTripped.verified).toBe(false);
    expect(roundTripped.paid).toBe(false);
  });
});

describe('multiple employees', () => {
  it('convert correctly as array', () => {
    const emps = [
      makeEmployee({ name: 'Alice', amount: 500 }),
      makeEmployee({ name: 'Bob', amount: 750, payoutCurrency: 'USDC' }),
      makeEmployee({ name: 'Carol', amount: 1000, currency: 'ZEC' }),
    ];
    const roster = employeesToRoster(emps);
    expect(roster).toHaveLength(3);
    const employees = rosterToEmployees(roster);
    expect(employees).toHaveLength(3);
    expect(employees[0].name).toBe('Alice');
    expect(employees[1].name).toBe('Bob');
    expect(employees[2].name).toBe('Carol');
    expect(employees[2].currency).toBe('ZEC');
  });
});
