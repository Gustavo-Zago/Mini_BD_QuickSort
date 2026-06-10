import * as http from 'http';
import { MAX_RESULTADOS } from '../config';
import { EntradaIndice } from '../types';
import { buscaExata, buscaParcial } from '../core/busca';

type ContextoBusca = {
      pronto: boolean;
      erroInicializacao: string | null;
      indiceNome: EntradaIndice[];
      indiceEndereco: EntradaIndice[];
      mapa: Map<number, EntradaIndice>;
};

/**
 * Controla o fluxo de busca binária solicitado pela API HTTP.
 */
export function handleBusca(
      req: http.IncomingMessage,
      res: http.ServerResponse,
      url: URL,
      contexto: ContextoBusca
): void {
      const { pronto, erroInicializacao, indiceNome, indiceEndereco, mapa } = contexto;

      if (!pronto) {
            const body = JSON.stringify({ erro: erroInicializacao ?? 'Índices ainda carregando, aguarde.' });
            res.writeHead(503, { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*' });
            res.end(body);
            return;
      }

      const q = (url.searchParams.get('q') ?? '').trim();
      const campo = url.searchParams.get('campo') === 'endereco' ? 'endereco' : 'nome';
      const tipo = url.searchParams.get('tipo') === 'exata' ? 'exata' : 'parcial';

      if (!q) {
            const body = JSON.stringify({ erro: 'Parâmetro "q" obrigatório.' });
            res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*' });
            res.end(body);
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

      const body = JSON.stringify({
            total: resultados.length,
            truncado: tipo === 'parcial' && resultados.length === MAX_RESULTADOS,
            tempoMs: ms,
            resultados,
      });

      res.writeHead(200, {
            'Content-Type': 'application/json; charset=utf-8',
            'Access-Control-Allow-Origin': '*',
      });
      res.end(body);
}