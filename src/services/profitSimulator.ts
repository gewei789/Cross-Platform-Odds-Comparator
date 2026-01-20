// Profit Simulator Service
// Requirements: 4.1, 4.2, 4.3, 4.4, 4.5

import { SpreadResult, FeeConfig, ProfitResult } from '../types';

/**
 * Interface for Profit Simulator
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5
 */
export interface IProfitSimulator {
  calculateProfit(
    spread: SpreadResult,
    amount: number,
    fees: FeeConfig
  ): ProfitResult;
}

/**
 * Validate trade amount
 * Requirements: 4.1 - Accept and validate numeric value
 * 
 * @param amount - Trade amount to validate
 * @returns true if valid, throws error if invalid
 */
export function validateTradeAmount(amount: number): boolean {
  if (typeof amount !== 'number' || isNaN(amount)) {
    throw new Error('Trade amount must be a valid number');
  }
  if (amount <= 0) {
    throw new Error('Trade amount must be greater than 0');
  }
  if (!isFinite(amount)) {
    throw new Error('Trade amount must be a finite number');
  }
  return true;
}

/**
 * Validate fee configuration
 * Requirements: 4.2, 4.3 - Allow setting buy fee rate, sell fee rate, withdrawal fee, and gas fee
 * 
 * @param fees - Fee configuration to validate
 * @returns true if valid, throws error if invalid
 */
export function validateFeeConfig(fees: FeeConfig): boolean {
  // Validate buy fee rate
  if (typeof fees.buyFeeRate !== 'number' || isNaN(fees.buyFeeRate)) {
    throw new Error('Buy fee rate must be a valid number');
  }
  if (fees.buyFeeRate < 0 || fees.buyFeeRate >= 1) {
    throw new Error('Buy fee rate must be between 0 and 1 (exclusive)');
  }
  
  // Validate sell fee rate
  if (typeof fees.sellFeeRate !== 'number' || isNaN(fees.sellFeeRate)) {
    throw new Error('Sell fee rate must be a valid number');
  }
  if (fees.sellFeeRate < 0 || fees.sellFeeRate >= 1) {
    throw new Error('Sell fee rate must be between 0 and 1 (exclusive)');
  }
  
  // Validate withdrawal fee
  if (typeof fees.withdrawalFee !== 'number' || isNaN(fees.withdrawalFee)) {
    throw new Error('Withdrawal fee must be a valid number');
  }
  if (fees.withdrawalFee < 0) {
    throw new Error('Withdrawal fee must be non-negative');
  }
  
  // Validate gas fee
  if (typeof fees.gasFee !== 'number' || isNaN(fees.gasFee)) {
    throw new Error('Gas fee must be a valid number');
  }
  if (fees.gasFee < 0) {
    throw new Error('Gas fee must be non-negative');
  }
  
  return true;
}

/**
 * Calculate gross profit from spread
 * Gross profit is the raw profit before any fees
 * 
 * @param buyPrice - Price at buy exchange
 * @param sellPrice - Price at sell exchange
 * @param amount - Trade amount (in base currency units)
 * @returns Gross profit in quote currency
 */
export function calculateGrossProfit(
  buyPrice: number,
  sellPrice: number,
  amount: number
): number {
  // Buy amount in quote currency
  const buyAmount = amount * buyPrice;
  // Sell amount in quote currency
  const sellAmount = amount * sellPrice;
  // Gross profit = sell - buy
  return sellAmount - buyAmount;
}

/**
 * Calculate total fees for a trade
 * Requirements: 4.2, 4.3
 * 
 * @param buyAmount - Amount spent on buying (in quote currency)
 * @param sellAmount - Amount received from selling (in quote currency)
 * @param fees - Fee configuration
 * @returns Total fees in quote currency
 */
export function calculateTotalFees(
  buyAmount: number,
  sellAmount: number,
  fees: FeeConfig
): number {
  // Buy fee = buyAmount * buyFeeRate
  const buyFee = buyAmount * fees.buyFeeRate;
  // Sell fee = sellAmount * sellFeeRate
  const sellFee = sellAmount * fees.sellFeeRate;
  // Total fees = buy fee + sell fee + withdrawal fee + gas fee
  return buyFee + sellFee + fees.withdrawalFee + fees.gasFee;
}

/**
 * Calculate net profit using the formula:
 * Net Profit = (Sell Amount × (1 - Sell Fee Rate)) - (Buy Amount × (1 + Buy Fee Rate)) - Withdrawal Fee - Gas Fee
 * 
 * Requirements: 4.4
 * 
 * @param sellAmount - Amount received from selling (in quote currency)
 * @param buyAmount - Amount spent on buying (in quote currency)
 * @param fees - Fee configuration
 * @returns Net profit in quote currency
 */
