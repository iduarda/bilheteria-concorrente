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
| Maria Eduarda Zumbé | [iduarda](https://github.com/iduarda) | `dominio.ts` (OO), `regras.ts` e `main.ts` |
| | | |
| | | |

### Decisões

1. **Concorrência.** Como vocês garantem que duas pessoas não ficam com a mesma poltrona? Onde estava o
   `await` perigoso?
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
4. **Se fosse em outro paradigma.** Escolham uma das partes e expliquem como ficaria em outro
   paradigma, e se ficaria melhor ou pior.
5. **Concorrente × paralelo.** O Node roda o JavaScript numa linha só: os pedidos de vocês são
   concorrentes, não paralelos. O que mudaria se a venda rodasse em vários núcleos ao mesmo tempo?

### Resultados do bench

| Cenário | Pedidos | Tempo (ms) | Vendidos | Poltrona ocupada | Falha de pagamento |
| :--- | ---: | ---: | ---: | ---: | ---: |
| Padrão (`main.ts`) | 200 | | | | |

O bench ocupa as poltronas do evento 1: para rodar de novo, parem o `npm start` (Ctrl+C) e subam outra
vez.

O que os números mostram:
