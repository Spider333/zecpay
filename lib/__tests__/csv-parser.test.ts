import { describe, it, expect } from 'vitest';
import { parseCSV, SAMPLE_CSV } from '../csv-parser';

describe('parseCSV', () => {
  it('parses sample CSV with 5 employees and 0 errors', () => {
    const { employees, errors } = parseCSV(SAMPLE_CSV);
    expect(errors).toHaveLength(0);
    expect(employees).toHaveLength(5);
    expect(employees[0].name).toBe('Alice Johnson');
    expect(employees[0].currency).toBe('USD');
    expect(employees[4].currency).toBe('ZEC');
  });

  it('returns error when required columns are missing', () => {
    const csv = 'name,amount\nAlice,500';
    const { employees, errors } = parseCSV(csv);
    expect(employees).toHaveLength(0);
    expect(errors[0]).toMatch(/must have columns/);
  });

  it('returns error for empty CSV', () => {
    const { employees, errors } = parseCSV('');
    expect(employees).toHaveLength(0);
    expect(errors[0]).toMatch(/header row/);
  });

  it('returns error for header-only CSV', () => {
    const { employees, errors } = parseCSV('name,wallet,amount');
    expect(employees).toHaveLength(0);
    expect(errors[0]).toMatch(/header row/);
  });

  it('reports invalid wallet address', () => {
    const csv = 'name,wallet,amount\nAlice,badaddr,500';
    const { employees, errors } = parseCSV(csv);
    expect(employees).toHaveLength(0);
    expect(errors[0]).toMatch(/invalid wallet/);
  });

  it('reports negative amount', () => {
    const csv = 'name,wallet,amount\nAlice,zs1j29m7zdhhyy2eqfzlfejzl7e0fz09c6rjgkhrdx63hjsck53gfyjhtaatgcwkttcp3gngmdfrlsy,-100';
    const { employees, errors } = parseCSV(csv);
    expect(employees).toHaveLength(0);
    expect(errors[0]).toMatch(/invalid amount/);
  });

  it('reports zero amount', () => {
    const csv = 'name,wallet,amount\nAlice,zs1j29m7zdhhyy2eqfzlfejzl7e0fz09c6rjgkhrdx63hjsck53gfyjhtaatgcwkttcp3gngmdfrlsy,0';
    const { employees, errors } = parseCSV(csv);
    expect(employees).toHaveLength(0);
    expect(errors[0]).toMatch(/invalid amount/);
  });

  it('reports NaN amount', () => {
    const csv = 'name,wallet,amount\nAlice,zs1j29m7zdhhyy2eqfzlfejzl7e0fz09c6rjgkhrdx63hjsck53gfyjhtaatgcwkttcp3gngmdfrlsy,abc';
    const { employees, errors } = parseCSV(csv);
    expect(employees).toHaveLength(0);
    expect(errors[0]).toMatch(/invalid amount/);
  });

  it('defaults currency to USD when column missing', () => {
    const csv = 'name,wallet,amount\nAlice,zs1j29m7zdhhyy2eqfzlfejzl7e0fz09c6rjgkhrdx63hjsck53gfyjhtaatgcwkttcp3gngmdfrlsy,500';
    const { employees } = parseCSV(csv);
    expect(employees[0].currency).toBe('USD');
  });

  it('skips blank lines silently', () => {
    const csv = 'name,wallet,amount\n\nAlice,zs1j29m7zdhhyy2eqfzlfejzl7e0fz09c6rjgkhrdx63hjsck53gfyjhtaatgcwkttcp3gngmdfrlsy,500\n\n';
    const { employees, errors } = parseCSV(csv);
    expect(employees).toHaveLength(1);
    expect(errors).toHaveLength(0);
  });

  it('accepts zs address format', () => {
    const csv = 'name,wallet,amount\nAlice,zs1j29m7zdhhyy2eqfzlfejzl7e0fz09c6rjgkhrdx63hjsck53gfyjhtaatgcwkttcp3gngmdfrlsy,500';
    const { employees } = parseCSV(csv);
    expect(employees).toHaveLength(1);
  });

  it('accepts u1 unified address format', () => {
    const csv = 'name,wallet,amount\nDave,u1qry0s5rgk80y7dcfxnqk8xap3xnfkd8zk8x3p0snfg7fhqrj0a3ght09skhw5d2m6ctq3nhxzv,1000';
    const { employees } = parseCSV(csv);
    expect(employees).toHaveLength(1);
  });

  it('accepts t1 transparent address format', () => {
    const csv = 'name,wallet,amount\nBob,t1VpYgkRvJx2h8fRQzjMHSSKMNYCMCxEajr,50';
    const { employees } = parseCSV(csv);
    expect(employees).toHaveLength(1);
  });
});
