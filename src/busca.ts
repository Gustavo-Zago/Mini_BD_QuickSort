// src/search/busca.ts

import { EntradaIndice, comparaTexto } from './indice';

type CampoBusca = 'nome' | 'endereco';

export function buscaExata(indice: EntradaIndice[], chave: string, campo: CampoBusca): number {
    let esquerda = 0;
    let direita = indice.length - 1;

    while (esquerda <= direita) {
        const meio = Math.floor((esquerda + direita) / 2);
        const valorAComparar = indice[meio][campo]; // Pega o nome ou endereço dinamicamente
        
        const comparacao = comparaTexto(valorAComparar, chave);

        if (comparacao === 0) {
            return indice[meio].offset;
        } else if (comparacao < 0) {
            esquerda = meio + 1; 
        } else {
            direita = meio - 1; 
        }
    }
    return -1; 
}

export function buscaParcial(indice: EntradaIndice[], prefixo: string, campo: CampoBusca): EntradaIndice[] {
    let esquerda = 0;
    let direita = indice.length - 1;
    let primeiraOcorrencia = -1;

    while (esquerda <= direita) {
        const meio = Math.floor((esquerda + direita) / 2);
        const valorAComparar = indice[meio][campo];
        
        const comparacao = comparaTexto(valorAComparar.substring(0, prefixo.length), prefixo);

        if (comparacao === 0) {
            primeiraOcorrencia = meio;
            direita = meio - 1; 
        } else if (comparacao < 0) {
            esquerda = meio + 1;
        } else {
            direita = meio - 1;
        }
    }

    if (primeiraOcorrencia === -1) return [];

    const resultados: EntradaIndice[] = [];
    const prefixoLower = prefixo.toLowerCase();

    for (let i = primeiraOcorrencia; i < indice.length; i++) {
        if (indice[i][campo].toLowerCase().startsWith(prefixoLower)) {
            resultados.push(indice[i]);
        } else {
            break; 
        }
    }

    return resultados;
}