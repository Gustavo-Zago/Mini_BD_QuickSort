// index.ts

import * as fs from 'fs';
import { gerarRegistro } from './generator';
import { gravarLote, totalRegistros } from './arquivo';
import {
  construirIndice,
  quickSort,
  salvarIndicesOrdenados,
  carregarIndicesOrdenados,
  comparaPorNome,
  comparaPorEndereco,
  estaOrdenado,
  percentualConcluido,
} from './indice';
import { buscaExata, buscaParcial } from './busca';

const CAMINHO_ARQUIVO = 'dados.bin';
const CAMINHO_INDICE = 'indice.bin';
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
          const percentual = percentualConcluido(i + 1, N);
          console.log(`Progresso: ${i + 1} de ${N} registos gravados (${percentual.toFixed(1)}%).`);
        }
      }
    }

    if (lote.length > 0) {
      gravarLote(CAMINHO_ARQUIVO, lote);
    }
  }

  // 2. CONSTRUÇÃO E ORDENAÇÃO DOS ÍNDICES
  console.log('A ler o disco e a construir o índice base...');
  const indiceBase = construirIndice(CAMINHO_ARQUIVO, (percentual, lidos, total) => {
    console.log(`Progresso do índice: ${lidos} de ${total} registros lidos (${percentual.toFixed(1)}%).`);
  });

  const mapa = new Map<number, import('./indice').EntradaIndice>();
  for (const entrada of indiceBase) {
    mapa.set(entrada.offset, entrada);
  }

  console.log('A preparar os índices...');
  const indicesCarregados = carregarIndicesOrdenados(CAMINHO_INDICE, mapa, indiceBase.length);

  let indiceNome: import('./indice').EntradaIndice[];
  let indiceEndereco: import('./indice').EntradaIndice[];

  if (indicesCarregados) {
    indiceNome = indicesCarregados.nome;
    indiceEndereco = indicesCarregados.endereco;
    console.log('Índices carregados do mesmo arquivo binário.');
  } else {
    console.log('Ordenando o Índice de NOMES com Quick Sort...');
    indiceNome = [...indiceBase];
    quickSort(indiceNome, 0, indiceNome.length - 1, comparaPorNome, (percentual) => {
      process.stdout.write(`\rQuicksort NOMES: ${percentual.toFixed(1)}%`);
    });
    console.log('\n');

    console.log('Ordenando o Índice de ENDEREÇOS com Quick Sort...');
    indiceEndereco = [...indiceBase];
    quickSort(indiceEndereco, 0, indiceEndereco.length - 1, comparaPorEndereco, (percentual) => {
      process.stdout.write(`\rQuicksort ENDEREÇOS: ${percentual.toFixed(1)}%`);
    });
    console.log('\n');

    salvarIndicesOrdenados(CAMINHO_INDICE, indiceNome, indiceEndereco);
    console.log(`Índices salvos em um único arquivo. NOMES ordenado? ${estaOrdenado(indiceNome, comparaPorNome) ? 'SIM' : 'NÃO'}`);
    console.log(`ENDEREÇOS ordenado? ${estaOrdenado(indiceEndereco, comparaPorEndereco) ? 'SIM' : 'NÃO'}`);
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

  // Busca exata com endereços completos conhecidos
  const enderecoExato = [
    {
      endereco: 'Albuquerque Alameda, 156, Breno do Norte, São Paulo, CEP: 83287-879',
    },
    {
      endereco: 'Albuquerque Alameda, 1711, Davi do Descoberto, Minas Gerais, CEP: 86927-698',
    },
    {
      endereco: 'Albuquerque Alameda, 2510, Costa do Norte, Amazonas, CEP: 39875-494',
    },
  ];

  const resultadosExatos = enderecoExato.map((entrada) => {
    const offsetEncontrado = buscaExata(indiceEndereco, entrada.endereco, 'endereco');
    return offsetEncontrado >= 0
      ? mapa.get(offsetEncontrado) ?? { ...entrada, offset: offsetEncontrado }
      : { ...entrada, offset: offsetEncontrado };
  });

  console.log('\nBusca exata por endereços completos. Resultados encontrados:');
  console.log(resultadosExatos);

  // Nome exato para teste de busca exata no índice de nomes

  const nomeExato = [
    {
      nome: 'Isabelly Braga',
    },
    {
      nome: 'Lavínia Moraes',
    },
    {
      nome: 'Fabrícia Silva',
    },
  ];

  const nomesExatos = nomeExato.map((entrada) => {
    const offsetEncontrado = buscaExata(indiceNome, entrada.nome, 'nome');
    return offsetEncontrado >= 0
      ? mapa.get(offsetEncontrado) ?? { ...entrada, offset: offsetEncontrado }
      : { ...entrada, offset: offsetEncontrado };
  });

  console.log('\nBusca exata por nomes completos. Resultados encontrados:');
  console.log(nomesExatos);

}

main().catch(console.error);