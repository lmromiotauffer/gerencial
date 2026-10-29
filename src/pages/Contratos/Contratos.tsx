import { useState, type CSSProperties } from "react";
import { useSearchParams } from "react-router-dom";
import Card from "@/components/Card/components/Root/Root";
import { Cartao } from "@/components/CartaoPainel/CartaoPainel";
import { Indicador } from "@/components/Indicador/Indicador";
import Tabs from "@/components/Tabs/Tabs";
import { contratos } from "@/shared/qlik/expressoes";
import { useNumeros } from "@/shared/qlik/useLinhas";
import { exato, exibir, inteiro, moedaCurta } from "@/shared/utils/formatarNumero";
import { AbaOrcamento } from "./AbaOrcamento";
import { AbaPorQuem } from "./AbaPorQuem";
import { AbaPrazos } from "./AbaPrazos";
import { AbaTabela } from "./AbaTabela";
import { AbaValores } from "./AbaValores";

const numeros = [contratos.quantidade, contratos.atual, contratos.medidoTotal, contratos.saldoPI] as const;

// Cada aba responde uma pergunta; o título do cartão é a pergunta
const abas = [
  { value: "valores", label: "Valores", titulo: "Quanto foi contratado, executado e liquidado" },
  { value: "por-quem", label: "Por quem e para quê", titulo: "Quem contrata e para quê" },
  { value: "prazos", label: "Prazos e conformidade", titulo: "Prazos e conformidade dos contratos vigentes" },
  { value: "orcamento", label: "Orçamento", titulo: "Quanto ainda precisa de orçamento" },
  { value: "tabela", label: "Tabela", titulo: "Lista dos contratos" },
];

/** Atributos de um bloco de primeiro nível da aba (filho direto do [data-revelar="aba"]): entra em cascata, do lado para onde a pílula andou */
export type Bloco = (ordem: number) => { "data-ordem": ""; style: CSSProperties };

export const Contratos = () => {
  // A aba vive na URL (#/contratos?aba=prazos): os alertas da Visão geral abrem direto na aba certa
  const [parametros, setParametros] = useSearchParams();
  const aba = abas.find(({ value }) => value === parametros.get("aba")) ?? abas[0];
  const n = useNumeros(numeros);

  // Sentido da troca de aba: só muda quando o índice muda; na primeira montagem os blocos sobem de baixo (padrão)
  const indice = abas.indexOf(aba);
  const [anterior, setAnterior] = useState(indice);
  const [sentido, setSentido] = useState("0 8px");
  if (anterior !== indice) {
    setSentido(indice > anterior ? "8px 0" : "-8px 0");
    setAnterior(indice);
  }
  const bloco: Bloco = (ordem) => ({ "data-ordem": "", style: { "--ordem": ordem, "--desloc-revelar": sentido } as CSSProperties });

  return (
    <div className="flex h-full flex-col gap-2 overflow-y-auto lg:overflow-hidden">
      <section aria-label="Indicadores" className="grid shrink-0 grid-cols-2 gap-2 xl:grid-cols-4">
        <Card className="px-4 py-3">
          <Indicador rotulo="Contratos" valor={exibir(n, 0, inteiro)} />
        </Card>
        <Card className="px-4 py-3">
          <Indicador rotulo="Contratado atual" sigla="original + aditivos" valor={exibir(n, 1, moedaCurta)} exato={exato(n, 1)} />
        </Card>
        <Card className="px-4 py-3">
          <Indicador rotulo="Executado" sigla="PI + R" valor={exibir(n, 2, moedaCurta)} exato={exato(n, 2)} apoio="medido e aprovado, com reajuste" />
        </Card>
        <Card className="px-4 py-3">
          <Indicador rotulo="Saldo a executar" sigla="PI" valor={exibir(n, 3, moedaCurta)} exato={exato(n, 3)} apoio="contratado atual menos o executado" />
        </Card>
      </section>

      <Cartao
        titulo={aba.titulo}
        className="h-auto min-h-[600px] shrink-0 lg:min-h-0 lg:flex-1"
        acoes={<Tabs tabs={abas} activeTab={aba.value} onTabChange={(value) => setParametros({ aba: value }, { replace: true })} className="w-auto max-w-full shrink-0 overflow-x-auto" />}
      >
        {(slot) => (
          // data-revelar="aba" fica na raiz de cada aba (pai direto dos blocos), não aqui: a regra é de filho direto
          <div role="tabpanel" aria-label={aba.label} className="h-full min-h-0">
            {aba.value === "valores" && <AbaValores bloco={bloco} />}
            {aba.value === "por-quem" && <AbaPorQuem bloco={bloco} />}
            {aba.value === "prazos" && <AbaPrazos slot={slot} bloco={bloco} />}
            {aba.value === "orcamento" && <AbaOrcamento slot={slot} bloco={bloco} />}
            {aba.value === "tabela" && <AbaTabela slot={slot} bloco={bloco} />}
          </div>
        )}
      </Cartao>
    </div>
  );
};
