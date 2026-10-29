import type { FilterConfig } from "@/shared/qlik/filtros";

// Rótulos dos campos selecionados fora da barra de filtros (cliques nas tabelas, gráficos e chips de alerta).
// Campos técnicos do app d7a3a844 (docs/objetos-gerencial.md); os campos já legíveis ("Situação atual da obra") passam direto.
const fieldLabels: Record<string, string> = {
  cdLote: "Código da obra",
  cdContrato: "Contrato",
  DEANOMES: "Mês",
  Ano: "Ano",
  deMotivoParalisacao: "Motivo da paralisação",
  deResponsavel: "Responsável",
  dtParalisacaoObra: "Data da paralisação",
  dtPrevisaoRetorno: "Previsão de retorno",
  dataFotoDiarioObra: "Data da foto",
  nmServicoFoto: "Serviço da foto",
  qtExtensaoObra: "Extensão",
  "Sigla adjunta": "Adjunta",
  "Sigla órgão setor": "Setor",
  "Sigla da rodovia": "Rodovia",
  "Prazo vigencia contratos": "Tempo até o fim da vigência",
  "Conformidade de valor cronograma (contratos vigentes)": "Valor igual ao cronograma",
  "Conformidade de data: fim execução do contrato x fim vigência do contrato": "Fim da execução dentro da vigência",
  "Obras por diferença previsto x realizado (p.p.)": "Previsto × realizado",
  "Última medição aprovada (PI)": "Tempo sem medição",
  "Obras paralisadas por tempo de paralisação": "Tempo de paralisação",
  // Alertas de valor, cronograma e medição são Aggr por contrato/obra: o engine seleciona a chave técnica
  _skContrato: "Contratos",
  _skObra: "Obras",
};

/** Campos-chave: o valor selecionado é um código interno; o chip mostra a contagem em vez dele */
export const camposChave = new Set(["_skContrato", "_skObra"]);

/** Nome do campo numa expressão de filtro: "=[Situação atual do contrato]" vira "Situação atual do contrato" */
export const campoDaExpressao = (expressao: string): string =>
  expressao.replace(/^=/, "").replace(/^\[(.*)\]$/, "$1");

// Dimensão mestra calculada: a seleção volta com a expressão inteira como nome do campo ("=If([Situação atual do contrato]=…").
// Casa por um trecho exclusivo de cada expressão, não pelo texto todo: o app pode reformatar espaços e quebras sem mudar o sentido.
const rotulosPorTrecho: [trecho: string, rotulo: string][] = [
  ["[Data fim vigência do contrato]", "Tempo até o fim da vigência"],
  ["'Nenhuma medição'", "Tempo sem medição"],
  ["'Ausência de cronograma'", "Previsto × realizado"],
  ["vlCronogramaProposta", "Valor igual ao cronograma"],
];

const rotuloDaExpressao = (field: string) =>
  field.startsWith("=") ? rotulosPorTrecho.find(([trecho]) => field.includes(trecho))?.[1] : undefined;

export const getFieldLabel = (field: string, filters: FilterConfig[]): string =>
  filters.find(({ expression }) => campoDaExpressao(expression) === field)?.label ??
  fieldLabels[field] ??
  rotuloDaExpressao(field) ??
  field;
