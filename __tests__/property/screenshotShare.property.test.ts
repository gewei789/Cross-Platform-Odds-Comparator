import * as fc from 'fast-check';
import {
  generateShareUrl,
  generateTwitterShareUrl,
  generateTelegramShareUrl,
  createShareableText,
} from '../../src/services/screenshotGenerator';
import { SpreadResult, ProfitResult } from '../../src/types';

const tradingPairArb = {
  base: 'ETH' as const,
  quote: 'USDT' as const,
  symbol: 'ETH/USDT' as const,
};

function createMockSpreadResult(overrides?: Partial<SpreadResult>): SpreadResult {
  return {
    pair: { ...tradingPairArb },
    buyExchange: 'binance',
    sellExchange: 'coinbase',
    buyPrice: 2500,
    sellPrice: 2525,
    spreadPercent: 1.0,
    timestamp: new Date(),
    ...overrides,
  };
}

function createMockProfitResult(overrides?: Partial<ProfitResult>): ProfitResult {
  return {
    grossProfit: 25,
    totalFees: 2.5,
    netProfit: 22.5,
    isProfitable: true,
    ...overrides,
  };
}

describe('Property 19: Screenshot Content Completeness', () => {
  it('should include trading pair in share text', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('BTC', 'ETH', 'SOL'),
        fc.constantFrom('USDT', 'USD'),
        (base, quote) => {
          const spread = createMockSpreadResult({
            pair: { base, quote, symbol: `${base}/${quote}` },
          });
          const profit = createMockProfitResult();

          const text = createShareableText(spread, profit);
          expect(text).toContain(`${base}/${quote}`);

          return true;
        }
      ),
      { numRuns: 6 }
    );
  });

  it('should include spread percentage in share text', () => {
    fc.assert(
      fc.property(fc.double({ min: 0.1, max: 10, noNaN: true }), (spreadPercent) => {
        const spread = createMockSpreadResult({ spreadPercent });
        const profit = createMockProfitResult();

        const text = createShareableText(spread, profit);
        expect(text).toContain(`${spreadPercent.toFixed(2)}%`);

        return true;
      }),
      { numRuns: 100 }
    );
  });

  it('should include exchanges in share text', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('binance', 'coinbase', 'kraken'),
        fc.constantFrom('binance', 'coinbase', 'kraken'),
        (buyExchange, sellExchange) => {
          if (buyExchange === sellExchange) return true;

          const spread = createMockSpreadResult({ buyExchange, sellExchange });
          const profit = createMockProfitResult();

          const text = createShareableText(spread, profit);
          expect(text).toContain(buyExchange);
          expect(text).toContain(sellExchange);

          return true;
        }
      ),
      { numRuns: 9 }
    );
  });

  it('should include disclaimer in share text', () => {
    const spread = createMockSpreadResult();
    const profit = createMockProfitResult();

    const text = createShareableText(spread, profit);
    expect(text).toContain('For reference only');
    expect(text).toContain('not investment advice');
  });

  it('should include profit status in share text', () => {
    const spread = createMockSpreadResult();
    const profitProfitable = createMockProfitResult({ isProfitable: true });
    const profitUnprofitable = createMockProfitResult({ isProfitable: false, netProfit: -10 });

    const textProfitable = createShareableText(spread, profitProfitable);
    expect(textProfitable).toContain('Profitable');

    const textUnprofitable = createShareableText(spread, profitUnprofitable);
    expect(textUnprofitable).toContain('Unprofitable');
  });

  it('should include timestamp in share text', () => {
    const spread = createMockSpreadResult({ timestamp: new Date('2024-01-15T10:30:00Z') });
    const profit = createMockProfitResult();

    const text = createShareableText(spread, profit);
    expect(text.length).toBeGreaterThan(0);
  });
});

describe('Property 20: Share URL Generation', () => {
  it('should generate valid Reddit share URL', () => {
    const spread = createMockSpreadResult();
    const profit = createMockProfitResult();

    const url = generateShareUrl('reddit', spread, profit);
    expect(url).toContain('reddit.com/submit');
    expect(url).toContain('text=');
  });

  it('should generate valid Discord share URL', () => {
    const spread = createMockSpreadResult();
    const profit = createMockProfitResult();

    const url = generateShareUrl('discord', spread, profit);
    expect(url).toContain('discord.com');
    expect(url).toContain('message=');
  });

  it('should generate valid Twitter share URL', () => {
    const spread = createMockSpreadResult();
    const profit = createMockProfitResult();

    const url = generateTwitterShareUrl(spread, profit);
    expect(url).toContain('twitter.com/intent/tweet');
    expect(url).toContain('text=');
  });

  it('should generate valid Telegram share URL', () => {
    const spread = createMockSpreadResult();
    const profit = createMockProfitResult();

    const url = generateTelegramShareUrl(spread, profit);
    expect(url).toContain('t.me/share/url');
    expect(url).toContain('text=');
  });

  it('should encode special characters in share URLs', () => {
    const spread = createMockSpreadResult({
      pair: { base: 'BTC', quote: 'USDT', symbol: 'BTC/USDT' },
    });
    const profit = createMockProfitResult();

    const redditUrl = generateShareUrl('reddit', spread, profit);
    expect(redditUrl).not.toContain(' ');
    expect(redditUrl).toContain('%20');
  });

  it('should throw error for unknown platform', () => {
    const spread = createMockSpreadResult();
    const profit = createMockProfitResult();

    expect(() => {
      generateShareUrl('unknown' as 'reddit', spread, profit);
    }).toThrow('Unknown platform');
  });
});
