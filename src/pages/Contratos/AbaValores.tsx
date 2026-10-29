import { Cascata } from "@/components/Cascata/Cascata";
import { Indicador } from "@/components/Indicador/Indicador";
import { contratos } from "@/shared/qlik/expressoes";
import { useNumeros } from "@/shared/qlik/useLinhas";
import { exato, exibir, moedaCurta, percentual } from "@/shared/utils/formatarNumero";
import type { Bloco } from "./Contratos";

const numeros = [
  contratos.original,
  contratos.aditivos,
  contratos.atual,
  contratos.medidoPI,
  contratos.saldoPI,
  contratos.reajuste,
  contratos.medidoTotal,
  contratos.empenhado,
  contratos.liquidado,
  contratos.aLiquidar,
] as const;

const Titulo = ({ children }: { children: string }) => <h3 className="mb-3 text-xs font-medium text-foreground">{children}</h3>;

/** O caminho do valor em duas cascatas e, ao lado, empenho e liquidação, que vêm do orçamento e não se somam ao contratado. */
export const AbaValores = ({ bloco }: { bloco: Bloco }) => {
  const n = useNumeros(numeros);
  const valor = (indice: number) => n?.[indice] ?? null;
  const pronto = n !== undefined;
  const fracaoLiquidada = valor(7) ? (valor(8) ?? 0) / (valor(7) as number) : 0;

  return (
    <div data-revelar="aba" className="grid h-full gap-6 overflow-y-auto lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
      <div {...bloco(0)} className="flex flex-col gap-6">
        <section>
          <Titulo>Do contratado ao saldo</Titulo>
          <Cascata
            pronto={pronto}
            degraus={[
              { rotulo: "Contratado original", apoio: "valor assinado nos contratos", valor: valor(0), tipo: "total" },
              { rotulo: "Aditivos", apoio: "acréscimos de valor aprovados", valor: valor(1), tipo: "mais" },
              { rotulo: "Contratado atual", apoio: "original + aditivos", valor: valor(2), tipo: "total" },
              { rotulo: "Executado", sigla: "PI", apoio: "medido e aprovado, a preço inicial", valor: valor(3), tipo: "menos" },
              { rotulo: "Saldo a executar", sigla: "PI", apoio: "o que ainda falta medir", valor: valor(4), tipo: "total" },
            ]}
          />
        </section>
        <section>
          <Titulo>Executado com reajuste</Titulo>
          <Cascata
            pronto={pronto}
            degraus={[
              { rotulo: "Executado", sigla: "PI", apoio: "a preço inicial", valor: valor(3), tipo: "total" },
              { rotulo: "Reajuste", sigla: "R", apoio: "correção de preços, com acréscimo e desconto", valor: valor(5), tipo: "mais" },
              { rotulo: "Executado total", sigla: "PI + R", apoio: "o que de fato foi medido em valores atualizados", valor: valor(6), tipo: "total" },
            ]}
          />
        </section>
      </div>

      <section {...bloco(1)} className="flex flex-col gap-4 lg:border-l lg:border-border lg:pl-6">
        <Titulo>Empenho e liquidação</Titulo>
        <Indicador rotulo="Empenhado" apoio="reservado no orçamento para estes contratos" valor={exibir(n, 7, moedaCurta)} exato={exato(n, 7)} />
        <Indicador rotulo="Liquidado" apoio="despesa reconhecida, pronta para pagamento" valor={exibir(n, 8, moedaCurta)} exato={exato(n, 8)} />
        <Indicador rotulo="Empenhado a liquidar" apoio="reservado e ainda não liquidado" valor={exibir(n, 9, moedaCurta)} exato={exato(n, 9)} />
        {pronto && valor(7) ? (
          <div className="flex flex-col gap-1.5">
            <p className="text-[11px] leading-4 text-muted-foreground">{percentual(fracaoLiquidada)} do empenhado já liquidado</p>
            <div className="h-2 w-full overflow-hidden rounded-full bg-primary/20" role="img" aria-label={`${percentual(fracaoLiquidada)} do empenhado já liquidado`}>
              <div className="barra-cresce h-full rounded-full bg-primary transition-[width] duration-(--duracao-longa) ease-(--ease-suave) motion-reduce:transition-none" style={{ width: `${Math.min(fracaoLiquidada, 1) * 100}%` }} />
            </div>
          </div>
        ) : null}
        <p className="text-[11px] leading-4 text-muted-foreground">
          Empenho e liquidação vêm da execução orçamentária e não se somam ao contratado.
        </p>
      </section>
    </div>
  );
};
