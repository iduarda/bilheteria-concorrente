// regras.ts — Regra de negócio da meia-entrada
import type { Pessoa } from "./tipos.ts";

// Paga meia: estudante, pessoa com deficiência (PcD) ou quem tem 60 anos ou mais.
export function direitoAMeia(pessoa: Pessoa): boolean {
  return pessoa.estudante || pessoa.pcd || pessoa.idade >= 60;
}