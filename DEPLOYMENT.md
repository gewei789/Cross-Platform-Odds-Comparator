# Deployment Guide

## Vercel Deployment (Recommended)

### 1. Push to GitHub

```bash
git add .
git commit -m "Complete implementation of crypto arbitrage scanner"
git push origin main
```

### 2. Deploy to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New Project"
3. Import your GitHub repository
4. Vercel will auto-detect Next.js settings
5. Click "Deploy"

### 3. Environment Variables (Optional)

If using Stripe payments, add these in Vercel Project Settings:

- `STRIPE_PUBLIC_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_PRICE_ID`

## Local Development

```bash
npm install
npm run dev
# Open http://localhost:3000
```

## Build for Production

```bash
npm run build
npm start
```

## API Usage

### CoinGecko (No API Key Required)

The app uses CoinGecko's free `/coins/{id}/tickers` endpoint:

- Rate limit: ~10-30 calls/minute
- No API key needed for basic usage

### Stripe (Optional)

For payment features, configure Stripe API keys.
Without keys, the upgrade modal will show a placeholder.
