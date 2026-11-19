// bilheteria.ts — Paradigma CONCORRENTE
// A venda acontece em três passos: reservar as poltronas, cobrar e, se o
// pagamento falhar ou estourar o tempo, devolver as poltronas para a venda.
// O pedido NÃO fica preso esperando o pagamento de outro: cada reserva roda
// na sua própria Promise, sem trava global.
import { DadosInvalidosErro, Evento, NaoEncontradoErro, PagamentoErro } from "./dominio.ts";
import { direitoAMeia } from "./regras.ts";
import { calcularTotal, montarIngressos } from "./preco.ts";
import type { Pagamento } from "./pagamento.ts";
import type { Comprovante, ConfigBilheteriaComRetentativa, EventoInfo, Pedido } from "./tipos.ts";

const esperar = (ms: number): Promise<void> =>
  new Promise((resolver) => setTimeout(resolver, ms));

// Corre a Promise contra um relógio. Se a operadora demorar mais que `ms`,
// a venda desiste e o erro de timeout sobe para quem chamou.
function comTimeout<T>(promessa: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const limite = new Promise<never>((_, rejeitar) => {
    timer = setTimeout(() => rejeitar(new Error("tempo esgotado")), ms);
  });

  return Promise.race([promessa, limite]).finally(() => {
    if (timer !== undefined) clearTimeout(timer);
  });
}

// Roda a função até dar certo ou acabar o número de tentativas.
// O intervalo entre tentativas evita martelar a operadora sem parar.
async function comRetentativa<T>(
  fn: () => Promise<T>,
  tentativas: number,
  intervaloMs: number,
): Promise<T> {
  const limite = Math.max(1, tentativas);
  let ultimoErro: unknown;

  for (let tentativa = 1; tentativa <= limite; tentativa++) {
    try {
      return await fn();
    } catch (erro) {
      ultimoErro = erro;
      if (tentativa < limite && intervaloMs > 0) await esperar(intervaloMs);
    }
  }

  throw ultimoErro;
}

// Os campos são privados (#): ninguém de fora consegue trocar a operadora,
// os eventos ou o contador de reservaId.
export class Bilheteria {
  #eventos: Evento[];
  #pagar: Pagamento;
  #limitePagamentoMs: number;
  #tentativas: number;
  #intervaloEntreTentativasMs: number;
  #proximoReservaId = 1;

  constructor(config: ConfigBilheteriaComRetentativa) {
    this.#eventos = config.eventos;
    this.#pagar = config.pagar;
    this.#limitePagamentoMs = config.limitePagamentoMs;
    // Padrão 1: neste projeto cada pedido é cobrado uma única vez. Retentar uma
    // recusa ou um timeout poderia cobrar duas vezes quem não levou o ingresso.
    this.#tentativas = config.tentativas ?? 1;
    this.#intervaloEntreTentativasMs = config.intervaloEntreTentativasMs ?? 0;
  }

  #eventoPorId(id: number): Evento {
    const evento = this.#eventos.find((e) => e.id === id);
    if (!evento) throw new NaoEncontradoErro(`evento ${id} não existe`);
    return evento;
  }

  #cobrar(valor: number): Promise<void> {
    return comRetentativa(
      () => comTimeout(this.#pagar(valor), this.#limitePagamentoMs),
      this.#tentativas,
      this.#intervaloEntreTentativasMs,
    );
  }

  async reservar(pedido: Pedido): Promise<Comprovante> {
    // 1. Conferir o pedido antes de procurar o evento ou cobrar.
    const ingressos = pedido?.ingressos;
    if (!Array.isArray(ingressos) || ingressos.length === 0) {
      throw new DadosInvalidosErro("o pedido não tem ingressos");
    }

    const evento = this.#eventoPorId(pedido.eventoId);

    // 2. SEÇÃO CRÍTICA: síncrona e sem await no meio. Conferir e marcar as
    // poltronas acontece numa tacada só; o event loop não interrompe aqui.
    // É isso que impede duas pessoas de ficarem com a mesma poltrona.
    const poltronas = ingressos.map((pessoa) => pessoa.poltrona);
    evento.reservar(poltronas);

    // 3. Só depois de garantir as poltronas é que o preço é montado.
    const ingressosMontados = montarIngressos(evento.preco, ingressos, direitoAMeia);
    const total = calcularTotal(ingressosMontados);

    try {
      // 4. Único await do fluxo: o pagamento. Cada pedido tem o seu, então um
      // pedido lento não segura os outros.
      await this.#cobrar(total);
    } catch (erro) {
      // Falhou ou estourou o tempo: devolve as poltronas antes de avisar.
      // Assim ninguém paga sem levar e ninguém perde o lugar por engano.
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

  // info() devolve um objeto simples (com o getter disponivel já resolvido);
  // devolver a instância de Evento perderia o disponivel no JSON.
  listarEventos(): EventoInfo[] {
    return this.#eventos.map((evento) => evento.info());
  }
}

export function criarBilheteria(config: ConfigBilheteriaComRetentativa): Bilheteria {
  return new Bilheteria(config);
}
