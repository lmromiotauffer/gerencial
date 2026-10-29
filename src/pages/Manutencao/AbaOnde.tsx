import { useMemo, useState } from "react";
import { GraficoBarras } from "@/components/GraficoBarras/GraficoBarras";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/shadcn/select";
import { dimensao, dimensoesManutencao, medida } from "@/shared/qlik/expressoes";
import { useLinhas } from "@/shared/qlik/useLinhas";
import { inteiro, moedaCurta } from "@/shared/utils/formatarNumero";
import type { Bloco } from "@/pages/Contratos/Contratos";

/** Os gráficos por credor, classificação, município e rodovia do app viram um só, com o seletor da dimensão. */
export const AbaOnde = ({ bloco }: { bloco: Bloco }) => {
  const [escolhida, setEscolhida] = useState<(typeof dimensoesManutencao)[number]["valor"]>("credor");
  const config = dimensoesManutencao.find(({ valor }) => valor === escolhida)!;
  const emValor = config.unidade === "valor";
  const cubo = useMemo(
    () => ({ dimensao: dimensao(config.campo, config.rotulo), medida: medida(config.medida, emValor ? "Valor dos serviços" : "Serviços"), quantidade: 300 }),
    [config, emValor],
  );
  const linhas = useLinhas(cubo);

  return (
    <div data-revelar="aba" className="flex h-full flex-col gap-3">
      <div {...bloco(0)} className="flex flex-wrap items-center gap-2 text-xs text-foreground">
        <label htmlFor="dimensao-manutencao">{emValor ? "Valor dos serviços por" : "Quantidade de serviços por"}</label>
        <Select value={escolhida} onValueChange={(valor) => setEscolhida(valor as typeof escolhida)}>
          <SelectTrigger id="dimensao-manutencao" className="h-8 w-56 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {dimensoesManutencao.map(({ valor, rotulo }) => (
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
        <GraficoBarras key={escolhida} {...linhas} formatar={emValor ? moedaCurta : inteiro} larguraRotulo="minmax(0,18rem)" className="min-h-0 flex-1" />
      </div>
    </div>
  );
};
