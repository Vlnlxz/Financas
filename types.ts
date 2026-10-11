export type TxType = "INCOME" | "EXPENSE";
export interface TxImage { id: string; url: string }
export interface Tx {
  id: string; type: TxType; amount: string | number; title: string;
  description: string | null; date: string; category: string; images: TxImage[];
}
export interface Summary { income: number; expense: number; balance: number; count: number }
