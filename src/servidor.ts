// servidor.ts — O serviço HTTP com Express
// Só cuida de HTTP: recebe o pedido, chama a venda e devolve a resposta.
// A regra de negócio fica no dominio.ts (OO) e no bilheteria.ts (concorrente).
import express from "express";
import { Evento, Pedido } from "./dominio";

// "Contrato" da função de venda. Quem implementa de verdade é o bilheteria.ts
// (Pessoa 3). Enquanto ele não existe, o main.ts usa a venda provisória.
export type Vender = (evento: Evento, quantidade: number) => Promise<Pedido>;

export function criarServidor(evento: Evento, vender: Vender) {
  const app = express();
  app.use(express.json());

  // Consulta o evento: lotação, vendidos, reservados e disponíveis
  app.get("/evento", (_req, res) => {
    res.json(evento);
  });

  // Compra: corpo { "quantidade": 2 } (se não vier, compra 1)
  app.post("/comprar", async (req, res) => {
    const quantidade = Number(req.body?.quantidade ?? 1);

    if (!Number.isInteger(quantidade) || quantidade <= 0) {
      res.status(400).json({ erro: "quantidade deve ser um inteiro positivo" });
      return;
    }

    try {
      const pedido = await vender(evento, quantidade);
      if (pedido.status === "pago") {
        res.status(201).json(pedido);
      } else {
        res.status(409).json({ erro: "compra não realizada", pedido });
      }
    } catch (e) {
      res.status(500).json({ erro: (e as Error).message });
    }
  });

  return app;
}
