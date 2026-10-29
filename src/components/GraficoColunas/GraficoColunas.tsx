import type { CSSProperties } from "react";
import { Skeleton } from "@/components/shadcn/skeleton";
import { SemDados } from "@/components/GraficoBarras/GraficoBarras";
import type { Linhas } from "@/shared/qlik/useLinhas";
import { cn } from "@/shared/utils/tailwind/cn";

type Props = Linhas & {
  // Valor curto no topo da coluna; o título leva a unidade
  formatar: (valor: number) => string;
  unidade: string;
  className?: string;
};

/** Colunas verticais em HTML para séries no tempo: valor no topo, rótulo na base; a coluna inteira seleciona no Qlik. */
export const GraficoColunas = ({ linhas, pronto, formatar, unidade, className }: Props) => {
  if (!pronto) return <Skeleton className="h-full min-h-40 w-full rounded-lg bg-muted" />;
  if (linhas.length === 0) return <SemDados />;
  const maximo = Math.max(...linhas.map((l) => l.valor), 0);
  return (
    <ol data-revelar="dados" className={cn("flex min-h-40 gap-0.5 sm:gap-1", className)}>
      {linhas.map((linha, indice) => {
        // 85 %: a maior coluna deixa espaço para o valor acima dela
        const altura = maximo > 0 ? (Math.max(linha.valor, 0) / maximo) * 85 : 0;
        return (
          <li key={linha.rotulo} data-ordem style={{ "--ordem": indice } as CSSProperties} className="flex min-w-0 flex-1">
            <button
              type="button"
              onClick={linha.selecionar}
              aria-pressed={linha.selecionada}
              title={`${linha.rotulo}: ${formatar(linha.valor)} ${unidade}`}
              className="transicao-feedback flex w-full min-w-0 cursor-pointer flex-col gap-1 rounded py-1 text-[11px] outline-none sm:px-0.5 sm:text-xs hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
              <span className="relative min-h-0 w-full flex-1">
                <span
                  className="absolute inset-x-0 text-center text-[10px] sm:text-[11px] tabular-nums text-muted-foreground transition-[bottom] duration-(--duracao-longa) ease-(--ease-suave) motion-reduce:transition-none"
                  style={{ bottom: `calc(${altura}% + 2px)` }}
                >
                  {formatar(linha.valor)}
                </span>
                {/* Coluna ≤ 40 px, reta na base e arredondada no topo; cresce do chão quando chega e desliza quando um filtro muda o valor */}
                <span
                  className="coluna-cresce absolute inset-x-0 bottom-0 mx-auto max-w-10 rounded-t-sm bg-primary transition-[height] duration-(--duracao-longa) ease-(--ease-suave) motion-reduce:transition-none"
                  style={{ height: `${altura}%` }}
                />
              </span>
              <span className="truncate border-t border-border pt-1 text-center text-foreground">{linha.rotulo}</span>
            </button>
          </li>
        );
      })}
    </ol>
  );
};
