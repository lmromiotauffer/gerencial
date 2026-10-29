// Avalia no app Qlik as expressões de src/shared/qlik/expressoes.ts e imprime os números, para conferir
// com o painel atual antes de ir à tela. Uso: node --experimental-strip-types scripts/validar-expressoes.mts
import { readFileSync } from "node:fs";
import enigma from "enigma.js";
import WebSocket from "ws";
import schema from "enigma.js/schemas/12.170.2.json" with { type: "json" };
import { contratos, obras, manutencao, entregas, mestres } from "../src/shared/qlik/expressoes.ts";

const conexao = JSON.parse(readFileSync("public/connection.json", "utf8"));
const base = `https://${conexao.host}`;
const hub = await fetch(`${base}/hub/`, { redirect: "manual" });
const cookies = hub.headers.getSetCookie().map((c) => c.split(";")[0]).join("; ");
const csrf = await fetch(`${base}/qps/csrftoken`, { headers: { Cookie: cookies } });
const token = csrf.headers.get("qlik-csrf-token") ?? "";
const sessao = enigma.create({
  schema,
  url: `wss://${conexao.host}/app/${conexao.appId}?qlik-csrf-token=${token}`,
  createSocket: (url: string) => new WebSocket(url, { headers: { Cookie: cookies, Origin: base } }) as never,
});
const app = await (await sessao.open()).openDoc(conexao.appId);

const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const grupos: Record<string, Record<string, string>> = { contratos, obras, manutencao, entregas };
for (const [grupo, exprs] of Object.entries(grupos)) {
  console.log(`\n== ${grupo}`);
  for (const [nome, expr] of Object.entries(exprs)) {
    // As curvas acumuladas só fazem sentido dentro de um cubo por mês (conferidas abaixo)
    if (nome.endsWith("Acumulado")) continue;
    try {
      const r = await app.evaluateEx(expr);
      const n = r.qNumber;
      console.log(`${nome.padEnd(24)} ${r.qIsNumeric ? (Math.abs(n) >= 1e5 ? brl(n) : n.toLocaleString("pt-BR", { maximumFractionDigits: 4 })) : r.qText}`);
    } catch (e) { console.log(`${nome.padEnd(24)} ERRO ${e}`); }
  }
}

const cubo = async (titulo: string, dim: Record<string, unknown>, medida: string) => {
  const obj = await app.createSessionObject({
    qInfo: { qType: "cubo" },
    qHyperCubeDef: {
      qDimensions: [{ ...dim, qNullSuppression: true }],
      qMeasures: [{ qDef: { qDef: medida } }],
      qInitialDataFetch: [{ qTop: 0, qLeft: 0, qWidth: 2, qHeight: 40 }],
    },
  });
  const layout = await obj.getLayout();
  const linhas = layout.qHyperCube.qDataPages[0].qMatrix.map((l: { qText: string; qNum: number }[]) => `${l[0].qText}=${Math.abs(l[1].qNum) >= 1e5 ? brl(l[1].qNum) : l[1].qText}`);
  console.log(`\n== ${titulo} (${layout.qHyperCube.qSize.qcy} linhas)\n${linhas.join(" | ")}`);
};
await cubo("prazo vigência", { qLibraryId: mestres.prazoVigencia }, contratos.vigentes);
await cubo("conformidade valor", { qLibraryId: mestres.conformidadeValor }, contratos.vigentes);
await cubo("conformidade data", { qLibraryId: mestres.conformidadeData }, contratos.vigentes);
await cubo("situação obra", { qLibraryId: mestres.situacaoObra }, obras.quantidade);
await cubo("previsto x realizado", { qLibraryId: mestres.diferencaPrevistoRealizado }, obras.quantidade);
await cubo("última medição", { qLibraryId: mestres.ultimaMedicao }, obras.quantidade);
await cubo("situação contrato", { qDef: { qFieldDefs: ["[Situação atual do contrato]"] } }, contratos.quantidade);
await cubo("por adjunta", { qDef: { qFieldDefs: ["[Sigla adjunta]"] } }, contratos.atual);
await cubo("km pav por ano", { qDef: { qFieldDefs: ["=Year(dataEventoObra)"] } }, "Sum({<[_skEvento] = {9}, cdTipoObra = {35}, cdClasseObra = {4}>} Aggr(qtExtensaoObra, [_skObra]))");
await cubo("necessidade por ano", { qDef: { qFieldDefs: ["Ano"] } }, "[Cronograma futuro PI considerando convênio (A)] + [Cronograma futuro R (B)] + [Passivo não executado PI (D)] + [Passivo não executado R (E)] - [(EMP - LIQ) dos contratos vigentes contexto gráfico] - ([Valor disponível ano corrente] + [Valor bloqueado ano corrente] + [Valor contingenciado ano corrente])");
for (const m of ["[Necessidade orçamento 2026]", "[Necessidade orçamento 2027]", "[Cronograma futuro PI considerando convênio (A)] + [Cronograma futuro R (B)]", "[Valor disponível ano corrente]"]) {
  const r = await app.evaluateEx(m); console.log(`${m} = ${r.qIsNumeric ? brl(r.qNumber) : r.qText}`);
}

// Seções Obras e Manutenção: faixas de alerta e curvas acumuladas (o realizado do último mês deve igualar o execucao da seção)
await cubo("tempo paralisação", { qLibraryId: mestres.tempoParalisacao }, "Count(DISTINCT [_skObra])");
await cubo("compat. situação", { qLibraryId: mestres.compatibilidadeSituacao }, obras.quantidade);
await cubo("conf. data obra", { qLibraryId: mestres.conformidadeDataObra }, obras.aIniciarAndamentoOuParalisadas);
await cubo("recebimento", { qLibraryId: mestres.recebimentoConcluidas }, obras.quantidade);
for (const [secao, grupo] of [["obras", obras], ["manutenção", manutencao]] as const) {
  const curva = await app.createSessionObject({
    qInfo: { qType: "cubo" },
    qHyperCubeDef: {
      qSuppressMissing: true,
      qDimensions: [{ qDef: { qFieldDefs: ["DEANOMES"], qSortCriterias: [{ qSortByLoadOrder: 1 }] }, qNullSuppression: true }],
      qMeasures: [{ qDef: { qDef: grupo.previstoAcumulado } }, { qDef: { qDef: grupo.realizadoAcumulado } }],
      qInitialDataFetch: [{ qTop: 0, qLeft: 0, qWidth: 3, qHeight: 400 }],
    },
  });
  const meses = (await curva.getLayout()).qHyperCube.qDataPages[0].qMatrix;
  // Nulo volta como "NaN" (texto): vale o último mês que ainda tem número em alguma das duas curvas
  const numero = (c: { qNum: unknown }) => (typeof c.qNum === "number" ? c.qNum.toFixed(4) : "–");
  const ultimo = [...meses].reverse().find((l: { qNum: unknown }[]) => typeof l[1].qNum === "number" || typeof l[2].qNum === "number") ?? meses[meses.length - 1];
  console.log(`\n== curva acumulada de ${secao} (${meses.length} meses de ${meses[0][0].qText} a ${meses[meses.length - 1][0].qText}): em ${ultimo[0].qText} previsto ${numero(ultimo[1])} · realizado ${numero(ultimo[2])}`);
}
await sessao.close();
