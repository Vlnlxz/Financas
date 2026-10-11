"use client";
import { useEffect, useRef, useState } from "react";
import { Download, Trash2, Upload } from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import { clearAll, exportJson, getName, importJson, setName } from "@/lib/store";

export default function Profile() {
  const [name, setN] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const file = useRef<HTMLInputElement>(null);
  useEffect(() => setN(getName()), []);
  const run = (fn: () => string) => { try { setMsg({ ok: true, text: fn() }); } catch (e) { setMsg({ ok: false, text: e instanceof Error ? e.message : "Erro" }); } };

  const backup = () => run(() => {
    const url = URL.createObjectURL(new Blob([exportJson()], { type: "application/json" }));
    const a = document.createElement("a");
    a.href = url; a.download = `financas-backup-${new Date().toISOString().slice(0, 10)}.json`; a.click();
    URL.revokeObjectURL(url);
    return "Backup baixado";
  });

  async function restore(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; e.target.value = "";
    if (!f) return;
    if (!confirm("Importar substitui TODOS os lançamentos atuais por os do backup. Continuar?")) return;
    const text = await f.text();
    run(() => `${importJson(text)} lançamentos importados`);
  }

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6">
      <h1 className="text-xl font-semibold">Ajustes</h1>

      <div className="card space-y-3 p-5">
        <label className="label">Seu nome (para a saudação)</label>
        <input className="input" maxLength={100} value={name} onChange={(e) => { setN(e.target.value); setName(e.target.value); }} />
      </div>

      <div className="card flex items-center justify-between p-5">
        <div><p className="text-sm font-semibold">Tema</p><p className="text-xs text-slate-500">Alterne entre claro e escuro</p></div>
        <ThemeToggle />
      </div>

      <div className="card space-y-3 p-5">
        <div>
          <p className="text-sm font-semibold">Backup dos dados</p>
          <p className="text-xs text-slate-500">Seus dados ficam só neste navegador. Limpar os dados do navegador apaga tudo, então baixe backups com frequência.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="btn-ghost" onClick={backup}><Download className="h-4 w-4" />Exportar</button>
          <button className="btn-ghost" onClick={() => file.current?.click()}><Upload className="h-4 w-4" />Importar</button>
          <button className="btn-ghost text-expense" onClick={() => { if (confirm("Apagar TODOS os lançamentos deste navegador? Isso não pode ser desfeito.")) run(() => { clearAll(); return "Todos os dados foram apagados"; }); }}><Trash2 className="h-4 w-4" />Apagar tudo</button>
        </div>
        <input ref={file} type="file" accept="application/json" hidden onChange={restore} />
        {msg && <p role="status" className={`rounded-lg px-3 py-2 text-sm ${msg.ok ? "bg-income/10 text-income" : "bg-expense/10 text-expense"}`}>{msg.text}</p>}
      </div>
    </div>
  );
}
