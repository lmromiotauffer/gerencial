import { TabelaCartao } from "@/components/CartaoPainel/CartaoPainel";
import type { Bloco } from "@/pages/Contratos/Contratos";
import { colunasManutencao } from "./colunas";

/** A Lista dos serviços de manutenção do app, com totais e exportação; clicar numa linha seleciona o serviço. */
export const AbaTabela = ({ slot, bloco }: { slot: HTMLElement | null; bloco: Bloco }) => (
  <div data-revelar="aba" className="h-full">
    <div {...bloco(0)} className="h-full">
      <TabelaCartao colunas={colunasManutencao} slotExportar={slot} nomeArquivo="manutencao" totais selecionarLinha />
    </div>
  </div>
);
