# Crypto Arbitrage Scanner

[中文版本](./README_CN.md)

A real-time cryptocurrency arbitrage spread scanner that helps traders discover cross-exchange price difference opportunities.

![Next.js](https://img.shields.io/badge/Next.js-16.1-black)
![React](https://img.shields.io/badge/React-19.2-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![Jest](https://img.shields.io/badge/Jest-30-green)
![License](https://img.shields.io/badge/License-MIT-yellow)

---

## ✨ Features

### Core Functions

- **Real-time Price Fetching** - Get prices from Binance, Coinbase, Kraken via CoinGecko API
- **Spread Calculation** - Automatically calculate buy/sell spread percentages for all exchange combinations
- **Profit Simulation** - Calculate actual net profit after deducting fees
- **Alert System** - Trigger browser notifications when spread exceeds threshold
- **Data Visualization** - Display spread history trends with Chart.js
- **Screenshot Sharing** - Generate opportunity screenshots and share to social platforms

### Four Pages

1. **Configuration Page** - Select trading pairs and exchanges
2. **Scanner Page** - Real-time price and spread monitoring
3. **Simulator Page** - Calculate profits, set alert thresholds, view alert history
4. **Share Page** - Generate screenshots and sharing links

### Technical Highlights

- Pure frontend architecture, all data processing in browser
- User privacy protection, no data upload
- Complete property-based test coverage (fast-check)
- Support for local storage configuration persistence

---

## 🚀 Quick Start

### Install Dependencies

```bash
npm install
```

### Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

### Run Tests

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

### Build for Production

```bash
npm run build
npm start
```

---

## 📖 User Guide

### Step 1: Configuration

1. Visit the app homepage, click **"Start Configuration"**
2. **Select Trading Pairs**:
   - Enter trading pair (e.g., `ETH/USDT`, `BTC/USD`)
   - Or choose from common suggestions
   - Free version supports only 1 trading pair
3. **Select Exchanges**:
   - Check exchanges to monitor (Binance, Coinbase, Kraken)
   - Select at least 2 exchanges
4. Click **"Start Scanning"** to enter the scanner

### Step 2: Scanner Page

**Price Table** - Shows current prices from each exchange:

- Real-time updates (5-30 second refresh interval configurable)
- Shows 24-hour trading volume
- Shows bid-ask spread percentage

**Spread List** - Sorted by spread percentage:

- Green highlight: Positive spread (arbitrage opportunity)
- Gray: Zero or negative spread
- Shows buy/sell exchanges, prices, spread%

**Spread Chart** - Real-time trend chart:

- Shows last 30 minutes of data
- Switchable time ranges (5/15/30 minutes)
- Red markers: Alert trigger points
- Hover for detailed data

### Step 3: Simulator Page

1. **Enter Trade Amount** - Input the amount to trade
2. **Configure Fees**:
   - Buy fee rate (percentage)
   - Sell fee rate (percentage)
   - Withdrawal fee (fixed amount)
   - Gas fee (fixed amount)
3. **View Profit Calculation**:
   - Gross Profit = Sell Amount - Buy Amount
   - Total Fees = Sum of all fees
   - Net Profit = Gross Profit - Total Fees
   - Negative values shown in red, marked "Unprofitable"
4. **Set Alert Threshold**:
   - Slide to select 0.1% - 10%
   - Triggers browser notification when exceeded
5. **View Alert History**:
   - Last 50 alert records
   - Can mark as read or clear all

### Step 4: Share Page

1. **Generate Screenshot**:
   - Click "Generate Screenshot"
   - Includes trading pair, spread, profit, timestamp, disclaimer
   - Watermark at bottom
2. **Download PNG**:
   - Click "Download PNG" to save the image
3. **Share to Social Platforms**:
   - Twitter/X
   - Reddit
   - Discord
   - Telegram

---

## 🏗️ Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── config/page.tsx     # Configuration page
│   ├── scanner/page.tsx    # Scanner page
│   ├── simulator/page.tsx  # Simulator page
│   └── share/page.tsx      # Share page
├── components/             # React components
│   ├── config/            # Configuration components
│   ├── scanner/           # Scanner components
│   ├── simulator/         # Simulator components
│   ├── share/             # Share components
│   ├── layout/            # Layout components (Header, Footer)
│   └── modals/            # Modal components
├── services/              # Business logic services
│   ├── priceFetcher.ts    # Price fetching (CoinGecko API)
│   ├── spreadCalculator.ts # Spread calculation
│   ├── profitSimulator.ts # Profit calculation
│   ├── alertSystem.ts     # Alert system
│   ├── screenshotGenerator.ts # Screenshot generation
│   └── subscriptionManager.ts # Subscription management
├── hooks/                 # Custom React Hooks
│   ├── useScanner.ts      # Scanner logic
│   ├── useAlerts.ts       # Alert logic
│   └── useSubscription.ts # Subscription logic
├── context/               # React Context
│   └── AppContext.tsx     # Global state management
├── types/                 # TypeScript type definitions
│   └── index.ts           # All type definitions
└── utils/                 # Utility functions
    ├── validation.ts      # Input validation
    └── formatting.ts      # Formatting utilities
```

---

## 🧪 Testing

The project uses Jest + React Testing Library + fast-check for testing:

```bash
# Unit tests
npm test -- --testPathPatterns="unit"

# Property tests (fast-check)
npm test -- --testPathPatterns="property"

# All tests
npm test
```

### Test Coverage

- **21 Property Tests** - Using fast-check for property-based testing
- **Unit Tests** - Component and function tests
- **Integration Tests** - Component interaction tests

---

## 📡 API

### CoinGecko API (No API Key Required)

The app uses CoinGecko's free `/coins/{id}/tickers` endpoint:

- Endpoint: `https://api.coingecko.com/api/v3/coins/{id}/tickers`
- Limit: ~10-30 calls/minute
- No API Key required

### Data Format

```typescript
interface PriceData {
  pair: TradingPair; // Trading pair info
  exchange: Exchange; // Exchange (binance | coinbase | kraken)
  price: number; // Current price
  volume24h: number; // 24h trading volume
  bidAskSpread: number; // Bid-ask spread percentage
  timestamp: Date; // Update time
  isStale: boolean; // Whether data is stale
}

interface SpreadResult {
  pair: TradingPair; // Trading pair
  buyExchange: Exchange; // Buy exchange
  sellExchange: Exchange; // Sell exchange
  buyPrice: number; // Buy price
  sellPrice: number; // Sell price
  spreadPercent: number; // Spread percentage
  timestamp: Date; // Calculation time
}

interface ProfitResult {
  grossProfit: number; // Gross profit
  totalFees: number; // Total fees
  netProfit: number; // Net profit
  isProfitable: boolean; // Whether profitable
}
```

---

## 🌐 Deployment

### Vercel Deployment (Recommended)

1. Push code to GitHub:

   ```bash
   git add .
   git commit -m "Complete crypto arbitrage scanner"
   git push origin main
   ```

2. Import repository in [Vercel Dashboard](https://vercel.com/dashboard)

3. Vercel will auto-detect Next.js config, click **Deploy**

### Local Deployment

```bash
npm run build
npm start
```

---

## 🔒 Privacy & Security

- **Pure Frontend Architecture** - All data processing in browser
- **Local Storage** - Configuration data only in localStorage
- **No Data Upload** - User data never sent to any server
- **CoinGecko API** - Direct browser call, no intermediate server

---

## 📝 License

MIT License - See [LICENSE](LICENSE) file for details

---

## 🙏 Acknowledgments

- [CoinGecko](https://www.coingecko.com/) - Free cryptocurrency API
- [Next.js](https://nextjs.org/) - React framework
- [Chart.js](https://www.chartjs.org/) - Charting library
- [html2canvas](https://html2canvas.hertzen.com/) - Screenshot generation
- [Jest](https://jestjs.io/) - Testing framework
- [fast-check](https://fast-check.dev/) - Property testing library

---

**Disclaimer**: This app provides simulation only, not investment advice. Users bear their own trading risks.
