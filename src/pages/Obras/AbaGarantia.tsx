import { TabelaCartao } from "@/components/CartaoPainel/CartaoPainel";
import { GraficoBarras } from "@/components/GraficoBarras/GraficoBarras";
import { Indicador } from "@/components/Indicador/Indicador";
import { dimensao, medida, obras } from "@/shared/qlik/expressoes";
import { useLinhas, useNumeros } from "@/shared/qlik/useLinhas";
import { exato, exibir, inteiro, moedaCurta } from "@/shared/utils/formatarNumero";
import type { Bloco } from "@/pages/Contratos/Contratos";
import { colunasGarantia } from "./colunas";

const numeros = [obras.emGarantia, obras.valorGarantia] as const;
const medidaGarantia = medida(obras.emGarantia, "Obras em garantia");
const porTipo = { dimensao: dimensao("[Tipo da obra]", "Tipo da obra"), medida: medidaGarantia };
const porMunicipio = { dimensao: dimensao("[Município]", "Município"), medida: medidaGarantia };

/** Quantas obras ainda estão na garantia do construtor e onde; abaixo, a lista pela garantia que acaba primeiro. */
export const AbaGarantia = ({ slot, bloco }: { slot: HTMLElement | null; bloco: Bloco }) => {
  const n = useNumeros(numeros);
  const tipo = useLinhas(porTipo);
  const municipio = useLinhas(porMunicipio);

  return (
    <div data-revelar="aba" className="flex h-full flex-col gap-5 overflow-y-auto lg:overflow-hidden">
      <div {...bloco(0)} className="grid shrink-0 gap-6 md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)_minmax(0,1fr)]">
        <section className="flex flex-col gap-4">
          <Indicador rotulo="Obras em garantia" valor={exibir(n, 0, inteiro)} apoio="defeitos ainda são responsabilidade do construtor" />
          <Indicador rotulo="Valor das obras em garantia" valor={exibir(n, 1, moedaCurta)} exato={exato(n, 1)} />
        </section>
        <section className="flex min-w-0 flex-col gap-2">
          <h3 className="text-xs font-medium text-foreground">Obras em garantia por tipo</h3>
          <GraficoBarras {...tipo} formatar={inteiro} larguraRotulo="minmax(0,14rem)" className="max-h-28" />
        </section>
        <section className="flex min-w-0 flex-col gap-2">
          <h3 className="text-xs font-medium text-foreground">Obras em garantia por município</h3>
          <GraficoBarras {...municipio} formatar={inteiro} larguraRotulo="minmax(0,10rem)" className="max-h-28" />
        </section>
      </div>
      <section {...bloco(1)} className="flex min-h-[320px] flex-1 flex-col gap-2 lg:min-h-0">
        <h3 className="text-xs font-medium text-foreground">Obras em garantia, pela garantia que acaba primeiro</h3>
        <div className="min-h-0 flex-1">
          <TabelaCartao colunas={colunasGarantia} slotExportar={slot} nomeArquivo="obras-em-garantia" selecionarLinha />
        </div>
      </section>
    </div>
  );
};
