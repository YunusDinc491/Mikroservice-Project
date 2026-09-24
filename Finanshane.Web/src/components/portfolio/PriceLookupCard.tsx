import { useState, type FormEvent } from 'react';
import { ArrowDownRight, ArrowUpRight, Loader2, Search } from 'lucide-react';
import SymbolAutocomplete from '@/components/SymbolAutocomplete';
import { ApiError, getCryptoPrice, type CryptoPrice } from '@/lib/api';
import { formatUsd } from '@/lib/format';

export default function PriceLookupCard() {
  const [symbol, setSymbol] = useState('');
  const [price, setPrice] = useState<CryptoPrice | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!symbol.trim()) return;
    setLoading(true);
    setError(null);
    setPrice(null);
    try {
      const result = await getCryptoPrice(symbol.trim());
      setPrice(result);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Fiyat alınamadı.');
    } finally {
      setLoading(false);
    }
  }

  const isUp = (price?.change24h ?? 0) >= 0;

  return (
    <div className="rounded-[24px] sm:rounded-[28px] bg-[rgba(17,16,15,0.55)] backdrop-blur-[24px] border border-white/[0.08] p-6 sm:p-8">
      <p className="text-white text-[16px] sm:text-[18px] font-[450] mb-4">Kripto Seç</p>
      <form onSubmit={handleSubmit} className="flex gap-2 mb-4 items-start">
        <div className="flex-1">
          <SymbolAutocomplete value={symbol} onChange={setSymbol} />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="h-[46px] px-5 flex items-center justify-center rounded-[12px] bg-[#E9E9E9] text-[#0A0707] text-[14px] font-[450] transition-opacity hover:opacity-90 disabled:opacity-60 shrink-0"
        >
          {loading ? (
            <Loader2 className="w-[16px] h-[16px] animate-spin" />
          ) : (
            <Search className="w-[16px] h-[16px]" />
          )}
        </button>
      </form>

      {error && <p className="text-red-300 text-[13px] font-[450]">{error}</p>}

      {price && (
        <div className="flex items-center justify-between rounded-[14px] bg-white/[0.03] border border-white/[0.06] px-5 py-4">
          <div>
            <p className="text-white/50 text-[12px] font-[450] uppercase tracking-[0.04em] mb-1">
              {price.symbol}
            </p>
            <p className="text-white text-[24px] font-[450] leading-[1]">
              {formatUsd(price.priceUsd)}
            </p>
          </div>
          {price.change24h !== null && (
            <span
              className={`flex items-center gap-1 px-3 py-1.5 rounded-[8px] text-[13px] font-[450] ${
                isUp ? 'text-emerald-400 bg-emerald-400/10' : 'text-red-400 bg-red-400/10'
              }`}
            >
              {isUp ? (
                <ArrowUpRight className="w-[14px] h-[14px]" />
              ) : (
                <ArrowDownRight className="w-[14px] h-[14px]" />
              )}
              {Math.abs(price.change24h).toFixed(2)}%
            </span>
          )}
        </div>
      )}
    </div>
  );
}
