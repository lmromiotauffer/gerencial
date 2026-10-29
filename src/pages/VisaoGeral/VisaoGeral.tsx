import { HardHat, Route, ScrollText, Wrench } from "lucide-react";
import Card from "@/components/Card/components/Root/Root";
import Header from "@/components/Card/components/Header/Header";
import { BarraEmpilhada } from "@/components/BarraEmpilhada/BarraEmpilhada";
import { decrescente } from "@/components/CartaoPainel/colunas";
import { estadoSituacao } from "@/shared/estados";
import { contratos, dimensao, dimensaoMestra, entregas, manutencao, medida, mestres, obras } from "@/shared/qlik/expressoes";
import { useLinhas, useNumeros } from "@/shared/qlik/useLinhas";
import { exato, exibir, inteiro, km, moedaCurta, percentual } from "@/shared/utils/formatarNumero";
import { CartaoFrente } from "./CartaoFrente";
import { FaixaAlertas } from "./FaixaAlertas";

// Números das quatro frentes (KPIs dos objetos WSFzbv, DJMvsM, aTtN, 5538bc…, 74694e7b…, 8565325b… do app)
const numerosContratos = [contratos.atual, contratos.quantidade, contratos.medidoTotal] as const;
const numerosObras = [obras.execucao, obras.quantidade, obras.valor] as const;
const numerosManutencao = [manutencao.quantidade, manutencao.valor, manutencao.extensaoKm] as const;
const numerosEntregas = [entregas.pavimentacaoTotal, entregas.restauracaoTotal, entregas.pavimentacaoEmAndamento] as const;

// Cubos dos mini gráficos: constantes de módulo, porque o useLinhas recria o cubo quando a referência muda
const porAdjunta = { dimensao: dimensao("[Sigla adjunta]", "Adjunta"), medida: medida(contratos.atual, "Valor contratado") };
const porTipoObra = { dimensao: dimensao("[Tipo da obra]", "Tipo da obra"), medida: medida(obras.valor, "Valor das obras") };
const porClassificacaoManutencao = { dimensao: dimensao("[Classificação da obra]", "Classificação"), medida: medida(manutencao.valor, "Valor") };
const kmRecebidosPorAno = {
  // Últimos anos primeiro no cubo; a lista mostra em ordem cronológica
  dimensao: dimensao("=Year(dataEventoObra)", "Ano", { qSortCriterias: [{ qSortByNumeric: decrescente }] }),
  medida: medida(entregas.pavimentacaoRecebidos, "Km recebidos"),
  ordem: "dimensao" as const,
};
const contratosPorSituacao = { dimensao: dimensao("[Situação atual do contrato]", "Situação do contrato"), medida: medida(contratos.quantidade, "Contratos") };
const obrasPorSituacao = { dimensao: dimensaoMestra(mestres.situacaoObra), medida: medida(obras.quantidade, "Obras") };

export const VisaoGeral = () => {
  const c = useNumeros(numerosContratos);
  const o = useNumeros(numerosObras);
  const m = useNumeros(numerosManutencao);
  const e = useNumeros(numerosEntregas);
  const adjunta = useLinhas({ ...porAdjunta, quantidade: 5 });
  const tipoObra = useLinhas({ ...porTipoObra, quantidade: 6 });
  const classificacaoManutencao = useLinhas({ ...porClassificacaoManutencao, quantidade: 5 });
  const kmPorAno = useLinhas({ ...kmRecebidosPorAno, quantidade: 5 });
  const situacaoContratos = useLinhas(contratosPorSituacao);
  const situacaoObras = useLinhas(obrasPorSituacao);

  return (
    // A partir de lg as frentes dividem a altura que sobra; se não couberem (1366×768), a página rola em vez de cortar os gráficos
    <div className="flex h-full flex-col gap-2 overflow-y-auto">
      <FaixaAlertas />

      <section aria-label="As quatro frentes" className="grid shrink-0 gap-2 md:grid-cols-2 lg:flex-1 lg:shrink lg:grid-cols-4">
        <CartaoFrente
          titulo="Contratos"
          icone={<ScrollText size={16} />}
          href="/contratos"
          heroi={{ rotulo: "Contratado atual", sigla: "original + aditivos", valor: exibir(c, 0, moedaCurta), exato: exato(c, 0), apoio: "quanto a SINFRA se comprometeu a pagar hoje" }}
          apoios={[
            { rotulo: "Contratos", valor: exibir(c, 1, inteiro) },
            { rotulo: "Executado", sigla: "PI + R", valor: exibir(c, 2, moedaCurta), exato: exato(c, 2), apoio: "medido e aprovado, com reajuste" },
          ]}
          grafico={{ titulo: "Valor contratado por adjunta", formatar: moedaCurta, ...adjunta }}
        />
        <CartaoFrente
          titulo="Obras"
          icone={<HardHat size={16} />}
          href="/obras"
          heroi={{ rotulo: "Execução das obras", sigla: "PI", valor: exibir(o, 0, (v) => percentual(v)), apoio: "do valor das obras já medido e aprovado" }}
          apoios={[
            { rotulo: "Obras", valor: exibir(o, 1, inteiro) },
            { rotulo: "Valor das obras", valor: exibir(o, 2, moedaCurta), exato: exato(o, 2) },
          ]}
          grafico={{ titulo: "Valor das obras por tipo", formatar: moedaCurta, ...tipoObra }}
        />
        <CartaoFrente
          titulo="Manutenção"
          icone={<Wrench size={16} />}
          href="/manutencao"
          heroi={{ rotulo: "Serviços de manutenção", valor: exibir(m, 0, inteiro), apoio: "conservação e manutenção de rodovias" }}
          apoios={[
            { rotulo: "Valor dos serviços", valor: exibir(m, 1, moedaCurta), exato: exato(m, 1) },
            { rotulo: "Extensão atendida", valor: exibir(m, 2, km) },
          ]}
          grafico={{ titulo: "Valor dos serviços por classificação", formatar: moedaCurta, ...classificacaoManutencao }}
        />
        <CartaoFrente
          titulo="Entregas"
          icone={<Route size={16} />}
          href="/entregas"
          heroi={{ rotulo: "Pavimentação entregue", valor: exibir(e, 0, km), apoio: "concluída mais o revestimento já executado" }}
          apoios={[
            { rotulo: "Restauração entregue", valor: exibir(e, 1, km) },
            { rotulo: "Pavimentação em andamento", valor: exibir(e, 2, km) },
          ]}
          grafico={{ titulo: "Km de pavimento recebidos (TRP) por ano", formatar: km, ...kmPorAno, linhas: [...kmPorAno.linhas].reverse() }}
        />
      </section>

      <section aria-label="Situação" className="grid shrink-0 gap-2 lg:grid-cols-2">
        <Card className="gap-0 p-0">
          <Header title="Contratos por situação" className="flex-none" />
          <div className="p-4">
            <BarraEmpilhada {...situacaoContratos} estado={estadoSituacao} unidade="contratos" />
          </div>
        </Card>
        <Card className="gap-0 p-0">
          <Header title="Obras por situação" className="flex-none" />
          <div className="p-4">
            <BarraEmpilhada {...situacaoObras} estado={estadoSituacao} unidade="obras" />
          </div>
        </Card>
      </section>
    </div>
  );
};
