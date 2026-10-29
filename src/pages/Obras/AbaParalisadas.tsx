import type { ReactNode } from "react";
import { TabelaCartao } from "@/components/CartaoPainel/CartaoPainel";
import { GraficoBarras } from "@/components/GraficoBarras/GraficoBarras";
import { dimensao, medida, obras } from "@/shared/qlik/expressoes";
import { useLinhas } from "@/shared/qlik/useLinhas";
import { inteiro, moedaCurta } from "@/shared/utils/formatarNumero";
import type { Bloco } from "@/pages/Contratos/Contratos";
import { colunasParalisadas } from "./colunas";

const medidaParalisadas = medida(obras.paralisadas, "Obras paralisadas");
const porMotivo = { dimensao: dimensao("deMotivoParalisacao", "Motivo"), medida: medidaParalisadas };
const porSetor = { dimensao: dimensao("[Sigla órgão setor]", "Setor"), medida: medidaParalisadas };
const porClassificacao = { dimensao: dimensao("[Classificação da obra]", "Classificação"), medida: medida(obras.valorParalisadas, "Valor paralisado") };

const Grafico = ({ titulo, children }: { titulo: string; children: ReactNode }) => (
  <section className="flex min-w-0 flex-col gap-2">
    <h3 className="text-xs font-medium text-foreground">{titulo}</h3>
    {children}
  </section>
);

/** Por que e onde as obras pararam e, abaixo, a lista pela data da paralisação (a mais antiga primeiro). */
export const AbaParalisadas = ({ slot, bloco }: { slot: HTMLElement | null; bloco: Bloco }) => {
  const motivo = useLinhas(porMotivo);
  const setor = useLinhas(porSetor);
  const classificacao = useLinhas(porClassificacao);

  return (
    <div data-revelar="aba" className="flex h-full flex-col gap-5 overflow-y-auto lg:overflow-hidden">
      <div {...bloco(0)} className="grid shrink-0 gap-6 md:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_minmax(0,1fr)]">
        <Grafico titulo="Obras paralisadas por motivo">
          <GraficoBarras {...motivo} formatar={inteiro} larguraRotulo="minmax(0,20rem)" className="max-h-28" />
        </Grafico>
        <Grafico titulo="Obras paralisadas por setor">
          <GraficoBarras {...setor} formatar={inteiro} className="max-h-28" />
        </Grafico>
        <Grafico titulo="Valor paralisado por classificação">
          <GraficoBarras {...classificacao} formatar={moedaCurta} larguraRotulo="minmax(0,10rem)" className="max-h-28" />
        </Grafico>
      </div>
      <section {...bloco(1)} className="flex min-h-[320px] flex-1 flex-col gap-2 lg:min-h-0">
        <h3 className="text-xs font-medium text-foreground">Obras paralisadas, da paralisação mais antiga para a mais recente</h3>
        <div className="min-h-0 flex-1">
          <TabelaCartao colunas={colunasParalisadas} slotExportar={slot} nomeArquivo="obras-paralisadas" selecionarLinha />
        </div>
      </section>
    </div>
  );
};
