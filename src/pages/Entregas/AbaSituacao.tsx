import { BarraEmpilhada } from "@/components/BarraEmpilhada/BarraEmpilhada";
import { GraficoBarras } from "@/components/GraficoBarras/GraficoBarras";
import { estadoSituacao } from "@/shared/estados";
import { dimensao, dimensaoMestra, entregas, medida, mestres } from "@/shared/qlik/expressoes";
import { useLinhas, useNumeros } from "@/shared/qlik/useLinhas";
import { exibir, km } from "@/shared/utils/formatarNumero";
import type { Bloco } from "@/pages/Contratos/Contratos";

const porSituacao = (expressao: string) => ({ dimensao: dimensaoMestra(mestres.situacaoObra), medida: medida(expressao, "Km") });
// Setor, não rodovia: a extensão é da obra inteira e 51 obras cruzam mais de uma rodovia (a soma por rodovia passaria do total)
const porSetor = (expressao: string) => ({ dimensao: dimensao("[Sigla órgão setor]", "Setor"), medida: medida(expressao, "Km") });
const revestimentos = [entregas.pavimentacaoRevestimento, entregas.restauracaoRevestimento] as const;
const cubos = {
  pavimentacao: { situacao: porSituacao(entregas.pavimentacaoKm), setor: porSetor(entregas.pavimentacaoKm) },
  restauracao: { situacao: porSituacao(entregas.restauracaoKm), setor: porSetor(entregas.restauracaoKm) },
};

const Titulo = ({ children, apoio }: { children: string; apoio?: string }) => (
  <div className="mb-2">
    <h3 className="text-xs font-medium text-foreground">{children}</h3>
    {apoio && <p className="text-[11px] leading-4 text-muted-foreground">{apoio}</p>}
  </div>
);

/** Os km de cada classe pela situação da obra, o revestimento já executado nas não concluídas e os km por setor responsável. */
export const AbaSituacao = ({ bloco }: { bloco: Bloco }) => {
  const r = useNumeros(revestimentos);
  const secoes = [
    { titulo: "Pavimentação", situacao: useLinhas(cubos.pavimentacao.situacao), setor: useLinhas(cubos.pavimentacao.setor), revestimento: exibir(r, 0, km) },
    { titulo: "Restauração", situacao: useLinhas(cubos.restauracao.situacao), setor: useLinhas(cubos.restauracao.setor), revestimento: exibir(r, 1, km) },
  ];

  return (
    <div data-revelar="aba" className="grid h-full gap-6 overflow-y-auto lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:overflow-hidden">
      {secoes.map(({ titulo, situacao, setor, revestimento }, ordem) => (
        <section key={titulo} {...bloco(ordem)} className={`flex min-h-0 flex-col gap-5 ${ordem ? "lg:border-l lg:border-border lg:pl-6" : ""}`}>
          <div className="flex flex-col gap-3">
            <Titulo apoio="extensão das obras por situação; clique num trecho para filtrar">{titulo}</Titulo>
            <BarraEmpilhada {...situacao} estado={estadoSituacao} unidade="km" />
            <p className="text-xs text-muted-foreground">
              Revestimento já executado em obras ainda não concluídas: <span className="font-semibold text-foreground">{revestimento ?? "–"}</span>. Entra no total
              entregue.
            </p>
          </div>
          <div className="flex min-h-[200px] flex-1 flex-col lg:min-h-0">
            <Titulo apoio="extensão das obras por setor responsável; obras sem setor cadastrado ficam de fora">Km por setor</Titulo>
            <GraficoBarras {...setor} formatar={km} larguraRotulo="minmax(0,7.5rem)" className="min-h-0 flex-1" />
          </div>
        </section>
      ))}
    </div>
  );
};
