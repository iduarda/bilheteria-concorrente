// dominio.ts — Paradigma ORIENTADO A OBJETOS
// O evento guarda os lugares e ninguém de fora altera:
// o estado fica em campos privados (#) e só muda pelos métodos da classe.

export type StatusPedido = "pendente" | "pago" | "falhou";

export class Evento {
  readonly #id: string;
  readonly #nome: string;
  readonly #lotacao: number;
  readonly #preco: number;

  #reservados = 0; // lugares segurados enquanto o pagamento acontece
  #vendidos = 0;   // lugares com pagamento confirmado

  constructor(id: string, nome: string, lotacao: number, preco: number) {
    if (!Number.isInteger(lotacao) || lotacao <= 0) {
      throw new Error("A lotação deve ser um inteiro positivo");
    }
    if (preco < 0) {
      throw new Error("O preço não pode ser negativo");
    }
    this.#id = id;
    this.#nome = nome;
    this.#lotacao = lotacao;
    this.#preco = preco;
  }

  // ---------- leitura (getters): de fora só dá para LER ----------
  get id(): string { return this.#id; }
  get nome(): string { return this.#nome; }
  get lotacao(): number { return this.#lotacao; }
  get preco(): number { return this.#preco; }
  get reservados(): number { return this.#reservados; }
  get vendidos(): number { return this.#vendidos; }
  get disponiveis(): number {
    return this.#lotacao - this.#reservados - this.#vendidos;
  }

  // ---------- alteração: só por estes métodos ----------

  /**
   * Tenta segurar `qtd` lugares. Retorna true se conseguiu.
   * É SÍNCRONO de propósito: checar e decrementar acontecem juntos,
   * sem nenhum await no meio. Como o Node roda o JavaScript numa thread só,
   * nenhum outro pedido consegue "entrar" entre a checagem e a reserva,
   * e por isso nunca se vende mais que a lotação.
   */
  reservar(qtd: number = 1): boolean {
    this.#validarQuantidade(qtd);
    if (qtd > this.disponiveis) return false;
    this.#reservados += qtd;
    return true;
  }

  /** Pagamento aprovado: o lugar reservado vira vendido. */
  confirmar(qtd: number = 1): void {
    this.#validarQuantidade(qtd);
    if (qtd > this.#reservados) {
      throw new Error("Não há reservas suficientes para confirmar");
    }
    this.#reservados -= qtd;
    this.#vendidos += qtd;
  }

  /** Pagamento falhou ou estourou o tempo: devolve o lugar. */
  liberar(qtd: number = 1): void {
    this.#validarQuantidade(qtd);
    if (qtd > this.#reservados) {
      throw new Error("Não há reservas suficientes para liberar");
    }
    this.#reservados -= qtd;
  }

  /** Visão do evento para devolver na API (cópia, não o objeto interno). */
  toJSON() {
    return {
      id: this.#id,
      nome: this.#nome,
      lotacao: this.#lotacao,
      preco: this.#preco,
      reservados: this.#reservados,
      vendidos: this.#vendidos,
      disponiveis: this.disponiveis,
    };
  }

  #validarQuantidade(qtd: number): void {
    if (!Number.isInteger(qtd) || qtd <= 0) {
      throw new Error("A quantidade deve ser um inteiro positivo");
    }
  }
}

export class Pedido {
  readonly #id: string;
  readonly #eventoId: string;
  readonly #quantidade: number;
  readonly #criadoEm: Date;
  #status: StatusPedido = "pendente";

  constructor(id: string, eventoId: string, quantidade: number) {
    if (!Number.isInteger(quantidade) || quantidade <= 0) {
      throw new Error("A quantidade deve ser um inteiro positivo");
    }
    this.#id = id;
    this.#eventoId = eventoId;
    this.#quantidade = quantidade;
    this.#criadoEm = new Date();
  }

  get id(): string { return this.#id; }
  get eventoId(): string { return this.#eventoId; }
  get quantidade(): number { return this.#quantidade; }
  get criadoEm(): Date { return this.#criadoEm; }
  get status(): StatusPedido { return this.#status; }

  // Um pedido só sai de "pendente" uma vez: não volta nem troca de final.
  marcarPago(): void { this.#mudarStatus("pago"); }
  marcarFalhou(): void { this.#mudarStatus("falhou"); }

  toJSON() {
    return {
      id: this.#id,
      eventoId: this.#eventoId,
      quantidade: this.#quantidade,
      status: this.#status,
      criadoEm: this.#criadoEm.toISOString(),
    };
  }

  #mudarStatus(novo: StatusPedido): void {
    if (this.#status !== "pendente") {
      throw new Error(`Pedido ${this.#id} já está ${this.#status}`);
    }
    this.#status = novo;
  }
}
