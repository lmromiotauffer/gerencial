import { Skeleton } from "@/components/shadcn/skeleton";
import { Button } from "@/components/shadcn/button";
import type { Linhas } from "@/shared/qlik/useLinhas";
import { inteiro, percentual } from "@/shared/utils/formatarNumero";
import { cn } from "@/shared/utils/tailwind/cn";

type Props = Linhas & {
  titulo: string;
  apoio?: string;
  // "contratos vigentes": "968 de 1.210 contratos vigentes"
  unidade: string;
  vazio?: string;
  className?: string;
};

/** Conformidade Sim/Não lida como "X de Y conformes", com a trilha preenchida e o botão que seleciona os não conformes. */
export const Medidor = ({ titulo, apoio, unidade, vazio = "Sem contratos vigentes para os filtros atuais.", linhas, pronto, className }: Props) => {
  const sim = linhas.find((l) => l.rotulo === "Sim");
  const nao = linhas.find((l) => l.rotulo === "Não");
  const total = (sim?.valor ?? 0) + (nao?.valor ?? 0);
  const fracao = total > 0 ? (sim?.valor ?? 0) / total : 0;
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div>
        <p className="text-xs font-medium text-foreground">{titulo}</p>
        {apoio && <p className="text-[11px] leading-4 text-muted-foreground">{apoio}</p>}
      </div>
      {!pronto ? (
        <Skeleton className="h-12 w-full rounded-lg bg-muted" />
      ) : total === 0 ? (
        <p className="text-xs text-muted-foreground">{vazio}</p>
      ) : (
        <>
          <p className="text-xl font-semibold leading-none text-foreground">
            {inteiro(sim?.valor ?? 0)} de {inteiro(total)} {unidade}
            <span className="ml-2 text-sm font-medium text-muted-foreground">{percentual(fracao)}</span>
          </p>
          {/* Trilha na mesma família de cor do preenchimento: o estado se lê na barra inteira */}
          <div className="h-2 w-full overflow-hidden rounded-full bg-n-success/20" role="img" aria-label={`${percentual(fracao)} conformes`}>
            <div className="barra-cresce h-full rounded-full bg-n-success transition-[width] duration-(--duracao-longa) ease-(--ease-suave) motion-reduce:transition-none" style={{ width: `${fracao * 100}%` }} />
          </div>
          {nao && nao.valor > 0 && (
            <Button variant="outline" size="sm" onClick={nao.selecionar} aria-pressed={nao.selecionada} className="w-fit border-input bg-sidebar text-foreground">
              Ver os {inteiro(nao.valor)} não conformes
            </Button>
          )}
        </>
      )}
    </div>
  );
};
