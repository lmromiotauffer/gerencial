import { Skeleton } from "@/components/shadcn/skeleton";
import { cn } from "@/shared/utils/tailwind/cn";

type Props = {
  // Nome simples; a sigla oficial vai ao lado, menor
  rotulo: string;
  sigla?: string;
  // undefined: carregando; null: indisponível
  valor?: string | null;
  // Valor completo, no título (o da tela é abreviado)
  exato?: string;
  // Linha de apoio em linguagem simples ("quanto já foi medido e aprovado")
  apoio?: string;
  heroi?: boolean;
  className?: string;
};

/** Número com rótulo simples + sigla e linha de apoio. Herói: 32 px, figuras proporcionais; padrão: 20 px. */
export const Indicador = ({ rotulo, sigla, valor, exato, apoio, heroi, className }: Props) => (
  <div className={cn("flex min-w-0 flex-col gap-1", className)}>
    <p className="text-[11px] leading-4 tracking-[0.11px] text-muted-foreground">
      {rotulo}
      {sigla && <span className="text-muted-foreground/75"> · {sigla}</span>}
    </p>
    {valor === undefined ? (
      <Skeleton className={cn("rounded bg-muted", heroi ? "h-8 w-40" : "h-5 w-24")} />
    ) : (
      <p
        title={exato}
        // key pelo valor: ao filtrar, só o número que mudou assenta de novo
        key={valor ?? "-"}
        className={cn(
          "animate-entrar-chip font-semibold leading-none text-foreground",
          heroi ? "text-[32px] tracking-[-0.5px]" : "text-xl",
          valor === null && "text-muted-foreground",
        )}
      >
        {valor ?? "–"}
      </p>
    )}
    {apoio && <p className="text-xs leading-4 text-muted-foreground">{apoio}</p>}
  </div>
);
