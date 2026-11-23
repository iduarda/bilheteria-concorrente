// main.ts — Liga os eventos, a operadora e o servidor na porta 3000.
import { Evento } from "./dominio.ts";
import { criarPagamentoFalso } from "./pagamento.ts";
import { criarBilheteria } from "./bilheteria.ts";
import { criarServidor } from "./servidor.ts";

// O evento 1, com 100 poltronas, é o que o bench usa.
const eventos = [
  new Evento(1, "Show de Abertura", 150, 100),
  new Evento(2, "Festival de Verão", 220, 300),
  new Evento(3, "Stand-up Comedy", 80, 50),
];

const pagar = criarPagamentoFalso({ latenciaMs: 80, taxaDeFalha: 0.1 });

const bilheteria = criarBilheteria({ eventos, pagar, limitePagamentoMs: 500 });

criarServidor(bilheteria).listen(3000, () => {
  console.log("Bilheteria no ar em http://localhost:3000");
});
