import { useMemo } from "react";
import { useGenericKPI, useTable, type Column } from "@cluster-data-experience/qlik-modules";
import { medidaDecrescente, semTotais } from "@/components/CartaoPainel/colunas";
import { celulasOrdemEngine } from "@/shared/utils/celulasOrdemEngine";

export type Linha = {
  rotulo: string;
  valor: number;
  selecionada: boolean;
  selecionar: () => Promise<void>;
};

export type Linhas = { linhas: Linha[]; pronto: boolean; carregando: boolean; total: number };

type Opcoes = {
  dimensao: Column;
  medida: Column;
  quantidade?: number;
  // "valor": maior primeiro; "dimensao": a ordem da própria dimensão (qSortCriterias dela)
  ordem?: "valor" | "dimensao";
};

/** Hipercubo de uma dimensão e uma medida lido como lista; clicar numa linha seleciona o valor no Qlik. */
export const useLinhas = ({ dimensao, medida, quantidade = 50, ordem = "valor" }: Opcoes): Linhas => {
  // sortingPriority vai para qInterColumnSortOrder; a medida só manda na ordem quando ordem = "valor"
  const colunas = useMemo<Column[]>(
    () =>
      ordem === "valor"
        ? [{ ...dimensao, sortingPriority: 1 }, { ...medida, qSortBy: { qSortByNumeric: medidaDecrescente }, sortingPriority: 0 }]
        : [{ ...dimensao, sortingPriority: 0 }, { ...medida, sortingPriority: 1 }],
    [dimensao, medida, ordem],
  );
  const { data, layout, selectCell, isLoading } = useTable({ columns: colunas, pageHeight: quantidade, totals: semTotais });

  const linhas = useMemo<Linha[]>(
    () =>
      (data?.rows ?? []).map((linha, indice) => {
        const [dim, med] = celulasOrdemEngine(linha.cells, layout?.qHyperCube);
        return {
          rotulo: dim?.qText ?? "",
          valor: Number.isFinite(med?.qNum) ? (med.qNum as number) : 0,
          selecionada: dim?.qState === "S",
          selecionar: () => selectCell(indice, 0),
        };
      }),
    [data, layout, selectCell],
  );

  return { linhas, pronto: !!data, carregando: isLoading, total: layout?.qHyperCube?.qSize?.qcy ?? 0 };
};

/** Lista de expressões escalares; devolve os números na mesma ordem (undefined enquanto carrega, null se o Qlik falhou). */
export const useNumeros = (expressoes: readonly string[]): (number | null)[] | undefined => {
  const parametros = useMemo(() => expressoes.map((expression, i) => ({ expression, label: `n${i}` })), [expressoes]);
  const { data, error } = useGenericKPI(parametros);
  return useMemo(() => {
    if (!data) return error ? expressoes.map(() => null) : undefined;
    return expressoes.map((_, i) => (Number.isFinite(data[i]?.qNum) ? data[i].qNum : null));
  }, [data, error, expressoes]);
};
