// Pure calc utilities
export function computeEmi(principal: number, annualRate: number, years: number) {
  const n = years * 12;
  const r = annualRate / 12 / 100;
  if (r === 0) return { emi: principal / n, interest: 0, total: principal };
  const emi = (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  const total = emi * n;
  return { emi, interest: total - principal, total };
}

export function inr(n: number) {
  if (Number.isNaN(n) || !isFinite(n)) return "₹0";
  const fmt = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });
  return `₹${fmt.format(Math.round(n))}`;
}

export function inrShort(n: number) {
  if (!isFinite(n)) return "₹0";
  if (n >= 1e7) return `₹${(n / 1e7).toFixed(2)} Cr`;
  if (n >= 1e5) return `₹${(n / 1e5).toFixed(2)} L`;
  if (n >= 1e3) return `₹${(n / 1e3).toFixed(1)} K`;
  return `₹${Math.round(n)}`;
}
