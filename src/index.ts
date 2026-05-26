// ─────────────────────────────────────────────────────────────────────────────
//  Mini Banco de Dados Sequencial
//  Ponto de entrada principal
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
//  Mini Banco de Dados Sequencial
//  Ponto de entrada principal
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
//  Mini Banco de Dados Sequencial
//  Ponto de entrada principal
// ─────────────────────────────────────────────────────────────────────────────

import * as fs from 'fs';
import { gerarRegistro } from './generator';
import { gravarLote, totalRegistros } from './arquivo';
import { construirIndice, quickSort } from './indice';
// import { buscaExata, buscaParcial } from './busca';

const CAMINHO_ARQUIVO = 'dados.bin';
const N = 10000;
const LOTE = 1000;
const RESET_ARQUIVO = false;

function resetArquivo(caminho: string): void {
  if (fs.existsSync(caminho)) {
    fs.unlinkSync(caminho);
  }
}

async function main() {
  if (RESET_ARQUIVO) {
    resetArquivo(CAMINHO_ARQUIVO);
  }

  if (totalRegistros(CAMINHO_ARQUIVO) === 0) {
    const lote: { nome: string; endereco: string }[] = [];

    for (let i = 0; i < N; i++) {
      lote.push(gerarRegistro());
      if (lote.length === LOTE) {
        gravarLote(CAMINHO_ARQUIVO, lote);
        lote.length = 0;
      }
    }

    if (lote.length > 0) {
      gravarLote(CAMINHO_ARQUIVO, lote);
    }
  }

  const indice = construirIndice(CAMINHO_ARQUIVO);
  quickSort(indice, 0, indice.length - 1);

  console.log('Total:', indice.length);
  console.log(indice.slice(0, 5).map(e => `${e.nome} | ${e.endereco}`));

  // Parte 3: chamadas de busca
  // const offset = buscaExata(indice, 'Maria Silva');
  // const resultados = buscaParcial(indice, 'Mar');
}

main().catch(console.error);

// // TODO: ETAPA 1 → gerar e gravar 10.000.000 de registros no arquivo
// // TODO: ETAPA 2 → construir e ordenar o índice com Quick Sort
// // TODO: ETAPA 3 → demonstrar busca rápida pelo índice