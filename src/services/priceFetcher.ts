// Price Fetcher Service - CoinGecko API client
// Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6

import axios, { AxiosError } from 'axios';
import {
  TradingPair,
  Exchange,
  PriceData,
  CoinGeckoTickersResponse,
  CoinGeckoTicker,
} from '../types';

// CoinGecko API base URL
const COINGECKO_API_BASE = 'https://api.coingecko.com/api/v3';

// Exchange identifier mapping (CoinGecko uses 'gdax' for Coinbase)
const EXCHANGE_IDENTIFIERS: Record<Exchange, string> = {
  binance: 'binance',
  coinbase: 'gdax',
  kraken: 'kraken',
};

// Reverse mapping for converting API identifiers back to Exchange type
const IDENTIFIER_TO_EXCHANGE: Record<string, Exchange> = {
  binance: 'binance',
  gdax: 'coinbase',
  kraken: 'kraken',
};

// Coin ID mapping for common cryptocurrencies (CoinGecko uses slugs)
const COIN_ID_MAP: Record<string, string> = {
  BTC: 'bitcoin',
  ETH: 'ethereum',
  USDT: 'tether',
  USDC: 'usd-coin',
  BNB: 'binancecoin',
  XRP: 'ripple',
  ADA: 'cardano',
  DOGE: 'dogecoin',
  SOL: 'solana',
  DOT: 'polkadot',
  MATIC: 'matic-network',
  LTC: 'litecoin',
  AVAX: 'avalanche-2',
  LINK: 'chainlink',
  UNI: 'uniswap',
};

// Retry configuration
const RETRY_DELAY_MS = 30000; // 30 seconds
const MAX_RETRIES = 3;

// State for tracking API calls and errors
interface PriceFetcherState {
  apiCallCount: number;
  lastUpdateTime: Date | null;
  lastError: string | null;
  isRetrying: boolean;
  retryCount: number;
  retryTimeoutId: NodeJS.Timeout | null;
}

let state: PriceFetcherState = {
  apiCallCount: 0,
  lastUpdateTime: null,
  lastError: null,
  isRetrying: false,
  retryCount: 0,
  retryTimeoutId: null,
};

// Error callback for notifying UI
type ErrorCallback = (error: string) => void;
let errorCallback: ErrorCallback | null = null;

/**
 * Set error callback for UI notifications
 * Requirements: 2.3
 */
export function setErrorCallback(callback: ErrorCallback | null): void {
  errorCallback = callback;
}

/**
 * Notify error to UI
 */
function notifyError(message: string): void {
  state.lastError = message;
  if (errorCallback) {
    errorCallback(message);
  }
}

/**
 * Sleep utility for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    state.retryTimeoutId = setTimeout(resolve, ms);
  });
}

/**
 * Cancel any pending retry
 */
export function cancelRetry(): void {
  if (state.retryTimeoutId) {
    clearTimeout(state.retryTimeoutId);
    state.retryTimeoutId = null;
  }
  state.isRetrying = false;
  state.retryCount = 0;
}

/**
 * Get CoinGecko coin ID from symbol
 */
export function getCoinId(symbol: string): string | null {
  return COIN_ID_MAP[symbol.toUpperCase()] || null;
}

/**
 * Parse CoinGecko ticker to PriceData format
 * Requirements: 2.2
 */
export function parseTickerToPriceData(
  ticker: CoinGeckoTicker,
  pair: TradingPair
): PriceData | null {
  const exchangeId = ticker.market.identifier.toLowerCase();
  
  // Skip if not a supported exchange - use hasOwnProperty to avoid prototype pollution
  if (!Object.prototype.hasOwnProperty.call(IDENTIFIER_TO_EXCHANGE, exchangeId)) {
    return null;
  }
  
  const exchange = IDENTIFIER_TO_EXCHANGE[exchangeId];

  // Validate price is positive
  if (ticker.last <= 0) {
    return null;
  }

  return {
    pair,
    exchange,
    price: ticker.last,
    volume24h: ticker.volume,
    bidAskSpread: ticker.bid_ask_spread_percentage || 0,
    timestamp: new Date(ticker.timestamp || ticker.last_traded_at),
    isStale: ticker.is_stale || ticker.is_anomaly,
  };
}

/**
 * Filter tickers by selected exchanges
 * Requirements: 2.2, 2.6
 */
export function filterTickersByExchanges(
  tickers: CoinGeckoTicker[],
  exchanges: Exchange[]
): CoinGeckoTicker[] {
  const exchangeIdentifiers = exchanges.map((e) => EXCHANGE_IDENTIFIERS[e]);
  return tickers.filter((ticker) =>
    exchangeIdentifiers.includes(ticker.market.identifier.toLowerCase())
  );
}

/**
 * Transform CoinGecko API response to PriceData array
 * Requirements: 2.2
 */
