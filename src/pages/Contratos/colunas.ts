// Colunas das tabelas da seção Contratos: Lista dos contratos (ShcNR) e Necessidade orçamentária (c4ee3c02) do app
import { crescente, type ColunaTabela } from "@/components/CartaoPainel/colunas";
import { contratos } from "@/shared/qlik/expressoes";

export const emReais = (expressao: string) => `Num(${expressao}, 'R$ #.##0,00;-R$ #.##0,00')`;

const dim = (campo: string, rotulo: string, largura: number | "resto", extra?: Partial<ColunaTabela>): ColunaTabela =>
  ({ type: "dimension", qFieldDefs: [campo], qFieldLabels: [rotulo], largura, ...extra }) as ColunaTabela;
const med = (qDef: string, qLabel: string, largura = 150): ColunaTabela => ({ type: "measure", qDef, qLabel, largura });

export const colunasContratos: ColunaTabela[] = [
  dim("Contrato", "Contrato", 140, { sortingPriority: 0 }),
  dim("=[Descrição do contrato]", "Descrição do contrato", 280),
  dim("=Credor", "Credor", 220),
  dim("=[Tipo do contrato]", "Tipo do contrato", 170),
  dim("=[Classificação do contrato]", "Classificação do contrato", 200),
  dim("=[Situação atual do contrato]", "Situação atual", 120),
  dim("=[Sigla adjunta]", "Adjunta", 90),
  dim("=[Sigla órgão setor]", "Setor", 120),
  dim("Data início vigência do contrato", "Início da vigência", 120),
  dim("Data fim execução do contrato", "Fim da execução", 120),
  dim("=[Data fim vigência do contrato]", "Fim da vigência", 120),
  med(emReais(contratos.original), "Contratado original"),
  med(emReais(contratos.aditivos), "Aditivos"),
  med(emReais(contratos.atual), "Contratado atual (original + aditivos)", 170),
  med(emReais(contratos.cronograma), "Cronograma"),
  med(emReais(contratos.apostilamento), "Apostilamento"),
  med(emReais(contratos.medidoPI), "Executado (PI)"),
  med(`Num((${contratos.medidoPI}) / (${contratos.atual}), '0,0%')`, "% executado", 100),
  med(emReais(contratos.reajuste), "Reajuste (R)"),
  med(emReais(contratos.medidoTotal), "Executado (PI + R)"),
  med(emReais(contratos.saldoPI), "Saldo a executar (PI)"),
  med(emReais(contratos.liquidado), "Liquidado"),
];

// Contratos vigentes pela proximidade do fim da vigência (os encerrados ficam nulos e saem);
// a seleção de uma faixa de prazo (chip ou barra) filtra esta lista
export const colunasVigencia: ColunaTabela[] = [
  dim("=If([Situação atual do contrato] = 'Vigente', [Data fim vigência do contrato])", "Fim da vigência", 120, {
    qSortCriterias: [{ qSortByNumeric: crescente }],
    qNullSuppression: true,
    sortingPriority: 0,
  }),
  dim("Contrato", "Contrato", 140, { sortingPriority: 1 }),
  dim("=Credor", "Credor", "resto"),
  dim("=[Situação atual do contrato]", "Situação atual", 120),
  dim("Data fim execução do contrato", "Fim da execução", 120),
  med("Only([Data fim vigência do contrato]) - Today()", "Dias até o fim", 110),
  med(emReais(contratos.atual), "Contratado atual", 160),
  med(emReais(contratos.medidoPI), "Executado (PI)", 160),
];

// Necessidade orçamentária: expressões da pivot c4ee3c02 do app, com o ano como coluna em vez de pivotado
const vigentesFuturo = `_skTempo={">=$(=Date(MonthStart(Today()), 'YYYYMMDD'))"}, [Situação atual do contrato] = {'Vigente'}, _skContrato = P(_skContrato), PAOE=`;
const vigentes = `[Situação atual do contrato] = {'Vigente'}, _skContrato = P(_skContrato), PAOE=`;
const cronogramaPI = `(Sum({<${vigentesFuturo}>} valorCronogramaAplicandoConvenio) + Sum({<${vigentes}>} vlSaldoPassado) + Sum({<${vigentesFuturo}>} vlCronogramaPropostaAplicandoConvenio)) - [(EMP - LIQ) dos contratos vigentes contexto tabela]`;
const reajusteR = `Sum({<${vigentesFuturo}>} vlPrevistoReajustamentoObra) + Sum({<${vigentes}>} vlSaldoPassadoReajustado)`;

export const colunasOrcamento: ColunaTabela[] = [
  dim("Contrato", "Contrato", 140, { sortingPriority: 0 }),
  dim("Credor", "Credor", 220),
  dim("Descrição do contrato", "Descrição do contrato", "resto"),
  dim("Ano", "Ano", 80, { sortingPriority: 1 }),
  med(emReais(cronogramaPI), "Cronograma + passivo (PI), menos empenhado a liquidar", 220),
  med(emReais(reajusteR), "Reajuste previsto (R)", 160),
  med(emReais(`(${cronogramaPI}) + (${reajusteR})`), "Necessidade total", 160),
];

// Necessidade por ano: expressão do gráfico 00f6995a do app
const somaFutura = "[Cronograma futuro PI considerando convênio (A)] + [Cronograma futuro R (B)] + [Passivo não executado PI (D)] + [Passivo não executado R (E)]";
export const necessidadePorAno = `If(GetSelectedCount(Contrato) >= 1 OR GetSelectedCount([Descrição do contrato]) >= 1 OR GetSelectedCount([Descrição da obra]) >= 1,
  (${somaFutura}) - [(EMP - LIQ) dos contratos vigentes contexto gráfico],
  (${somaFutura}) - [(EMP - LIQ) dos contratos vigentes contexto gráfico] - ([Valor disponível ano corrente] + [Valor bloqueado ano corrente] + [Valor contingenciado ano corrente]))`;
