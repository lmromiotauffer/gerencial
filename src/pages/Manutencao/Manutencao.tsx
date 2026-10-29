import { useState, type CSSProperties } from "react";
import { useSearchParams } from "react-router-dom";
import Card from "@/components/Card/components/Root/Root";
import { Cartao } from "@/components/CartaoPainel/CartaoPainel";
import { Indicador } from "@/components/Indicador/Indicador";
import Tabs from "@/components/Tabs/Tabs";
import { manutencao } from "@/shared/qlik/expressoes";
import { useNumeros } from "@/shared/qlik/useLinhas";
import { exato, exibir, inteiro, km, moedaCurta, percentual } from "@/shared/utils/formatarNumero";
import type { Bloco } from "@/pages/Contratos/Contratos";
import { AbaExecucao } from "./AbaExecucao";
import { AbaOnde } from "./AbaOnde";
import { AbaTabela } from "./AbaTabela";

const numeros = [manutencao.quantidade, manutencao.valor, manutencao.extensaoKm, manutencao.execucao, manutencao.medidoPI] as const;

// Cada aba responde uma pergunta; o título do cartão é a pergunta
const abas = [
  { value: "execucao", label: "Execução", titulo: "Quanto dos serviços já foi executado" },
  { value: "onde", label: "Onde e por quem", titulo: "Onde estão e quem executa os serviços" },
  { value: "tabela", label: "Tabela", titulo: "Lista dos serviços de manutenção" },
];

export const Manutencao = () => {
  // A aba vive na URL (#/manutencao?aba=onde), como em Contratos e Obras
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
  const medido = exibir(n, 4, moedaCurta);

  return (
    <div className="flex h-full flex-col gap-2 overflow-y-auto lg:overflow-hidden">
      <section aria-label="Indicadores" className="grid shrink-0 grid-cols-2 gap-2 xl:grid-cols-4">
        <Card className="px-4 py-3">
          <Indicador rotulo="Serviços de manutenção" valor={exibir(n, 0, inteiro)} apoio="conservação e manutenção de rodovias" />
        </Card>
        <Card className="px-4 py-3">
          <Indicador rotulo="Valor dos serviços" valor={exibir(n, 1, moedaCurta)} exato={exato(n, 1)} />
        </Card>
        <Card className="px-4 py-3">
          <Indicador rotulo="Extensão atendida" valor={exibir(n, 2, km)} apoio="soma da extensão dos serviços" />
        </Card>
        <Card className="px-4 py-3">
          <Indicador rotulo="Executado" sigla="PI" valor={exibir(n, 3, percentual)} apoio={medido ? `do valor dos serviços; ${medido} medidos e aprovados` : "do valor dos serviços"} />
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
            {aba.value === "onde" && <AbaOnde bloco={bloco} />}
            {aba.value === "tabela" && <AbaTabela slot={slot} bloco={bloco} />}
          </div>
        )}
      </Cartao>
    </div>
  );
};
