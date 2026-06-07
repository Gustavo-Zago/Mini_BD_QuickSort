// src/server.ts
// Servidor HTTP — expõe as buscas via API REST e serve o front-end estático.
// Assume que os arquivos dados.bin e indice.bin já existem.
// Para gerar os arquivos, rode primeiro:  npx ts-node src/index.ts

import * as http from 'http';
import * as fs from 'fs';
import * as path from 'path';

import { totalRegistros } from './arquivo';
import {
    construirIndice,
    carregarIndicesOrdenados,
    comparaPorNome,
    comparaPorEndereco,
    EntradaIndice,
} from './indice';
import { buscaExata, buscaParcial } from './busca';

// ─── Configuração ─────────────────────────────────────────────────────────────
const CAMINHO_ARQUIVO = path.resolve('dados.bin');
const CAMINHO_INDICE  = path.resolve('indice.bin');
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;
const MAX_RESULTADOS  = 200; // limite para buscas parciais

// ─── Estado global dos índices em memória ────────────────────────────────────
let indiceNome:     EntradaIndice[] = [];
let indiceEndereco: EntradaIndice[] = [];
let mapa:           Map<number, EntradaIndice> = new Map();
let pronto = false;
let erroInicializacao: string | null = null;

// ─── Carregamento assíncrono dos índices ─────────────────────────────────────
function carregarIndices(): void {
    console.log('[server] A carregar índices em memória...');

    if (!fs.existsSync(CAMINHO_ARQUIVO)) {
        erroInicializacao = `Arquivo de dados não encontrado: ${CAMINHO_ARQUIVO}. Execute "npm run dev" primeiro para gerar os dados.`;
        console.error('[server]', erroInicializacao);
        return;
    }

    const total = totalRegistros(CAMINHO_ARQUIVO);
    if (total === 0) {
        erroInicializacao = 'Arquivo de dados existe mas está vazio. Execute "npm run dev" para popular os dados.';
        console.error('[server]', erroInicializacao);
        return;
    }

    console.log(`[server] ${total} registros encontrados em dados.bin`);

    // Constrói índice base lendo o arquivo de dados
    const indiceBase = construirIndice(CAMINHO_ARQUIVO, (pct, lidos, tot) => {
        process.stdout.write(`\r[server] Lendo registros: ${pct.toFixed(1)}% (${lidos}/${tot})`);
    });
    console.log('\n[server] Índice base construído.');

    // Monta o mapa offset → entrada
    for (const entrada of indiceBase) {
        mapa.set(entrada.offset, entrada);
    }

    // Tenta carregar índice ordenado do disco
    const carregado = carregarIndicesOrdenados(CAMINHO_INDICE, mapa, indiceBase.length);

    if (carregado) {
        indiceNome     = carregado.nome;
        indiceEndereco = carregado.endereco;
        console.log('[server] Índices ordenados carregados do disco.');
    } else {
        // Índice binário não existe ou está desatualizado — usa o base (não ordenado)
        // Isso ainda permite busca, só não será perfeita para parcial.
        // Para produção, rode index.ts para gerar indice.bin antes do servidor.
        console.warn('[server] AVISO: indice.bin não encontrado ou desatualizado. As buscas usarão o índice não ordenado.');
        indiceNome     = [...indiceBase].sort(comparaPorNome);
        indiceEndereco = [...indiceBase].sort(comparaPorEndereco);
        console.log('[server] Índices ordenados em memória (mais lento na primeira vez).');
    }

    pronto = true;
    console.log(`[server] Pronto! Servidor escutando em http://localhost:${PORT}`);
}

// ─── Utilitários HTTP ─────────────────────────────────────────────────────────
function json(res: http.ServerResponse, statusCode: number, data: unknown): void {
    const body = JSON.stringify(data);
    res.writeHead(statusCode, {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
    });
    res.end(body);
}

function servirEstatico(res: http.ServerResponse, filePath: string): void {
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes: Record<string, string> = {
        '.html': 'text/html; charset=utf-8',
        '.css':  'text/css',
        '.js':   'application/javascript',
        '.ico':  'image/x-icon',
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

// ─── Roteador ────────────────────────────────────────────────────────────────
const servidor = http.createServer((req, res) => {
    const url = new URL(req.url ?? '/', `http://localhost:${PORT}`);

    // CORS preflight
    if (req.method === 'OPTIONS') {
        res.writeHead(204, { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*' });
        res.end();
        return;
    }

    // ── GET /status ──────────────────────────────────────────────────────────
    if (url.pathname === '/status') {
        json(res, 200, {
            pronto,
            erro: erroInicializacao,
            registros: pronto ? indiceNome.length : 0,
        });
        return;
    }

    // ── GET /busca?q=...&campo=nome|endereco&tipo=parcial|exata ───────────────
    if (url.pathname === '/busca') {
        if (!pronto) {
            json(res, 503, { erro: erroInicializacao ?? 'Índices ainda carregando, aguarde.' });
            return;
        }

        const q      = (url.searchParams.get('q') ?? '').trim();
        const campo  = url.searchParams.get('campo') === 'endereco' ? 'endereco' : 'nome';
        const tipo   = url.searchParams.get('tipo') === 'exata'     ? 'exata'    : 'parcial';

        if (!q) {
            json(res, 400, { erro: 'Parâmetro "q" obrigatório.' });
            return;
        }

        const indice = campo === 'nome' ? indiceNome : indiceEndereco;
        const inicio = Date.now();

        let resultados: EntradaIndice[];

        if (tipo === 'exata') {
            const offset = buscaExata(indice, q, campo);
            if (offset >= 0) {
                const entrada = mapa.get(offset);
                resultados = entrada ? [entrada] : [];
            } else {
                resultados = [];
            }
        } else {
            resultados = buscaParcial(indice, q, campo).slice(0, MAX_RESULTADOS);
        }

        const ms = Date.now() - inicio;

        json(res, 200, {
            total: resultados.length,
            truncado: tipo === 'parcial' && resultados.length === MAX_RESULTADOS,
            tempoMs: ms,
            resultados,
        });
        return;
    }

    // ── Arquivos estáticos de /public ─────────────────────────────────────────
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

// ─── Boot ─────────────────────────────────────────────────────────────────────
servidor.listen(PORT, () => {
    console.log(`[server] HTTP em http://localhost:${PORT}`);
    // Carrega os índices após o servidor já estar escutando
    // (o front pode exibir "carregando" enquanto isso)
    setImmediate(carregarIndices);
});
