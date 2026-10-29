import { TabelaCartao } from "@/components/CartaoPainel/CartaoPainel";
import { GraficoBarras } from "@/components/GraficoBarras/GraficoBarras";
import { Medidor } from "@/components/Medidor/Medidor";
import { estadoPrazo } from "@/shared/estados";
import { contratos, dimensaoMestra, medida, mestres, ordemPrazo } from "@/shared/qlik/expressoes";
import { useLinhas } from "@/shared/qlik/useLinhas";
import { inteiro } from "@/shared/utils/formatarNumero";
import { colunasVigencia } from "./colunas";
import type { Bloco } from "./Contratos";

const medidaVigentes = medida(contratos.vigentes, "Contratos vigentes");
const cuboPrazo = { dimensao: dimensaoMestra(mestres.prazoVigencia), medida: medidaVigentes };
const cuboValor = { dimensao: dimensaoMestra(mestres.conformidadeValor), medida: medidaVigentes };
const cuboData = { dimensao: dimensaoMestra(mestres.conformidadeData), medida: medidaVigentes };

/** Prazos em barras de status, conformidade como "X de Y" e, abaixo, a lista pela proximidade do fim da vigência. */
export const AbaPrazos = ({ slot, bloco }: { slot: HTMLElement | null; bloco: Bloco }) => {
  const prazo = useLinhas(cuboPrazo);
  const valor = useLinhas(cuboValor);
  const data = useLinhas(cuboData);

  return (
    <div data-revelar="aba" className="flex h-full flex-col gap-5 overflow-y-auto lg:overflow-hidden">
      <div {...bloco(0)} className="grid shrink-0 gap-6 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,1fr)]">
        <section>
          <h3 className="mb-2 text-xs font-medium text-foreground">Contratos vigentes por tempo até o fim da vigência</h3>
          <GraficoBarras {...prazo} formatar={inteiro} estado={estadoPrazo} ordem={ordemPrazo} larguraRotulo="minmax(0,9rem)" />
        </section>
        <Medidor
          titulo="Valor do contrato igual ao cronograma"
          apoio="contratado atual = soma do cronograma; só contratos vigentes"
          unidade="contratos"
          {...valor}
        />
        <Medidor
          titulo="Fim da execução dentro da vigência"
          apoio="data fim de execução até a data fim de vigência; só contratos vigentes"
          unidade="contratos"
          {...data}
        />
      </div>
      <section {...bloco(1)} className="flex min-h-[320px] flex-1 flex-col gap-2 lg:min-h-0">
        <h3 className="text-xs font-medium text-foreground">Contratos pela proximidade do fim da vigência</h3>
        <div className="min-h-0 flex-1">
          <TabelaCartao colunas={colunasVigencia} slotExportar={slot} nomeArquivo="contratos-por-vigencia" selecionarLinha />
        </div>
      </section>
    </div>
  );
};
