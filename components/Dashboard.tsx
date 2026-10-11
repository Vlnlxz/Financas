"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowDownCircle, ArrowUpCircle, ChevronLeft, ChevronRight, Eye, Hash, Inbox, Loader2, Pencil, Plus, Scale, Search, Trash2 } from "lucide-react";
import Modal from "./Modal";
import TransactionModal from "./TransactionModal";
import { CATEGORIES, MONTHS, brl, fmtDate, todayBR } from "@/lib/format";
import type { Summary, Tx } from "@/types";
import { deleteTx, getMonth, getName } from "@/lib/store";

const PAGE = 30;

export default function Dashboard() {
  const [userName, setUserName] = useState("");
  useEffect(() => setUserName(getName()), []);
  const today = todayBR();
  const [ym, setYm] = useState(today.slice(0, 7));
  const [data, setData] = useState<{ items: Tx[]; summary: Summary } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");
  const [type, setType] = useState("");
  const [cat, setCat] = useState("");
  const [sort, setSort] = useState("date-desc");
  const [limit, setLimit] = useState(PAGE);
  const [edit, setEdit] = useState<Tx | null | undefined>(undefined); // undefined = fechado, null = novo
  const [detail, setDetail] = useState<Tx | null>(null);
  const [del, setDel] = useState<Tx | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const [y, m] = ym.split("-").map(Number);
  const go = (dy: number, dm: number) => { const d = new Date(Date.UTC(y, m - 1 + dm, 1)); setYm(`${d.getUTCFullYear() + dy}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`); };
  const notify = (msg: string, ok = true) => { setToast({ msg, ok }); setTimeout(() => setToast(null), 3000); };

  const load = useCallback(() => {
    try { setData(getMonth(ym)); setError(""); }
    catch (e) { setError(e instanceof Error ? e.message : "Não foi possível ler os dados"); }
    finally { setLoading(false); }
  }, [ym]);
  useEffect(() => { load(); setLimit(PAGE); }, [load]);

  const visible = useMemo(() => {
    const s = q.trim().toLowerCase();
    const list = (data?.items ?? []).filter((t) =>
      (!type || t.type === type) && (!cat || t.category === cat) &&
      (!s || t.title.toLowerCase().includes(s) || (t.description ?? "").toLowerCase().includes(s)));
    const dir = sort.endsWith("asc") ? 1 : -1;
    list.sort((a, b) => sort.startsWith("value") ? (Number(a.amount) - Number(b.amount)) * dir : a.date.localeCompare(b.date) * dir);
    return list;
  }, [data, q, type, cat, sort]);

  const groups = useMemo(() => {
    const page = visible.slice(0, limit);
    if (sort.startsWith("value")) return [["", page] as [string, Tx[]]];
    const map = new Map<string, Tx[]>();
    page.forEach((t) => { const k = t.date.slice(0, 10); map.set(k, [...(map.get(k) ?? []), t]); });
    return [...map.entries()];
  }, [visible, limit, sort]);

  async function confirmDelete() {
    if (!del) return;
    setDeleting(true);
    try {
      deleteTx(del.id);
      setDel(null); setDetail(null); notify("Lançamento excluído"); load();
    } catch (e) { notify(e instanceof Error ? e.message : "Erro de conexão", false); }
    finally { setDeleting(false); }
  }


  const s = data?.summary;
  const cards = [
    { label: "Total de ganhos", value: s ? brl(s.income) : "—", icon: ArrowUpCircle, color: "text-income bg-income/10" },
    { label: "Total de gastos", value: s ? brl(s.expense) : "—", icon: ArrowDownCircle, color: "text-expense bg-expense/10" },
    { label: "Saldo mensal", value: s ? brl(s.balance) : "—", icon: Scale, color: s && s.balance < 0 ? "text-expense bg-expense/10" : "text-brand bg-brand/10", neg: !!s && s.balance < 0 },
    { label: "Lançamentos", value: s ? String(s.count) : "—", icon: Hash, color: "text-slate-500 bg-slate-500/10" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <header><h1 className="text-xl font-semibold">Olá{userName ? `, ${userName.split(" ")[0]}` : ""}</h1><p className="text-sm text-slate-500">Resumo e lançamentos do período</p></header>

      <section className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button className="btn-ghost !p-2.5" onClick={() => go(0, -1)} aria-label="Mês anterior"><ChevronLeft className="h-4 w-4" /></button>
          <select className="input !w-auto" value={m} onChange={(e) => setYm(`${y}-${String(e.target.value).padStart(2, "0")}`)}>
            {MONTHS.map((n, i) => <option key={n} value={i + 1}>{n}</option>)}
          </select>
          <input className="input !w-24" type="number" min={2000} max={2100} value={y} onChange={(e) => { const v = Number(e.target.value); if (v >= 2000 && v <= 2100) setYm(`${v}-${String(m).padStart(2, "0")}`); }} />
          <button className="btn-ghost !p-2.5" onClick={() => go(0, 1)} aria-label="Próximo mês"><ChevronRight className="h-4 w-4" /></button>
          {ym !== today.slice(0, 7) && <button className="btn-ghost" onClick={() => setYm(today.slice(0, 7))}>Mês atual</button>}
        </div>
        <button className="btn-primary" onClick={() => setEdit(null)}><Plus className="h-4 w-4" />Novo lançamento</button>
      </section>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className={`card p-4 ${c.neg ? "ring-1 ring-expense/40" : ""}`}>
            <div className={`mb-3 inline-flex rounded-lg p-2 ${c.color}`}><c.icon className="h-4 w-4" /></div>
            <p className="text-xs text-slate-500">{c.label}</p>
            <p className={`text-lg font-semibold sm:text-xl ${c.neg ? "text-expense" : ""}`}>{c.value}</p>
          </div>
        ))}
      </section>

      <section className="card p-4">
        <div className="mb-4 grid gap-2 sm:grid-cols-4">
          <div className="relative sm:col-span-1"><Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" /><input className="input !pl-9" placeholder="Buscar..." value={q} onChange={(e) => setQ(e.target.value)} /></div>
          <select className="input" value={type} onChange={(e) => setType(e.target.value)}><option value="">Ganhos e gastos</option><option value="INCOME">Ganhos</option><option value="EXPENSE">Gastos</option></select>
          <select className="input" value={cat} onChange={(e) => setCat(e.target.value)}><option value="">Todas as categorias</option>{Object.entries(CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select>
          <select className="input" value={sort} onChange={(e) => setSort(e.target.value)}><option value="date-desc">Data (recentes)</option><option value="date-asc">Data (antigos)</option><option value="value-desc">Maior valor</option><option value="value-asc">Menor valor</option></select>
        </div>

        {loading && !data ? <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-brand" /></div>
          : error ? <div className="py-12 text-center"><p className="mb-3 text-sm text-expense">{error}</p><button className="btn-ghost" onClick={load}>Tentar novamente</button></div>
          : visible.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-14 text-center">
              <div className="rounded-2xl bg-slate-100 p-4 dark:bg-slate-800"><Inbox className="h-7 w-7 text-slate-400" /></div>
              <p className="font-medium">{data?.items.length ? "Nenhum resultado para os filtros" : "Nenhum lançamento neste mês"}</p>
              {!data?.items.length && <button className="btn-primary mt-2" onClick={() => setEdit(null)}><Plus className="h-4 w-4" />Adicionar o primeiro</button>}
            </div>
          ) : (
            <div className={`space-y-5 transition-opacity ${loading ? "opacity-50" : ""}`}>
              {groups.map(([day, list]) => {
                const inc = list.filter((t) => t.type === "INCOME").reduce((a, t) => a + Number(t.amount), 0);
                const exp = list.filter((t) => t.type === "EXPENSE").reduce((a, t) => a + Number(t.amount), 0);
                return (
                  <div key={day || "all"}>
                    {day && <div className="mb-2 flex items-center justify-between text-xs font-medium text-slate-500">
                      <span>{fmtDate(day)}</span>
                      <span>{inc > 0 && <span className="text-income">+{brl(inc)} </span>}{exp > 0 && <span className="text-expense">−{brl(exp)}</span>}</span>
                    </div>}
                    <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                      {list.map((t) => {
                        const C = (CATEGORIES[t.category] ?? CATEGORIES.OUTRAS);
                        const inc = t.type === "INCOME";
                        return (
                          <li key={t.id} className="flex items-center gap-3 py-3">
                            <div className={`rounded-xl p-2.5 ${inc ? "bg-income/10 text-income" : "bg-expense/10 text-expense"}`}><C.icon className="h-4 w-4" /></div>
                            <button className="min-w-0 flex-1 text-left" onClick={() => setDetail(t)}>
                              <p className="truncate text-sm font-medium">{t.title}</p>
                              <p className="text-xs text-slate-500">{C.label} · {fmtDate(t.date)}</p>
                            </button>
                            <p className={`text-sm font-semibold ${inc ? "text-income" : "text-expense"}`}>{inc ? "+" : "−"}{brl(Number(t.amount))}</p>
                            <div className="hidden gap-1 sm:flex">
                              <button aria-label="Ver" className="rounded-lg p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => setDetail(t)}><Eye className="h-4 w-4" /></button>
                              <button aria-label="Editar" className="rounded-lg p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => setEdit(t)}><Pencil className="h-4 w-4" /></button>
                              <button aria-label="Excluir" className="rounded-lg p-1.5 text-expense hover:bg-expense/10" onClick={() => setDel(t)}><Trash2 className="h-4 w-4" /></button>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                );
              })}
              {visible.length > limit && <button className="btn-ghost w-full" onClick={() => setLimit(limit + PAGE)}>Carregar mais</button>}
            </div>
          )}
      </section>

      {edit !== undefined && <TransactionModal tx={edit} defaultDate={ym === today.slice(0, 7) ? today : `${ym}-01`} onClose={() => setEdit(undefined)}
        onSaved={(warn) => { notify(warn ?? (edit ? "Lançamento atualizado" : "Lançamento criado"), !warn); setEdit(undefined); setDetail(null); load(); }} />}

      {detail && !del && edit === undefined && (
        <Modal title="Detalhes" onClose={() => setDetail(null)}>
          <p className={`text-2xl font-semibold ${detail.type === "INCOME" ? "text-income" : "text-expense"}`}>{detail.type === "INCOME" ? "+" : "−"}{brl(Number(detail.amount))}</p>
          <p className="mt-1 font-medium">{detail.title}</p>
          <p className="text-sm text-slate-500">{CATEGORIES[detail.category]?.label} · {fmtDate(detail.date)} · {detail.type === "INCOME" ? "Ganho" : "Gasto"}</p>
          {detail.description && <p className="mt-4 whitespace-pre-wrap rounded-xl bg-slate-50 p-3 text-sm dark:bg-slate-800">{detail.description}</p>}
          {detail.images.length > 0 && <div className="mt-4 grid grid-cols-3 gap-2">{detail.images.map((i) => <a key={i.id} href={i.url} target="_blank" rel="noreferrer"><img src={i.url} alt="" className="aspect-square rounded-lg object-cover" /></a>)}</div>}
          <div className="mt-5 flex justify-end gap-2">
            <button className="btn-ghost text-expense" onClick={() => setDel(detail)}><Trash2 className="h-4 w-4" />Excluir</button>
            <button className="btn-primary" onClick={() => setEdit(detail)}><Pencil className="h-4 w-4" />Editar</button>
          </div>
        </Modal>
      )}

      {del && (
        <Modal title="Excluir lançamento?" onClose={() => setDel(null)}>
          <p className="text-sm text-slate-500">“{del.title}” será removido permanentemente, junto com suas fotos.</p>
          <div className="mt-5 flex justify-end gap-2">
            <button className="btn-ghost" onClick={() => setDel(null)}>Cancelar</button>
            <button className="btn bg-expense text-white hover:opacity-90" disabled={deleting} onClick={confirmDelete}>{deleting && <Loader2 className="h-4 w-4 animate-spin" />}Excluir</button>
          </div>
        </Modal>
      )}

      {toast && <div role="status" className={`fixed bottom-20 left-1/2 md:bottom-5 z-[60] -translate-x-1/2 animate-pop rounded-xl px-4 py-2.5 text-sm font-medium text-white shadow-lg ${toast.ok ? "bg-slate-900 dark:bg-slate-700" : "bg-expense"}`}>{toast.msg}</div>}
    </div>
  );
}
