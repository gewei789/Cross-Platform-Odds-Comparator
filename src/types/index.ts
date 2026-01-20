// Core TypeScript interfaces and types for Crypto Arbitrage Scanner

/**
 * Trading Pair - represents a cryptocurrency trading pair
 * Requirements: 1.1
 */
export interface TradingPair {
  base: string;      // e.g., "ETH"
  quote: string;     // e.g., "USDT"
  symbol: string;    // e.g., "ETH/USDT"
}

/**
 * Supported exchanges
 * Requirements: 1.3
 */
export type Exchange = 'binance' | 'coinbase' | 'kraken';

/**
 * CoinGecko Ticker - individual ticker from CoinGecko API
 * Matches actual CoinGecko /coins/{id}/tickers response format
 * Requirements: 2.2
 */
export interface CoinGeckoTicker {
  base: string;              // e.g., "ETH"
  target: string;            // e.g., "USDT"
  market: {
    name: string;            // e.g., "Binance"
    identifier: string;      // e.g., "binance", "gdax" (Coinbase), "kraken"
  };
  last: number;              // Last traded price
  volume: number;
  bid_ask_spread_percentage: number;
  timestamp: string;
  last_traded_at: string;
  last_fetch_at: string;
  is_anomaly: boolean;
  is_stale: boolean;
  trade_url: string | null;
  converted_last: {
    usd: number;
  };
  converted_volume: {
    usd: number;
  };
}

/**
 * CoinGecko Tickers API Response
 * Requirements: 2.2
 */
export interface CoinGeckoTickersResponse {
  name: string;
  tickers: CoinGeckoTicker[];
}

/**
 * Transformed Price Data - internal use after parsing API response
 * Requirements: 2.2
 */
export interface PriceData {
  pair: TradingPair;
  exchange: Exchange;
  price: number;            // Current price from exchange
  volume24h: number;
  bidAskSpread: number;     // Bid-ask spread percentage
  timestamp: Date;
  isStale: boolean;         // Data freshness indicator
}

/**
 * Spread Calculation Result
 * Requirements: 3.4
 */
export interface SpreadResult {
  pair: TradingPair;
  buyExchange: Exchange;
  sellExchange: Exchange;
  buyPrice: number;
  sellPrice: number;
  spreadPercent: number;  // ((sellPrice - buyPrice) / buyPrice) * 100
  timestamp: Date;
}

/**
 * Fee Configuration
 * Requirements: 4.2
 */
export interface FeeConfig {
  buyFeeRate: number;      // e.g., 0.001 for 0.1%
  sellFeeRate: number;     // e.g., 0.001 for 0.1%
  withdrawalFee: number;   // Fixed amount in quote currency
  gasFee: number;          // Fixed amount in quote currency
}

/**
 * Profit Calculation Result
 * Requirements: 4.5
 */
export interface ProfitResult {
  grossProfit: number;
  totalFees: number;
  netProfit: number;
  isProfitable: boolean;
}

/**
 * Alert Record
 * Requirements: 5.6
 */
export interface AlertRecord {
  id: string;
  spread: SpreadResult;
  estimatedProfit: ProfitResult;
  triggeredAt: Date;
  acknowledged: boolean;
}

/**
 * User Subscription
 * Requirements: 8.1, 8.5
 */
export interface UserSubscription {
  isPaid: boolean;
  purchaseDate?: Date;
  stripeSessionId?: string;
}

/**
 * App Configuration - stored in localStorage
 * Requirements: All configuration-related
 */
export interface AppConfig {
  selectedPairs: TradingPair[];
  selectedExchanges: Exchange[];
  refreshInterval: number;  // 5-30 seconds
  alertThreshold: number;   // 0.1-10%
  feeConfig: FeeConfig;
  soundEnabled: boolean;
  subscription: UserSubscription;
}

/**
 * Chart Data Point - for spread visualization
 * Requirements: 6.1, 6.2
 */
export interface ChartDataPoint {
  timestamp: Date;
  spreadPercent: number;
  isAlert: boolean;
}
