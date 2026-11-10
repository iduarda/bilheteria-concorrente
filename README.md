# Bilheteria Concorrente

Projeto final da disciplina **Paradigmas de Linguagens de Programação** (A2).

Serviço HTTP de venda de ingressos que aguenta centenas de pedidos ao mesmo tempo para os mesmos lugares, cobrando cada um numa operadora de pagamento que demora, às vezes falha e às vezes trava. O serviço precisa garantir que:

- não vende mais ingressos que a lotação;
- não cobra quem não levou o ingresso;
- um pedido não fica esperando o pagamento de outro;
- nenhum pedido fica preso para sempre numa operadora travada.

## Integrantes

| Nome | GitHub | Parte |
| --- | --- | --- |
| Maria Eduarda Zumbé | [@iduarda](https://github.com/iduarda) | `dominio.ts` (OO), `servidor.ts` e `main.ts` |
| _(nome)_ | _(@usuario)_ | `preco.ts` (Funcional), README e Dockerfile |
| _(nome)_ | _(@usuario)_ | `bilheteria.ts` (Concorrente) |

## Cada paradigma no seu lugar

| Arquivo | Paradigma | O que faz |
| --- | --- | --- |
| `src/dominio.ts` | Orientado a objetos | O evento guarda os lugares e ninguém de fora altera |
| `src/preco.ts` | Funcional | Preço e taxa de 10% com fábricas, `map` e `reduce` |
| `src/bilheteria.ts` | Concorrente | Venda sem estourar a lotação, com tempo limite e retentativa |
| `src/servidor.ts`, `src/main.ts` | — | Serviço HTTP com Express |

## Estado atual

| Arquivo | Situação |
| --- | --- |
| `src/dominio.ts` | Pronto (pode mudar para bater com os testes do professor) |
| `src/servidor.ts` | Rascunho pronto, rotas `/evento` e `/comprar` |
| `src/main.ts` | Pronto, usando a venda provisória |
| `src/venda-provisoria.ts` | Temporário, será substituído pelo `bilheteria.ts` |
| `src/teste-dominio.ts` | Teste manual do domínio |
| `src/preco.ts` | A fazer |
| `src/bilheteria.ts` | A fazer |
| `Dockerfile` | A fazer |

Ainda faltam os arquivos que o professor vai enviar: a operadora de pagamento falsa, o bench, os testes e o `GUIA.md`. Quando chegarem, os nomes de classes, funções e rotas devem ser ajustados para o que os testes esperam.

## Como rodar

Requisitos: [Node.js](https://nodejs.org/) e Git.

```bash
git clone https://github.com/iduarda/bilheteria-concorrente.git
cd bilheteria-concorrente
npm install
```

| Comando | O que faz |
| --- | --- |
| `npm start` | Sobe o serviço em `http://localhost:3000` |
| `npx tsx src/teste-dominio.ts` | Roda o teste manual do domínio |
| `npm test` | Testes do professor _(quando chegarem)_ |
| `npm run bench` | Carga de pedidos _(quando chegar)_ |

### Rotas

| Método | Rota | Corpo | Resposta |
| --- | --- | --- | --- |
| GET | `/evento` | — | Lotação, reservados, vendidos e disponíveis |
| POST | `/comprar` | `{ "quantidade": 2 }` | 201 pago, 409 não comprou, 400 quantidade inválida |

Testando a compra no PowerShell (com o servidor rodando em outro terminal):

```powershell
Invoke-RestMethod -Method Post -Uri http://localhost:3000/comprar -ContentType "application/json" -Body '{"quantidade":2}'
```

### Docker

_(a completar)_

## Como o código está organizado

### `dominio.ts` — Orientado a objetos

- **`Evento`** guarda lotação, reservados e vendidos em campos privados (`#`). De fora só dá para **ler** pelos getters; para **alterar**, só pelos métodos:
  - `reservar(qtd)`: segura lugares e retorna `true` ou `false`;
  - `confirmar(qtd)`: pagamento aprovado, o reservado vira vendido;
  - `liberar(qtd)`: pagamento falhou ou travou, o lugar volta a ficar disponível.
- **`reservar` é síncrono de propósito.** Checar e decrementar acontecem sem `await` no meio. Como o Node roda o JavaScript numa thread só, nenhum outro pedido entra entre as duas coisas, e a lotação nunca estoura.
- **`Pedido`** tem status `pendente`, `pago` ou `falhou`, e só sai de `pendente` uma vez.

### `servidor.ts` e `main.ts` — HTTP

- O `servidor.ts` só cuida de HTTP: valida a entrada, chama a venda e responde. A regra de negócio fica no domínio e na bilheteria.
- A função de venda chega **de fora**, pelo tipo `Vender`:

  ```ts
  type Vender = (evento: Evento, quantidade: number) => Promise<Pedido>;
  ```

  Para usar o `bilheteria.ts`, basta trocar o import e o argumento no `main.ts`, sem mexer no servidor.

### Fluxo de uma venda

1. **Reservar** o lugar no `Evento` (síncrono). Sem lugar, o pedido falha e ninguém é cobrado.
2. **Cobrar** na operadora, com tempo limite e retentativa.
3. **Confirmar** se o pagamento foi aprovado, ou **liberar** o lugar se falhou ou estourou o tempo.

Cada pedido roda na sua própria `Promise`, sem trava global em volta do pagamento, para nenhum pedido esperar o de outro.

### `preco.ts` — Funcional _(a fazer)_

Fábricas no estilo do `criarMultiplicador` (por exemplo, `criarMultiplicador(1.10)` para a taxa de 10%) e funções puras com `map` e `reduce`.

### `bilheteria.ts` — Concorrente _(a fazer)_

Implementa a função `Vender`, seguindo o mesmo fluxo do `venda-provisoria.ts` e acrescentando tempo limite (`Promise.race`) e retentativa.

## Como contribuir

1. Antes de começar, atualize: `git pull`
2. Confira se o git está com **a sua** conta: `git config user.email`
3. Faça commits pequenos e frequentes com a sua conta (sem commit, a nota do vídeo fica 0):

   ```bash
   git add .
   git commit -m "descrição do que mudou"
   git push
   ```

4. Não suba a `node_modules` (ela já está no `.gitignore`).
