// dominio.ts — Paradigma ORIENTADO A OBJETOS
// Os erros de negócio formam uma hierarquia de classes, e o Evento guarda
// as poltronas vendidas num campo privado (#) que ninguém de fora altera.
import type { EventoInfo } from "./tipos.ts";

// ------------------------------------------------------------------ erros

// Classe abstrata: ninguém cria um "ErroDeNegocio" genérico, só as filhas.
// Cada erro guarda o próprio status HTTP, assim o servidor só precisa
// ler erro.status, sem um if para cada tipo de erro.
export abstract class ErroDeNegocio extends Error {
  readonly status: number;

  constructor(mensagem: string, status: number) {
    super(mensagem);
    this.status = status;
    this.name = new.target.name; // o nome da classe filha aparece no erro
  }
}

export class DadosInvalidosErro extends ErroDeNegocio {
  constructor(mensagem: string) {
    super(mensagem, 400);
  }
}

export class NaoEncontradoErro extends ErroDeNegocio {
  constructor(mensagem: string) {
    super(mensagem, 404);
  }
}

export class PoltronaOcupadaErro extends ErroDeNegocio {
  constructor(mensagem: string) {
    super(mensagem, 409);
  }
}

export class PagamentoErro extends ErroDeNegocio {
  constructor(mensagem: string) {
    super(mensagem, 502);
  }
}

// ------------------------------------------------------------------ evento

export class Evento {
  readonly id: number;
  readonly nome: string;
  readonly preco: number;
  readonly capacidade: number;

  // Privado: de fora não dá para ler nem mudar a lista, só pelos métodos.
  #vendidas: number[] = [];

  constructor(id: number, nome: string, preco: number, capacidade: number) {
    this.id = id;
    this.nome = nome;
    this.preco = preco;
    this.capacidade = capacidade;
  }

  // Só leitura: não existe "set disponivel", então ninguém consegue mudar.
  get disponivel(): number {
    return this.capacidade - this.#vendidas.length;
  }

  // Tudo ou nada: primeiro confere TODAS as poltronas; só depois marca.
  // Se qualquer conferência lançar erro, nenhuma poltrona foi marcada.
  // É síncrono (sem await): nenhum outro pedido entra entre conferir e marcar.
  reservar(poltronas: number[]): void {
    if (!Array.isArray(poltronas) || poltronas.length === 0) {
      throw new DadosInvalidosErro("o pedido não tem poltronas");
    }

    for (const p of poltronas) {
      if (!Number.isInteger(p) || p < 1 || p > this.capacidade) {
        throw new DadosInvalidosErro(`a poltrona ${p} não existe`);
      }
    }

    if (new Set(poltronas).size !== poltronas.length) {
      throw new DadosInvalidosErro("a mesma poltrona aparece duas vezes no pedido");
    }

    const ocupada = poltronas.find((p) => this.#vendidas.includes(p));
    if (ocupada !== undefined) {
      throw new PoltronaOcupadaErro(`a poltrona ${ocupada} já foi vendida`);
    }

    // Chegou aqui: todas são válidas e livres. Agora sim, marca.
    this.#vendidas.push(...poltronas);
  }

  // Devolve as poltronas para a venda (usado quando o pagamento falha).
  liberar(poltronas: number[]): void {
    const naoVendida = poltronas.find((p) => !this.#vendidas.includes(p));
    if (naoVendida !== undefined) {
      throw new DadosInvalidosErro(`a poltrona ${naoVendida} não estava vendida`);
    }
    this.#vendidas = this.#vendidas.filter((p) => !poltronas.includes(p));
  }

  info(): EventoInfo {
    return {
      id: this.id,
      nome: this.nome,
      preco: this.preco,
      capacidade: this.capacidade,
      disponivel: this.disponivel,
    };
  }
}
