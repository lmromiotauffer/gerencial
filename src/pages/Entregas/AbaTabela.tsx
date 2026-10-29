import { TabelaCartao } from "@/components/CartaoPainel/CartaoPainel";
import type { Bloco } from "@/pages/Contratos/Contratos";
import { colunasEntregas } from "./colunas";

/** Obras de pavimentação e restauração, com totais e exportação; clicar numa linha seleciona a obra. */
export const AbaTabela = ({ slot, bloco }: { slot: HTMLElement | null; bloco: Bloco }) => (
  <div data-revelar="aba" className="h-full">
    <div {...bloco(0)} className="h-full">
      <TabelaCartao colunas={colunasEntregas} slotExportar={slot} nomeArquivo="entregas" totais selecionarLinha />
    </div>
  </div>
);
