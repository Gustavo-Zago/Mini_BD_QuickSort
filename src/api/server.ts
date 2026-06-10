import * as http from 'http';
import * as fs from 'fs';
import * as path from 'path';

import { PORT, CAMINHO_ARQUIVO, CAMINHO_INDICE } from '../config';
import { EntradaIndice } from '../types';
import { totalRegistros } from '../core/arquivo';
import {
    construirIndice,
    carregarIndicesOrdenados,
    comparaPorNome,
    comparaPorEndereco,
} from '../core/indice';
import { handleBusca } from './buscaController'; // Import do Controlador

let indiceNome: EntradaIndice[] = [];
let indiceEndereco: EntradaIndice[] = [];
let mapa: Map<number, EntradaIndice> = new Map();
let pronto = false;
let erroInicializacao: string | null = null;

function carregarIndices(): void {
    console.log('[server] A carregar índices em memória...');

    if (!fs.existsSync(CAMINHO_ARQUIVO)) {
        erroInicializacao = `Arquivo de dados não encontrado: ${CAMINHO_ARQUIVO}. Execute "npm run seed" primeiro.`;
        console.error('[server]', erroInicializacao);
        return;
    }

    const total = totalRegistros(CAMINHO_ARQUIVO);
    if (total === 0) {
        erroInicializacao = 'Arquivo de dados vazio. Popule os dados primeiro.';
        console.error('[server]', erroInicializacao);
        return;
    }

    const indiceBase = construirIndice(CAMINHO_ARQUIVO, (pct, lidos, tot) => {
        process.stdout.write(`\r[server] Lendo registros: ${pct.toFixed(1)}% (${lidos}/${tot})`);
    });
    console.log('\n[server] Índice base construído.');

    for (const entrada of indiceBase) {
        mapa.set(entrada.offset, entrada);
    }

    const carregado = carregarIndicesOrdenados(CAMINHO_INDICE, mapa, indiceBase.length);

    if (carregado) {
        indiceNome = carregado.nome;
        indiceEndereco = carregado.endereco;
        console.log('[server] Índices ordenados carregados do disco.');
    } else {
        console.warn('[server] AVISO: indice.bin ausente. Ordenando em memória (lento na inicialização)...');
        indiceNome = [...indiceBase].sort(comparaPorNome);
        indiceEndereco = [...indiceBase].sort(comparaPorEndereco);
    }

    pronto = true;
    console.log(`[server] Pronto! Servidor escutando em http://localhost:${PORT}`);
}

function json(res: http.ServerResponse, statusCode: number, data: unknown): void {
    res.writeHead(statusCode, {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
    });
    res.end(JSON.stringify(data));
}

function servirEstatico(res: http.ServerResponse, filePath: string): void {
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes: Record<string, string> = {
        '.html': 'text/html; charset=utf-8',
        '.css': 'text/css',
        '.js': 'application/javascript',
        '.ico': 'image/x-icon',
    };
    const contentType = mimeTypes[ext] ?? 'application/octet-stream';

    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.writeHead(404);
            res.end('Not found');
            return;
        }
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(data);
    });
}

const servidor = http.createServer((req, res) => {
    const url = new URL(req.url ?? '/', `http://localhost:${PORT}`);

    if (req.method === 'OPTIONS') {
        res.writeHead(204, { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*' });
        res.end();
        return;
    }

    if (url.pathname === '/status') {
        json(res, 200, { pronto, erro: erroInicializacao, registros: pronto ? indiceNome.length : 0 });
        return;
    }

    // Repassa a responsabilidade da busca para o arquivo separado
    if (url.pathname === '/busca') {
        handleBusca(req, res, url, { pronto, erroInicializacao, indiceNome, indiceEndereco, mapa });
        return;
    }

    if (url.pathname === '/' || url.pathname === '/index.html') {
        servirEstatico(res, path.resolve('public', 'index.html'));
        return;
    }

    const staticPath = path.resolve('public', url.pathname.replace(/^\//, ''));
    if (staticPath.startsWith(path.resolve('public'))) {
        servirEstatico(res, staticPath);
        return;
    }

    res.writeHead(404);
    res.end('Not found');
});

servidor.listen(PORT, () => {
    console.log(`[server] HTTP em http://localhost:${PORT}`);
    setImmediate(carregarIndices);
});