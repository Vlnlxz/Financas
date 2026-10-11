import {
  Wallet, Store, Utensils, Car, Gamepad2, Receipt, HeartPulse,
  GraduationCap, ShoppingBag, Tag, type LucideIcon,
} from "lucide-react";

export const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
export const fmtDate = (iso: string) => { const [y, m, d] = iso.slice(0, 10).split("-"); return `${d}/${m}/${y}`; };
export const todayBR = () => new Date().toLocaleDateString("sv-SE", { timeZone: "America/Sao_Paulo" });
export const MONTHS = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];

export const CATEGORIES: Record<string, { label: string; icon: LucideIcon }> = {
  SALARIO: { label: "Salário", icon: Wallet },
  VENDAS: { label: "Vendas", icon: Store },
  ALIMENTACAO: { label: "Alimentação", icon: Utensils },
  TRANSPORTE: { label: "Transporte", icon: Car },
  LAZER: { label: "Lazer", icon: Gamepad2 },
  CONTAS: { label: "Contas", icon: Receipt },
  SAUDE: { label: "Saúde", icon: HeartPulse },
  EDUCACAO: { label: "Educação", icon: GraduationCap },
  COMPRAS: { label: "Compras", icon: ShoppingBag },
  OUTRAS: { label: "Outras", icon: Tag },
};
