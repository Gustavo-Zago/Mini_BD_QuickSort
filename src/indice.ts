// ─────────────────────────────────────────────────────────────────────────────
//  src/index/indice.ts
//  Responsável por: construção e ordenação do índice via Quick Sort
// ─────────────────────────────────────────────────────────────────────────────

// TODO: interface EntradaIndice { chave: string; offset: number }
//       → estrutura de cada entrada do índice (chave + posição no arquivo)

// TODO: construirIndice(caminhoArquivo)
//       → lê todos os registros e monta o array de EntradaIndice

// TODO: quickSort(arr, esq, dir)
//       → ordena o índice pela chave usando Quick Sort

type EntradaIndice = {
      chave: string; // nome ou endereço
      offset: number; // posição no arquivo
}

export function construirIndice(caminhoArquivo: string): EntradaIndice[] {
    // Implementação da função
}

export function quickSort(arr: EntradaIndice[], esq: number, dir: number): void {
    // Implementação do Quick Sort
}