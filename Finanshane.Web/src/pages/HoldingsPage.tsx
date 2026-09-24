import { useEffect, useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, Loader2, PieChart, Wallet, Coins, Layers } from 'lucide-react';
import { Link } from 'react-router-dom';
import Animate from '@/components/Animate';
import {
  ApiError,
  getCryptoPrices,
  getCurrentUser,
  getHoldings,
  getPortfolioWithRetry,
  getTransactions,
  isBuyTransaction,
  type Holding,
  type PortfolioAccount,
  type Transaction,
} from '@/lib/api';
import { formatUsd } from '@/lib/format';

interface EnrichedHolding extends Holding {
  priceUsd: number | null;
}

export default function HoldingsPage() {
  const user = getCurrentUser();
  const userId = user?.sub ?? '';

  const [portfolio, setPortfolio] = useState<PortfolioAccount | null>(null);
  const [holdings, setHoldings] = useState<EnrichedHolding[] | null>(null);
  const [transactions, setTransactions] = useState<Transaction[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    Promise.all([
      getPortfolioWithRetry(userId),
      getHoldings(userId),
      getTransactions(userId, 10),
    ])
      .then(async ([portfolioResult, rawHoldings, txs]) => {
        if (cancelled) return;
        setPortfolio(portfolioResult);
        setTransactions(txs);

        if (rawHoldings.length === 0) {
          setHoldings([]);
          return;
        }
        const prices = await getCryptoPrices(rawHoldings.map((h) => h.symbol)).catch(() => []);
        const bySymbol = new Map(prices.map((p) => [p.symbol.toUpperCase(), p.priceUsd]));
        if (!cancelled) {
          setHoldings(
            rawHoldings.map((h) => ({ ...h, priceUsd: bySymbol.get(h.symbol.toUpperCase()) ?? null })),
          );
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof ApiError ? err.message : 'Varlıklar yüklenemedi.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  const cryptoValue =
    holdings?.reduce((sum, h) => sum + (h.priceUsd ? h.priceUsd * h.quantity : 0), 0) ?? 0;
  const cashValue = portfolio?.cashBalance ?? 0;
  const totalValue = cashValue + cryptoValue;

  return (
    <>
      <Animate delay={250} direction="up">
        <h1 className="text-white text-[28px] sm:text-[34px] font-normal leading-[1.1] mb-1">
          Varlıklarım
        </h1>
        <p className="text-white/50 text-[14px] sm:text-[15px] font-[450] mb-8">
          Portföyünüzdeki nakit ve kripto varlıkların dökümü.
        </p>
      </Animate>

      {loading ? (
        <div className="flex items-center gap-2 text-white/50 text-[14px] font-[450] mb-6">
          <Loader2 className="w-[16px] h-[16px] animate-spin" />
          Yükleniyor…
        </div>
      ) : error ? (
        <p className="text-red-300 text-[14px] font-[450] mb-6">{error}</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <Animate delay={350} direction="up">
            <SummaryCard icon={Wallet} label="Nakit Bakiye" value={formatUsd(cashValue)} />
          </Animate>
          <Animate delay={400} direction="up">
            <SummaryCard icon={Coins} label="Kriptoda Kullanılan" value={formatUsd(cryptoValue)} />
          </Animate>
          <Animate delay={450} direction="up">
            <SummaryCard icon={Layers} label="Toplam Varlık" value={formatUsd(totalValue)} highlight />
          </Animate>
        </div>
      )}

      {!loading && !error && holdings && holdings.length > 0 && (
        <Animate delay={500} direction="up" className="mb-6">
          <div className="rounded-[24px] sm:rounded-[28px] bg-[rgba(17,16,15,0.55)] backdrop-blur-[24px] border border-white/[0.08] p-6 sm:p-8">
            <p className="text-white text-[16px] sm:text-[18px] font-[450] mb-4">Kripto Dökümü</p>
            <div className="flex flex-col gap-1">
              {holdings.map((h) => (
                <div
                  key={h.id}
                  className="flex items-center justify-between py-3 border-b border-white/[0.06] last:border-0"
                >
                  <div>
                    <p className="text-white text-[15px] font-[450] uppercase">{h.symbol}</p>
                    <p className="text-white/40 text-[12px] font-[450]">{h.quantity} adet</p>
                  </div>
                  <p className="text-white/80 text-[15px] font-[450]">
                    {h.priceUsd ? formatUsd(h.priceUsd * h.quantity) : '—'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </Animate>
      )}

      {!loading && !error && holdings && holdings.length === 0 && (
        <Animate delay={500} direction="up" className="mb-6">
          <div className="rounded-[24px] sm:rounded-[28px] bg-[rgba(17,16,15,0.35)] backdrop-blur-[24px] border border-white/[0.08] p-8 text-center">
            <div className="w-[48px] h-[48px] mx-auto flex items-center justify-center rounded-[14px] bg-white/[0.06] border border-white/10 mb-4">
              <PieChart className="w-[20px] h-[20px] text-white/50" />
            </div>
            <p className="text-white/60 text-[14px] font-[450] mb-4">Henüz kripto varlığınız yok.</p>
            <Link
              to="/trade"
              className="inline-flex h-[44px] px-6 items-center justify-center rounded-[12px] bg-[#E9E9E9] text-[#0A0707] text-[14px] font-[450] transition-opacity hover:opacity-90"
            >
              Alım Yap
            </Link>
          </div>
        </Animate>
      )}

      <Animate delay={600} direction="up">
        <TransactionsCard transactions={transactions} />
      </Animate>
    </>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  highlight,
}: {
  icon: typeof Wallet;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-[20px] sm:rounded-[24px] backdrop-blur-[24px] border p-5 sm:p-6 ${
        highlight
          ? 'bg-white/[0.08] border-white/20'
          : 'bg-[rgba(17,16,15,0.55)] border-white/[0.08]'
      }`}
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="w-[32px] h-[32px] flex items-center justify-center rounded-[9px] bg-white/[0.06] border border-white/10">
          <Icon className="w-[14px] h-[14px] text-white/80" />
        </div>
        <p className="text-white/60 text-[13px] font-[450]">{label}</p>
      </div>
      <p className="text-white text-[24px] sm:text-[28px] font-[450] leading-[1]">{value}</p>
    </div>
  );
}

function TransactionsCard({ transactions }: { transactions: Transaction[] | null }) {
  if (!transactions || transactions.length === 0) {
    return (
      <div className="rounded-[24px] sm:rounded-[28px] bg-[rgba(17,16,15,0.35)] backdrop-blur-[24px] border border-white/[0.08] p-6 sm:p-8 text-center">
        <p className="text-white/40 text-[14px] font-[450]">Henüz işlem geçmişiniz yok.</p>
      </div>
    );
  }

  return (
    <div className="rounded-[24px] sm:rounded-[28px] bg-[rgba(17,16,15,0.55)] backdrop-blur-[24px] border border-white/[0.08] p-6 sm:p-8">
      <p className="text-white text-[16px] sm:text-[18px] font-[450] mb-4">Son İşlemler</p>
      <div className="flex flex-col gap-1">
        {transactions.map((tx) => {
          const isBuy = isBuyTransaction(tx);
          return (
            <div
              key={tx.id}
              className="flex items-center justify-between py-3 border-b border-white/[0.06] last:border-0"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-[32px] h-[32px] flex items-center justify-center rounded-[9px] border ${
                    isBuy
                      ? 'bg-emerald-400/10 border-emerald-400/20'
                      : 'bg-red-400/10 border-red-400/20'
                  }`}
                >
                  {isBuy ? (
                    <ArrowDownLeft className="w-[14px] h-[14px] text-emerald-300" />
                  ) : (
                    <ArrowUpRight className="w-[14px] h-[14px] text-red-300" />
                  )}
                </div>
                <div>
                  <p className="text-white text-[14px] font-[450]">
                    {isBuy ? 'Alım' : 'Satım'} · {tx.symbol.toUpperCase()}
                  </p>
                  <p className="text-white/40 text-[12px] font-[450]">
                    {new Date(tx.createdAt).toLocaleString('tr-TR')}
                  </p>
                </div>
              </div>
              <p className="text-white/80 text-[14px] font-[450]">{formatUsd(tx.totalUsd)}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
