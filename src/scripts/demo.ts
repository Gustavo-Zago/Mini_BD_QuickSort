import { CAMINHO_ARQUIVO, CAMINHO_INDICE } from '../config';
import { EntradaIndice } from '../types';
import { construirIndice, carregarIndicesOrdenados, comparaPorNome, comparaPorEndereco } from '../core/indice';
import { buscaExata, buscaParcial } from '../core/busca';

async function main() {
      console.log('A ler o disco para montar a demonstração...');
      const indiceBase = construirIndice(CAMINHO_ARQUIVO);

      const mapa = new Map<number, EntradaIndice>();
      for (const entrada of indiceBase) {
            mapa.set(entrada.offset, entrada);
      }

      console.log('A carregar os índices ordenados...');
      const indicesCarregados = carregarIndicesOrdenados(CAMINHO_INDICE, mapa, indiceBase.length);

      let indiceNome: EntradaIndice[];
      let indiceEndereco: EntradaIndice[];

      if (indicesCarregados) {
            indiceNome = indicesCarregados.nome;
            indiceEndereco = indicesCarregados.endereco;
      } else {
            console.log('Índices ordenados não encontrados. Ordenando em memória temporária para demonstração...');
            indiceNome = [...indiceBase].sort(comparaPorNome);
            indiceEndereco = [...indiceBase].sort(comparaPorEndereco);
      }

      console.log('\n--- Demonstração de Buscas Rápidas ---');

      const resultadoNomes = buscaParcial(indiceNome, 'Maria', 'nome');
      console.log(`\nEncontradas ${resultadoNomes.length} pessoas chamadas Maria. Exemplo das 3 primeiras:`);
      console.log(resultadoNomes.slice(0, 3));

      const resultadoRuas = buscaParcial(indiceEndereco, 'Carvalho', 'endereco');
      console.log(`\nEncontradas ${resultadoRuas.length} pessoas morando em locais com prefixo Carvalho. Exemplo das 3 primeiras:`);
      console.log(resultadoRuas.slice(0, 3));
}

main().catch(console.error);