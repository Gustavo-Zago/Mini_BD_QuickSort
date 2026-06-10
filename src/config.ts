import * as path from 'path';

// Caminhos dos arquivos no disco
export const CAMINHO_ARQUIVO = path.resolve('dados.bin');
export const CAMINHO_INDICE = path.resolve('indice.bin');

// Configurações do Banco de Dados
export const TAMANHO_NOME = 100; // bytes
export const TAMANHO_ENDERECO = 200; // bytes
export const TAMANHO_REGISTRO = TAMANHO_NOME + TAMANHO_ENDERECO; // 300 bytes

// Configurações do script de geração (index.ts)
export const N_REGISTROS = 10000000;
export const LOTE_TAMANHO = 10000;
export const RESET_ARQUIVO = false;

// Configurações do Servidor
export const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3333;
export const MAX_RESULTADOS = 200; // limite para buscas parciais