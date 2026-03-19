import { describe, it, expect } from 'vitest';
import { usdToZec, formatZec } from '../price';

describe('usdToZec', () => {
  it('converts $100 at $50/ZEC to 2.00000000', () => {
    expect(usdToZec(100, 50)).toBe(2);
  });

  it('handles repeating decimals with 8-place precision', () => {
    // $1 / $3 = 0.33333333
    expect(usdToZec(1, 3)).toBe(0.33333333);
  });

  it('handles very small amounts', () => {
    const result = usdToZec(0.01, 50);
    expect(result).toBe(0.0002);
  });

  it('handles very large rate', () => {
    const result = usdToZec(100, 1000000);
    expect(result).toBe(0.0001);
  });
});

describe('formatZec', () => {
  it('formats to 8 decimal places', () => {
    expect(formatZec(1.5)).toBe('1.50000000');
  });

  it('formats zero', () => {
    expect(formatZec(0)).toBe('0.00000000');
  });

  it('formats small number', () => {
    expect(formatZec(0.00000001)).toBe('0.00000001');
  });
});
