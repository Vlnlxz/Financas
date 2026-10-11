"use client";
import { useRef, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import Modal from "./Modal";
import { CATEGORIES, brl, todayBR } from "@/lib/format";
import { compressToDataUrl } from "@/lib/image";
import { saveTx } from "@/lib/store";
import type { Tx, TxType } from "@/types";

const MAX_PHOTOS = 3;

export default function TransactionModal({ tx, defaultDate, onClose, onSaved }: {
  tx: Tx | null; defaultDate: string; onClose: () => void; onSaved: (warning?: string) => void;
}) {
  const [type, setType] = useState<TxType>(tx?.type ?? "EXPENSE");
  const [cents, setCents] = useState(tx ? String(Math.round(Number(tx.amount) * 100)) : "");
  const [title, setTitle] = useState(tx?.title ?? "");
  const [date, setDate] = useState(tx?.date.slice(0, 10) ?? defaultDate);
  const [category, setCategory] = useState(tx?.category ?? "OUTRAS");
  const [description, setDescription] = useState(tx?.description ?? "");
  const [removed, setRemoved] = useState<string[]>([]);
  const [added, setAdded] = useState<{ preview: string }[]>([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const kept = (tx?.images ?? []).filter((i) => !removed.includes(i.id));
  const total = kept.length + added.length;

  async function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    setError("");
    const next = [...added];
    for (const f of files) {
      if (kept.length + next.length >= MAX_PHOTOS) { setError(`Máximo de ${MAX_PHOTOS} fotos`); break; }
      if (!/^image\/(jpeg|png|webp)$/.test(f.type)) { setError("Use imagens JPG, PNG ou WebP"); continue; }
      try { next.push({ preview: await compressToDataUrl(f) }); }
      catch { setError("Não foi possível processar uma das imagens"); }
    }
    setAdded(next);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const amount = Number(cents) / 100;
    if (!(amount > 0)) return setError("Informe um valor maior que zero");
    if (!title.trim()) return setError("Informe o título");
    if (!date) return setError("Informe a data");
    setSaving(true); setError("");
    try {
      const images = [...kept, ...added.map((a) => ({ id: crypto.randomUUID(), url: a.preview }))];
      saveTx({ id: tx?.id, type, amount, title: title.trim(), description: description.trim() || null, date, category, images });
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível salvar");
      setSaving(false);
    }
  }

  const seg = (t: TxType, label: string, on: string) => (
    <button type="button" onClick={() => setType(t)} className={`flex-1 rounded-lg py-2 text-sm font-medium transition ${type === t ? on : "text-slate-500"}`}>{label}</button>
  );

  return (
    <Modal title={tx ? "Editar lançamento" : "Novo lançamento"} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <div className="flex gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
          {seg("EXPENSE", "Gasto", "bg-expense text-white shadow")}
          {seg("INCOME", "Ganho", "bg-income text-white shadow")}
        </div>
        <div>
          <label className="label">Valor</label>
          <input className="input text-lg font-semibold" inputMode="numeric" placeholder="R$ 0,00"
            value={cents ? brl(Number(cents) / 100) : ""}
            onChange={(e) => setCents(e.target.value.replace(/\D/g, "").replace(/^0+/, "").slice(0, 11))} />
        </div>
        <div><label className="label">Título</label><input className="input" maxLength={150} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex.: Salário, Mercado..." /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label">Data</label><input className="input" type="date" max={`${Number(todayBR().slice(0, 4)) + 5}-12-31`} value={date} onChange={(e) => setDate(e.target.value)} /></div>
          <div><label className="label">Categoria</label>
            <select className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
              {Object.entries(CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select></div>
        </div>
        <div><label className="label">Descrição</label><textarea className="input min-h-24" maxLength={5000} value={description} onChange={(e) => setDescription(e.target.value)} /></div>
        <div>
          <label className="label">Fotos ({total}/{MAX_PHOTOS})</label>
          <div className="flex flex-wrap gap-2">
            {kept.map((i) => (
              <div key={i.id} className="relative">
                <img src={i.url} alt="" className="h-16 w-16 rounded-lg object-cover" />
                <button type="button" aria-label="Remover foto" onClick={() => setRemoved([...removed, i.id])} className="absolute -right-1.5 -top-1.5 rounded-full bg-expense p-0.5 text-white"><X className="h-3.5 w-3.5" /></button>
              </div>
            ))}
            {added.map((a, idx) => (
              <div key={a.preview} className="relative">
                <img src={a.preview} alt="" className="h-16 w-16 rounded-lg object-cover" />
                <button type="button" aria-label="Remover foto" onClick={() => { setAdded(added.filter((_, k) => k !== idx)); }} className="absolute -right-1.5 -top-1.5 rounded-full bg-expense p-0.5 text-white"><X className="h-3.5 w-3.5" /></button>
              </div>
            ))}
            {total < MAX_PHOTOS && (
              <button type="button" onClick={() => fileRef.current?.click()} className="flex h-16 w-16 items-center justify-center rounded-lg border border-dashed border-slate-300 text-slate-400 transition hover:border-brand hover:text-brand dark:border-slate-700" aria-label="Adicionar fotos"><ImagePlus className="h-5 w-5" /></button>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" multiple hidden onChange={pick} />
        </div>
        {error && <p role="alert" className="rounded-lg bg-expense/10 px-3 py-2 text-sm text-expense">{error}</p>}
        <div className="flex justify-end gap-2">
          <button type="button" className="btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn-primary" disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin" />}Salvar</button>
        </div>
      </form>
    </Modal>
  );
}
