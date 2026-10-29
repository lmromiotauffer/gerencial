import { test } from "node:test";
import assert from "node:assert/strict";
import { getFieldLabel } from "./getFieldLabel.ts";

// fieldName real devolvido pela lib ao selecionar "≤ 30 dias" na dimensão mestra de prazo (23/10/2026)
const prazo =
  "=If([Situação atual do contrato]='Vigente',If([Data fim vigência do contrato]<=Today()+30,Dual('≤ 30 dias',4),If([Data fim vigência do contrato]<=Today()+60,Dual('> 30 dias e ≤ 60 dias',3),If([Data fim vigência do contrato]<=Today()+90,Dual('> 60 dias e ≤ 90 dias',2),Dual('> 90 dias',1)))))";

test("expressão de dimensão mestra vira o rótulo legível", () => {
  assert.equal(getFieldLabel(prazo, []), "Tempo até o fim da vigência");
});

test("filtros.json e o mapa técnico têm prioridade; campo desconhecido passa direto", () => {
  assert.equal(getFieldLabel("Sigla adjunta", [{ expression: "=[Sigla adjunta]", label: "Adjunta (filtro)" }]), "Adjunta (filtro)");
  assert.equal(getFieldLabel("cdLote", []), "Código da obra");
  assert.equal(getFieldLabel("Situação atual da obra", []), "Situação atual da obra");
  // Só expressões ("=…") são casadas por trecho
  assert.equal(getFieldLabel("vlCronogramaProposta", []), "vlCronogramaProposta");
});
