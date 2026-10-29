import { useLayoutEffect, useRef } from "react";
import { Skeleton } from "@/components/shadcn/skeleton";
import { SemDados } from "@/components/GraficoBarras/GraficoBarras";
import { fundoEstado, type Estado } from "@/shared/estados";
import { movimentoReduzido } from "@/shared/hooks/useMovimentoReduzido";
import type { Linhas } from "@/shared/qlik/useLinhas";
import { inteiro, percentual } from "@/shared/utils/formatarNumero";
import { cn } from "@/shared/utils/tailwind/cn";

type Props = Linhas & {
  estado: (rotulo: string) => Estado;
  // "contratos", "obras": para o texto acessível
  unidade: string;
  className?: string;
};

/** Uma barra só, 100 % = todos; cada trecho é a proporção de uma situação e seleciona no Qlik. Legenda com os números. */
export const BarraEmpilhada = ({ linhas, pronto, estado, unidade, className }: Props) => {
  const grupoRef = useRef<HTMLDivElement>(null);
  const temDados = pronto && linhas.length > 0;
  // Chegada: a barra se revela da esquerda (clip-path, não scale: o texto dos trechos não distorce).
  // Só quando a barra aparece; filtros depois deslizam as larguras em vez de reapresentar a barra
  useLayoutEffect(() => {
    const grupo = grupoRef.current;
    if (!temDados || !grupo) return;
    const estilo = getComputedStyle(document.documentElement);
    const animacao = movimentoReduzido()
      ? grupo.animate([{ opacity: 0 }, { opacity: 1 }], { duration: parseFloat(estilo.getPropertyValue("--duracao-curta")), easing: estilo.getPropertyValue("--ease-cor") })
      : grupo.animate([{ clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 0 0 0)" }], {
          duration: parseFloat(estilo.getPropertyValue("--duracao-longa")),
          easing: estilo.getPropertyValue("--ease-suave"),
        });
    return () => animacao.cancel();
  }, [temDados]);

  if (!pronto) return <Skeleton className="h-16 w-full rounded-lg bg-muted" />;
  if (linhas.length === 0) return <SemDados />;
  const total = linhas.reduce((soma, l) => soma + l.valor, 0);
  const fracao = (valor: number) => (total > 0 ? valor / total : 0);
  const resumo = linhas.map((l) => `${l.rotulo} ${inteiro(l.valor)} (${percentual(fracao(l.valor))})`).join(", ");
  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div
        ref={grupoRef}
        role="group"
        aria-label={`${inteiro(total)} ${unidade}: ${resumo}`}
        // 2 px de fundo entre os trechos: é o espaço que separa, não uma borda
        className="flex h-7 w-full gap-0.5 overflow-hidden rounded-sm"
      >
        {linhas.map((linha) => {
          const parte = fracao(linha.valor);
          return (
            <button
              key={linha.rotulo}
              type="button"
              onClick={linha.selecionar}
              aria-pressed={linha.selecionada}
              title={`${linha.rotulo}: ${inteiro(linha.valor)} ${unidade} (${percentual(parte)})`}
              style={{ width: `${parte * 100}%` }}
              className={cn(
                // Largura desliza sob filtro (400 ms) e o hover de opacidade segue curto (150 ms); sem transicao-feedback,
                // que disputaria transition-property com a largura
                "min-w-1 cursor-pointer outline-none transition-[width,opacity] duration-[var(--duracao-longa),var(--duracao-curta)] ease-[var(--ease-suave),var(--ease-cor)] hover:opacity-80 focus-visible:ring-[3px] focus-visible:ring-inset focus-visible:ring-ring/50 motion-reduce:transition-none",
                fundoEstado[estado(linha.rotulo)],
              )}
            >
              {/* O percentual só entra no trecho quando cabe; o resto fica na legenda e no título */}
              {parte >= 0.09 && <span className="text-[11px] font-medium text-primary-foreground">{percentual(parte, 0)}</span>}
            </button>
          );
        })}
      </div>
      <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
        {linhas.map((linha) => (
          <li key={linha.rotulo} className="flex items-center gap-1.5">
            <span aria-hidden className={cn("size-2.5 shrink-0 rounded-sm", fundoEstado[estado(linha.rotulo)])} />
            <span className="text-muted-foreground">{linha.rotulo}</span>
            <span className="font-semibold tabular-nums text-foreground">{inteiro(linha.valor)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};
