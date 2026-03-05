
import React from 'react';
import { TrendingUp, TrendingDown, MapPin } from 'lucide-react';
import { MANDI_RATES } from '../constants';
import { UserLocation, MandiRate } from '../types';

interface MandiTickerProps {
  userLocation: UserLocation | null;
}

export const MandiTicker: React.FC<MandiTickerProps> = ({ userLocation }) => {
  const [mandiRates, setMandiRates] = React.useState<MandiRate[]>(MANDI_RATES);

  React.useEffect(() => {
    const fetchRates = async () => {
      try {
        const response = await fetch('/api/mandi-rates');
        if (response.ok) {
          const data = await response.json();
          setMandiRates(data);
        }
      } catch (error) {
        console.error("Error fetching mandi rates:", error);
      }
    };
    fetchRates();
  }, []);

  // Live price simulation — fluctuate ±2% every 3 minutes
  React.useEffect(() => {
    const refreshPrices = () => {
      setMandiRates(prev => prev.map(rate => {
        const fluctuation = 1 + (Math.random() * 0.04 - 0.02);
        const newPrice = Math.round(rate.price * fluctuation);
        const newChange = parseFloat((rate.change + (Math.random() * 0.6 - 0.3)).toFixed(1));
        return { ...rate, price: newPrice, change: newChange };
      }));
    };
    const interval = setInterval(refreshPrices, 3 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);
  
  // Sort Logic: If user location exists, move those items to front
  const sortedRates = React.useMemo(() => {
    if (!userLocation) return mandiRates;
    
    const local = mandiRates.filter(r => r.state === userLocation.state);
    const others = mandiRates.filter(r => r.state !== userLocation.state);
    
    return [...local, ...others];
  }, [userLocation, mandiRates]);

  return (
    <div id="mandi-rates" className="w-full bg-white dark:bg-charcoal border-y border-black/5 dark:border-white/5 overflow-hidden py-3 relative z-20 transition-colors duration-500 shadow-sm dark:shadow-none scroll-mt-32">
      <div className="flex animate-marquee whitespace-nowrap gap-12 items-center will-change-transform">
        {/* Duplicate the array 3 times for smooth infinite scroll */}
        {[...sortedRates, ...sortedRates, ...sortedRates].map((rate, index) => {
          
          const isLocal = userLocation && rate.state === userLocation.state;
          
          return (
            <div key={`${rate.crop}-${index}`} className={`flex items-center gap-3 px-4 py-1 border-r border-black/5 dark:border-white/5 last:border-0 ${isLocal ? 'bg-emerald-50/50 dark:bg-emerald-900/10 rounded-lg' : ''}`}>
              
              {isLocal && (
                 <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-bold animate-pulse">NEAR YOU</span>
              )}

              <span className={`font-outfit text-sm font-medium ${isLocal ? 'text-emerald-900 dark:text-emerald-100' : 'text-taupe dark:text-gray-300'}`}>
                {rate.crop}
              </span>
              
              <span className={`font-inter font-bold text-sm ${isLocal ? 'text-emerald-700 dark:text-emerald-400' : 'text-espresso dark:text-white'}`}>
                ₹{rate.price}
              </span>
              
              <div className={`flex items-center gap-1 text-xs font-bold ${rate.change >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                {rate.change >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                <span>{Math.abs(rate.change)}%</span>
              </div>
              
              <div className="flex items-center gap-1">
                 <MapPin size={10} className="text-gray-400" />
                 <span className="text-[10px] font-jakarta text-gray-400 dark:text-gray-500 uppercase tracking-wide font-bold">{rate.location}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};