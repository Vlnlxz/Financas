import { CATEGORIES } from "./format";
import type { Summary, Tx } from "@/types";

const KEY = "financas:v1";
const NAME = "financas:name";
const FULL = "Armazenamento do navegador cheio. Remova fotos ou exporte um backup e apague lançamentos antigos.";

function read(): Tx[] {
  const raw = localStorage.getItem(KEY);
  if (!raw) return [];
  try {
    const d = JSON.parse(raw);
    if (!Array.isArray(d.transactions)) throw new Error();
    return d.transactions as Tx[];
  } catch {
    throw new Error("Os dados salvos neste navegador estão ilegíveis. Importe um backup em Ajustes.");
  }
}

function write(list: Tx[]) {
  try { localStorage.setItem(KEY, JSON.stringify({ transactions: list })); }
  catch { throw new Error(FULL); }
}

export const getName = () => { try { return localStorage.getItem(NAME) ?? ""; } catch { return ""; } };
export const setName = (n: string) => { try { localStorage.setItem(NAME, n.trim().slice(0, 100)); } catch { /* ignora */ } };

export function getMonth(ym: string): { items: Tx[]; summary: Summary } {
  const items = read().filter((t) => t.date.startsWith(ym));
  items.sort((a, b) => b.date.localeCompare(a.date));
  const sum = (t: string) => items.filter((x) => x.type === t).reduce((a, x) => a + Number(x.amount), 0);
  const income = sum("INCOME"), expense = sum("EXPENSE");
  return { items, summary: { income, expense, balance: income - expense, count: items.length } };
}

export function saveTx(input: Omit<Tx, "id"> & { id?: string }): Tx {
  const list = read();
  if (input.id) {
    const i = list.findIndex((t) => t.id === input.id);
    if (i === -1) throw new Error("Lançamento não encontrado");
    list[i] = { ...input, id: input.id };
    write(list);
    return list[i];
  }
  const tx: Tx = { ...input, id: crypto.randomUUID() };
  write([tx, ...list]);
  return tx;
}

export function deleteTx(id: string) {
  const list = read();
  if (!list.some((t) => t.id === id)) throw new Error("Lançamento não encontrado");
  write(list.filter((t) => t.id !== id));
}

export const exportJson = () => JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), transactions: read() }, null, 2);

export function importJson(text: string): number {
  let d: { transactions?: unknown };
  try { d = JSON.parse(text); } catch { throw new Error("Arquivo inválido"); }
  if (!Array.isArray(d.transactions)) throw new Error("Arquivo de backup inválido");
  const ok = (d.transactions as Tx[]).every((t) =>
    t && typeof t.id === "string" && (t.type === "INCOME" || t.type === "EXPENSE") && Number(t.amount) > 0 &&
    typeof t.title === "string" && /^\d{4}-\d{2}-\d{2}/.test(t.date) && t.category in CATEGORIES && Array.isArray(t.images));
  if (!ok) throw new Error("O backup contém lançamentos inválidos; nada foi importado");
  write(d.transactions as Tx[]);
  return (d.transactions as Tx[]).length;
}

export const clearAll = () => localStorage.removeItem(KEY);

export function getAnalytics(month: string, n: number) {
  const [y, m] = month.split("-").map(Number);
  const r2 = (x: number) => Math.round(x * 100) / 100;
  const pct = (c: number, p: number) => (p === 0 ? null : r2(((c - p) / Math.abs(p)) * 100));
  const keys = Array.from({ length: n }, (_, i) => { const d = new Date(Date.UTC(y, m - 1 - (n - 1) + i, 1)); return d.toISOString().slice(0, 7); });
  const all = read();
  const b = new Map(keys.map((k) => [k, { income: 0, expense: 0 }]));
  const cats: Record<string, number> = {};
  let opening = 0, hasData = all.length > 0;
  for (const t of all) {
    const k = t.date.slice(0, 7), a = Number(t.amount), sign = t.type === "INCOME" ? 1 : -1;
    if (k < keys[0]) opening += sign * a;
    else if (b.has(k)) {
      const e = b.get(k)!;
      if (sign === 1) e.income += a; else e.expense += a;
      if (sign === -1 && k === month) cats[t.category] = (cats[t.category] ?? 0) + a;
    }
  }
  let bal = opening;
  const series = keys.map((ym) => { const v = b.get(ym)!; bal += v.income - v.expense; return { ym, income: r2(v.income), expense: r2(v.expense), balance: r2(bal) }; });
  const cur = series[n - 1], prev = series[n - 2];
  const net = (s: typeof cur) => r2(s.income - s.expense);
  return {
    hasData, series,
    categories: Object.entries(cats).map(([category, total]) => ({ category, total: r2(total) })).sort((a, c) => c.total - a.total),
    compare: {
      current: { income: cur.income, expense: cur.expense, net: net(cur) },
      previous: { income: prev.income, expense: prev.expense, net: net(prev) },
      variation: { income: pct(cur.income, prev.income), expense: pct(cur.expense, prev.expense), net: pct(net(cur), net(prev)) },
    },
  };
}
