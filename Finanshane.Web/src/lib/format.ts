const currencyFormatter = new Intl.NumberFormat('tr-TR', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
});

export function formatUsd(value: number) {
  return currencyFormatter.format(value);
}
