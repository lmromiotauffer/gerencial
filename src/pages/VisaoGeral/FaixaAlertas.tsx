import { useEffect, useRef, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarClock, CircleAlert, OctagonAlert, Ruler, TriangleAlert } from "lucide-react";
import Card from "@/components/Card/components/Root/Root";
import { Skeleton } from "@/components/shadcn/skeleton";
import { corEstado, type Estado } from "@/shared/estados";
import { contratos, dimensaoMestra, medida, mestres, obras } from "@/shared/qlik/expressoes";
import { useLinhas, type Linhas } from "@/shared/qlik/useLinhas";
import { inteiro } from "@/shared/utils/formatarNumero";
import { cn } from "@/shared/utils/tailwind/cn";

// Cada alerta é uma faixa de uma dimensão mestra do app (Aggr por contrato ou obra), contada
const cubos = {
  prazo: { dimensao: dimensaoMestra(mestres.prazoVigencia), medida: medida(contratos.vigentes, "Contratos") },
  situacaoObra: { dimensao: dimensaoMestra(mestres.situacaoObra), medida: medida(obras.quantidade, "Obras") },
  cronograma: { dimensao: dimensaoMestra(mestres.diferencaPrevistoRealizado), medida: medida(obras.quantidade, "Obras") },
  medicao: { dimensao: dimensaoMestra(mestres.ultimaMedicao), medida: medida(obras.quantidade, "Obras") },
  conformidadeValor: { dimensao: dimensaoMestra(mestres.conformidadeValor), medida: medida(contratos.vigentes, "Contratos") },
};

type Alerta = {
  cubo: Linhas;
  faixa: string;
  // Texto depois do número: "contratos vencem em até 30 dias"
  texto: string;
  estado: Estado;
  icone: ReactNode;
  href: string;
};

/** Faixa de alertas acionáveis: cada chip diz quantos e, ao clicar, seleciona a faixa no Qlik e abre a seção já filtrada. */
export const FaixaAlertas = () => {
  const navegar = useNavigate();
  const prazo = useLinhas(cubos.prazo);
  const situacaoObra = useLinhas(cubos.situacaoObra);
  const cronograma = useLinhas(cubos.cronograma);
  const medicao = useLinhas(cubos.medicao);
  const conformidadeValor = useLinhas(cubos.conformidadeValor);
  // Chip clicado, enquanto a seleção no Qlik (~250 ms) não volta; um segundo clique nesse intervalo é ignorado
  const [acionando, setAcionando] = useState<string | null>(null);
  // Há chips escondidos à direita: esmaece a ponta da lista (não o cartão) para indicar que a faixa continua
  const listaRef = useRef<HTMLDivElement>(null);
  const [temMais, setTemMais] = useState(false);

  const alertas: Alerta[] = [
    { cubo: prazo, faixa: "≤ 30 dias", texto: `contratos vencem em até 30 dias`, estado: "ruim", icone: <CalendarClock size={14} />, href: "/contratos?aba=prazos" },
    { cubo: prazo, faixa: "> 30 dias e ≤ 60", texto: `vencem em 30 a 60 dias`, estado: "atencao", icone: <CalendarClock size={14} />, href: "/contratos?aba=prazos" },
    { cubo: situacaoObra, faixa: "Paralisada", texto: `obras paralisadas`, estado: "ruim", icone: <OctagonAlert size={14} />, href: "/obras?aba=paralisadas" },
    { cubo: medicao, faixa: "> 90 dias", texto: `obras sem medição há mais de 90 dias`, estado: "atencao", icone: <Ruler size={14} />, href: "/obras?aba=alertas" },
    { cubo: cronograma, faixa: "Ausência de cronograma", texto: `obras sem cronograma`, estado: "neutro", icone: <CircleAlert size={14} />, href: "/obras?aba=alertas" },
    { cubo: conformidadeValor, faixa: "Não", texto: `contratos vigentes com valor diferente do cronograma`, estado: "atencao", icone: <CircleAlert size={14} />, href: "/contratos?aba=prazos" },
  ];
  const carregando = alertas.some(({ cubo }) => !cubo.pronto);
  const ativos = alertas
    .map((alerta) => ({ ...alerta, linha: alerta.cubo.linhas.find((l) => l.rotulo === alerta.faixa) }))
    .filter((alerta) => alerta.linha && alerta.linha.valor > 0);

  const verificarMais = () => {
    const el = listaRef.current;
    if (el) setTemMais(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  };
  // Remede quando a janela, o menu ou os chips mudam a largura
  useEffect(() => {
    const el = listaRef.current;
    if (!el) return;
    verificarMais();
    const observador = new ResizeObserver(verificarMais);
    observador.observe(el);
    [...el.children].forEach((filho) => observador.observe(filho));
    return () => observador.disconnect();
  }, [carregando, ativos.length]);

  return (
    <Card className="shrink-0 flex-row items-center gap-2 px-3 py-2">
      <h2 className="flex shrink-0 items-center gap-1.5 text-xs font-medium text-foreground">
        <TriangleAlert size={14} className="text-n-alerta" aria-hidden />
        Atenção
      </h2>
      {/* Só a lista rola: o título fica à vista e a borda do cartão não esmaece junto. py/-my: espaço para o anel de foco */}
      <div
        ref={listaRef}
        onScroll={verificarMais}
        className={cn(
          "-my-1 flex min-w-0 flex-1 items-center gap-2 overflow-x-auto py-1",
          temMais && "[mask-image:linear-gradient(to_right,black_calc(100%-3rem),transparent)]",
        )}
      >
      {carregando ? (
        <>
          <Skeleton className="h-7 w-56 rounded-full bg-muted" />
          <Skeleton className="h-7 w-44 rounded-full bg-muted" />
          <Skeleton className="h-7 w-40 rounded-full bg-muted" />
        </>
      ) : ativos.length === 0 ? (
        <p className="text-xs text-muted-foreground">Nenhum alerta para os filtros atuais.</p>
      ) : (
        <ul data-revelar="dados" className="flex items-center gap-2">
          {ativos.map((alerta, indice) => (
            <li key={alerta.texto} data-ordem style={{ "--ordem": indice } as React.CSSProperties} className="shrink-0">
              <button
                type="button"
                onClick={async () => {
                  if (acionando) return;
                  setAcionando(alerta.texto);
                  try {
                    await alerta.linha!.selecionar();
                  } catch {
                    setAcionando(null);
                    return;
                  }
                  // A navegação desmonta a faixa: o estado só é limpo quando a seleção falha
                  navegar(alerta.href, { viewTransition: true });
                }}
                data-acionando={acionando === alerta.texto || undefined}
                aria-busy={acionando === alerta.texto || undefined}
                title="Seleciona estes itens e abre a seção"
                className={cn(
                  // Chip: tinta a 10 % do estado (20 % no hover e enquanto aciona), ícone e número em negrito; nunca fundo cheio
                  "transicao-feedback flex h-7 cursor-pointer items-center gap-1.5 rounded-full bg-current/10 px-3 text-xs font-medium whitespace-nowrap outline-none hover:bg-current/20 data-[acionando]:bg-current/20 focus-visible:ring-[3px] focus-visible:ring-ring/50 active:scale-[0.97] motion-reduce:active:scale-100",
                  corEstado[alerta.estado],
                )}
              >
                <span aria-hidden>{alerta.icone}</span>
                {/* O número em negrito na cor do estado; o texto em cor de texto */}
                <span className="font-semibold tabular-nums">{inteiro(alerta.linha!.valor)}</span>
                <span className="text-foreground">{alerta.texto}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      </div>
    </Card>
  );
};
