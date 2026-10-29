import { TabelaCartao } from "@/components/CartaoPainel/CartaoPainel";
import { colunasContratos } from "./colunas";
import type { Bloco } from "./Contratos";

/** A Tabela de contratos do app, com totais e exportação; clicar numa linha seleciona o contrato. */
export const AbaTabela = ({ slot, bloco }: { slot: HTMLElement | null; bloco: Bloco }) => (
  <div data-revelar="aba" className="h-full">
    <div {...bloco(0)} className="h-full">
      <TabelaCartao colunas={colunasContratos} slotExportar={slot} nomeArquivo="contratos" totais selecionarLinha />
    </div>
  </div>
);
