import type { CSSProperties } from "react";
import { Skeleton } from "@/components/shadcn/skeleton";
import { fundoEstado, type Estado } from "@/shared/estados";
import type { Linhas } from "@/shared/qlik/useLinhas";
import { cn } from "@/shared/utils/tailwind/cn";

type Props = Linhas & {
  formatar: (valor: number) => string;
  // Cor por significado (prazo, situação); sem isso todas as barras são azuis, uma série só
  estado?: (rotulo: string) => Estado;
  // Ordem fixa das categorias (faixas de prazo); fora dela, a ordem do cubo
  ordem?: readonly string[];
  larguraRotulo?: string;
  className?: string;
};

export const SemDados = () => (
  <p className="flex h-full items-center justify-center p-4 text-center text-sm text-muted-foreground">Sem dados para os filtros atuais.</p>
);

/** Barras horizontais em HTML: rótulo, barra fina com o valor na ponta; a linha inteira é o alvo e seleciona no Qlik. */
export const GraficoBarras = ({ linhas, pronto, formatar, estado, ordem, larguraRotulo = "minmax(0,7.5rem)", className }: Props) => {
  if (!pronto) return <Skeleton className="h-full min-h-24 w-full rounded-lg bg-muted" />;
  if (linhas.length === 0) return <SemDados />;
  const ordenadas = ordem ? [...linhas].sort((a, b) => ordem.indexOf(a.rotulo) - ordem.indexOf(b.rotulo)) : linhas;
  const maximo = Math.max(...ordenadas.map((l) => l.valor), 0);
  return (
    <ol data-revelar="dados" className={cn("flex flex-col gap-1 overflow-y-auto overflow-x-hidden", className)}>
      {ordenadas.map((linha, indice) => (
        <li key={linha.rotulo} data-ordem style={{ "--ordem": indice } as CSSProperties}>
          <button
            type="button"
            onClick={linha.selecionar}
            aria-pressed={linha.selecionada}
            title={`${linha.rotulo}: ${formatar(linha.valor)}`}
            // A barra nunca some: em cartão estreito o rótulo trunca antes de a trilha passar de 3rem
            style={{ gridTemplateColumns: `${larguraRotulo} minmax(3rem,1fr) auto` }}
            className="transicao-feedback grid w-full cursor-pointer items-center gap-2 rounded px-1 py-1 text-left text-xs outline-none hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            <span className="truncate text-foreground">{linha.rotulo}</span>
            {/* Barra ≤ 12 px, reta na base e arredondada na ponta; cresce de zero quando a linha entra e desliza quando um filtro muda o valor */}
            <span className="h-3 overflow-hidden rounded-r-sm bg-muted">
              <span
                className={cn(
                  "barra-cresce block h-full rounded-r-sm transition-[width] duration-(--duracao-longa) ease-(--ease-suave) motion-reduce:transition-none",
                  estado ? fundoEstado[estado(linha.rotulo)] : "bg-primary",
                )}
                style={{ width: `${maximo > 0 ? (Math.max(linha.valor, 0) / maximo) * 100 : 0}%` }}
              />
            </span>
            <span className="min-w-[4.5rem] text-right tabular-nums text-muted-foreground">{formatar(linha.valor)}</span>
          </button>
        </li>
      ))}
    </ol>
  );
};
