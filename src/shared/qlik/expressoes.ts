// Expressões do app Qlik d7a3a844 (docs/objetos-gerencial.md), copiadas dos objetos originais.
// Sem Num(): o formato é feito em JS (formatarNumero.ts) para abreviar na tela e manter o exato no título.
import type { Column } from "@cluster-data-experience/qlik-modules";

// Conjunto que isola o contrato das dimensões de obra, como nos KPIs de Valores contratuais (DJMvsM…aTtN)
const soContrato =
  "$(vIgnorar_Campos_DIM_Obra), urlFoto=, codigoAtivo=, [Tipo da rodovia]=, [Município]=, [Sigla da rodovia]=, [_skContrato] = P(_skContrato)";
const medicaoAprovada = '[cdTipoCalculoMedicao] = {1,2,3}, [flMedicaoAprovada] = {"S"}';
// Obras propriamente ditas (os demais tipos são serviços, manutenção etc.)
const soObras = "cdTipoObra = {15, 30, 33, 35, 37, 41, 45}";
const soManutencao = "cdTipoObra = {4}";
const mesAtual = `_skTempo={"<$(=Date(MonthStart(Today()), 'YYYYMMDD'))"}`;

const original = "Sum(vlInicialContrato)";
const aditivos = `Sum({<${soContrato}, [cdTipoAditivo] = {1}>} valorAditivo)`;
const medidoPI = `Sum({<${soContrato}, [tpValor] = {"PI"}, ${medicaoAprovada}>} valorMedicao)`;
const reajuste = `Sum({<${soContrato}, [tpValor] = {"RD", "CR", "RP"}, ${medicaoAprovada}>} valorMedicao)`;
const empenhado = `Sum({<${soContrato}>} valorEmpenho) - Sum({<${soContrato}>} valorEstornoEmpenho)`;
const liquidado = `Sum({<${soContrato}>} valorLiquidacao) - Sum({<${soContrato}>} valorEstornoLiquidacao)`;

export const contratos = {
  quantidade: "Count(DISTINCT _skContrato)",
  original,
  aditivos,
  atual: `${original} + ${aditivos}`,
  medidoPI,
  reajuste,
  medidoTotal: `Sum({<${soContrato}, ${medicaoAprovada}>} valorMedicao)`,
  saldoPI: `(${original} + ${aditivos}) - ${medidoPI}`,
  empenhado,
  liquidado,
  aLiquidar: `(${empenhado}) - (${liquidado})`,
  cronograma: "Sum(valorCronograma) + Sum(vlCronogramaProposta)",
  apostilamento: `Sum({<${soContrato}, [cdTipoAditivo] = {3}>} valorAditivo)`,
  // Só os vigentes: a dimensão mestra de conformidade devolve 'Sim' para contratos sem cronograma e sem valor
  vigentes: "Count(DISTINCT {<[Situação atual do contrato] = {'Vigente'}>} _skContrato)",
};

const paralisada = `${soObras}, [Situação atual da obra] = {"Paralisada"}, flUltimaParalisacao = {1}`;
const emGarantia = `${soObras}, flGarantia = {'S'}`;

// Curvas acumuladas por DEANOMES (linechart XtRBZ do app), com duas correções validadas ao vivo:
// o denominador é o valor de todas as obras do recorte (TOTAL; no app ele era recortado pelo mês e a curva passava de 100 %)
// e o mês sem cronograma nem medição fica nulo, para o qSuppressMissing tirar os meses do calendário vazios (1899…2250)
const curvaAcumulada = (recorte: string) => {
  const cronogramaMes = `Sum({<urlFoto=, ${recorte}, [_skObra] = P(_skObra)>} valorCronograma)`;
  const medidoMes = `Sum({<urlFoto=, ${mesAtual}, [tpValor] = {"PI"}, ${medicaoAprovada}, ${recorte}, [_skObra] = P(_skObra)>} valorMedicao)`;
  const valorTotal = `Sum(TOTAL {<${recorte}, urlFoto=, [_skObra] = P(_skObra), _skTempo=, DEANOMES=>} valorServicoObra)`;
  const temDadoNoMes = `(${cronogramaMes} <> 0 or ${medidoMes} <> 0)`;
  return {
    previstoAcumulado: `If(${temDadoNoMes}, RangeSum(Above(${cronogramaMes}, 0, RowNo())) / ${valorTotal})`,
    realizadoAcumulado: `If(${temDadoNoMes}, RangeSum(Above(${medidoMes}, 0, RowNo())) / ${valorTotal})`,
  };
};

const valorObrasMedido = (extra: string) =>
  `Sum({<[_skObra] = P(_skObra), ${extra}, ${medicaoAprovada}, ${soObras}, urlFoto=>} valorMedicao)`;
const valorObras = `Sum({<${soObras}>} valorServicoObra)`;

