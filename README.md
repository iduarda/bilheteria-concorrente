# Bilheteria concorrente

Projeto final de Paradigmas de Linguagens de Programação. Enunciado completo no Blackboard.

Os arquivos de `src/` que vocês escrevem já existem, vazios; o `tipos.ts` e o `servidor.ts` vêm prontos. O que vai em cada um está no passo
indicado do enunciado:

| Arquivo | Passo do enunciado |
| :--- | :--- |
| `src/tipos.ts` (pronto) | 1: os tipos |
| `src/regras.ts` | 2: meia-entrada |
| `src/preco.ts` | 3: preço (funcional) |
| `src/dominio.ts` | 4: evento e erros (orientado a objetos) |
| `src/bilheteria.ts` | 5: a venda, onde a concorrência aparece |
| `src/servidor.ts` (pronto) e `src/main.ts` | 6: ligar o servidor |

Não alterem `src/pagamento.ts`, `src/servidor.ts`, `src/bench.ts` nem `testes/`: a correção usa os originais.

Para começar, sigam o `GUIA.md`. Depois dele, os comandos são:

```bash
npm install
npm test          # correção automática: mostra os pontos
npm start         # serviço em http://localhost:3000
npm run bench     # com o serviço no ar: 200 pedidos simultâneos no evento 1, dois por poltrona
```

Exemplo de pedido:

```bash
curl -X POST localhost:3000/reservas -H 'Content-Type: application/json' \
  -d '{"eventoId":1,"ingressos":[{"nome":"Ana","idade":20,"estudante":true,"pcd":false,"poltrona":7}]}'
```

---

## Preencham (avaliado no vídeo)

**Link do vídeo:** 

### Integrantes

