import { TabelaCartao } from "@/components/CartaoPainel/CartaoPainel";
import type { Bloco } from "@/pages/Contratos/Contratos";
import { colunasObras } from "./colunas";

/** A Lista das obras do app, com totais e exportação; clicar numa linha seleciona a obra. */
export const AbaTabela = ({ slot, bloco }: { slot: HTMLElement | null; bloco: Bloco }) => (
  <div data-revelar="aba" className="h-full">
    <div {...bloco(0)} className="h-full">
      <TabelaCartao colunas={colunasObras} slotExportar={slot} nomeArquivo="obras" totais selecionarLinha />
    </div>
  </div>
);
