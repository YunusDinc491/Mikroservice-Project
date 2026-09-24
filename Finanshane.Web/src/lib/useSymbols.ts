import { useEffect, useState } from 'react';
import { getSupportedSymbols } from '@/lib/api';

let cache: string[] | null = null;
let inflight: Promise<string[]> | null = null;

function loadSymbols(): Promise<string[]> {
  if (cache) return Promise.resolve(cache);
  if (!inflight) {
    inflight = getSupportedSymbols()
      .then((symbols) => {
        cache = symbols;
        return symbols;
      })
      .catch(() => []);
  }
  return inflight;
}

export function useSymbols(): string[] {
  const [symbols, setSymbols] = useState<string[]>(cache ?? []);

  useEffect(() => {
    if (cache) return;
    loadSymbols().then(setSymbols);
  }, []);

  return symbols;
}
