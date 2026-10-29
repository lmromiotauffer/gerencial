// Formatos pt-BR: curto na tela (R$ 21,4 bi), exato no título e na exportação
const moedaCompacta = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", notation: "compact", maximumFractionDigits: 1 });
const moedaCompleta = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const numeroCompacto = new Intl.NumberFormat("pt-BR", { notation: "compact", maximumFractionDigits: 1 });

export const moedaCurta = (valor: number) => moedaCompacta.format(valor);
export const moedaExata = (valor: number) => moedaCompleta.format(valor);
export const inteiro = (valor: number) => Math.round(valor).toLocaleString("pt-BR");
export const numeroCurto = (valor: number) => (Math.abs(valor) < 10_000 ? inteiro(valor) : numeroCompacto.format(valor));
export const percentual = (fracao: number, casas = 1) => fracao.toLocaleString("pt-BR", { style: "percent", maximumFractionDigits: casas });
export const km = (valor: number) => `${inteiro(valor)} km`;
export const pontosPercentuais = (valor: number) =>
  `${valor.toLocaleString("pt-BR", { maximumFractionDigits: 1, signDisplay: "exceptZero" })} p.p.`;

// Leitura de uma lista de números do Qlik (useNumeros): undefined enquanto carrega, null se indisponível
export const exibir = (numeros: (number | null)[] | undefined, indice: number, formatar: (valor: number) => string) =>
  numeros === undefined ? undefined : numeros[indice] === null ? null : formatar(numeros[indice] as number);
export const exato = (numeros: (number | null)[] | undefined, indice: number) =>
  numeros?.[indice] == null ? undefined : moedaExata(numeros[indice] as number);