export const obras = {
  quantidade: `Count(DISTINCT {<${soObras}>} [_skObra])`,
  valor: valorObras,
  medidoPI: valorObrasMedido('[tpValor] = {"PI"}'),
  medidoTotal: `Sum({<[_skObra] = P(_skObra), ${medicaoAprovada}, ${soObras}, urlFoto=>} valorMedicao)`,
  execucao: `${valorObrasMedido('[tpValor] = {"PI"}')} / ${valorObras}`,
  execucaoEsperada: `Sum({<[_skObra] = P(_skObra), ${mesAtual}, ${soObras}, urlFoto=>} valorCronograma) / Sum({<${soObras}, [_skObra] = P(_skObra), urlFoto=>} valorServicoObra)`,
  paralisadas: `Count(DISTINCT {<${paralisada}>} [_skObra])`,
  valorParalisadas: `Sum({<${paralisada}>} valorServicoObra)`,
  emGarantia: `Count(DISTINCT {<${emGarantia}>} [_skObra])`,
  valorGarantia: `Sum({<${emGarantia}>} valorServicoObra)`,
  ...curvaAcumulada(soObras),
  // Medidas das faixas de alerta, com o recorte de situação que cada objeto do app usa
  emAndamentoOuParalisadas: `Count(DISTINCT {<[Situação atual da obra] = {"Paralisada", "Em Andamento"}, ${soObras}>} [_skObra])`,
  aIniciarAndamentoOuParalisadas: `Count(DISTINCT {<[Situação atual da obra] = {"Paralisada", "Em Andamento", "A Iniciar"}, ${soObras}>} [_skObra])`,
};

// Recorte cdTipoObra = {4}, o dos KPIs do app e da Visão geral (174 serviços). Os gráficos e a tabela do app usam
// [Tipo do contrato] = 'MANUTENÇÃO/CONSERVAÇÃO' (164): a seção usa um recorte só, para os números somarem igual
const medidoManutencao = (extra: string) =>
  `Sum({<${soManutencao}, [_skObra] = P(_skObra), ${extra}${medicaoAprovada}, urlFoto=>} valorMedicao)`;
const valorManutencao = `Sum({<${soManutencao}>} valorServicoObra)`;

export const manutencao = {
  quantidade: `Count(DISTINCT {<${soManutencao}>} [_skObra])`,
  valor: valorManutencao,
  extensaoKm: `Sum(DISTINCT {<${soManutencao}>} Aggr(qtExtensaoObra, [_skObra]))`,
  medidoPI: medidoManutencao('[tpValor] = {"PI"}, '),
  reajuste: medidoManutencao('[tpValor] = {"RD", "CR", "RP"}, '),
  medidoTotal: medidoManutencao(""),
  execucao: `${medidoManutencao('[tpValor] = {"PI"}, ')} / ${valorManutencao}`,
  cronograma: `Sum({<${soManutencao}, [_skObra] = P(_skObra), urlFoto=>} valorCronograma) + Sum({<${soManutencao}, [_skObra] = P(_skObra), urlFoto=>} vlCronogramaProposta)`,
  ...curvaAcumulada(soManutencao),
};

// Dimensões do gráfico "Onde e por quem" (Gerencial de manutenção), cada uma com a medida que o app usa nela;
// município e rodovia descartam a chave 0 (serviço sem município ou rodovia), como no app
const servicosSem = (chave: string) => `Count(DISTINCT {<${soManutencao}, [${chave}] =- {0}>} [_skObra])`;
export const dimensoesManutencao = [
  { valor: "credor", rotulo: "Credor", campo: "Credor", medida: valorManutencao, unidade: "valor" },
  { valor: "classificacao", rotulo: "Classificação", campo: "[Classificação da obra]", medida: valorManutencao, unidade: "valor" },
  { valor: "municipio", rotulo: "Município", campo: "[Município]", medida: servicosSem("_skMunicipio"), unidade: "serviços" },
  { valor: "rodovia", rotulo: "Rodovia", campo: "[Sigla da rodovia]", medida: servicosSem("_skDrodovia"), unidade: "serviços" },
  { valor: "setor", rotulo: "Setor", campo: "[Sigla órgão setor]", medida: `Count(DISTINCT {<${soManutencao}>} [_skObra])`, unidade: "serviços" },
] as const;

// Entregas: pavimentação = classe 4, restauração = classe 6, ambas do tipo 35
const kmPorSituacao = (classe: number, situacao: string) =>
  `Round(Sum({<[_skObra] = P(_skObra), [Situação atual da obra] = {'${situacao}'}, cdTipoObra = {35}, cdClasseObra = {${classe}}, urlFoto=>} Aggr(qtExtensaoObra, [_skObra])))`;