export function calculateNetProfit(
  sellAmount: number,
  buyAmount: number,
  fees: FeeConfig
): number {
  // Apply the formula from requirements 4.4:
  // Net Profit = (Sell Amount × (1 - Sell Fee Rate)) - (Buy Amount × (1 + Buy Fee Rate)) - Withdrawal Fee - Gas Fee
  const sellAfterFee = sellAmount * (1 - fees.sellFeeRate);
  const buyWithFee = buyAmount * (1 + fees.buyFeeRate);
  return sellAfterFee - buyWithFee - fees.withdrawalFee - fees.gasFee;
}

/**
 * Calculate profit for an arbitrage opportunity
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5
 * 
 * @param spread - Spread result containing buy/sell prices and exchanges
 * @param amount - Trade amount in base currency units (e.g., number of ETH)
 * @param fees - Fee configuration including buy/sell fee rates, withdrawal fee, and gas fee
 * @returns ProfitResult with grossProfit, totalFees, netProfit, and isProfitable
 */
export function calculateProfit(
  spread: SpreadResult,
  amount: number,
  fees: FeeConfig
): ProfitResult {
  // Validate inputs
  validateTradeAmount(amount);
  validateFeeConfig(fees);
  
  // Calculate amounts in quote currency
  const buyAmount = amount * spread.buyPrice;
  const sellAmount = amount * spread.sellPrice;
  
  // Calculate gross profit (before fees)
  const grossProfit = calculateGrossProfit(spread.buyPrice, spread.sellPrice, amount);
  
  // Calculate total fees
  const totalFees = calculateTotalFees(buyAmount, sellAmount, fees);
  
  // Calculate net profit using the formula from requirements 4.4
  const netProfit = calculateNetProfit(sellAmount, buyAmount, fees);
  
  // Determine if profitable
  const isProfitable = netProfit > 0;
  
  return {
    grossProfit,
    totalFees,
    netProfit,
    isProfitable,
  };
}

/**
 * Calculate profit with raw price inputs (without SpreadResult)
 * Useful for direct calculations without a spread object
 * 
 * @param buyPrice - Price at buy exchange
 * @param sellPrice - Price at sell exchange
 * @param amount - Trade amount in base currency units
 * @param fees - Fee configuration
 * @returns ProfitResult with grossProfit, totalFees, netProfit, and isProfitable
 */
export function calculateProfitFromPrices(
  buyPrice: number,
  sellPrice: number,
  amount: number,
  fees: FeeConfig
): ProfitResult {
  // Validate inputs
  validateTradeAmount(amount);
  validateFeeConfig(fees);
  
  if (buyPrice <= 0 || sellPrice <= 0) {
    throw new Error('Prices must be greater than 0');
  }
  
  // Calculate amounts in quote currency
  const buyAmount = amount * buyPrice;
  const sellAmount = amount * sellPrice;
  
  // Calculate gross profit (before fees)
  const grossProfit = sellAmount - buyAmount;
  
  // Calculate total fees
  const totalFees = calculateTotalFees(buyAmount, sellAmount, fees);
  
  // Calculate net profit using the formula from requirements 4.4
  const netProfit = calculateNetProfit(sellAmount, buyAmount, fees);
  
  // Determine if profitable
  const isProfitable = netProfit > 0;
  
  return {
    grossProfit,
    totalFees,
    netProfit,
    isProfitable,
  };
}

/**
 * Create a default fee configuration
 * Provides reasonable defaults for common exchange fees
 * 
 * @returns Default FeeConfig
 */
export function createDefaultFeeConfig(): FeeConfig {
  return {
    buyFeeRate: 0.001,      // 0.1% buy fee
    sellFeeRate: 0.001,     // 0.1% sell fee
    withdrawalFee: 0,       // No withdrawal fee by default
    gasFee: 0,              // No gas fee by default
  };
}

/**
 * Calculate break-even spread percentage
 * Returns the minimum spread needed to cover all fees
 * 
 * @param fees - Fee configuration
 * @param buyPrice - Approximate buy price (for calculating fixed fee impact)
 * @param amount - Trade amount
 * @returns Minimum spread percentage needed to break even
 */
export function calculateBreakEvenSpread(
  fees: FeeConfig,
  buyPrice: number,
  amount: number
): number {
  // Total percentage-based fees
  const percentageFees = fees.buyFeeRate + fees.sellFeeRate;
  
  // Fixed fees as percentage of trade value
  const tradeValue = amount * buyPrice;
  const fixedFeesPercent = tradeValue > 0 
    ? ((fees.withdrawalFee + fees.gasFee) / tradeValue) * 100 
    : 0;
  
  // Total break-even spread (in percentage)
  return (percentageFees * 100) + fixedFeesPercent;
}

/**
 * ProfitSimulator class implementing IProfitSimulator interface
 * Provides an object-oriented interface for profit calculations
 */
export class ProfitSimulator implements IProfitSimulator {
  calculateProfit(
    spread: SpreadResult,
    amount: number,
    fees: FeeConfig
  ): ProfitResult {
    return calculateProfit(spread, amount, fees);
  }
}

// Export a default instance for convenience
export const profitSimulator = new ProfitSimulator();
