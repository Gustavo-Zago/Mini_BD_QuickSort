// src/indice.ts

/// <reference types="node" />
import * as fs from 'fs';
import { TAMANHO_REGISTRO, TAMANHO_NOME, TAMANHO_ENDERECO, bufferFixoParaString } from './generator';

export type EntradaIndice = {
    nome: string;
    endereco: string;
    offset: number;
}

export function percentualConcluido(atual: number, total: number): number {
    if (total <= 0) return 100;
    return Math.min(100, Math.max(0, (atual / total) * 100));
}

export function construirIndice(
    caminhoArquivo: string,
    onProgress?: (percentual: number, lidos: number, total: number) => void
): EntradaIndice[] {
    const fd = fs.openSync(caminhoArquivo, 'r');
    const stats = fs.statSync(caminhoArquivo);
    const totalRegistros = Math.floor(stats.size / TAMANHO_REGISTRO);
    const indice: EntradaIndice[] = [];

    for (let i = 0; i < totalRegistros; i++) {
        const buffer = Buffer.alloc(TAMANHO_REGISTRO);
        fs.readSync(fd, buffer, 0, TAMANHO_REGISTRO, i * TAMANHO_REGISTRO);
        const nome = bufferFixoParaString(buffer.subarray(0, TAMANHO_NOME));
        const endereco = bufferFixoParaString(buffer.subarray(TAMANHO_NOME, TAMANHO_NOME + TAMANHO_ENDERECO));
        indice.push({ nome, endereco, offset: i * TAMANHO_REGISTRO });

        if (onProgress && (i + 1) % 100000 === 0) {
            const percentual = percentualConcluido(i + 1, totalRegistros);
            onProgress(percentual, i + 1, totalRegistros);
        }
    }

    fs.closeSync(fd);
    return indice;
}

export function comparaTexto(a: string, b: string): number {
    return a.localeCompare(b, 'pt-BR', { sensitivity: 'base' });
}

export function comparaPorNome(a: EntradaIndice, b: EntradaIndice): number {
    const cmp = comparaTexto(a.nome, b.nome);
    if (cmp !== 0) return cmp;
    return comparaTexto(a.endereco, b.endereco);
}

export function comparaPorEndereco(a: EntradaIndice, b: EntradaIndice): number {
    const cmp = comparaTexto(a.endereco, b.endereco);
    if (cmp !== 0) return cmp;
    return comparaTexto(a.nome, b.nome);
}

export function salvarIndicesOrdenados(
    caminhoIndice: string,
    indiceNome: EntradaIndice[],
    indiceEndereco: EntradaIndice[]
): void {
    const total = indiceNome.length;
    const buffer = Buffer.allocUnsafe(4 + total * 8);
    buffer.writeUInt32LE(total, 0);

    for (let i = 0; i < total; i++) {
        buffer.writeUInt32LE(indiceNome[i].offset, 4 + i * 4);
        buffer.writeUInt32LE(indiceEndereco[i].offset, 4 + total * 4 + i * 4);
    }

    fs.writeFileSync(caminhoIndice, buffer);
}

export function carregarIndicesOrdenados(
    caminhoIndice: string,
    mapa: Map<number, EntradaIndice>,
    totalEsperado: number
): { nome: EntradaIndice[]; endereco: EntradaIndice[] } | null {
    if (!fs.existsSync(caminhoIndice)) return null;

    const buffer = fs.readFileSync(caminhoIndice);
    const total = buffer.readUInt32LE(0);
    if (total !== totalEsperado) return null;

    const nome: EntradaIndice[] = [];
    const endereco: EntradaIndice[] = [];

    for (let i = 0; i < total; i++) {
        const offsetNome = buffer.readUInt32LE(4 + i * 4);
        const offsetEndereco = buffer.readUInt32LE(4 + total * 4 + i * 4);

        const entradaNome = mapa.get(offsetNome);
        const entradaEndereco = mapa.get(offsetEndereco);

        if (entradaNome) nome.push(entradaNome);
        if (entradaEndereco) endereco.push(entradaEndereco);
    }

    return { nome, endereco };
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