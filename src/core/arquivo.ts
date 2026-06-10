import * as fs from 'fs';
import { TAMANHO_REGISTRO, TAMANHO_NOME, TAMANHO_ENDERECO } from '../config';
import { Registro } from '../types';
import { stringParaBufferFixo, bufferFixoParaString } from '../utils/generator';

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