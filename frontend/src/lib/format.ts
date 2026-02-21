export const money = (value: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(
    value
  );

export const percent = (value: number) => `${(value * 100).toFixed(2)}%`;

export const shortDate = (value: string) =>
  new Date(value).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
