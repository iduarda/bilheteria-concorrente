// dominio.ts — Orientação a objetos: erros de negócio e Evento.
import type { EventoInfo } from "./tipos.ts";

export abstract class ErroDeNegocio extends Error {
  readonly status: number;

  constructor(mensagem: string, status: number) {
    super(mensagem);
    this.status = status;
    this.name = new.target.name;
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

export class Evento {
  readonly id: number;
  readonly nome: string;
  readonly preco: number;
  readonly capacidade: number;

  // Privado: fora da classe só se lê disponivel.
  #vendidas: number[] = [];

  constructor(id: number, nome: string, preco: number, capacidade: number) {
    this.id = id;
    this.nome = nome;
    this.preco = preco;
    this.capacidade = capacidade;
  }

  get disponivel(): number {
    return this.capacidade - this.#vendidas.length;
  }

  // Tudo ou nada: valida todas antes de marcar.
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

    this.#vendidas.push(...poltronas);
  }

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
