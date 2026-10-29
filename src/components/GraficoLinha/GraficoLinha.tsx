import { useMemo } from "react";
import ReactECharts from "echarts-for-react/esm/core";
import * as echarts from "echarts/core";
import { LineChart } from "echarts/charts";
import { GridComponent, LegendComponent, TooltipComponent } from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";
import { useTable, type Column } from "@cluster-data-experience/qlik-modules";
import { semTotais } from "@/components/CartaoPainel/colunas";
import { SemDados } from "@/components/GraficoBarras/GraficoBarras";
import { Skeleton } from "@/components/shadcn/skeleton";
import { useTheme } from "@/shared/contexts/ThemeContext";
import { movimentoReduzido } from "@/shared/hooks/useMovimentoReduzido";
import { percentual } from "@/shared/utils/formatarNumero";

// Só os módulos usados: o echarts completo pesa ~1 MB minificado
echarts.use([LineChart, GridComponent, LegendComponent, TooltipComponent, CanvasRenderer]);

type Props = {
  // Dimensão de mês "AAAA/M" e duas medidas em fração (0–1): previsto e realizado
  colunas: Column[];
  rotulos: [previsto: string, realizado: string];
};

const fracao = (valor: number | undefined) => (Number.isFinite(valor) ? (valor as number) : null);
const hoje = new Date();
// O realizado acumulado fica parado depois do mês atual; corta a linha ali em vez de desenhar um platô no futuro
const depoisDeHoje = (mes: string) => {
  const [ano, m] = mes.split("/").map(Number);
  return ano > hoje.getFullYear() || (ano === hoje.getFullYear() && m > hoje.getMonth() + 1);
};

/** Curvas acumuladas previsto × realizado em ECharts (o HTML não faz linha); o previsto tracejado, o realizado em azul. */
export const GraficoLinha = ({ colunas, rotulos }: Props) => {
  const { isDark } = useTheme();
  const { data, isLoading } = useTable({ columns: colunas, pageHeight: 400, totals: semTotais });

  // O canvas precisa de cores resolvidas: lê as bases opacas de cada tema (index.css, --palette-*)
  const cores = useMemo(() => {
    const estilo = getComputedStyle(document.documentElement);
    const ler = (papel: string) => estilo.getPropertyValue(`--palette-${isDark ? "dark" : "light"}-${papel}`).trim();
    return { superficie: ler("surface"), texto: ler("text"), apagado: ler("muted"), borda: ler("border"), primaria: ler("primary") };
  }, [isDark]);

  const serie = useMemo(() => {
    const linhas = data?.rows ?? [];
    return {
      meses: linhas.map((l) => l.cells[0]?.qText ?? ""),
      previsto: linhas.map((l) => fracao(l.cells[1]?.qNum)),
      realizado: linhas.map((l) => (depoisDeHoje(l.cells[0]?.qText ?? "") ? null : fracao(l.cells[2]?.qNum))),
    };
  }, [data]);

  const opcao = useMemo(() => {
    const linha = (nome: string, valores: (number | null)[], cor: string, tracejada: boolean) => ({
      name: nome,
      type: "line",
      data: valores,
      showSymbol: false,
      // Mês sem dado no meio da série (nulo no cubo) não quebra a curva acumulada
      connectNulls: true,
      lineStyle: { width: tracejada ? 2 : 3, color: cor, type: tracejada ? "dashed" : "solid" },
      itemStyle: { color: cor },
    });
    return {
      animation: !movimentoReduzido(),
      backgroundColor: "transparent",
      textStyle: { fontFamily: "inherit" },
      legend: { top: 0, left: 0, itemWidth: 16, textStyle: { color: cores.apagado, fontSize: 11 } },
      tooltip: {
        trigger: "axis",
        backgroundColor: cores.superficie,
        borderColor: cores.borda,
        textStyle: { color: cores.texto, fontSize: 12 },
        valueFormatter: (v: number | null) => (v == null ? "–" : percentual(v)),
      },
      grid: { left: 0, right: 8, top: 28, bottom: 0, containLabel: true },
      xAxis: {
        type: "category",
        boundaryGap: false,
        data: serie.meses,
        axisLabel: { color: cores.apagado, fontSize: 10 },
        axisLine: { lineStyle: { color: cores.borda } },
        axisTick: { show: false },
      },
      yAxis: {
        type: "value",
        min: 0,
        axisLabel: { color: cores.apagado, fontSize: 10, formatter: (v: number) => percentual(v, 0) },
        splitLine: { lineStyle: { color: cores.borda } },
      },
      series: [linha(rotulos[0], serie.previsto, cores.apagado, true), linha(rotulos[1], serie.realizado, cores.primaria, false)],
    };
  }, [serie, cores, rotulos]);

  if (isLoading && !data) return <Skeleton className="h-full min-h-40 w-full rounded-lg bg-muted" />;
  if (serie.meses.length === 0) return <SemDados />;
  // Último mês medido, para o texto acessível
  let indice = serie.realizado.length - 1;
  while (indice > 0 && serie.realizado[indice] == null) indice--;
  const ultimo = serie.realizado[indice];
  const ultimoPrevisto = serie.previsto[indice];
  return (
    <div
      role="img"
      aria-label={`${rotulos[1]}: ${ultimo == null ? "sem medição" : percentual(ultimo)}; ${rotulos[0]} até o mesmo mês: ${ultimoPrevisto == null ? "sem cronograma" : percentual(ultimoPrevisto)}`}
      className="h-full min-h-40 w-full"
    >
      <ReactECharts echarts={echarts} option={opcao} notMerge style={{ height: "100%", width: "100%" }} />
    </div>
  );
};
