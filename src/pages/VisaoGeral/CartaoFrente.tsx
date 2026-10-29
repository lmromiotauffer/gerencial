import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import Card from "@/components/Card/components/Root/Root";
import { Button } from "@/components/shadcn/button";
import { Indicador } from "@/components/Indicador/Indicador";
import { GraficoBarras } from "@/components/GraficoBarras/GraficoBarras";
import type { Linhas } from "@/shared/qlik/useLinhas";

type Numero = { rotulo: string; sigla?: string; valor?: string | null; exato?: string; apoio?: string };

type Props = {
  titulo: string;
  icone: ReactNode;
  href: string;
  heroi: Numero;
  apoios: [Numero, Numero];
  grafico: Linhas & { titulo: string; formatar: (valor: number) => string };
};

/** Uma frente de trabalho: o número que importa em grande, dois de apoio, um mini gráfico e a porta para a seção. */
export const CartaoFrente = ({ titulo, icone, href, heroi, apoios, grafico }: Props) => (
  // A partir de lg o mínimo é o conteúdo (com ≥ 3 barras): em janelas baixas a página rola em vez de esmagar o gráfico
  <Card className="min-h-[360px] gap-0 p-0 lg:min-h-[min-content]">
    <h2 className="flex min-h-10 shrink-0 items-center gap-2 border-b border-border px-4 text-xs font-medium text-foreground">
      <span className="text-primary" aria-hidden>
        {icone}
      </span>
      {titulo}
    </h2>
    <div className="flex min-h-0 flex-1 flex-col gap-4 p-4">
      <Indicador heroi {...heroi} />
      <div className="grid grid-cols-2 gap-3">
        <Indicador {...apoios[0]} />
        <Indicador {...apoios[1]} />
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-1.5">
        <h3 className="text-[11px] leading-4 text-muted-foreground">{grafico.titulo}</h3>
        {/* contain:size: a lista não empurra o cartão; só os 5rem (3 linhas) entram no mínimo, o resto rola por dentro */}
        <GraficoBarras {...grafico} className="min-h-0 flex-1 lg:min-h-20 lg:[contain:size]" />
      </div>
      <Button asChild variant="outline" size="sm" className="w-fit border-input bg-sidebar text-foreground">
        <Link to={href} viewTransition>
          Abrir {titulo}
          <ArrowRight aria-hidden />
        </Link>
      </Button>
    </div>
  </Card>
);
