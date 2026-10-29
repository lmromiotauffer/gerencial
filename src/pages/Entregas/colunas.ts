// Colunas da lista de entregas: as folhas de entregas do app não têm tabela; segue a Lista das obras (KjjxPXa)
// no recorte cdTipoObra = 35 com classe 4 (pavimentação) ou 6 (restauração)
import type { ColunaTabela } from "@/components/CartaoPainel/colunas";
import { obras } from "@/shared/qlik/expressoes";
import { emReais } from "@/pages/Contratos/colunas";

const dim = (campo: string, rotulo: string, largura: number | "resto", extra?: Partial<ColunaTabela>): ColunaTabela =>
  ({ type: "dimension", qFieldDefs: [campo], qFieldLabels: [rotulo], largura, ...extra }) as ColunaTabela;
const med = (qDef: string, qLabel: string, largura = 150): ColunaTabela => ({ type: "measure", qDef, qLabel, largura });

export const colunasEntregas: ColunaTabela[] = [
  dim("Contrato", "Contrato", 130, { sortingPriority: 0 }),
  // O código é nulo fora do recorte e a linha sai (qNullSuppression); ele se repete entre contratos, daí o Contrato
  dim("=If(cdTipoObra = 35 and Match(cdClasseObra, 4, 6), cdLote)", "Código da obra", 110, { qNullSuppression: true, sortingPriority: 1 }),
  dim("=[Descrição da obra]", "Descrição da obra", 280),
  dim("=[Classificação da obra]", "Classificação", 220),
  dim("=[Situação atual da obra]", "Situação atual", 140),
  dim("=[Sigla órgão setor]", "Setor", 120),
  dim("=Credor", "Credor", 220),
  dim("qtExtensaoObra", "Extensão", 90, { alinhamento: "direita" }),
  dim("=[Unidade extensão da obra]", "Unidade", 80),
  med("Date(Max({<[_skEvento] = {9}>} dataEventoObra))", "Recebimento provisório", 130),
  med(emReais(obras.valor), "Valor da obra"),
  med(emReais(obras.medidoPI), "Executado (PI)"),
  med(`Num(${obras.execucao}, '0,0%')`, "% executado", 100),
];
