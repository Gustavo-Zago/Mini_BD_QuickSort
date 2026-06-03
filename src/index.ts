// index.ts

import * as fs from 'fs';
import { gerarRegistro } from './generator';
import { gravarLote, totalRegistros } from './arquivo';
import { construirIndice, quickSort, salvarIndiceOrdenado, carregarIndiceOrdenado, comparaPorNome, comparaPorEndereco } from './indice';
import { buscaExata, buscaParcial } from './busca';

const CAMINHO_ARQUIVO = 'dados.bin';
const CAMINHO_INDICE_NOMES = 'indice_nomes.bin';
const CAMINHO_INDICE_ENDERECOS = 'indice_enderecos.bin';
const N = 10000000; // 10 milhões conforme enunciado
const LOTE = 10000;
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

  // 1. GERAÇÃO DE DADOS NO DISCO
  if (totalRegistros(CAMINHO_ARQUIVO) === 0) {
    console.log(`Gerando ${N} registos... Isto irá demorar bastante, tenha paciência!`);
    const lote: { nome: string; endereco: string }[] = [];

    for (let i = 0; i < N; i++) {
      lote.push(gerarRegistro());
      
      if (lote.length === LOTE) {
        gravarLote(CAMINHO_ARQUIVO, lote);
        lote.length = 0;
        
        // Log de progresso a cada 100.000 registos para não achar que travou
        if ((i + 1) % 100000 === 0) {
            console.log(`Progresso: ${i + 1} de ${N} registos gravados...`);
        }
      }
    }

    if (lote.length > 0) {
      gravarLote(CAMINHO_ARQUIVO, lote);
    }
  }

  // 2. CONSTRUÇÃO E ORDENAÇÃO DOS ÍNDICES
  console.log('A ler o disco e a construir o índice base...');
  const indiceBase = construirIndice(CAMINHO_ARQUIVO);

  const mapa = new Map<number, import('./indice').EntradaIndice>();
  for (const entrada of indiceBase) {
    mapa.set(entrada.offset, entrada);
  }

  console.log('A preparar o Índice de NOMES...');
  let indiceNome = carregarIndiceOrdenado(CAMINHO_INDICE_NOMES, mapa, indiceBase.length);
  if (indiceNome) {
    console.log('Índice de NOMES carregado do disco (ordenação ignorada).');
  } else {
    console.log('Ordenando o Índice de NOMES com Quick Sort...');
    indiceNome = [...indiceBase];
    quickSort(indiceNome, 0, indiceNome.length - 1, comparaPorNome);
    salvarIndiceOrdenado(CAMINHO_INDICE_NOMES, indiceNome);
    console.log('Índice de NOMES salvo em disco.');
  }

  console.log('A preparar o Índice de ENDEREÇOS...');
  let indiceEndereco = carregarIndiceOrdenado(CAMINHO_INDICE_ENDERECOS, mapa, indiceBase.length);
  if (indiceEndereco) {
    console.log('Índice de ENDEREÇOS carregado do disco (ordenação ignorada).');
  } else {
    console.log('Ordenando o Índice de ENDEREÇOS com Quick Sort...');
    indiceEndereco = [...indiceBase];
    quickSort(indiceEndereco, 0, indiceEndereco.length - 1, comparaPorEndereco);
    salvarIndiceOrdenado(CAMINHO_INDICE_ENDERECOS, indiceEndereco);
    console.log('Índice de ENDEREÇOS salvo em disco.');
  }

  console.log(`Concluído! Índices em memória com ${indiceNome.length} entradas.`);

  // 3. DEMONSTRAÇÃO DE BUSCA PARA O EXERCÍCIO
  console.log('\n--- Demonstração de Buscas Rápidas ---');
  
  // Buscar no índice de Nomes
  const resultadoNomes = buscaParcial(indiceNome, 'Maria', 'nome');
  console.log(`\nEncontradas ${resultadoNomes.length} pessoas chamadas Maria. Exemplo das 3 primeiras:`);
  console.log(resultadoNomes.slice(0, 3));

  // Buscar no índice de Endereços
// Buscar no índice de Endereços
  const resultadoRuas = buscaParcial(indiceEndereco, 'Carvalho', 'endereco');
  console.log(`\nEncontradas ${resultadoRuas.length} pessoas morando em endereços que começam com Carvalho. Exemplo das 3 primeiras:`);
  console.log(resultadoRuas.slice(0, 3));
}

main().catch(console.error);