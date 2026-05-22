# Mini Banco Sequencial - Instrucoes de Projeto

Use este arquivo como base para orientar futuros chats e implementacoes.

## Resumo do desafio

- Armazenar registros em arquivo sequencial com campos fixos: nome (100 bytes) e endereco (200 bytes).
- Construir indice em memoria com entradas {chave, offset} e ordenar por quicksort.
- Fazer busca rapida usando o indice ordenado (exata e por prefixo).
- Demonstrar funcionamento com base em 10.000.000 registros (pode rodar com menos na pratica, mas a logica deve suportar 10M).

## Decisoes atuais

- Formato do arquivo: binario de tamanho fixo (300 bytes por registro).
- O arquivo nao e reordenado; o indice e que fica ordenado.
- CLI simples para gerar, indexar e buscar.

## Divisao sugerida do trio

- Parte 1: I/O do arquivo sequencial (gravar, ler, total, lote).
- Parte 2 (usuario): indice + quicksort.
- Parte 3: busca binaria e busca por prefixo usando o indice.

## Plano resumido

1. Alinhar estrutura do projeto (root vs src) e imports.
2. Implementar gravacao/leitura sequencial por offset.
3. Construir indice lendo o arquivo sequencialmente.
4. Ordenar indice com quicksort (comparacao case-insensitive).
5. Implementar buscas usando o indice ordenado.
6. Integrar tudo em um menu CLI.
7. Demonstrar com N menor e documentar que a logica suporta 10M.

## Instrucoes para futuros chats

- Usar este arquivo como base do contexto.
- Confirmar com o usuario qual parte ele esta implementando no momento.
- Manter o foco em explicar conceitos (arquivo sequencial, indice, quicksort, busca binaria) enquanto guia a implementacao.
- Evitar mudancas de escopo sem alinhamento com o trio.
- Se houver duvida sobre estrutura do projeto, priorizar decidir entre mover arquivos para src ou ajustar tsconfig e scripts.
