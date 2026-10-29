import { BarraEmpilhada } from "@/components/BarraEmpilhada/BarraEmpilhada";
import { crescente } from "@/components/CartaoPainel/colunas";
import { GraficoBarras } from "@/components/GraficoBarras/GraficoBarras";
import { GraficoLinha } from "@/components/GraficoLinha/GraficoLinha";
import { estadoSituacao } from "@/shared/estados";
import { dimensao, dimensaoMestra, manutencao, medida, mestres } from "@/shared/qlik/expressoes";
import { useLinhas } from "@/shared/qlik/useLinhas";
import { moedaCurta } from "@/shared/utils/formatarNumero";
import type { Bloco } from "@/pages/Contratos/Contratos";

// Meses na ordem de carga, que é a cronológica (DEANOMES é texto "AAAA/M"); crescente por causa do qReverseSort do useTable
const curva = [
  dimensao("DEANOMES", "Mês", { qSortCriterias: [{ qSortByLoadOrder: crescente }] }),
  medida(manutencao.previstoAcumulado, "Previsto pelo cronograma"),
  medida(manutencao.realizadoAcumulado, "Realizado (medição PI)"),
];
const rotulosCurva: [string, string] = ["Previsto pelo cronograma", "Realizado (medição PI)"];
const porSituacao = { dimensao: dimensaoMestra(mestres.situacaoObra), medida: medida(manutencao.quantidade, "Serviços") };
const porClassificacao = { dimensao: dimensao("[Classificação da obra]", "Classificação"), medida: medida(manutencao.valor, "Valor dos serviços") };

const Titulo = ({ children, apoio }: { children: string; apoio?: string }) => (
  <div className="mb-2">
    <h3 className="text-xs font-medium text-foreground">{children}</h3>
    {apoio && <p className="text-[11px] leading-4 text-muted-foreground">{apoio}</p>}
  </div>
);

/** A curva acumulada do previsto contra o realizado e, ao lado, a situação dos serviços e o valor por classificação. */
export const AbaExecucao = ({ bloco }: { bloco: Bloco }) => {
  const situacao = useLinhas(porSituacao);
  const classificacao = useLinhas(porClassificacao);

  return (
    <div data-revelar="aba" className="grid h-full gap-6 overflow-y-auto lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:overflow-hidden">
      <section {...bloco(0)} className="flex min-h-[320px] flex-col lg:min-h-0">
        <Titulo apoio="fração do valor dos serviços, acumulada mês a mês; serviços sem cronograma não entram no previsto">Previsto × realizado, acumulado</Titulo>
        <div className="min-h-0 flex-1">
          <GraficoLinha colunas={curva} rotulos={rotulosCurva} />
        </div>
      </section>

      <div {...bloco(1)} className="flex min-h-0 flex-col gap-5 lg:overflow-y-auto lg:border-l lg:border-border lg:pl-6">
        <section>
          <Titulo>Serviços por situação</Titulo>
          <BarraEmpilhada {...situacao} estado={estadoSituacao} unidade="serviços" />
        </section>
        <section>
          <Titulo>Valor dos serviços por classificação</Titulo>
          <GraficoBarras {...classificacao} formatar={moedaCurta} larguraRotulo="minmax(0,16rem)" />
        </section>
      </div>
    </div>
  );
};
