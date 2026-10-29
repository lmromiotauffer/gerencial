// Lê no app Qlik (connection.json) as definições de todos os objetos de todas as folhas, os itens mestres e as
// variáveis, e grava docs/objetos-gerencial.json. Sessão anônima pelo /hub/, como o navegador faz.
// Uso: node scripts/extrair-objetos.mjs
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import enigma from "enigma.js";
import WebSocket from "ws";
import schema from "enigma.js/schemas/12.170.2.json" with { type: "json" };

const conexao = JSON.parse(readFileSync("public/connection.json", "utf8"));
const base = `https://${conexao.host}`;
const saida = "docs/objetos-gerencial.json";

// Cookie X-Qlik-Session: o /hub/ cria a sessão anônima
const hub = await fetch(`${base}/hub/`, { redirect: "manual" });
const cookies = hub.headers.getSetCookie().map((c) => c.split(";")[0]).join("; ");
if (!cookies.includes("X-Qlik-Session")) throw new Error(`Sem cookie de sessão: ${hub.status} ${[...hub.headers].map(([k, v]) => `${k}=${v}`).join(" | ")}`);
const csrf = await fetch(`${base}/qps/csrftoken`, { headers: { Cookie: cookies } });
const token = csrf.headers.get("qlik-csrf-token") ?? "";
console.log(`sessão ok (csrf ${csrf.status})`);

const sessao = enigma.create({
  schema,
  url: `wss://${conexao.host}/app/${conexao.appId}${token ? `?qlik-csrf-token=${token}` : ""}`,
  createSocket: (url) => new WebSocket(url, { headers: { Cookie: cookies, Origin: base, "X-Qlik-Xrfkey": "0123456789abcdef" } }),
});
const global = await sessao.open();
const app = await global.openDoc(conexao.appId);
console.log("app aberto");

const coletarLibraryIds = (valor, ids) => {
  if (Array.isArray(valor)) valor.forEach((v) => coletarLibraryIds(v, ids));
  else if (valor && typeof valor === "object")
    for (const [k, v] of Object.entries(valor)) k === "qLibraryId" && typeof v === "string" && v ? ids.add(v) : coletarLibraryIds(v, ids);
};
const coletarVariaveis = (valor, nomes) => {
  if (typeof valor === "string") for (const m of valor.matchAll(/\$\(([A-Za-z_][\w.]*)\)/g)) nomes.add(m[1]);
  else if (Array.isArray(valor)) valor.forEach((v) => coletarVariaveis(v, nomes));
  else if (valor && typeof valor === "object") Object.values(valor).forEach((v) => coletarVariaveis(v, nomes));
};

const lista = await app.createSessionObject({ qInfo: { qType: "SheetList" }, qAppObjectListDef: { qType: "sheet", qData: { title: "/qMetaDef/title", rank: "/rank" } } });
const folhas = (await lista.getLayout()).qAppObjectList.qItems.sort((a, b) => (a.qData.rank ?? 0) - (b.qData.rank ?? 0));
const resultado = { app: conexao.appId, extraidoEm: new Date().toISOString(), folhas: [], itensMestres: {}, variaveis: {} };
const libraryIds = new Set();
const variaveis = new Set();
for (const folha of folhas) {
  process.stdout.write(`folha: ${folha.qData.title} … `);
  try {
    const arvore = await (await app.getObject(folha.qInfo.qId)).getFullPropertyTree();
    coletarLibraryIds(arvore, libraryIds);
    coletarVariaveis(arvore, variaveis);
    resultado.folhas.push({ id: folha.qInfo.qId, titulo: folha.qData.title, ordem: folha.qData.rank, arvore });
    console.log(`${arvore.qChildren?.length ?? 0} objetos`);
  } catch (erro) {
    resultado.folhas.push({ id: folha.qInfo.qId, titulo: folha.qData.title, erro: String(erro) });
    console.log(`erro: ${erro}`);
  }
}
for (const id of libraryIds) {
  try { resultado.itensMestres[id] = await (await app.getDimension(id)).getProperties(); }
  catch { try { resultado.itensMestres[id] = await (await app.getMeasure(id)).getProperties(); } catch (erro) { resultado.itensMestres[id] = { erro: String(erro) }; } }
}
coletarVariaveis(resultado.itensMestres, variaveis);
const pendentes = [...variaveis];
while (pendentes.length) {
  const nome = pendentes.pop();
  if (nome in resultado.variaveis) continue;
  try {
    const props = await (await app.getVariableByName(nome)).getProperties();
    resultado.variaveis[nome] = props;
    const internas = new Set();
    coletarVariaveis(props.qDefinition, internas);
    internas.forEach((n) => !(n in resultado.variaveis) && pendentes.push(n));
  } catch (erro) { resultado.variaveis[nome] = { erro: String(erro) }; }
}
mkdirSync("docs", { recursive: true });
writeFileSync(saida, JSON.stringify(resultado, null, 2));
console.log(`gravado ${saida}: ${resultado.folhas.length} folhas, ${Object.keys(resultado.itensMestres).length} itens mestres, ${Object.keys(resultado.variaveis).length} variáveis`);
await sessao.close();
