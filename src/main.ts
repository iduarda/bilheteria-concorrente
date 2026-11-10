// main.ts — Ponto de entrada: cria o evento e sobe o servidor
import { Evento } from "./dominio";
import { criarServidor } from "./servidor";
// PROVISÓRIO: trocar pela função do bilheteria.ts quando a Pessoa 3 terminar
import { venderProvisorio } from "./venda-provisoria";

const evento = new Evento("show-1", "Show de Abertura", 100, 150);
const app = criarServidor(evento, venderProvisorio);

const PORTA = Number(process.env.PORT) || 3000;
app.listen(PORTA, () => {
  console.log(`Bilheteria rodando em http://localhost:${PORTA}`);
});
