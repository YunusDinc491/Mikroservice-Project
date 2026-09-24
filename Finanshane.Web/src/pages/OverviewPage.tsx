import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRightLeft, ChevronRight, LineChart, PieChart } from 'lucide-react';
import Animate from '@/components/Animate';
import BalanceCard from '@/components/portfolio/BalanceCard';
import { ApiError, getCurrentUser, getPortfolioWithRetry, type PortfolioAccount } from '@/lib/api';

const SHORTCUTS = [
  {
    to: '/trade',
    icon: ArrowRightLeft,
    title: 'Al / Sat',
    desc: 'Kripto alım satım emirlerinizi gerçekleştirin',
  },
  {
    to: '/markets',
    icon: LineChart,
    title: 'Piyasalar',
    desc: 'Güncel kripto fiyatlarını takip edin',
  },
  {
    to: '/holdings',
    icon: PieChart,
    title: 'Varlıklarım',
    desc: 'Portföyünüzdeki kripto varlıkları görüntüleyin',
  },
];

export default function OverviewPage() {
  const user = getCurrentUser();
  const userId = user?.sub ?? '';

  const [portfolio, setPortfolio] = useState<PortfolioAccount | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    getPortfolioWithRetry(userId)
      .then((result) => {
        if (!cancelled) setPortfolio(result);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof ApiError ? err.message : 'Portföy yüklenemedi.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  return (
    <>
      <Animate delay={250} direction="up">
        <h1 className="text-white text-[28px] sm:text-[34px] font-normal leading-[1.1] mb-1">
          Dashboard
        </h1>
        <p className="text-white/50 text-[14px] sm:text-[15px] font-[450] mb-8">
          Hoş geldiniz{user?.email ? `, ${user.email}` : ''}.
        </p>
      </Animate>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.3fr] gap-6">
        <Animate delay={350} direction="up">
          <BalanceCard portfolio={portfolio} loading={loading} error={error} />
        </Animate>

        <Animate delay={450} direction="up">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 h-full">
            {SHORTCUTS.map((shortcut) => (
              <Link
                key={shortcut.to}
                to={shortcut.to}
                className="group rounded-[20px] bg-[rgba(17,16,15,0.55)] backdrop-blur-[24px] border border-white/[0.08] p-5 flex flex-col justify-between transition-colors hover:bg-[rgba(17,16,15,0.75)] hover:border-white/20"
              >
                <div>
                  <div className="w-[38px] h-[38px] flex items-center justify-center rounded-[10px] bg-white/[0.06] border border-white/10 mb-4">
                    <shortcut.icon className="w-[17px] h-[17px] text-white/80" />
                  </div>
                  <p className="text-white text-[15px] font-[450] mb-1">{shortcut.title}</p>
                  <p className="text-white/50 text-[12px] font-[450] leading-[16px]">
                    {shortcut.desc}
                  </p>
                </div>
                <div className="flex items-center gap-1 mt-4 text-white/40 text-[12px] font-[450] group-hover:text-white/70 transition-colors">
                  Görüntüle
                  <ChevronRight className="w-[13px] h-[13px]" />
                </div>
              </Link>
            ))}
          </div>
        </Animate>
      </div>
    </>
  );
}
