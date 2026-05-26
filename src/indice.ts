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

import * as fs from 'fs';
import {
    TAMANHO_REGISTRO, TAMANHO_NOME, TAMANHO_ENDERECO, bufferFixoParaString } from './generator';

export type EntradaIndice = {
    nome: string; // nome 
    endereco: string; // endereço
      offset: number; // posição no arquivo
}

export function construirIndice(caminhoArquivo: string): EntradaIndice[] {
    const fd = fs.openSync(caminhoArquivo, 'r');
    const stats = fs.statSync(caminhoArquivo);
    const totalRegistros = Math.floor(stats.size / TAMANHO_REGISTRO);
    const indice: EntradaIndice[] = [];

    for (let i = 0; i < totalRegistros; i++) {
        const buffer = Buffer.alloc(TAMANHO_REGISTRO);
        fs.readSync(fd, buffer, 0, TAMANHO_REGISTRO, i * TAMANHO_REGISTRO);
        const nomeBuffer = buffer.subarray(0, TAMANHO_NOME);
        const enderecoBuffer = buffer.subarray(TAMANHO_NOME, TAMANHO_NOME + TAMANHO_ENDERECO);
        const endereco = bufferFixoParaString(enderecoBuffer);
        const nome = bufferFixoParaString(nomeBuffer);
        indice.push({ nome, endereco, offset: i * TAMANHO_REGISTRO });
    }

    fs.closeSync(fd);
    return indice;
}

export function comparaTexto(a: string, b: string): number {
    return a.localeCompare(b, 'pt-BR', { sensitivity: 'base' });
}

function comparaEntrada(a: EntradaIndice, b: EntradaIndice): number {
    const nomeCmp = comparaTexto(a.nome, b.nome);
    if (nomeCmp !== 0) return nomeCmp;
    return comparaTexto(a.endereco, b.endereco);
}

export function quickSort(arr: EntradaIndice[], esq: number, dir: number): void {
    if(esq >= dir) return;

    // Pivô no meio
    const meio = Math.floor((esq + dir) / 2);
    const pivot = arr[meio];

    let i = esq;
    let j = dir;

    while (i <= j) {
        while (comparaEntrada(arr[i], pivot) < 0) i++;
        while (comparaEntrada(arr[j], pivot) > 0) j--;

        if (i <= j) {
            [arr[i], arr[j]] = [arr[j], arr[i]]; // troca
            i++;
            j--;
        }
    }

    if (esq < j) quickSort(arr, esq, j);
    if (i < dir) quickSort(arr, i, dir);
}