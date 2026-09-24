const pad = (n) => String(n).padStart(2, '0');

export const fmt = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export const parse = (key) => {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
};

export const shiftDay = (key, n) => {
  const d = parse(key);
  d.setDate(d.getDate() + n);
  return fmt(d);
};

export const num = (n) => Number(n).toLocaleString(undefined, { maximumFractionDigits: 1 });

export const hasData = (days, key) => !!days[key] && Object.keys(days[key]).length > 0;

// Consecutive days with an entry, ending today (or yesterday if today is still empty).
export function streak(days, todayKey) {
  let key = todayKey;
  if (!hasData(days, key)) key = shiftDay(key, -1);
  let n = 0;
  while (hasData(days, key)) {
    n += 1;
    key = shiftDay(key, -1);
  }
  return n;
}
