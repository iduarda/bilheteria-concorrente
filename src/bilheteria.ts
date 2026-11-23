// bilheteria.ts — Concorrência: a venda inteira sem trava global.
import { DadosInvalidosErro, Evento, NaoEncontradoErro, PagamentoErro } from "./dominio.ts";
import { direitoAMeia } from "./regras.ts";
import { calcularTotal, montarIngressos } from "./preco.ts";
import type { Pagamento } from "./pagamento.ts";
import type { Comprovante, ConfigBilheteria, EventoInfo, Pedido } from "./tipos.ts";

function comTempoLimite<T>(promessa: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const limite = new Promise<never>((_, rejeitar) => {
    timer = setTimeout(() => rejeitar(new Error("tempo esgotado")), ms);
  });
  // O finally desliga o relógio quando a cobrança termina antes.
  return Promise.race([promessa, limite]).finally(() => clearTimeout(timer));
}

// Campos privados (#): nada pode ser mudado por fora.
export class Bilheteria {
  #eventos: Evento[];
  #pagar: Pagamento;
  #limitePagamentoMs: number;
  #proximoReservaId = 1;

  constructor(config: ConfigBilheteria) {
    this.#eventos = config.eventos;
    this.#pagar = config.pagar;
    this.#limitePagamentoMs = config.limitePagamentoMs;
  }

  #eventoPorId(id: number): Evento {
    const evento = this.#eventos.find((e) => e.id === id);
    if (!evento) throw new NaoEncontradoErro(`evento ${id} não existe`);
    return evento;
  }

  async reservar(pedido: Pedido): Promise<Comprovante> {
    // 1. Conferir o pedido antes de cobrar.
    const ingressos = pedido?.ingressos;
    if (!Array.isArray(ingressos) || ingressos.length === 0) {
      throw new DadosInvalidosErro("o pedido não tem ingressos");
    }

    const evento = this.#eventoPorId(pedido.eventoId);

    // 2. Marcar as poltronas antes do await: conferir e marcar são síncronos.
    const poltronas = ingressos.map((pessoa) => pessoa.poltrona);
    evento.reservar(poltronas);

    // 3. Montar os ingressos e o total.
    const ingressosMontados = montarIngressos(evento.preco, ingressos, direitoAMeia);
    const total = calcularTotal(ingressosMontados);

    try {
      // 4. Único await: cada pedido espera o seu próprio pagamento.
      await comTempoLimite(this.#pagar(total), this.#limitePagamentoMs);
    } catch (erro) {
      // Falha ou timeout: devolve as poltronas antes de avisar.
      evento.liberar(poltronas);
      const motivo = erro instanceof Error ? erro.message : String(erro);
      throw new PagamentoErro(`pagamento não aprovado: ${motivo}`);
    }

    // 5. Um id diferente para cada compra.
    return {
      reservaId: this.#proximoReservaId++,
      eventoId: evento.id,
      ingressos: ingressosMontados,
      total,
    };
  }

  listarEventos(): EventoInfo[] {
    return this.#eventos.map((evento) => evento.info());
  }
}

export function criarBilheteria(config: ConfigBilheteria): Bilheteria {
  return new Bilheteria(config);
}
