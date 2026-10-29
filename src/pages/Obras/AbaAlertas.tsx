import type { ReactNode } from "react";
import { GraficoBarras } from "@/components/GraficoBarras/GraficoBarras";
import { Medidor } from "@/components/Medidor/Medidor";
import { estadoDiferenca, estadoMedicao, estadoParalisacao, estadoRecebimento } from "@/shared/estados";
import { dimensaoMestra, medida, mestres, obras, ordemDiferenca, ordemMedicao, ordemParalisacao, ordemRecebimento } from "@/shared/qlik/expressoes";
import { useLinhas } from "@/shared/qlik/useLinhas";
import { inteiro } from "@/shared/utils/formatarNumero";
import type { Bloco } from "@/pages/Contratos/Contratos";

// Cada cubo repete a medida do objeto da folha Alertas das obras, com o recorte de situação dele
const cubos = {
  diferenca: { dimensao: dimensaoMestra(mestres.diferencaPrevistoRealizado), medida: medida(obras.quantidade, "Obras") },
  medicao: { dimensao: dimensaoMestra(mestres.ultimaMedicao), medida: medida(obras.emAndamentoOuParalisadas, "Obras") },
  paralisacao: { dimensao: dimensaoMestra(mestres.tempoParalisacao), medida: medida("Count(DISTINCT [_skObra])", "Obras") },
  situacao: { dimensao: dimensaoMestra(mestres.compatibilidadeSituacao), medida: medida(obras.quantidade, "Obras") },
  data: { dimensao: dimensaoMestra(mestres.conformidadeDataObra), medida: medida(obras.aIniciarAndamentoOuParalisadas, "Obras") },
  recebimento: { dimensao: dimensaoMestra(mestres.recebimentoConcluidas), medida: medida(obras.quantidade, "Obras") },
};

const Secao = ({ titulo, apoio, children }: { titulo: string; apoio: string; children: ReactNode }) => (
  <section className="flex min-w-0 flex-col gap-2">
    <div>
      <h3 className="text-xs font-medium text-foreground">{titulo}</h3>
      <p className="text-[11px] leading-4 text-muted-foreground">{apoio}</p>
    </div>
    {children}
  </section>
);

/** As faixas de alerta das obras em barras de status e as conformidades como "X de Y"; clicar filtra no Qlik. */
export const AbaAlertas = ({ bloco }: { bloco: Bloco }) => {
  const diferenca = useLinhas(cubos.diferenca);
  const medicao = useLinhas(cubos.medicao);
  const paralisacao = useLinhas(cubos.paralisacao);
  const situacao = useLinhas(cubos.situacao);
  const data = useLinhas(cubos.data);
  const recebimento = useLinhas(cubos.recebimento);

  return (
    <div data-revelar="aba" className="flex h-full flex-col gap-6 overflow-y-auto">
      <div {...bloco(0)} className="grid gap-6 md:grid-cols-3">
        <Secao titulo="Executado em relação ao cronograma" apoio="realizado menos previsto até hoje, em pontos percentuais (p.p.)">
          <GraficoBarras {...diferenca} formatar={inteiro} estado={estadoDiferenca} ordem={ordemDiferenca} larguraRotulo="minmax(0,10rem)" />
        </Secao>
        <Secao titulo="Tempo desde a última medição" apoio="só obras em andamento ou paralisadas">
          <GraficoBarras {...medicao} formatar={inteiro} estado={estadoMedicao} ordem={ordemMedicao} larguraRotulo="minmax(0,8rem)" />
        </Secao>
        <Secao titulo="Tempo de paralisação" apoio="só obras paralisadas">
          <GraficoBarras {...paralisacao} formatar={inteiro} estado={estadoParalisacao} ordem={ordemParalisacao} larguraRotulo="minmax(0,6rem)" />
        </Secao>
      </div>
      <div {...bloco(1)} className="grid gap-6 border-t border-border pt-5 md:grid-cols-3">
        <Medidor
          titulo="Situação da obra compatível com a do contrato"
          apoio="ex.: obra em andamento com contrato vigente"
          unidade="obras"
          vazio="Sem obras para os filtros atuais."
          {...situacao}
        />
        <Medidor
          titulo="Fim da execução da obra dentro do fim da execução do contrato"
          apoio="só obras a iniciar, em andamento ou paralisadas"
          unidade="obras"
          vazio="Sem obras para os filtros atuais."
          {...data}
        />
        <Secao titulo="Recebimento das obras concluídas" apoio="termo de recebimento definitivo (TRD)">
          <GraficoBarras {...recebimento} formatar={inteiro} estado={estadoRecebimento} ordem={ordemRecebimento} larguraRotulo="minmax(0,9rem)" />
        </Secao>
      </div>
    </div>
  );
};
