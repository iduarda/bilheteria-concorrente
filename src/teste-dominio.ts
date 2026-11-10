// Teste rápido e manual do dominio.ts (não substitui os testes do professor)
// Rodar com: npx tsx src/teste-dominio.ts
import { Evento, Pedido } from "./dominio";

const show = new Evento("show-1", "Show de Teste", 3, 100);

console.log("Reservou 2?", show.reservar(2));   // true
console.log("Reservou 2 de novo?", show.reservar(2)); // false (só sobrou 1)
show.confirmar(1);  // 1 pagamento aprovado
show.liberar(1);    // 1 pagamento falhou
console.log(show.toJSON()); // vendidos 1, reservados 0, disponiveis 2

const pedido = new Pedido("p-1", show.id, 1);
pedido.marcarPago();
console.log(pedido.toJSON());

try {
  pedido.marcarFalhou(); // deve dar erro: já está pago
} catch (e) {
  console.log("Erro esperado:", (e as Error).message);
}

// Tente descomentar a linha abaixo: o VS Code marca erro, porque
// #vendidos é privado e ninguém de fora da classe consegue alterar.
// show.#vendidos = 999;
