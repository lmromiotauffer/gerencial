import { crescente } from "@/components/CartaoPainel/colunas";
import { GraficoColunas } from "@/components/GraficoColunas/GraficoColunas";
import { Indicador } from "@/components/Indicador/Indicador";
import { dimensao, entregas, medida } from "@/shared/qlik/expressoes";
import { useLinhas, type Linhas } from "@/shared/qlik/useLinhas";
import { inteiro, km } from "@/shared/utils/formatarNumero";
import type { Bloco } from "@/pages/Contratos/Contratos";

// Anos em ordem cronológica, como nos barcharts 96587866 e 96b0ff84 do app
const porAno = (expressao: string) => ({
  dimensao: dimensao("=Year(dataEventoObra)", "Ano", { qSortCriterias: [{ qSortByNumeric: crescente }] }),
  medida: medida(expressao, "Km recebidos"),
  ordem: "dimensao" as const,
});
const pavimentacao = porAno(entregas.pavimentacaoRecebidos);
const restauracao = porAno(entregas.restauracaoRecebidos);

/** Total, média e melhor ano tirados das próprias linhas do gráfico: sem consulta a mais e sempre coerentes com ele. */
const Resumo = ({ linhas, pronto }: Linhas) => {
  const vazio = pronto && linhas.length === 0;
  const total = linhas.reduce((soma, l) => soma + l.valor, 0);
  const maior = linhas.reduce<(typeof linhas)[number] | undefined>((m, l) => (!m || l.valor > m.valor ? l : m), undefined);
  const valor = (texto: () => string) => (!pronto ? undefined : vazio ? null : texto());
  return (
    <div className="grid grid-cols-3 gap-3">
      <Indicador rotulo="Recebido" sigla="TRP" valor={valor(() => km(total))} />
      <Indicador rotulo="Média por ano" valor={valor(() => km(total / linhas.length))} apoio={pronto && !vazio ? `em ${linhas.length} anos com recebimento` : undefined} />
      <Indicador rotulo="Ano com mais km" valor={valor(() => maior!.rotulo)} apoio={maior ? km(maior.valor) : undefined} />
    </div>
  );
};

/** Km com termo de recebimento provisório (TRP) por ano, pavimentação e restauração lado a lado. */
export const AbaPorAno = ({ bloco }: { bloco: Bloco }) => {
  const secoes = [
    { titulo: "Pavimentação", anos: useLinhas(pavimentacao) },
    { titulo: "Restauração", anos: useLinhas(restauracao) },
  ];

  return (
    <div data-revelar="aba" className="grid h-full gap-6 overflow-y-auto lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:overflow-hidden">
      {secoes.map(({ titulo, anos }, ordem) => (
        <section key={titulo} {...bloco(ordem)} className={`flex min-h-[360px] flex-col gap-4 lg:min-h-0 ${ordem ? "lg:border-l lg:border-border lg:pl-6" : ""}`}>
          <div>
            <h3 className="text-xs font-medium text-foreground">{titulo}</h3>
            <p className="text-[11px] leading-4 text-muted-foreground">km com termo de recebimento provisório, pelo ano do recebimento; clique num ano para filtrar</p>
          </div>
          <Resumo {...anos} />
          <GraficoColunas {...anos} formatar={inteiro} unidade="km" className="min-h-0 flex-1" />
        </section>
      ))}
    </div>
  );
};
