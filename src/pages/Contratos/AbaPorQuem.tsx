import { useMemo, useState } from "react";
import { GraficoBarras } from "@/components/GraficoBarras/GraficoBarras";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/shadcn/select";
import { contratos, dimensao, dimensoesContrato, medida } from "@/shared/qlik/expressoes";
import { useLinhas } from "@/shared/qlik/useLinhas";
import { moedaCurta } from "@/shared/utils/formatarNumero";
import type { Bloco } from "./Contratos";

const medidaContratado = medida(contratos.atual, "Valor contratado atual");

/** Os cinco gráficos "Valor contratado por…" do app viram um só, com o seletor da dimensão. */
export const AbaPorQuem = ({ bloco }: { bloco: Bloco }) => {
  const [escolhida, setEscolhida] = useState<(typeof dimensoesContrato)[number]["valor"]>("adjunta");
  const config = dimensoesContrato.find(({ valor }) => valor === escolhida)!;
  const cubo = useMemo(() => ({ dimensao: dimensao(config.campo, config.rotulo), medida: medidaContratado, quantidade: 300 }), [config]);
  const linhas = useLinhas(cubo);

  return (
    <div data-revelar="aba" className="flex h-full flex-col gap-3">
      <div {...bloco(0)} className="flex flex-wrap items-center gap-2 text-xs text-foreground">
        <label htmlFor="dimensao-contratos">Valor contratado atual (original + aditivos) por</label>
        <Select value={escolhida} onValueChange={(valor) => setEscolhida(valor as typeof escolhida)}>
          <SelectTrigger id="dimensao-contratos" className="h-8 w-56 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {dimensoesContrato.map(({ valor, rotulo }) => (
              <SelectItem key={valor} value={valor} className="text-xs">
                {rotulo}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {linhas.pronto && <span className="text-muted-foreground">{linhas.total} valores; clique numa barra para filtrar</span>}
      </div>
      {/* key: trocar a dimensão recria a lista e a cascata de entrada roda de novo */}
      <div {...bloco(1)} className="flex min-h-0 flex-1 flex-col">
        <GraficoBarras key={escolhida} {...linhas} formatar={moedaCurta} larguraRotulo="minmax(0,18rem)" className="min-h-0 flex-1" />
      </div>
    </div>
  );
};
