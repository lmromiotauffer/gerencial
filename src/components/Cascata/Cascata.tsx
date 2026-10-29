import type { CSSProperties } from "react";
import { Skeleton } from "@/components/shadcn/skeleton";
import { moedaCurta, moedaExata } from "@/shared/utils/formatarNumero";
import { cn } from "@/shared/utils/tailwind/cn";

export type Degrau = {
  rotulo: string;
  sigla?: string;
  apoio?: string;
  valor: number | null;
  // total: barra desde o zero; mais/menos: a barra parte de onde a anterior parou
  tipo: "total" | "mais" | "menos";
};

type Props = { degraus: Degrau[]; pronto: boolean; className?: string };

/** Caminho do valor em degraus: de onde sai, o que soma, o que desconta e onde chega. Sem canvas: barras posicionadas em HTML. */
export const Cascata = ({ degraus, pronto, className }: Props) => {
  if (!pronto) return <Skeleton className="h-40 w-full rounded-lg bg-muted" />;
  // Cada degrau parte de onde o anterior parou; um total recomeça do zero
  const posicoes = degraus.reduce<{ inicio: number; largura: number; fim: number }[]>((lista, degrau) => {
    const valor = degrau.valor ?? 0;
    const anterior = lista[lista.length - 1]?.fim ?? 0;
    const inicio = degrau.tipo === "total" ? 0 : degrau.tipo === "mais" ? anterior : anterior - valor;
    const fim = degrau.tipo === "total" ? valor : degrau.tipo === "mais" ? anterior + valor : anterior - valor;
    return [...lista, { inicio, largura: Math.abs(valor), fim }];
  }, []);
  const maximo = Math.max(...posicoes.map((p) => p.inicio + p.largura), 1);
  return (
    <ol data-revelar="dados" className={cn("flex flex-col gap-2", className)}>
      {degraus.map((degrau, indice) => {
        const { inicio, largura } = posicoes[indice];
        const sinal = degrau.tipo === "mais" ? "+ " : degrau.tipo === "menos" ? "− " : "";
        return (
          <li
            key={degrau.rotulo}
            data-ordem
            style={{ "--ordem": indice } as CSSProperties}
            className="grid grid-cols-[minmax(0,11rem)_minmax(0,1fr)_auto] items-center gap-3 text-xs"
          >
            <div className="min-w-0">
              <p className={cn("truncate text-foreground", degrau.tipo === "total" && "font-semibold")}>
                {sinal}
                {degrau.rotulo}
                {degrau.sigla && <span className="text-muted-foreground"> · {degrau.sigla}</span>}
              </p>
              {degrau.apoio && <p className="truncate text-[11px] leading-4 text-muted-foreground">{degrau.apoio}</p>}
            </div>
            <div className="relative h-4">
              {/* Régua fina de referência no zero */}
              <span aria-hidden className="absolute inset-y-0 left-0 w-px bg-border" />
              <span
                className={cn(
                  // Sob filtro o degrau desliza de posição e de largura, em vez de saltar
                  "barra-cresce absolute inset-y-0 rounded-r-sm transition-[left,width] duration-(--duracao-longa) ease-(--ease-suave) motion-reduce:transition-none",
                  degrau.tipo === "total" ? "bg-primary" : degrau.tipo === "mais" ? "bg-primary/45" : "bg-muted-foreground/50",
                )}
                style={{ left: `${(inicio / maximo) * 100}%`, width: `${(largura / maximo) * 100}%` }}
              />
            </div>
            <span
              title={degrau.valor === null ? undefined : moedaExata(degrau.valor)}
              className={cn("min-w-[5.5rem] text-right tabular-nums", degrau.tipo === "total" ? "font-semibold text-foreground" : "text-muted-foreground")}
            >
              {degrau.valor === null ? "–" : moedaCurta(degrau.valor)}
            </span>
          </li>
        );
      })}
    </ol>
  );
};
