let cachedRate: { rate: number; timestamp: number } | null = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function fetchZecPrice(): Promise<number> {
  if (cachedRate && Date.now() - cachedRate.timestamp < CACHE_TTL) {
    return cachedRate.rate;
  }

  try {
    const res = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=zcash&vs_currencies=usd',
      { cache: 'no-store' }
    );
    if (!res.ok) throw new Error(`CoinGecko API error: ${res.status}`);
    const data = await res.json();
    const rate = data.zcash.usd;
    cachedRate = { rate, timestamp: Date.now() };
    return rate;
  } catch (err) {
    // Fallback rate if API fails
    console.error('Failed to fetch ZEC price, using fallback', err);
    return cachedRate?.rate ?? 35.0;
  }
}

export function usdToZec(usd: number, rate: number): number {
  return parseFloat((usd / rate).toFixed(8));
}

export function formatZec(amount: number): string {
  return amount.toFixed(8);
}
