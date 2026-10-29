import { useState, type CSSProperties } from "react";
import { useSearchParams } from "react-router-dom";
import Card from "@/components/Card/components/Root/Root";
import { Cartao } from "@/components/CartaoPainel/CartaoPainel";
import { Indicador } from "@/components/Indicador/Indicador";
import Tabs from "@/components/Tabs/Tabs";
import { entregas } from "@/shared/qlik/expressoes";
import { useNumeros } from "@/shared/qlik/useLinhas";
import { exibir, km } from "@/shared/utils/formatarNumero";
import type { Bloco } from "@/pages/Contratos/Contratos";
import { AbaPorAno } from "./AbaPorAno";
import { AbaSituacao } from "./AbaSituacao";
import { AbaTabela } from "./AbaTabela";

// KPIs das folhas Entregas pavimentação e Entregas restauração do app (uTgjm, 2278ede9, cc2fd44b, d90427c3)
const numeros = [entregas.pavimentacaoTotal, entregas.restauracaoTotal, entregas.pavimentacaoEmAndamento, entregas.restauracaoEmAndamento] as const;

// Cada aba responde uma pergunta; o título do cartão é a pergunta. As duas folhas do app ficam lado a lado em cada aba
const abas = [
  { value: "situacao", label: "Situação", titulo: "Em que situação estão os km e quais setores respondem por eles" },
  { value: "por-ano", label: "Recebidos por ano", titulo: "Quantos km foram recebidos (TRP) a cada ano" },
  { value: "tabela", label: "Tabela", titulo: "Lista das obras de pavimentação e restauração" },
];

const apoioEntregue = "concluída mais o revestimento já executado";

export const Entregas = () => {
  // A aba vive na URL (#/entregas?aba=por-ano), como nas outras seções
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

  return (
    <div className="flex h-full flex-col gap-2 overflow-y-auto lg:overflow-hidden">
      <section aria-label="Indicadores" className="grid shrink-0 grid-cols-2 gap-2 xl:grid-cols-4">
        <Card className="px-4 py-3">
          <Indicador rotulo="Pavimentação entregue" valor={exibir(n, 0, km)} apoio={apoioEntregue} />
        </Card>
        <Card className="px-4 py-3">
          <Indicador rotulo="Restauração entregue" valor={exibir(n, 1, km)} apoio={apoioEntregue} />
        </Card>
        <Card className="px-4 py-3">
          <Indicador rotulo="Pavimentação em andamento" valor={exibir(n, 2, km)} apoio="extensão das obras em execução" />
        </Card>
        <Card className="px-4 py-3">
          <Indicador rotulo="Restauração em andamento" valor={exibir(n, 3, km)} apoio="extensão das obras em execução" />
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
            {aba.value === "situacao" && <AbaSituacao bloco={bloco} />}
            {aba.value === "por-ano" && <AbaPorAno bloco={bloco} />}
            {aba.value === "tabela" && <AbaTabela slot={slot} bloco={bloco} />}
          </div>
        )}
      </Cartao>
    </div>
  );
};
