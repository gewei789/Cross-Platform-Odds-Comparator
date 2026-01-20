/**
 * Example usage of SpreadList component
 * This demonstrates how to use the SpreadList component with sample data
 */

import { SpreadList } from '../src/components/scanner/SpreadList';
import { SpreadResult, TradingPair, Exchange } from '../src/types';

// Example 1: Basic usage with sample spread data
export function BasicSpreadListExample() {
  const sampleSpreads: SpreadResult[] = [
    {
      pair: { base: 'ETH', quote: 'USDT', symbol: 'ETH/USDT' },
      buyExchange: 'binance' as Exchange,
      sellExchange: 'coinbase' as Exchange,
      buyPrice: 2450.00,
      sellPrice: 2475.00,
      spreadPercent: 1.020, // Profitable opportunity
      timestamp: new Date(),
    },
    {
      pair: { base: 'BTC', quote: 'USD', symbol: 'BTC/USD' },
      buyExchange: 'kraken' as Exchange,
      sellExchange: 'binance' as Exchange,
      buyPrice: 45000.00,
      sellPrice: 45200.00,
      spreadPercent: 0.444, // Smaller but still profitable
      timestamp: new Date(),
    },
    {
      pair: { base: 'ETH', quote: 'USDT', symbol: 'ETH/USDT' },
      buyExchange: 'coinbase' as Exchange,
      sellExchange: 'kraken' as Exchange,
      buyPrice: 2475.00,
      sellPrice: 2460.00,
      spreadPercent: -0.606, // Unprofitable (negative spread)
      timestamp: new Date(),
    },
  ];

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-6">Arbitrage Opportunities</h1>
      <SpreadList spreadResults={sampleSpreads} />
    </div>
  );
}

// Example 2: With click handler
export function InteractiveSpreadListExample() {
  const sampleSpreads: SpreadResult[] = [
    {
      pair: { base: 'ETH', quote: 'USDT', symbol: 'ETH/USDT' },
      buyExchange: 'binance' as Exchange,
      sellExchange: 'coinbase' as Exchange,
      buyPrice: 2450.00,
      sellPrice: 2475.00,
      spreadPercent: 1.020,
      timestamp: new Date(),
    },
  ];

  const handleSpreadClick = (spread: SpreadResult) => {
    console.log('Spread clicked:', spread);
    alert(`
      Arbitrage Opportunity Selected:
      
      Pair: ${spread.pair.symbol}
      Buy at ${spread.buyExchange}: $${spread.buyPrice}
      Sell at ${spread.sellExchange}: $${spread.sellPrice}
      Spread: ${spread.spreadPercent.toFixed(3)}%
    `);
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-6">Interactive Spread List</h1>
      <p className="mb-4 text-gray-600">Click on any row to see details</p>
      <SpreadList 
        spreadResults={sampleSpreads} 
        onSpreadClick={handleSpreadClick}
      />
    </div>
  );
}

// Example 3: Empty state
export function EmptySpreadListExample() {
  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-6">No Data Available</h1>
      <SpreadList spreadResults={[]} />
    </div>
  );
}

// Example 4: Real-world scenario with multiple pairs
export function MultiPairSpreadListExample() {
  const multiPairSpreads: SpreadResult[] = [
    // ETH/USDT opportunities
    {
      pair: { base: 'ETH', quote: 'USDT', symbol: 'ETH/USDT' },
      buyExchange: 'binance' as Exchange,
      sellExchange: 'coinbase' as Exchange,
      buyPrice: 2450.00,
      sellPrice: 2475.00,
      spreadPercent: 1.020,
      timestamp: new Date(),
    },
    {
      pair: { base: 'ETH', quote: 'USDT', symbol: 'ETH/USDT' },
      buyExchange: 'binance' as Exchange,
      sellExchange: 'kraken' as Exchange,
      buyPrice: 2450.00,
      sellPrice: 2460.00,
      spreadPercent: 0.408,
      timestamp: new Date(),
    },
    // BTC/USD opportunities
    {
      pair: { base: 'BTC', quote: 'USD', symbol: 'BTC/USD' },
      buyExchange: 'kraken' as Exchange,
      sellExchange: 'coinbase' as Exchange,
      buyPrice: 45000.00,
      sellPrice: 45300.00,
      spreadPercent: 0.667,
      timestamp: new Date(),
    },
    {
      pair: { base: 'BTC', quote: 'USD', symbol: 'BTC/USD' },
      buyExchange: 'binance' as Exchange,
      sellExchange: 'coinbase' as Exchange,
      buyPrice: 45100.00,
      sellPrice: 45300.00,
      spreadPercent: 0.443,
      timestamp: new Date(),
    },
    // SOL/USDT opportunities
    {
      pair: { base: 'SOL', quote: 'USDT', symbol: 'SOL/USDT' },
      buyExchange: 'binance' as Exchange,
      sellExchange: 'kraken' as Exchange,
      buyPrice: 98.50,
      sellPrice: 99.20,
      spreadPercent: 0.711,
      timestamp: new Date(),
    },
  ];

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-6">Multi-Pair Arbitrage Scanner</h1>
      <p className="mb-4 text-gray-600">
        Monitoring {new Set(multiPairSpreads.map(s => s.pair.symbol)).size} trading pairs 
        across 3 exchanges
      </p>
      <SpreadList spreadResults={multiPairSpreads} />
    </div>
  );
}

// Example 5: Integration with SpreadCalculator service
export function ServiceIntegrationExample() {
  // This would typically be in a React component with state management
  // Showing the pattern for integration
  
  /*
  import { calculateAndSortSpreads } from '../services/spreadCalculator';
  import { PriceData } from '../types';
  
  const [priceData, setPriceData] = useState<PriceData[]>([]);
  const [spreadResults, setSpreadResults] = useState<SpreadResult[]>([]);
  
  useEffect(() => {
    // When price data updates, calculate spreads
    const spreads = calculateAndSortSpreads(priceData);
    setSpreadResults(spreads);
  }, [priceData]);
  
  return <SpreadList spreadResults={spreadResults} />;
  */
  
  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-6">Service Integration Pattern</h1>
      <p className="text-gray-600 mb-4">
        See the code comments for integration pattern with SpreadCalculator service
      </p>
      <pre className="bg-white p-4 rounded-lg border border-gray-200 overflow-x-auto">
        <code>{`
// In your React component:
import { calculateAndSortSpreads } from '../services/spreadCalculator';
import { SpreadList } from '../components/scanner/SpreadList';

function ScannerPage() {
  const [priceData, setPriceData] = useState<PriceData[]>([]);
  const [spreadResults, setSpreadResults] = useState<SpreadResult[]>([]);
  
  useEffect(() => {
    // When price data updates, calculate spreads
    const spreads = calculateAndSortSpreads(priceData);
    setSpreadResults(spreads);
  }, [priceData]);
  
  return (
    <div>
      <SpreadList 
        spreadResults={spreadResults}
        onSpreadClick={(spread) => {
          // Handle spread selection
          console.log('Selected spread:', spread);
        }}
      />
    </div>
  );
}
        `}</code>
      </pre>
    </div>
  );
}

export default BasicSpreadListExample;
