"use client";
import { useEffect, useState } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ArrowDownRight, ArrowUpRight, ChevronLeft, ChevronRight, Loader2, Minus } from "lucide-react";
import { CATEGORIES, MONTHS, brl, todayBR } from "@/lib/format";
import { getAnalytics } from "@/lib/store";

interface Point { ym: string; income: number; expense: number; balance: number }
interface Cmp { income: number; expense: number; net: number }
interface Data {
  hasData: boolean; series: Point[]; categories: { category: string; total: number }[];
  compare: { current: Cmp; previous: Cmp; variation: Record<keyof Cmp, number | null> };
}

const COLORS = ["#6366f1", "#f43f5e", "#f59e0b", "#10b981", "#06b6d4", "#8b5cf6", "#ec4899", "#84cc16", "#64748b", "#f97316"];
const short = (ym: string) => `${MONTHS[Number(ym.slice(5)) - 1].slice(0, 3)}/${ym.slice(2, 4)}`;
const tt = { contentStyle: { background: "var(--tt-bg)", color: "var(--tt-fg)", border: "1px solid var(--tt-bd)", borderRadius: 12, fontSize: 12 } };
const money = (v: unknown) => brl(Number(v));
const axis = { stroke: "#94a3b8", fontSize: 11, tickLine: false, axisLine: false } as const;

function Box({ title, empty, children }: { title: string; empty: boolean; children: React.ReactNode }) {
  return (
    <div className="card p-4">
      <h3 className="mb-3 text-sm font-semibold">{title}</h3>
      {empty ? <p className="flex h-56 items-center justify-center text-sm text-slate-500">Sem dados para exibir.</p> : <div className="h-64">{children}</div>}
    </div>
  );
}

function Variation({ label, cur, prev, v, goodUp }: { label: string; cur: number; prev: number; v: number | null; goodUp: boolean }) {
  const up = (v ?? 0) > 0, flat = v === null || v === 0;
  const good = flat ? null : up === goodUp;
  const color = good === null ? "text-slate-500" : good ? "text-income" : "text-expense";
  const Icon = flat ? Minus : up ? ArrowUpRight : ArrowDownRight;
  return (
    <div className="card p-4">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-lg font-semibold">{brl(cur)}</p>
      <p className="text-xs text-slate-500">Mês anterior: {brl(prev)}</p>
      <p className={`mt-2 flex items-center gap-1 text-xs font-medium ${color}`}>
        <Icon className="h-3.5 w-3.5" />{v === null ? "Sem base de comparação" : `${v > 0 ? "+" : ""}${v.toLocaleString("pt-BR")}%`}
      </p>
    </div>
  );
}

export default function Analytics() {
  const [ym, setYm] = useState(todayBR().slice(0, 7));
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [y, m] = ym.split("-").map(Number);
  const go = (dm: number) => { const d = new Date(Date.UTC(y, m - 1 + dm, 1)); setYm(`${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`); };

  useEffect(() => {
    try { setData(getAnalytics(ym, 12)); setError(""); }
    catch (e) { setError(e instanceof Error ? e.message : "Não foi possível ler os dados"); }
    finally { setLoading(false); }
  }, [ym]);

  const series = (data?.series ?? []).map((p) => ({ ...p, label: short(p.ym) }));
  const cats = (data?.categories ?? []).map((c) => ({ name: CATEGORIES[c.category]?.label ?? c.category, value: c.total }));
  const hasFlow = series.some((p) => p.income > 0 || p.expense > 0);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="text-xl font-semibold">Análises</h1><p className="text-sm text-slate-500">Últimos 12 meses até o período escolhido</p></div>
        <div className="flex items-center gap-2">
          <button className="btn-ghost !p-2.5" onClick={() => go(-1)} aria-label="Mês anterior"><ChevronLeft className="h-4 w-4" /></button>
          <span className="min-w-36 text-center text-sm font-medium">{MONTHS[m - 1]} de {y}</span>
          <button className="btn-ghost !p-2.5" onClick={() => go(1)} aria-label="Próximo mês"><ChevronRight className="h-4 w-4" /></button>
        </div>
      </div>

      {loading && !data ? <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-brand" /></div>
        : error ? <p className="py-12 text-center text-sm text-expense">{error}</p>
        : data && (
          <div className={`flex flex-col gap-6 transition-opacity ${loading ? "opacity-50" : ""}`}>
            <section className="grid gap-3 sm:grid-cols-3">
              <Variation label="Ganhos" cur={data.compare.current.income} prev={data.compare.previous.income} v={data.compare.variation.income} goodUp />
              <Variation label="Gastos" cur={data.compare.current.expense} prev={data.compare.previous.expense} v={data.compare.variation.expense} goodUp={false} />
              <Variation label="Resultado do mês" cur={data.compare.current.net} prev={data.compare.previous.net} v={data.compare.variation.net} goodUp />
            </section>

            <div className="grid gap-4 lg:grid-cols-2">
              <Box title="Ganhos × gastos por mês" empty={!hasFlow}>
                <ResponsiveContainer><BarChart data={series}><CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" strokeOpacity={0.2} vertical={false} />
                  <XAxis dataKey="label" {...axis} /><YAxis {...axis} width={48} tickFormatter={(v) => (Math.abs(v) >= 1000 ? `${v / 1000}k` : v)} />
                  <Tooltip {...tt} formatter={money} cursor={{ fill: "#94a3b8", fillOpacity: 0.1 }} /><Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="income" name="Ganhos" fill="#10b981" radius={[6, 6, 0, 0]} /><Bar dataKey="expense" name="Gastos" fill="#f43f5e" radius={[6, 6, 0, 0]} />
                </BarChart></ResponsiveContainer>
              </Box>

              <Box title={`Gastos por categoria — ${MONTHS[m - 1]}`} empty={cats.length === 0}>
                <ResponsiveContainer><PieChart>
                  <Pie data={cats} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={2} stroke="none">
                    {cats.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip {...tt} formatter={money} /><Legend wrapperStyle={{ fontSize: 12 }} />
                </PieChart></ResponsiveContainer>
              </Box>
            </div>

            <Box title="Evolução do saldo acumulado" empty={!data.hasData}>
              <ResponsiveContainer><AreaChart data={series}>
                <defs><linearGradient id="bal" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#6366f1" stopOpacity={0.35} /><stop offset="100%" stopColor="#6366f1" stopOpacity={0} /></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" strokeOpacity={0.2} vertical={false} />
                <XAxis dataKey="label" {...axis} /><YAxis {...axis} width={48} />
                <Tooltip {...tt} formatter={money} />
                <Area type="monotone" dataKey="balance" name="Saldo" stroke="#6366f1" strokeWidth={2} fill="url(#bal)" />
              </AreaChart></ResponsiveContainer>
            </Box>
          </div>
        )}
    </div>
  );
}
