export const PLAYER_COLORS = [
  "#e63946",
  "#2a9d8f",
  "#e9c46a",
  "#457b9d",
  "#f4a261",
  "#8b5cf6",
  "#06d6a0",
  "#ef476f",
  "#118ab2",
  "#fb8500",
];

export type Net = { playerId: string; net: number };

export function computeSettlement(nets: Net[]) {
  const creditors = nets
    .filter((n) => n.net > 0)
    .map((n) => ({ id: n.playerId, amt: Math.round(n.net) }))
    .sort((a, b) => b.amt - a.amt);
  const debtors = nets
    .filter((n) => n.net < 0)
    .map((n) => ({ id: n.playerId, amt: -Math.round(n.net) }))
    .sort((a, b) => b.amt - a.amt);

  const out: { from: string; to: string; amount: number }[] = [];
  let i = 0,
    j = 0;
  while (i < debtors.length && j < creditors.length) {
    const pay = Math.min(debtors[i].amt, creditors[j].amt);
    if (pay > 0) out.push({ from: debtors[i].id, to: creditors[j].id, amount: pay });
    debtors[i].amt -= pay;
    creditors[j].amt -= pay;
    if (debtors[i].amt === 0) i++;
    if (creditors[j].amt === 0) j++;
  }
  return out;
}

export const fmt = (n: number) =>
  new Intl.NumberFormat("es-UY", { maximumFractionDigits: 0 }).format(
    Math.round(n || 0)
  );
export const money = (n: number) => "$" + fmt(n);
export const signed = (n: number) =>
  (n > 0 ? "+" : n < 0 ? "−" : "") + "$" + fmt(Math.abs(n));