export function transformApiResponse(
  response: CoinGeckoTickersResponse,
  pair: TradingPair,
  exchanges: Exchange[]
): PriceData[] {
  const filteredTickers = filterTickersByExchanges(response.tickers, exchanges);
  const priceDataList: PriceData[] = [];

  for (const ticker of filteredTickers) {
    // Also filter by target currency matching the quote
    if (ticker.target.toUpperCase() !== pair.quote.toUpperCase()) {
      continue;
    }

    const priceData = parseTickerToPriceData(ticker, pair);
    if (priceData) {
      priceDataList.push(priceData);
    }
  }

  return priceDataList;
}

/**
 * Fetch prices from CoinGecko API for a single trading pair with retry logic
 * Requirements: 2.1, 2.2, 2.3, 2.6
 */
export async function fetchPricesForPair(
  pair: TradingPair,
  exchanges: Exchange[],
  enableRetry: boolean = true
): Promise<PriceData[]> {
  const coinId = getCoinId(pair.base);

  if (!coinId) {
    throw new Error(`Unknown coin symbol: ${pair.base}`);
  }

  const url = `${COINGECKO_API_BASE}/coins/${coinId}/tickers`;

  const attemptFetch = async (): Promise<PriceData[]> => {
    try {
      const response = await axios.get<CoinGeckoTickersResponse>(url, {
        params: {
          include_exchange_logo: false,
          depth: false,
        },
        timeout: 10000, // 10 second timeout
      });

      state.apiCallCount++;
      state.lastUpdateTime = new Date();
      state.lastError = null;
      state.retryCount = 0;
      state.isRetrying = false;

      return transformApiResponse(response.data, pair, exchanges);
    } catch (error) {
      const axiosError = error as AxiosError;
      let errorMessage: string;

      if (axiosError.response?.status === 429) {
        errorMessage = 'Rate limit exceeded. Please wait before making more requests.';
      } else if (axiosError.code === 'ECONNABORTED') {
        errorMessage = 'Request timed out. Please check your connection.';
      } else if (axiosError.code === 'ERR_NETWORK' || !axiosError.response) {
        errorMessage = 'Network error. Please check your internet connection.';
      } else {
        errorMessage = axiosError.message || 'Failed to fetch prices';
      }

      notifyError(errorMessage);

      // Retry logic for network failures
      if (enableRetry && state.retryCount < MAX_RETRIES) {
        state.isRetrying = true;
        state.retryCount++;
        notifyError(`${errorMessage} Retrying in 30 seconds... (Attempt ${state.retryCount}/${MAX_RETRIES})`);
        await sleep(RETRY_DELAY_MS);
        return attemptFetch();
      }

      throw new Error(errorMessage);
    }
  };

  return attemptFetch();
}

/**
 * Fetch prices for multiple trading pairs
 * Requirements: 2.1, 2.2, 2.6
 */
export async function fetchPrices(
  pairs: TradingPair[],
  exchanges: Exchange[],
  enableRetry: boolean = true
): Promise<PriceData[]> {
  const allPriceData: PriceData[] = [];

  for (const pair of pairs) {
    try {
      const priceData = await fetchPricesForPair(pair, exchanges, enableRetry);
      allPriceData.push(...priceData);
    } catch (error) {
      // Log error but continue with other pairs
      console.error(`Failed to fetch prices for ${pair.symbol}:`, error);
    }
  }

  return allPriceData;
}

/**
 * Get remaining API calls estimate
 * Note: CoinGecko free tier has rate limits but no monthly cap
 * Requirements: 2.4, 2.5
 */
export function getRemainingCalls(): number {
  // CoinGecko free tier: ~10-30 calls per minute
  // We track calls for user awareness, not hard limit
  return Math.max(0, 10000 - state.apiCallCount);
}

/**
 * Get last update time
 * Requirements: 2.4
 */
export function getLastUpdateTime(): Date | null {
  return state.lastUpdateTime;
}

/**
 * Get last error message
 * Requirements: 2.3
 */
export function getLastError(): string | null {
  return state.lastError;
}

/**
 * Check if API call count is approaching limit
 * Requirements: 2.5
 */
export function isApproachingLimit(): boolean {
  return state.apiCallCount > 9000;
}

/**
 * Reset API call count (for testing or monthly reset)
 */
export function resetApiCallCount(): void {
  state.apiCallCount = 0;
}

/**
 * Get current state (for testing)
 */
export function getState(): PriceFetcherState {
  return { ...state };
}

/**
 * Check if currently retrying
 * Requirements: 2.3
 */
export function isRetrying(): boolean {
  return state.isRetrying;
}

/**
 * Get retry count
 * Requirements: 2.3
 */
export function getRetryCount(): number {
  return state.retryCount;
}

/**
 * Reset state (for testing)
 */
export function resetState(): void {
  cancelRetry();
  state = {
    apiCallCount: 0,
    lastUpdateTime: null,
    lastError: null,
    isRetrying: false,
    retryCount: 0,
    retryTimeoutId: null,
  };
}

// Export constants for testing
export { EXCHANGE_IDENTIFIERS, IDENTIFIER_TO_EXCHANGE, COIN_ID_MAP, RETRY_DELAY_MS, MAX_RETRIES };
