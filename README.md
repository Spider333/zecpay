# ZecPay — Shielded Payroll with Zcash

**CSV → Preview → ZIP-321 URI → Copy to Zodl**

ZecPay is a client-side payroll tool that converts a CSV of employees and payment amounts into a valid [ZIP-321](https://zips.z.cash/zip-0321) multi-payment URI. Scan the QR code or copy the URI into a Zcash wallet (like [Zodl](https://zodl.xyz)) to execute a shielded batch payment.

## Features

- **CSV import** — Upload a CSV with name, wallet address, amount, currency
- **Live ZEC/USD rate** — Fetched from CoinGecko, cached 5 min
- **ZIP-321 multi-payment URIs** — Spec-compliant, works with Zodl and other wallets
- **QR code** — Scannable payment URI
- **E2E encryption** — All data encrypted in localStorage with NaCl (tweetnacl). Password-derived key via PBKDF2. Nothing leaves your browser.
- **Shielded addresses** — Supports `zs...` (Sapling), `u1...` (unified), and `t1...` (transparent)

## How It Works

1. Set a password (encrypts all local data)
2. Upload a CSV or load the sample
3. Review the batch: names, amounts, USD→ZEC conversion
4. Generate the ZIP-321 URI
5. Copy or scan the QR into your Zcash wallet
6. Execute the payment

## CSV Format

```csv
name,wallet,amount,currency,payout_currency
Alice,zs1abc...,500,USD,ZEC
Bob,zs1def...,0.5,ZEC,ZEC
```

| Column | Required | Values |
|--------|----------|--------|
| name | Yes | Recipient name |
| wallet | Yes | Zcash address (zs, u1, or t1) |
| amount | Yes | Numeric amount |
| currency | No | `USD` (default) or `ZEC` |
| payout_currency | No | `ZEC` (default) or `USDC` |

## What is ZIP-321?

[ZIP-321](https://zips.z.cash/zip-0321) defines a URI format for Zcash payment requests, including multi-recipient payments. Format:

```
zcash:?address=<addr>&amount=<zec>&address.1=<addr2>&amount.1=<zec2>
```

This allows a single URI to encode a batch payroll payment that a compatible wallet can execute in one transaction.

## Tech Stack

- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS
- tweetnacl (encryption)
- qrcode.react (QR generation)
- CoinGecko API (pricing)
- 100% client-side — no backend, no server

## Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploy

```bash
# Push to GitHub, then:
vercel
```

## License

MIT