| Nome | Usuário do GitHub | Parte principal |
| :--- | :--- | :--- |
| Maria Eduarda Zumbé | [iduarda](https://github.com/iduarda) | `dominio.ts` (OO), `regras.ts` e `main.ts` |
| Anna Maria Albino | [annamarialb](https://github.com/annamarialb)|  `preco.ts`(funcional) e `Dockerfile` |
| Milena Azevedo | [milenazevedo](https://github.com/milenazevedo) | `bilheteria.ts` (concorrente) |

### Decisões

1. **Concorrência.** Como vocês garantem que duas pessoas não ficam com a mesma poltrona? Onde estava o
   `await` perigoso?

   **Resposta.** A garantia está no `Evento.reservar`, que é síncrono: ele confere todas as poltronas e só
   depois marca, sem nenhum `await` entre a conferência e a marcação. O Node roda JavaScript numa thread só,
   então, enquanto esse método está executando, nenhuma outra continuação de Promise pode entrar. A
   verificação "a poltrona já foi vendida?" e o `#vendidas.push(...)` acontecem numa tacada só; é isso que
   torna a operação atômica do ponto de vista dos pedidos. Na `bilheteria.ts` a ordem é: achar o evento,
   chamar `evento.reservar(poltronas)` e só depois montar o preço e fazer `await` na cobrança.

   O `await` perigoso seria qualquer espera entre conferir e marcar — por exemplo, transformar a reserva em
   `async` e consultar algo antes de marcar, ou cobrar antes de reservar. Nesse caso, dois pedidos poderiam
   conferir a mesma poltrona livre, os dois passarem pela conferência e os dois marcarem, vendendo o mesmo
   lugar duas vezes (ou cobrando duas pessoas por uma poltrona só). Como a parte crítica não tem `await`,
   não precisamos de mutex nem de trava global: o único `await` fica no pagamento, depois que as poltronas
   já são do pedido. Cada venda roda na sua própria Promise, então um pagamento lento não segura os outros.
   No teste de 200 pedidos simultâneos para 50 poltronas saem exatamente 50 vendas, 150 `PoltronaOcupadaErro`
   e 50 cobranças aprovadas; no teste de 20 pedidos com operadora de 100 ms, tudo termina em cerca de 100 ms,
   e não em 2 s como aconteceria se as cobranças fossem uma de cada vez. Se o pagamento falha ou estoura o
   tempo, o `liberar` (também síncrono) devolve as poltronas, então ninguém paga sem levar ingresso.

2. **OO.** O que o `Evento` esconde e por quê? Por que o `reservar` é tudo ou nada? Por que os erros são uma hierarquia de classes?

   **Resposta.** O `Evento` esconde a lista de poltronas vendidas no campo privado `#vendidas`.
   De fora da classe só dá para ler quantas restam, pelo `get disponivel()`, que não tem `set`.
   Para mudar as poltronas é obrigatório passar pelos métodos `reservar` e `liberar`, que conferem
   as regras antes de alterar. Assim nenhuma parte do sistema consegue, por engano, marcar uma
   poltrona inexistente ou vender a mesma poltrona duas vezes.

   O `reservar` é tudo ou nada porque um pedido é de uma família que compra junta: se uma das
   poltronas já foi vendida, não faz sentido vender só as outras. Por isso ele confere todas as
   poltronas primeiro (se existem, se não se repetem, se estão livres) e só depois marca. Se der
   erro, nada foi alterado, e a bilheteria não precisa desfazer uma reserva pela metade.

   Os erros são uma hierarquia porque todos são erros de negócio com algo em comum: o status HTTP.
   A classe abstrata `ErroDeNegocio` define o campo `status`, e cada filha só informa o seu (400,
   404, 409 ou 502). Assim o `servidor.ts` trata todos de uma vez, com um único
   `erro instanceof ErroDeNegocio` e `res.status(erro.status)`, sem um `if` para cada tipo. Para
   criar um erro novo, basta outra classe filha, sem mexer no servidor.
   
3. **Funcional.** O que ganhamos com `preco.ts` puro? Como vocês testariam ele sem subir o servidor?
   
   **Resposta.** Como o preco.ts só tem funções puras, o mesmo dado de entrada sempre dá o mesmo resultado. Nenhuma função altera a lista recebida: o map e o reduce criam valores novos. Por isso não existe estado escondido nem efeito colateral que dependa da ordem dos pedidos concorrentes. Para testar sem subir o servidor, basta importar as funções e chamar direto, por exemplo aplicarTaxa(0.1)(100) tem que dar 110. A regra da meia também vem por parâmetro no montarIngressos, então dá para testar com qualquer regra.
   
5. **Se fosse em outro paradigma.** Escolham uma das partes e expliquem como ficaria em outro
   paradigma, e se ficaria melhor ou pior.

   **Resposta.** Escolhemos o `Evento`, hoje orientado a objetos, e imaginamos ele funcional. Em vez
   de uma classe com o campo privado `#vendidas`, teríamos só dados imutáveis (`EventoInfo` mais uma
   lista de poltronas vendidas) e funções que recebem esse estado e devolvem um **estado novo**:
   `reservar(evento, vendidas, poltronas)` devolveria uma nova lista de vendidas, e `liberar` outra,
   sem mudar a lista recebida. O "tudo ou nada" continuaria fácil: a função confere todas as
   poltronas e só constrói a lista nova se passarem na conferência.

   O problema aparece na concorrência. Cada pedido receberia uma cópia do estado; se dois pedidos
   lessem a mesma lista antes de um deles publicar a nova, os dois marcariam a mesma poltrona.
   Seria preciso passar o estado atualizado numa fila/redutor único, ou usar versão com
   compare-and-swap, para que só uma atualização vingasse. No Node de uma thread, a classe atual é
   melhor aqui: o `#vendidas` esconde o estado e o `reservar` síncrono já é atômico, sem coordenação
   extra. O lado funcional ganharia em teste (funções puras, sem estado escondido) e perderia em
   simplicidade de integração com a operadora assíncrona. Conclusão: para o `preco.ts`, funcional é
   claramente melhor; para o `Evento`, a versão orientada a objetos ficou melhor neste projeto,
   justamente por causa da venda concorrente.

6. **Concorrente × paralelo.** O Node roda o JavaScript numa linha só: os pedidos de vocês são
   concorrentes, não paralelos. O que mudaria se a venda rodasse em vários núcleos ao mesmo tempo?

   **Resposta.** Concorrente é vários pedidos progredindo no mesmo intervalo de tempo, intercalados
   pelo event loop; paralelo é vários pedidos executando ao mesmo tempo em núcleos diferentes. Hoje
   há uma thread: quando um pedido chega no `await pagar`, o Node suspende esse pedido e atende os
   outros, mas só um trecho de JavaScript roda por vez. Por isso o `evento.reservar` síncrono é
   atômico e não precisamos de trava.

   Com vários núcleos (cluster, worker_threads ou várias instâncias atrás de um balanceador), cada
   núcleo teria a sua própria memória e a sua própria cópia de `#vendidas`. Dois núcleos poderiam
   conferir a mesma poltrona como livre ao mesmo tempo e os dois vender. O campo privado deixaria
   de proteger: ele é privado dentro do processo, não entre processos. Para manter as regras, seria
   preciso estado compartilhado com operação atômica — por exemplo uma transação no banco com chave
   única `(eventoId, poltrona)`, um `SETNX` no Redis, controle de versão com compare-and-swap, ou
   dividir as poltronas entre núcleos. A devolução quando o pagamento falha também teria que ser
   vista por todos os núcleos, senão uma poltrona liberada num processo continuaria ocupada noutro.
   O tempo limite continua útil, mas o rollback passa a ser distribuído. Ou seja: ganharíamos
   paralelismo de verdade, mas perderíamos a simplicidade — a correção atual depende justamente de
   o JavaScript ser single-thread.

### Resultados do bench

| Cenário | Pedidos | Tempo (ms) | Vendidos | Poltrona ocupada | Falha de pagamento |
| :--- | ---: | ---: | ---: | ---: | ---: |
| Padrão (`main.ts`) | 200 | 147 | 91 | 100 | 9 |

O bench ocupa as poltronas do evento 1: para rodar de novo, parem o `npm start` (Ctrl+C) e subam outra
vez.

O que os números mostram: os 200 pedidos foram disparados ao mesmo tempo, mas só 100 conseguiram
reservar uma poltrona (91 pagaram e 9 tiveram o pagamento recusado); os outros 100 receberam 409, sem
ninguém ficar com a mesma poltrona. As 9 falhas devolveram as poltronas, por isso o evento terminou com
9 disponíveis. O tempo de 147 ms para 200 pedidos mostra que as cobranças rodaram juntas: se fossem uma
de cada vez, só as 100 reservas já levariam uns 8 s (100 × 80 ms da operadora falsa). A taxa de falha é
aleatória (10%), então os números variam um pouco a cada execução.
