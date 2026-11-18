// preco.ts — Paradigma FUNCIONAL
// Só funções puras: recebem dados, devolvem dados novos e não mudam nada fora delas.
// Nada de let, var, for, while, forEach, push ou class neste arquivo.
import type { Pessoa, Ingresso, TipoIngresso } from "./tipos.ts";

// Arredonda em 2 casas, devolvendo número (o toFixed devolveria texto).
const arredondar = (valor: number): number => Math.round(valor * 100) / 100;

// Fábrica de funções (como o criarMultiplicador da Aula 7):
// recebe o preço base e devolve uma função que, dado o tipo, devolve o valor.
// A função devolvida "lembra" o precoBase (closure).
export const valorDoIngresso =
  (precoBase: number) =>
  (tipo: TipoIngresso): number =>
    tipo === "meia" ? arredondar(precoBase / 2) : precoBase;

// Outra fábrica: recebe o percentual (0.1 = 10%) e devolve uma função
// que soma essa taxa a um valor.
export const aplicarTaxa =
  (percentual: number) =>
  (valor: number): number =>
    arredondar(valor * (1 + percentual));

// Cria um Ingresso por pessoa, na mesma ordem, com map (não altera a lista recebida).
// Quem decide se é meia é a função temDireitoAMeia recebida como parâmetro.
export const montarIngressos = (
  precoBase: number,
  pessoas: readonly Pessoa[],
  temDireitoAMeia: (pessoa: Pessoa) => boolean,
): Ingresso[] => {
  const valorDe = valorDoIngresso(precoBase);
  return pessoas.map((pessoa) => {
    const tipo: TipoIngresso = temDireitoAMeia(pessoa) ? "meia" : "inteira";
    return { nome: pessoa.nome, poltrona: pessoa.poltrona, tipo, valor: valorDe(tipo) };
  });
};

// A taxa de serviço de 10%, criada uma vez pela fábrica.
const comTaxaDeServico = aplicarTaxa(0.1);

// Soma os valores com reduce e aplica a taxa de 10%.
export const calcularTotal = (ingressos: readonly Ingresso[]): number =>
  comTaxaDeServico(ingressos.reduce((soma, ingresso) => soma + ingresso.valor, 0));
