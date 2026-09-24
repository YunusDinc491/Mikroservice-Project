import { useEffect, useState } from 'react';
import { ArrowDownRight, ArrowUpRight, Loader2 } from 'lucide-react';
import Animate from '@/components/Animate';
import PriceLookupCard from '@/components/portfolio/PriceLookupCard';
import { getCryptoPrices, type CryptoPrice } from '@/lib/api';
import { formatUsd } from '@/lib/format';

const POPULAR_SYMBOLS = ['BTC', 'ETH', 'SOL', 'BNB', 'XRP', 'ADA', 'DOGE', 'LTC'];

type CoinState = { status: 'loading' } | { status: 'ready'; price: CryptoPrice } | { status: 'error' };

export default function MarketsPage() {
  const [coins, setCoins] = useState<Record<string, CoinState>>(
    Object.fromEntries(POPULAR_SYMBOLS.map((s) => [s, { status: 'loading' }])),
  );

  useEffect(() => {
    getCryptoPrices(POPULAR_SYMBOLS)
      .then((prices) => {
        const bySymbol = new Map(prices.map((p) => [p.symbol.toUpperCase(), p]));
        setCoins((c) => {
          const next = { ...c };
          for (const symbol of POPULAR_SYMBOLS) {
            const price = bySymbol.get(symbol);
            next[symbol] = price ? { status: 'ready', price } : { status: 'error' };
          }
          return next;
        });
      })
      .catch(() => {
        setCoins((c) => {
          const next = { ...c };
          for (const symbol of POPULAR_SYMBOLS) next[symbol] = { status: 'error' };
          return next;
        });
      });
  }, []);

  return (
    <>
      <Animate delay={250} direction="up">
        <h1 className="text-white text-[28px] sm:text-[34px] font-normal leading-[1.1] mb-1">
          Piyasalar
        </h1>
        <p className="text-white/50 text-[14px] sm:text-[15px] font-[450] mb-8">
          Popüler kripto varlıkların güncel fiyatları.
        </p>
      </Animate>

      <Animate delay={350} direction="up" className="mb-6">
        <PriceLookupCard />
      </Animate>

      <Animate delay={450} direction="up">
        <div className="rounded-[24px] sm:rounded-[28px] bg-[rgba(17,16,15,0.55)] backdrop-blur-[24px] border border-white/[0.08] overflow-hidden">
          <div className="hidden sm:grid grid-cols-[1fr_auto_auto] gap-4 px-6 py-3 border-b border-white/[0.06] text-white/40 text-[12px] font-[450] uppercase tracking-[0.04em]">
            <span>Varlık</span>
            <span className="text-right">Fiyat</span>
            <span className="text-right w-[90px]">24s</span>
          </div>
          <div className="flex flex-col">
            {POPULAR_SYMBOLS.map((symbol) => {
              const state = coins[symbol];
              const change = state.status === 'ready' ? state.price.change24h : null;
              const isUp = (change ?? 0) >= 0;
              return (
                <div
                  key={symbol}
                  className="grid grid-cols-[1fr_auto_auto] gap-4 items-center px-6 py-4 border-b border-white/[0.06] last:border-0"
                >
                  <span className="text-white text-[14px] font-[450] uppercase">{symbol}</span>

                  <span className="text-right">
                    {state.status === 'loading' && (
                      <Loader2 className="w-[15px] h-[15px] text-white/30 animate-spin ml-auto" />
                    )}
                    {state.status === 'error' && <span className="text-white/30 text-[14px]">—</span>}
                    {state.status === 'ready' && (
                      <span className="text-white text-[15px] font-[450]">
                        {formatUsd(state.price.priceUsd)}
                      </span>
                    )}
                  </span>

                  <span className="text-right w-[90px]">
                    {state.status === 'ready' && change !== null ? (
                      <span
                        className={`inline-flex items-center gap-1 justify-end text-[13px] font-[450] ${
                          isUp ? 'text-emerald-400' : 'text-red-400'
                        }`}
                      >
                        {isUp ? (
                          <ArrowUpRight className="w-[13px] h-[13px]" />
                        ) : (
                          <ArrowDownRight className="w-[13px] h-[13px]" />
                        )}
                        {Math.abs(change).toFixed(2)}%
                      </span>
                    ) : (
                      <span className="text-white/20 text-[13px]">—</span>
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </Animate>
    </>
  );
}
