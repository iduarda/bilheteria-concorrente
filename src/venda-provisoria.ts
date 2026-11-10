// venda-provisoria.ts — PROVISÓRIO, só para testar o servidor agora.
// Será substituído pelo bilheteria.ts (Pessoa 3), que terá tempo limite
// e retentativa, e pela operadora de pagamento falsa do professor.
import { randomUUID } from "node:crypto";
import { Evento, Pedido } from "./dominio";

// Simula uma operadora que demora até 500 ms e falha 20% das vezes
function pagarFalso(): Promise<void> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (Math.random() < 0.2) reject(new Error("pagamento recusado"));
      else resolve();
    }, Math.random() * 500);
  });
}

export async function venderProvisorio(evento: Evento, quantidade: number): Promise<Pedido> {
  const pedido = new Pedido(randomUUID(), evento.id, quantidade);

  // 1. Reserva (síncrona: não estoura a lotação)
  if (!evento.reservar(quantidade)) {
    pedido.marcarFalhou(); // esgotado
    return pedido;
  }

  // 2. Cobra; 3. confirma ou devolve o lugar
  try {
    await pagarFalso();
    evento.confirmar(quantidade);
    pedido.marcarPago();
  } catch {
    evento.liberar(quantidade);
    pedido.marcarFalhou();
  }
  return pedido;
}
