// src/utils/quicksort.ts

import { EntradaIndice } from '../types';

export function quickSort(
      arr: EntradaIndice[],
      esq: number,
      dir: number,
      comparaFn: (a: EntradaIndice, b: EntradaIndice) => number,
      onProgress?: (percentual: number) => void
): void {
      const estimativaTotal = Math.max(1, arr.length * Math.ceil(Math.log2(arr.length + 1)));
      let comparacoes = 0;

      function ordenar(inicio: number, fim: number): void {
            if (inicio >= fim) return;

            const meio = Math.floor((inicio + fim) / 2);
            const pivot = arr[meio];
            let i = inicio;
            let j = fim;

            while (i <= j) {
                  comparacoes++;
                  while (comparaFn(arr[i], pivot) < 0) { comparacoes++; i++; }
                  while (comparaFn(arr[j], pivot) > 0) { comparacoes++; j--; }

                  if (i <= j) {
                        [arr[i], arr[j]] = [arr[j], arr[i]];
                        i++;
                        j--;
                  }
            }

            if (onProgress && comparacoes % 1000000 === 0) {
                  onProgress(Math.min(99.9, (comparacoes / estimativaTotal) * 100));
            }

            if (inicio < j) ordenar(inicio, j);
            if (i < fim) ordenar(i, fim);
      }

      ordenar(esq, dir);
      if (onProgress) onProgress(100);
}