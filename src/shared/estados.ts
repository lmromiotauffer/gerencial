// Cor = significado. Estados de prazo, conformidade e situação; o azul fica para identidade, ação e seleção.
export type Estado = "bom" | "atencao" | "ruim" | "neutro" | "andamento";

export const fundoEstado: Record<Estado, string> = {
  bom: "bg-n-success",
  atencao: "bg-n-alerta",
  ruim: "bg-destructive",
  // muted-foreground, não input: o percentual branco dentro do trecho precisa de 4,5:1 (input dava 3,8:1)
  neutro: "bg-muted-foreground",
  andamento: "bg-primary",
};

export const corEstado: Record<Estado, string> = {
  bom: "text-n-success",
  atencao: "text-n-alerta",
  ruim: "text-destructive",
  neutro: "text-muted-foreground",
  andamento: "text-primary",
};

// Situações do app: contrato (Vigente, Encerrado, Rescindido…) e obra (A Iniciar, Em Andamento, Execução Concluída…)
export const estadoSituacao = (situacao: string): Estado => {
  const s = situacao.toLowerCase();
  if (s.includes("paralis") || s.includes("rescind") || s.includes("não executada")) return "ruim";
  if (s.includes("parcial")) return "atencao";
  if (s.includes("concluída") || s.includes("vigente")) return "bom";
  if (s.includes("andamento")) return "andamento";
  return "neutro";
};

export const estadoPrazo = (faixa: string): Estado =>
  faixa.startsWith("≤ 30") ? "ruim" : faixa.startsWith("> 90") ? "bom" : "atencao";

// Faixas das dimensões mestras de alerta das obras (expressoes.ts: mestres)
export const estadoDiferenca = (faixa: string): Estado =>
  faixa === "≥ -5 p.p." ? "bom" : faixa === "< -50 p.p." ? "ruim" : faixa.startsWith("≥ -50") ? "atencao" : "neutro";
export const estadoMedicao = (faixa: string): Estado =>
  faixa === "≤ 60 dias" ? "bom" : faixa === "> 90 dias" ? "ruim" : faixa.startsWith("> 60") ? "atencao" : "neutro";
export const estadoParalisacao = (faixa: string): Estado => (faixa.startsWith(">=") ? "ruim" : "atencao");
export const estadoRecebimento = (faixa: string): Estado => (faixa === "Com TRD" ? "bom" : faixa === "TRD atrasado" ? "ruim" : "neutro");
