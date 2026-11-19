// Todas as interfaces e types do projeto ficam aqui.
import type { Evento } from "./dominio.ts";
import type { Pagamento } from "./pagamento.ts";

export interface Pessoa {
  nome: string;
  idade: number;
  estudante: boolean;
  pcd: boolean; // pessoa com deficiência
  poltrona: number; // a poltrona que a pessoa escolheu
}

// Um pedido compra um ou mais ingressos para o mesmo evento, um por pessoa.
export interface Pedido {
  eventoId: number;
  ingressos: Pessoa[];
}

export type TipoIngresso = "inteira" | "meia";

export interface Ingresso {
  nome: string;
  poltrona: number;
  tipo: TipoIngresso;
  valor: number;
}

export interface Comprovante {
  reservaId: number;
  eventoId: number;
  ingressos: Ingresso[];
  total: number; // soma dos ingressos + taxa de serviço
}

export interface EventoInfo {
  id: number;
  nome: string;
  preco: number;
  capacidade: number;
  disponivel: number;
}

// O que o criarBilheteria recebe.
export interface ConfigBilheteria {
  eventos: Evento[];
  pagar: Pagamento;
  limitePagamentoMs: number;
}

// Interface extra usada pela bilheteria: tentativas de cobrança configuráveis.
// O padrão é 1, para não cobrar duas vezes por causa de uma retentativa.
export interface ConfigBilheteriaComRetentativa extends ConfigBilheteria {
  tentativas?: number;
  intervaloEntreTentativasMs?: number;
}
