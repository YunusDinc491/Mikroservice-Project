import { Loader2, Wallet } from 'lucide-react';
import type { PortfolioAccount } from '@/lib/api';
import { formatUsd } from '@/lib/format';

export default function BalanceCard({
  portfolio,
  loading,
  error,
}: {
  portfolio: PortfolioAccount | null;
  loading: boolean;
  error: string | null;
}) {
  return (
    <div className="h-full rounded-[24px] sm:rounded-[28px] bg-[rgba(17,16,15,0.55)] backdrop-blur-[24px] border border-white/[0.08] p-6 sm:p-8">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-[36px] h-[36px] flex items-center justify-center rounded-[10px] bg-white/[0.06] border border-white/10">
          <Wallet className="w-[16px] h-[16px] text-white/80" />
        </div>
        <p className="text-white text-[16px] sm:text-[18px] font-[450]">Nakit Bakiye</p>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-white/50 text-[14px] font-[450]">
          <Loader2 className="w-[16px] h-[16px] animate-spin" />
          Yükleniyor…
        </div>
      ) : error ? (
        <p className="text-red-300 text-[14px] font-[450]">{error}</p>
      ) : portfolio ? (
        <>
          <p className="text-white text-[38px] sm:text-[46px] font-[450] leading-[1] mb-2">
            {formatUsd(portfolio.cashBalance)}
          </p>
          <p className="text-white/50 text-[13px] font-[450]">
            Para birimi: {portfolio.currency} · Hesap{' '}
            {new Date(portfolio.createdAt).toLocaleDateString('tr-TR')} tarihinde açıldı
          </p>
        </>
      ) : null}
    </div>
  );
}