const kmRevestimento = (programa: string) =>
  `Round(Sum({<[dataCapaAsfaltica] = {"$(=Date(Max(dataCapaAsfaltica)))"}, [Situação atual da obra] -= {'Execução Concluída'}, programa = {"*${programa}*"}, urlFoto=>} avancoKmCapaAsfaltica))`;

// Km por classe sem recorte de situação, para os cubos por situação e a tabela
const kmClasse = (classe: number) =>
  `Sum({<[_skObra] = P(_skObra), cdTipoObra = {35}, cdClasseObra = {${classe}}, urlFoto=>} Aggr(qtExtensaoObra, [_skObra]))`;
// Km com termo de recebimento provisório (evento 9), por ano do evento (barchart 96587866 e 96b0ff84)
const kmRecebidos = (classe: number) =>
  `Sum({<[_skEvento] = {9}, cdTipoObra = {35}, cdClasseObra = {${classe}}>} Aggr(qtExtensaoObra, [_skObra]))`;

export const entregas = {
  pavimentacaoTotal: `${kmPorSituacao(4, "Execução Concluída")} + ${kmRevestimento("PAV")}`,
  restauracaoTotal: `${kmPorSituacao(6, "Execução Concluída")} + ${kmRevestimento("RESTAURA")}`,
  pavimentacaoEmAndamento: kmPorSituacao(4, "Em Andamento"),
  restauracaoEmAndamento: kmPorSituacao(6, "Em Andamento"),
  pavimentacaoRevestimento: kmRevestimento("PAV"),
  restauracaoRevestimento: kmRevestimento("RESTAURA"),
  pavimentacaoKm: kmClasse(4),
  restauracaoKm: kmClasse(6),
  pavimentacaoRecebidos: kmRecebidos(4),
  restauracaoRecebidos: kmRecebidos(6),
};

// Dimensões mestras do app (ids em docs/objetos-gerencial.json): as faixas de alerta são Aggr() por contrato/obra
export const mestres = {
  prazoVigencia: "FPpEYBk", // '≤ 30 dias' · '> 30 dias e ≤ 60' · '> 60 dias e ≤ 90 dias' · '> 90 dias'
  conformidadeValor: "bUwjPa", // Sim / Não (contrato x cronograma)
  conformidadeData: "EEbygYp", // Sim / Não (fim execução x fim vigência)
  situacaoObra: "mxMtT",
  diferencaPrevistoRealizado: "qPgHK", // '≥ -5 p.p.' · '≥ -50 p.p. e < -5 p.p.' · '< -50 p.p.' · 'Ausência de cronograma'
  ultimaMedicao: "jykc", // '≤ 60 dias' · '> 60 e ≤ 90 dias' · '> 90 dias' · 'Nenhuma medição'
  tempoParalisacao: "ZmuMt", // '< 90 dias' · '>= 90 dias' (só paralisadas)
  compatibilidadeSituacao: "AYVejJU", // Sim / Não (situação da obra x do contrato)
  conformidadeDataObra: "c4a844cc-402b-456e-990d-d9fc0b401c14", // Sim / Não (fim execução do contrato x da obra)
  recebimentoConcluidas: "tHUdsP", // 'Com TRD' · 'No prazo para TRD' · 'TRD atrasado'
} as const;

export const ordemDiferenca = ["≥ -5 p.p.", "≥ -50 p.p. e < -5 p.p.", "< -50 p.p.", "Ausência de cronograma"];
export const ordemMedicao = ["≤ 60 dias", "> 60 e ≤ 90 dias", "> 90 dias", "Nenhuma medição"];
export const ordemParalisacao = ["< 90 dias", ">= 90 dias"];
export const ordemRecebimento = ["Com TRD", "No prazo para TRD", "TRD atrasado"];

export const ordemPrazo = ["≤ 30 dias", "> 30 dias e ≤ 60", "> 60 dias e ≤ 90 dias", "> 90 dias"];

// Colunas prontas para o useLinhas
export const dimensao = (campo: string, rotulo: string, extra?: Partial<Column>): Column =>
  ({ type: "dimension", qFieldDefs: [campo], qFieldLabels: [rotulo], qNullSuppression: true, ...extra }) as Column;
export const dimensaoMestra = (id: string): Column => ({ type: "dimension", qLibraryId: id, qNullSuppression: true });
export const medida = (qDef: string, qLabel: string): Column => ({ type: "measure", qDef, qLabel });

export const dimensoesContrato = [
  { valor: "adjunta", rotulo: "Adjunta", campo: "[Sigla adjunta]" },
  { valor: "setor", rotulo: "Setor", campo: "[Sigla órgão setor]" },
  { valor: "credor", rotulo: "Credor", campo: "Credor" },
  { valor: "tipo", rotulo: "Tipo do contrato", campo: "[Tipo do contrato]" },
  { valor: "classificacao", rotulo: "Classificação do contrato", campo: "[Classificação do contrato]" },
] as const;
