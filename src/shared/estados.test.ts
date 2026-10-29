import { test } from "node:test";
import assert from "node:assert/strict";
import { estadoDiferenca, estadoMedicao, estadoParalisacao, estadoRecebimento } from "./estados.ts";
import { ordemDiferenca, ordemMedicao, ordemParalisacao, ordemRecebimento } from "./qlik/expressoes.ts";

// As faixas são os textos que as dimensões mestras devolvem (conferidos ao vivo em 23/10/2026), na ordem de exibição
test("cada faixa de alerta das obras tem o estado esperado", () => {
  assert.deepEqual(ordemDiferenca.map(estadoDiferenca), ["bom", "atencao", "ruim", "neutro"]);
  assert.deepEqual(ordemMedicao.map(estadoMedicao), ["bom", "atencao", "ruim", "neutro"]);
  assert.deepEqual(ordemParalisacao.map(estadoParalisacao), ["atencao", "ruim"]);
  assert.deepEqual(ordemRecebimento.map(estadoRecebimento), ["bom", "neutro", "ruim"]);
});
