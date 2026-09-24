import { useEffect, useState } from 'react';
import { ArrowDownRight, ArrowUpRight, Loader2 } from 'lucide-react';
import { getCryptoPriceHistory, getCryptoPrice, type PricePoint } from '@/lib/api';
import { formatUsd } from '@/lib/format';

const WIDTH = 800;
const HEIGHT = 160;
const PADDING = 8;

export default function SelectedCryptoChart({ symbol }: { symbol: string }) {
  const [points, setPoints] = useState<PricePoint[] | null>(null);
  const [price, setPrice] = useState<number | null>(null);
  const [change24h, setChange24h] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!symbol) {
      setPoints(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(false);
    Promise.allSettled([getCryptoPriceHistory(symbol, 1), getCryptoPrice(symbol)])
      .then(([historyResult, priceResult]) => {
        if (cancelled) return;
        const history = historyResult.status === 'fulfilled' ? historyResult.value : [];
        setPoints(history);

        if (priceResult.status === 'fulfilled') {
          setPrice(priceResult.value.priceUsd);
          setChange24h(priceResult.value.change24h);
        } else if (history.length > 0) {
          const first = history[0].priceUsd;
          const last = history[history.length - 1].priceUsd;
          setPrice(last);
          setChange24h(first ? ((last - first) / first) * 100 : null);
        } else {
          setPrice(null);
          setChange24h(null);
        }

        if (history.length === 0) setError(true);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [symbol]);

  const isUp = (change24h ?? 0) >= 0;

  return (
    <div className="w-full h-[220px] rounded-[24px] sm:rounded-[28px] bg-[rgba(17,16,15,0.55)] backdrop-blur-[24px] border border-white/[0.08] p-5 sm:p-6 flex flex-col">
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="text-white/50 text-[12px] font-[450] uppercase tracking-[0.04em] mb-1">
            {symbol ? symbol : 'Sembol seçin'}
          </p>
          {price !== null && (
            <div className="flex items-center gap-2">
              <p className="text-white text-[22px] sm:text-[26px] font-[450] leading-[1]">
                {formatUsd(price)}
              </p>
              {change24h !== null && (
                <span
                  className={`flex items-center gap-0.5 text-[12px] font-[450] ${
                    isUp ? 'text-emerald-400' : 'text-red-400'
                  }`}
                >
                  {isUp ? (
                    <ArrowUpRight className="w-[13px] h-[13px]" />
                  ) : (
                    <ArrowDownRight className="w-[13px] h-[13px]" />
                  )}
                  {Math.abs(change24h).toFixed(2)}%
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 min-h-0 -mx-1">
        {!symbol ? (
          <div className="h-full flex items-center justify-center text-white/30 text-[13px] font-[450]">
            Grafiği görmek için bir sembol yazın
          </div>
        ) : loading ? (
          <div className="h-full flex items-center justify-center text-white/40">
            <Loader2 className="w-[18px] h-[18px] animate-spin" />
          </div>
        ) : error || !points || points.length < 2 ? (
          <div className="h-full flex items-center justify-center text-white/30 text-[13px] font-[450]">
            Grafik verisi alınamadı
          </div>
        ) : (
          <ChartSvg points={points} isUp={isUp} />
        )}
      </div>
    </div>
  );
}

function ChartSvg({ points, isUp }: { points: PricePoint[]; isUp: boolean }) {
  const prices = points.map((p) => p.priceUsd);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min || 1;

  const stepX = (WIDTH - PADDING * 2) / (points.length - 1);
  const coords = points.map((p, i) => {
    const x = PADDING + i * stepX;
    const y = PADDING + (1 - (p.priceUsd - min) / range) * (HEIGHT - PADDING * 2);
    return [x, y] as const;
  });

  const linePath = coords.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`).join(' ');
  const areaPath = `${linePath} L${coords[coords.length - 1][0].toFixed(2)},${HEIGHT - PADDING} L${coords[0][0].toFixed(2)},${HEIGHT - PADDING} Z`;

  const strokeColor = isUp ? '#34d399' : '#f87171';
  const gradientId = isUp ? 'chart-gradient-up' : 'chart-gradient-down';

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      preserveAspectRatio="none"
      className="w-full h-full"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={strokeColor} stopOpacity="0.25" />
          <stop offset="100%" stopColor={strokeColor} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${gradientId})`} stroke="none" />
      <path d={linePath} fill="none" stroke={strokeColor} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}
