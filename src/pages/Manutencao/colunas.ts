// Colunas da Lista das obras da folha Tabela de manutenção (9c0065ca) do app, no recorte cdTipoObra = {4}
import type { ColunaTabela } from "@/components/CartaoPainel/colunas";
import { manutencao } from "@/shared/qlik/expressoes";
import { emReais } from "@/pages/Contratos/colunas";

const dim = (campo: string, rotulo: string, largura: number | "resto", extra?: Partial<ColunaTabela>): ColunaTabela =>
  ({ type: "dimension", qFieldDefs: [campo], qFieldLabels: [rotulo], largura, ...extra }) as ColunaTabela;
const med = (qDef: string, qLabel: string, largura = 150): ColunaTabela => ({ type: "measure", qDef, qLabel, largura });

export const colunasManutencao: ColunaTabela[] = [
  dim("Contrato", "Contrato", 130, { sortingPriority: 0 }),
  // O cubo do app não suprime zeros: o código é nulo fora do recorte e a linha sai (qNullSuppression)
  dim("=If(cdTipoObra = 4, cdLote)", "Código", 90, { qNullSuppression: true, sortingPriority: 1 }),
  dim("=[Descrição da obra]", "Descrição", 300),
  dim("=[Classificação da obra]", "Classificação", 220),
  dim("=[Situação atual da obra]", "Situação atual", 140),
  dim("Sigla adjunta", "Adjunta", 90),
  dim("=[Sigla órgão setor]", "Setor", 120),
  dim("qtExtensaoObra", "Extensão", 90, { alinhamento: "direita" }),
  dim("=[Unidade extensão da obra]", "Unidade", 80),
  med(emReais(manutencao.valor), "Valor"),
  med(emReais(manutencao.medidoPI), "Executado (PI)"),
  med(emReais(manutencao.reajuste), "Reajuste (R)"),
  med(emReais(manutencao.medidoTotal), "Executado (PI + R)"),
  med(`Num(${manutencao.execucao}, '0,0%')`, "% executado", 100),
  med(emReais(manutencao.cronograma), "Cronograma"),
];
