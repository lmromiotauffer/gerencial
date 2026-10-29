// Resume docs/objetos-gerencial.json em docs/objetos-gerencial.md: por folha, cada objeto com tipo, título,
// dimensões e medidas (expressões resolvidas dos itens mestres). Uso: node scripts/resumir-objetos.mjs
import { readFileSync, writeFileSync } from "node:fs";
const dados = JSON.parse(readFileSync("docs/objetos-gerencial.json", "utf8"));
const mestres = dados.itensMestres;
const linhas = [`# Objetos do app ${dados.app} (extraído em ${dados.extraidoEm})`, ""];
const texto = (v) => (typeof v === "string" ? v : v?.qv ?? v?.qStringExpression?.qExpr ?? (v == null ? "" : JSON.stringify(v)));
const dim = (d) => {
  if (d.qLibraryId) { const m = mestres[d.qLibraryId]; return `[mestre ${m?.qMetaDef?.title ?? d.qLibraryId}] ${m?.qDim?.qFieldDefs?.join(", ") ?? ""}`; }
  return `${d.qDef?.qFieldLabels?.filter(Boolean).join(", ") || ""} = ${d.qDef?.qFieldDefs?.join(", ") ?? ""}`;
};
const med = (m) => {
  if (m.qLibraryId) { const x = mestres[m.qLibraryId]; return `[mestre ${x?.qMetaDef?.title ?? m.qLibraryId}] ${texto(x?.qMeasure?.qDef)}`; }
  return `${texto(m.qDef?.qLabel) || ""} = ${texto(m.qDef?.qDef)}`;
};
const andar = (no, nivel) => {
  const p = no.qProperty ?? {};
  const tipo = p.qInfo?.qType;
  const titulo = texto(p.title) || texto(p.qMetaDef?.title) || "";
  const sub = texto(p.subtitle);
  const pref = "  ".repeat(nivel);
  if (tipo !== "sheet") linhas.push(`${pref}- **${tipo}** ${p.qInfo?.qId}${titulo ? ` — ${titulo}` : ""}${sub ? ` _(${sub})_` : ""}`);
  const hc = p.qHyperCubeDef;
  if (hc) {
    hc.qDimensions?.forEach((d) => linhas.push(`${pref}  - dim: ${dim(d)}`));
    hc.qMeasures?.forEach((m) => linhas.push(`${pref}  - med: ${med(m)}`));
  }
  if (p.qListObjectDef) linhas.push(`${pref}  - lista: ${p.qListObjectDef.qDef?.qFieldDefs?.join(", ") ?? p.qListObjectDef.qLibraryId}`);
  // Filtros (filterpane) e contêineres guardam os filhos em qChildren; KPIs em qHyperCubeDef
  if (p.qChildListDef && p.qInfo?.qType === "filterpane") {}
  (no.qChildren ?? []).forEach((f) => andar(f, nivel + 1));
};
for (const folha of dados.folhas) {
  linhas.push(`## ${folha.ordem ?? ""} ${folha.titulo} (${folha.id})`, "");
  if (folha.erro) linhas.push(`erro: ${folha.erro}`);
  else andar(folha.arvore, 0);
  linhas.push("");
}
linhas.push("## Variáveis", "");
for (const [nome, v] of Object.entries(dados.variaveis)) linhas.push(`- \`${nome}\` = ${v.qDefinition ?? v.erro}`);
writeFileSync("docs/objetos-gerencial.md", linhas.join("\n"));
console.log(`${linhas.length} linhas em docs/objetos-gerencial.md`);
