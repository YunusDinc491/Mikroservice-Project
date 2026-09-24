import { useState } from 'react';
import { ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import Animate from '@/components/Animate';
import TradeCard from '@/components/portfolio/TradeCard';
import SelectedCryptoChart from '@/components/portfolio/SelectedCryptoChart';
import { getCurrentUser, type BuyResult, type SellResult } from '@/lib/api';
import { formatUsd } from '@/lib/format';

type Activity =
  | { type: 'buy'; result: BuyResult; at: number }
  | { type: 'sell'; result: SellResult; at: number };

export default function TradePage() {
  const user = getCurrentUser();
  const userId = user?.sub ?? '';
  const [activity, setActivity] = useState<Activity[]>([]);
  const [symbol, setSymbol] = useState('BTC');

  return (
    <>
      <Animate delay={250} direction="up">
        <h1 className="text-white text-[28px] sm:text-[34px] font-normal leading-[1.1] mb-1">
          Al / Sat
        </h1>
        <p className="text-white/50 text-[14px] sm:text-[15px] font-[450] mb-8">
          Kripto varlıklarınızı anlık fiyattan alın veya satın.
        </p>
      </Animate>

      <Animate delay={350} direction="up" className="mb-6">
        <SelectedCryptoChart symbol={symbol} />
      </Animate>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Animate delay={450} direction="up">
          <TradeCard
            mode="buy"
            userId={userId}
            symbol={symbol}
            onSymbolChange={setSymbol}
            onSuccess={(result) => {
              const buyResult = result as BuyResult;
              setActivity((a) => [{ type: 'buy', result: buyResult, at: Date.now() }, ...a]);
            }}
          />
        </Animate>
        <Animate delay={550} direction="up">
          <TradeCard
            mode="sell"
            userId={userId}
            symbol={symbol}
            onSymbolChange={setSymbol}
            onSuccess={(result) => {
              const sellResult = result as SellResult;
              setActivity((a) => [{ type: 'sell', result: sellResult, at: Date.now() }, ...a]);
            }}
          />
        </Animate>
      </div>

      <Animate delay={650} direction="up">
        <ActivityCard activity={activity} />
      </Animate>
    </>
  );
}

function ActivityCard({ activity }: { activity: Activity[] }) {
  if (activity.length === 0) {
    return (
      <div className="rounded-[24px] sm:rounded-[28px] bg-[rgba(17,16,15,0.35)] backdrop-blur-[24px] border border-white/[0.08] p-6 sm:p-8 text-center">
        <p className="text-white/40 text-[14px] font-[450]">
          Bu oturumda henüz işlem yapmadınız.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-[24px] sm:rounded-[28px] bg-[rgba(17,16,15,0.55)] backdrop-blur-[24px] border border-white/[0.08] p-6 sm:p-8">
      <p className="text-white text-[16px] sm:text-[18px] font-[450] mb-4">
        Son İşlemler (bu oturum)
      </p>
      <div className="flex flex-col gap-1">
        {activity.map((item, i) => (
          <div
            key={i}
            className="flex items-center justify-between py-3 border-b border-white/[0.06] last:border-0"
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-[32px] h-[32px] flex items-center justify-center rounded-[9px] border ${
                  item.type === 'buy'
                    ? 'bg-emerald-400/10 border-emerald-400/20'
                    : 'bg-red-400/10 border-red-400/20'
                }`}
              >
                {item.type === 'buy' ? (
                  <ArrowDownLeft className="w-[14px] h-[14px] text-emerald-300" />
                ) : (
                  <ArrowUpRight className="w-[14px] h-[14px] text-red-300" />
                )}
              </div>
              <div>
                <p className="text-white text-[14px] font-[450]">
                  {item.type === 'buy' ? 'Alım' : 'Satım'} · {item.result.symbol.toUpperCase()}
                </p>
                <p className="text-white/40 text-[12px] font-[450]">
                  {new Date(item.at).toLocaleTimeString('tr-TR')}
                </p>
              </div>
            </div>
            <p className="text-white/80 text-[14px] font-[450]">
              {item.type === 'buy'
                ? formatUsd((item.result as BuyResult).pricePerUnit * item.result.quantity)
                : formatUsd((item.result as SellResult).receivedUsd)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
