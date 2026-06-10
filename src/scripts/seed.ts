import * as fs from 'fs';
import { CAMINHO_ARQUIVO, CAMINHO_INDICE, N_REGISTROS, LOTE_TAMANHO, RESET_ARQUIVO } from '../config';
import { EntradaIndice, Registro } from '../types';
import { gerarRegistro } from '../utils/generator';
import { quickSort } from '../utils/quicksort';
import { gravarLote, totalRegistros } from '../core/arquivo';
import {
      construirIndice,
      salvarIndicesOrdenados,
      carregarIndicesOrdenados,
      comparaPorNome,
      comparaPorEndereco,
      estaOrdenado,
      percentualConcluido,
} from '../core/indice';

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
            console.log(`Gerando ${N_REGISTROS} registos... Isto irá demorar bastante, tenha paciência!`);
            const lote: Registro[] = [];

            for (let i = 0; i < N_REGISTROS; i++) {
                  lote.push(gerarRegistro());

                  if (lote.length === LOTE_TAMANHO) {
                        gravarLote(CAMINHO_ARQUIVO, lote);
                        lote.length = 0;

                        if ((i + 1) % 100000 === 0) {
                              const percentual = percentualConcluido(i + 1, N_REGISTROS);
                              console.log(`Progresso: ${i + 1} de ${N_REGISTROS} registos gravados (${percentual.toFixed(1)}%).`);
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

      const mapa = new Map<number, EntradaIndice>();
      for (const entrada of indiceBase) {
            mapa.set(entrada.offset, entrada);
      }

      console.log('A preparar os índices...');
      const indicesCarregados = carregarIndicesOrdenados(CAMINHO_INDICE, mapa, indiceBase.length);

      let indiceNome: EntradaIndice[];
      let indiceEndereco: EntradaIndice[];

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

      console.log(`Concluído! Índices gerados e salvos com sucesso em memória com ${indiceNome.length} entradas.`);
}

main().catch(console.error);