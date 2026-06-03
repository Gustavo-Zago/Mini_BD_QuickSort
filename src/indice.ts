// src/index/indice.ts

import * as fs from 'fs';
import { TAMANHO_REGISTRO, TAMANHO_NOME, TAMANHO_ENDERECO, bufferFixoParaString } from './generator';

export type EntradaIndice = {
    nome: string;
    endereco: string;
    offset: number;
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

// Ordena focando no Nome
export function comparaPorNome(a: EntradaIndice, b: EntradaIndice): number {
    const cmp = comparaTexto(a.nome, b.nome);
    if (cmp !== 0) return cmp;
    return comparaTexto(a.endereco, b.endereco); // desempate
}

// Ordena focando no Endereço
export function comparaPorEndereco(a: EntradaIndice, b: EntradaIndice): number {
    const cmp = comparaTexto(a.endereco, b.endereco);
    if (cmp !== 0) return cmp;
    return comparaTexto(a.nome, b.nome); // desempate
}

export function salvarIndiceOrdenado(caminhoIndice: string, indice: EntradaIndice[]): void {
    const buffer = Buffer.allocUnsafe(4 + indice.length * 4);
    buffer.writeUInt32LE(indice.length, 0);
    for (let i = 0; i < indice.length; i++) {
        buffer.writeUInt32LE(indice[i].offset, 4 + i * 4);
    }
    fs.writeFileSync(caminhoIndice, buffer);
}

export function carregarIndiceOrdenado(
    caminhoIndice: string,
    mapa: Map<number, EntradaIndice>,
    totalEsperado: number
): EntradaIndice[] | null {
    if (!fs.existsSync(caminhoIndice)) return null;
    const buffer = fs.readFileSync(caminhoIndice);
    const total = buffer.readUInt32LE(0);
    if (total !== totalEsperado) return null;
    const indice: EntradaIndice[] = [];
    for (let i = 0; i < total; i++) {
        const offset = buffer.readUInt32LE(4 + i * 4);
        const entrada = mapa.get(offset);
        if (entrada) indice.push(entrada);
    }
    return indice;
}

export function estaOrdenado(
    arr: EntradaIndice[],
    comparaFn: (a: EntradaIndice, b: EntradaIndice) => number
): boolean {
    for (let i = 1; i < arr.length; i++) {
        if (comparaFn(arr[i - 1], arr[i]) > 0) return false;
    }
    return true;
}

// QuickSort agora recebe a função de comparação dinamicamente
export function quickSort(
    arr: EntradaIndice[], 
    esq: number, 
    dir: number, 
    comparaFn: (a: EntradaIndice, b: EntradaIndice) => number
): void {
    if(esq >= dir) return;

    const meio = Math.floor((esq + dir) / 2);
    const pivot = arr[meio];

    let i = esq;
    let j = dir;

    while (i <= j) {
        while (comparaFn(arr[i], pivot) < 0) i++;
        while (comparaFn(arr[j], pivot) > 0) j--;

        if (i <= j) {
            [arr[i], arr[j]] = [arr[j], arr[i]]; 
            i++;
            j--;
        }
    }

    if (esq < j) quickSort(arr, esq, j, comparaFn);
    if (i < dir) quickSort(arr, i, dir, comparaFn);
}