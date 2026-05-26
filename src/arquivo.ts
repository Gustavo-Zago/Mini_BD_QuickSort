// ─────────────────────────────────────────────────────────────────────────────
//  src/data/arquivo.ts
//  Responsável por: leitura e gravação no arquivo sequencial (dados.bin)
// ─────────────────────────────────────────────────────────────────────────────

// TODO: gravarRegistro(caminhoArquivo, registro)
//       → grava um registro de 300 bytes no final do arquivo

// TODO: gravarLote(caminhoArquivo, registros[])
//       → grava um lote de registros de uma vez (mais eficiente para 10 milhões)

// TODO: lerRegistro(caminhoArquivo, offset)
//       → lê um registro a partir de uma posição (offset) no arquivo

// TODO: totalRegistros(caminhoArquivo)
//       → retorna quantos registros existem no arquivo

import * as fs from 'fs';
import {
      TAMANHO_REGISTRO,
      TAMANHO_NOME,
      TAMANHO_ENDERECO,
      stringParaBufferFixo,
      bufferFixoParaString,
} from './generator';

type Registro = {
      nome: string;
      endereco: string;
};

function registroParaBuffer(registro: Registro): Buffer {
      const bufNome = stringParaBufferFixo(registro.nome, TAMANHO_NOME);
      const bufEndereco = stringParaBufferFixo(registro.endereco, TAMANHO_ENDERECO);
      return Buffer.concat([bufNome, bufEndereco]);
}

export function gravarRegistro(caminhoArquivo: string, registro: Registro): void {
      const buffer = registroParaBuffer(registro);
      fs.appendFileSync(caminhoArquivo, buffer);
}

export function gravarLote(caminhoArquivo: string, registros: Registro[]): void {
      if (registros.length === 0) return;
      const buffers = registros.map(registroParaBuffer);
      fs.appendFileSync(caminhoArquivo, Buffer.concat(buffers));
}

export function lerRegistro(caminhoArquivo: string, offset: number): Registro {
      const fd = fs.openSync(caminhoArquivo, 'r');
      const buffer = Buffer.alloc(TAMANHO_REGISTRO);
      fs.readSync(fd, buffer, 0, TAMANHO_REGISTRO, offset);
      fs.closeSync(fd);

      const nome = bufferFixoParaString(buffer.subarray(0, TAMANHO_NOME));
      const endereco = bufferFixoParaString(
            buffer.subarray(TAMANHO_NOME, TAMANHO_NOME + TAMANHO_ENDERECO)
      );

      return { nome, endereco };
}

export function totalRegistros(caminhoArquivo: string): number {
      if (!fs.existsSync(caminhoArquivo)) return 0;
      const stats = fs.statSync(caminhoArquivo);
      return Math.floor(stats.size / TAMANHO_REGISTRO);
}