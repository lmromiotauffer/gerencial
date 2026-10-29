// Colunas das tabelas da seção Obras: Lista das obras (KjjxPXa), Obras paralisadas (PANxj) e Obras em garantia (fa62b202) do app
import { crescente, type ColunaTabela } from "@/components/CartaoPainel/colunas";
import { obras } from "@/shared/qlik/expressoes";
import { emReais } from "@/pages/Contratos/colunas";

const dim = (campo: string, rotulo: string, largura: number | "resto", extra?: Partial<ColunaTabela>): ColunaTabela =>
  ({ type: "dimension", qFieldDefs: [campo], qFieldLabels: [rotulo], largura, ...extra }) as ColunaTabela;
const med = (qDef: string, qLabel: string, largura = 150): ColunaTabela => ({ type: "measure", qDef, qLabel, largura });

const soObras = "cdTipoObra = {15, 30, 33, 35, 37, 41, 45}";
// O cubo do app não suprime zeros: a primeira dimensão é nula fora do recorte e a linha sai (qNullSuppression)
const codigoSe = (condicao: string, extra?: Partial<ColunaTabela>) =>
  dim(`=If(${condicao}, cdLote)`, "Código da obra", 110, { qNullSuppression: true, ...extra });
const percentual = (expressao: string) => `Num(${expressao}, '0,0%')`;

export const colunasObras: ColunaTabela[] = [
  codigoSe("Match(cdTipoObra, 15, 30, 33, 35, 37, 41, 45)", { sortingPriority: 1 }),
  dim("Contrato", "Contrato", 130, { sortingPriority: 0 }),
  dim("=[Descrição da obra]", "Descrição da obra", 280),
  dim("=Credor", "Credor", 220),
  dim("=[Sigla adjunta]", "Adjunta", 90),
  dim("=[Sigla órgão setor]", "Setor", 120),
  dim("Tipo da obra filtrado tabela", "Tipo da obra", 200),
  dim("Classificação da obra filtrado tabela", "Classificação da obra", 200),
  dim("=[Situação atual da obra]", "Situação atual", 140),
  dim("qtExtensaoObra", "Extensão", 90, { alinhamento: "direita" }),
  dim("=[Unidade extensão da obra]", "Unidade", 80),
  dim("Data início execução da obra", "Ordem de início", 120),
  dim("Data fim execução da obra", "Fim da execução", 120),
  med(`Date(Max({<[_skEvento] = {9}, ${soObras}>} dataEventoObra))`, "Recebimento provisório", 130),
  med(emReais(obras.valor), "Valor da obra"),
  med(emReais(obras.medidoPI), "Executado (PI)"),
  med(emReais(obras.medidoTotal), "Executado (PI + R)"),
  med(percentual(obras.execucao), "% executado", 100),
  med(percentual(obras.execucaoEsperada), "% esperado hoje", 110),
];

const paralisada = `flUltimaParalisacao = 1 and [Situação atual da obra] = 'Paralisada' and Match(cdTipoObra, 15, 30, 33, 35, 37, 41, 45)`;

// Mais tempo paralisada primeiro
export const colunasParalisadas: ColunaTabela[] = [
  dim(`=If(${paralisada}, dtParalisacaoObra)`, "Paralisada em", 110, {
    qNullSuppression: true,
    qSortCriterias: [{ qSortByNumeric: crescente }],
    sortingPriority: 0,
  }),
  dim("dtPrevisaoRetorno", "Previsão de retorno", 120),
  dim("Contrato", "Contrato", 130),
  dim("cdLote", "Código da obra", 110),
  dim("=[Descrição da obra]", "Descrição da obra", "resto"),
  dim("=[Sigla órgão setor]", "Setor", 110),
  dim("deMotivoParalisacao", "Motivo", 200),
  dim("deResponsavel", "Responsável", 160),
  med(`Only({<${soObras}, [Situação atual da obra] = {"Paralisada"}, flUltimaParalisacao = {1}>} nuDiasParalisados)`, "Dias paralisada", 110),
];

// Garantia que acaba primeiro no topo (crescente: ver o sinal trocado em CartaoPainel/colunas.ts)
export const colunasGarantia: ColunaTabela[] = [
  dim("=If(flGarantia = 'S' and Match(cdTipoObra, 15, 30, 33, 35, 37, 41, 45), [Data fim garantia])", "Fim da garantia", 120, {
    qNullSuppression: true,
    qSortCriterias: [{ qSortByNumeric: crescente }],
    sortingPriority: 0,
  }),
  dim("Contrato", "Contrato", 130),
  dim("cdLote", "Código da obra", 110),
  dim("=[Descrição da obra]", "Descrição da obra", "resto"),
  dim("=[Sigla órgão setor]", "Setor", 110),
  dim("=Credor", "Credor", 200),
  dim("Tipo da obra filtrado tabela", "Tipo da obra", 180),
  med(
    `Date(If(IsNull(Max({<[_skEvento] = {10}, ${soObras}>} dataEventoObra)), Max({<[_skEvento] = {9}, ${soObras}>} dataEventoObra) + 90, Max({<[_skEvento] = {10}, ${soObras}>} dataEventoObra)))`,
    "Recebimento definitivo",
    140,
  ),
  med(emReais(obras.valor), "Valor da obra"),
];
