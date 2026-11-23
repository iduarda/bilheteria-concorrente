// preco.ts — Paradigma funcional: só funções puras.
import type { Pessoa, Ingresso, TipoIngresso } from "./tipos.ts";

const arredondar = (valor: number): number => Math.round(valor * 100) / 100;

export const valorDoIngresso =
  (precoBase: number) =>
  (tipo: TipoIngresso): number =>
    tipo === "meia" ? arredondar(precoBase / 2) : precoBase;

export const aplicarTaxa =
  (percentual: number) =>
  (valor: number): number =>
    arredondar(valor * (1 + percentual));

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

const comTaxaDeServico = aplicarTaxa(0.1);

export const calcularTotal = (ingressos: readonly Ingresso[]): number =>
  comTaxaDeServico(ingressos.reduce((soma, ingresso) => soma + ingresso.valor, 0));
