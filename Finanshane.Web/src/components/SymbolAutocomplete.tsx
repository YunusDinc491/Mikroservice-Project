import { useEffect, useRef, useState } from 'react';
import { useSymbols } from '@/lib/useSymbols';

interface SymbolAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function SymbolAutocomplete({
  value,
  onChange,
  placeholder = 'örn. BTC',
}: SymbolAutocompleteProps) {
  const symbols = useSymbols();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const query = value.trim().toUpperCase();
  const filtered = query
    ? symbols.filter((s) => s.startsWith(query)).slice(0, 8)
    : [];
  const isValid = symbols.length === 0 || symbols.includes(query);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={rootRef} className="relative">
      <input
        value={value}
        onChange={(e) => {
          onChange(e.target.value.toUpperCase());
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        autoComplete="off"
        className={`w-full h-[46px] px-4 rounded-[12px] bg-white/[0.05] border text-white text-[14px] placeholder:text-white/30 outline-none transition-colors uppercase ${
          value && !isValid
            ? 'border-red-500/40 focus:border-red-500/60'
            : 'border-white/10 focus:border-white/40 focus:bg-white/[0.07]'
        }`}
      />
      {open && filtered.length > 0 && (
        <div className="absolute z-20 mt-1 w-full rounded-[10px] bg-[#15130f] border border-white/10 shadow-lg overflow-hidden">
          {filtered.map((symbol) => (
            <button
              key={symbol}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                onChange(symbol);
                setOpen(false);
              }}
              className="w-full text-left px-4 py-2.5 text-white text-[14px] font-[450] hover:bg-white/[0.08] transition-colors"
            >
              {symbol}
            </button>
          ))}
        </div>
      )}
      {value && !isValid && (
        <p className="mt-1.5 text-red-300 text-[12px] font-[450]">
          Desteklenmeyen sembol. Listeden bir sembol seçin.
        </p>
      )}
    </div>
  );
}
