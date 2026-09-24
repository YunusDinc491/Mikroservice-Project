import { useState, type FormEvent } from 'react';
import { ArrowDownLeft, ArrowUpRight, Loader2 } from 'lucide-react';
import SymbolAutocomplete from '@/components/SymbolAutocomplete';
import { useSymbols } from '@/lib/useSymbols';
import { ApiError, buyCrypto, sellCrypto, type BuyResult, type SellResult } from '@/lib/api';
import { formatUsd } from '@/lib/format';

export default function TradeCard({
  mode,
  userId,
  symbol,
  onSymbolChange,
  onSuccess,
}: {
  mode: 'buy' | 'sell';
  userId: string;
  symbol: string;
  onSymbolChange: (symbol: string) => void;
  onSuccess: (result: BuyResult | SellResult) => void;
}) {
  const isBuy = mode === 'buy';
  const symbols = useSymbols();
  const [amount, setAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<BuyResult | SellResult | null>(null);

  const isSymbolValid = symbols.length === 0 || symbols.includes(symbol.trim().toUpperCase());

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setLastResult(null);
    const numericAmount = Number(amount);
    if (!symbol.trim() || !isSymbolValid) {
      setError('Listeden geçerli bir sembol seçin.');
      return;
    }
    if (!numericAmount || numericAmount <= 0) {
      setError('Geçerli bir miktar girin.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = isBuy
        ? await buyCrypto(userId, { symbol: symbol.trim(), amountUsd: numericAmount })
        : await sellCrypto(userId, { symbol: symbol.trim(), quantity: numericAmount });
      setLastResult(result);
      setAmount('');
      onSuccess(result);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'İşlem gerçekleştirilemedi.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="h-full rounded-[24px] sm:rounded-[28px] bg-[rgba(17,16,15,0.55)] backdrop-blur-[24px] border border-white/[0.08] p-6 sm:p-8">
      <div className="flex items-center gap-2 mb-5">
        <div
          className={`w-[36px] h-[36px] flex items-center justify-center rounded-[10px] border ${
            isBuy ? 'bg-emerald-400/10 border-emerald-400/20' : 'bg-red-400/10 border-red-400/20'
          }`}
        >
          {isBuy ? (
            <ArrowDownLeft className="w-[16px] h-[16px] text-emerald-300" />
          ) : (
            <ArrowUpRight className="w-[16px] h-[16px] text-red-300" />
          )}
        </div>
        <p className="text-white text-[16px] sm:text-[18px] font-[450]">
          {isBuy ? 'Kripto Al' : 'Kripto Sat'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block text-white/70 text-[13px] font-[450] mb-2">Sembol</label>
          <SymbolAutocomplete value={symbol} onChange={onSymbolChange} />
        </div>
        <div>
          <label className="block text-white/70 text-[13px] font-[450] mb-2">
            {isBuy ? 'Tutar (USD)' : 'Miktar (adet)'}
          </label>
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            type="number"
            min="0"
            step="any"
            placeholder={isBuy ? '100' : '0.01'}
            className="w-full h-[46px] px-4 rounded-[12px] bg-white/[0.05] border border-white/10 text-white text-[14px] placeholder:text-white/30 outline-none transition-colors focus:border-white/40 focus:bg-white/[0.07]"
          />
        </div>

        {error && (
          <div className="px-4 py-3 rounded-[10px] bg-red-500/10 border border-red-500/30 text-red-300 text-[13px] font-[450] leading-[18px]">
            {error}
          </div>
        )}

        {lastResult && (
          <div className="px-4 py-3 rounded-[10px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-200 text-[13px] font-[450] leading-[18px]">
            {isBuy
              ? `${(lastResult as BuyResult).quantity} ${lastResult.symbol.toUpperCase()} alındı, birim fiyat ${formatUsd((lastResult as BuyResult).pricePerUnit)}`
              : `${(lastResult as SellResult).quantity} ${lastResult.symbol.toUpperCase()} satıldı, ${formatUsd((lastResult as SellResult).receivedUsd)} kazanıldı`}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className={`h-[48px] w-full flex items-center justify-center gap-2 rounded-[12px] text-[14px] font-[450] transition-opacity hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed ${
            isBuy ? 'bg-[#E9E9E9] text-[#0A0707]' : 'border border-white text-white'
          }`}
        >
          {isSubmitting && <Loader2 className="w-[16px] h-[16px] animate-spin" />}
          {isSubmitting ? 'İşleniyor…' : isBuy ? 'Satın Al' : 'Sat'}
        </button>
      </form>
    </div>
  );
}
