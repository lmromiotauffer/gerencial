import { useState, type CSSProperties } from "react";
import { useSearchParams } from "react-router-dom";
import Card from "@/components/Card/components/Root/Root";
import { Cartao } from "@/components/CartaoPainel/CartaoPainel";
import { Indicador } from "@/components/Indicador/Indicador";
import Tabs from "@/components/Tabs/Tabs";
import { obras } from "@/shared/qlik/expressoes";
import { useNumeros } from "@/shared/qlik/useLinhas";
import { exato, exibir, inteiro, moedaCurta, percentual } from "@/shared/utils/formatarNumero";
import type { Bloco } from "@/pages/Contratos/Contratos";
import { AbaAlertas } from "./AbaAlertas";
import { AbaExecucao } from "./AbaExecucao";
import { AbaGarantia } from "./AbaGarantia";
import { AbaParalisadas } from "./AbaParalisadas";
import { AbaTabela } from "./AbaTabela";

const numeros = [obras.quantidade, obras.valor, obras.execucao, obras.execucaoEsperada, obras.paralisadas, obras.valorParalisadas] as const;

// Cada aba responde uma pergunta; o título do cartão é a pergunta
const abas = [
  { value: "execucao", label: "Execução", titulo: "Quanto das obras já foi executado" },
  { value: "alertas", label: "Alertas", titulo: "Onde as obras fogem do previsto" },
  { value: "paralisadas", label: "Paralisadas", titulo: "Quais obras estão paralisadas e por quê" },
  { value: "garantia", label: "Em garantia", titulo: "Quais obras estão em garantia" },
  { value: "tabela", label: "Tabela", titulo: "Lista das obras" },
];

export const Obras = () => {
  // A aba vive na URL (#/obras?aba=paralisadas): os alertas da Visão geral abrem direto na aba certa
  const [parametros, setParametros] = useSearchParams();
  const aba = abas.find(({ value }) => value === parametros.get("aba")) ?? abas[0];
  const n = useNumeros(numeros);

  // Sentido da troca de aba, como em Contratos: os blocos entram do lado para onde a pílula andou
  const indice = abas.indexOf(aba);
  const [anterior, setAnterior] = useState(indice);
  const [sentido, setSentido] = useState("0 8px");
  if (anterior !== indice) {
    setSentido(indice > anterior ? "8px 0" : "-8px 0");
    setAnterior(indice);
  }
  const bloco: Bloco = (ordem) => ({ "data-ordem": "", style: { "--ordem": ordem, "--desloc-revelar": sentido } as CSSProperties });
  const esperado = exibir(n, 3, percentual);
  const valorParado = exibir(n, 5, moedaCurta);

  return (
    <div className="flex h-full flex-col gap-2 overflow-y-auto lg:overflow-hidden">
      <section aria-label="Indicadores" className="grid shrink-0 grid-cols-2 gap-2 xl:grid-cols-4">
        <Card className="px-4 py-3">
          <Indicador rotulo="Obras" valor={exibir(n, 0, inteiro)} />
        </Card>
        <Card className="px-4 py-3">
          <Indicador rotulo="Valor das obras" valor={exibir(n, 1, moedaCurta)} exato={exato(n, 1)} apoio="soma do valor dos serviços de obra" />
        </Card>
        <Card className="px-4 py-3">
          <Indicador
            rotulo="Executado"
            sigla="PI"
            valor={exibir(n, 2, percentual)}
            apoio={esperado ? `do valor das obras; o cronograma previa ${esperado} até hoje` : "do valor das obras"}
          />
        </Card>
        <Card className="px-4 py-3">
          <Indicador rotulo="Paralisadas" valor={exibir(n, 4, inteiro)} apoio={valorParado ? `${valorParado} em obras paradas` : undefined} />
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
            {aba.value === "execucao" && <AbaExecucao bloco={bloco} />}
            {aba.value === "alertas" && <AbaAlertas bloco={bloco} />}
            {aba.value === "paralisadas" && <AbaParalisadas slot={slot} bloco={bloco} />}
            {aba.value === "garantia" && <AbaGarantia slot={slot} bloco={bloco} />}
            {aba.value === "tabela" && <AbaTabela slot={slot} bloco={bloco} />}
          </div>
        )}
      </Cartao>
    </div>
  );
};
