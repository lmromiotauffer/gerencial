import { TabelaCartao } from "@/components/CartaoPainel/CartaoPainel";
import { crescente } from "@/components/CartaoPainel/colunas";
import { GraficoBarras } from "@/components/GraficoBarras/GraficoBarras";
import { Indicador } from "@/components/Indicador/Indicador";
import { dimensao, medida } from "@/shared/qlik/expressoes";
import { useLinhas, useNumeros } from "@/shared/qlik/useLinhas";
import { exato, exibir, moedaCurta } from "@/shared/utils/formatarNumero";
import { colunasOrcamento, necessidadePorAno } from "./colunas";
import type { Bloco } from "./Contratos";

// Medidas mestras do app, referenciadas pelo nome (KPIs da folha Necessidade orçamentária)
const anos = [2026, 2027, 2028, 2029];
const numeros = [
  ...anos.map((ano) => `If([Necessidade orçamento ${ano}] <= 0, 0, [Necessidade orçamento ${ano}])`),
  "[Cronograma futuro PI considerando convênio (A)] + [Cronograma futuro R (B)]",
  "[Passivo não executado PI (D)] + [Passivo não executado R (E)]",
  "[Valor empenhado dos contratos vigentes] - [Valor liquidado dos contratos vigentes]",
  "[Valor disponível ano corrente]",
  "[Valor bloqueado ano corrente]",
  "[Valor contingenciado ano corrente]",
];

const cuboPorAno = {
  // O campo Ano é o calendário inteiro (1898–2250): só do ano corrente em diante, e sem os anos zerados (filtro abaixo)
  dimensao: dimensao("=If(Ano >= Year(Today()), Ano)", "Ano", { qSortCriterias: [{ qSortByNumeric: crescente }] }),
  medida: medida(necessidadePorAno, "Necessidade orçamentária"),
  ordem: "dimensao" as const,
};

/** Necessidade por ano em destaque; os componentes do cálculo ao lado; a lista por contrato e ano embaixo. */
export const AbaOrcamento = ({ slot, bloco }: { slot: HTMLElement | null; bloco: Bloco }) => {
  const n = useNumeros(numeros);
  const cubo = useLinhas({ ...cuboPorAno, quantidade: 30 });
  const porAno = { ...cubo, linhas: cubo.linhas.filter(({ valor }) => valor !== 0) };

  return (
    <div data-revelar="aba" className="flex h-full flex-col gap-5 overflow-y-auto lg:overflow-hidden">
      <p {...bloco(0)} className="shrink-0 text-[11px] leading-4 text-muted-foreground">
        Considera somente os contratos vigentes. Empenhado, liquidado e o quadro de detalhamento da despesa (QDD) consideram só as fontes do estado.
      </p>
      <div {...bloco(1)} className="grid shrink-0 gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <section className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
            {anos.map((ano, indice) => (
              <Indicador key={ano} rotulo={`Necessidade ${ano}`} valor={exibir(n, indice, moedaCurta)} exato={exato(n, indice)} />
            ))}
          </div>
          <div>
            <h3 className="mb-2 text-xs font-medium text-foreground">Necessidade orçamentária por ano</h3>
            <GraficoBarras {...porAno} formatar={moedaCurta} larguraRotulo="4rem" />
          </div>
        </section>
        <section className="grid content-start grid-cols-2 gap-x-4 gap-y-3 lg:border-l lg:border-border lg:pl-6">
          <Indicador rotulo="Cronograma futuro" sigla="A + B" apoio="o que ainda está previsto medir, com reajuste" valor={exibir(n, 4, moedaCurta)} exato={exato(n, 4)} />
          <Indicador rotulo="Passivo não executado" sigla="D + E" apoio="previsto no passado e ainda não medido" valor={exibir(n, 5, moedaCurta)} exato={exato(n, 5)} />
          <Indicador rotulo="Empenhado a liquidar" sigla="C − F" apoio="já reservado, abate da necessidade" valor={exibir(n, 6, moedaCurta)} exato={exato(n, 6)} />
          <Indicador rotulo="Disponível no ano" apoio="orçamento livre no ano corrente" valor={exibir(n, 7, moedaCurta)} exato={exato(n, 7)} />
          <Indicador rotulo="Bloqueado no ano" valor={exibir(n, 8, moedaCurta)} exato={exato(n, 8)} />
          <Indicador rotulo="Contingenciado no ano" valor={exibir(n, 9, moedaCurta)} exato={exato(n, 9)} />
        </section>
      </div>
      <section {...bloco(2)} className="flex min-h-[320px] flex-1 flex-col gap-2 lg:min-h-0">
        <h3 className="text-xs font-medium text-foreground">Necessidade por contrato e ano</h3>
        <div className="min-h-0 flex-1">
          {/* qSuppressZero: Ano é o calendário inteiro; sem isso cada contrato apareceria em centenas de anos zerados */}
          <TabelaCartao colunas={colunasOrcamento} slotExportar={slot} nomeArquivo="necessidade-orcamentaria" hipercubo={{ qSuppressZero: true }} />
        </div>
      </section>
    </div>
  );
};
