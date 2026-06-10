// src/utils/generator.ts

import { faker } from '@faker-js/faker/locale/pt_BR';
import { TAMANHO_NOME, TAMANHO_ENDERECO } from '../config';
import { Registro } from '../types';

// ─── Manipulação de Buffer (Padding) ──────────────────────────────────────────

export function stringParaBufferFixo(texto: string, tamanho: number): Buffer {
  const buffer = Buffer.alloc(tamanho, 0);
  buffer.write(texto, 0, tamanho, 'utf8');
  return buffer;
}

export function bufferFixoParaString(buffer: Buffer): string {
  return buffer.toString('utf8').replace(/\0/g, '').trim();
}

// ─── Geração de Dados Fictícios ───────────────────────────────────────────────

export function gerarNome(): string {
  const nome = faker.person.fullName();
  return nome.substring(0, TAMANHO_NOME);
}

export function gerarEndereco(): string {
  const endereco = [
    faker.location.street(),
    faker.location.buildingNumber(),
    faker.location.city(),
    faker.location.state(),
    `CEP: ${faker.location.zipCode('#####-###')}`,
  ].join(', ');

  return endereco.substring(0, TAMANHO_ENDERECO);
}

export function gerarRegistro(): Registro {
  return {
    nome: gerarNome(),
    endereco: gerarEndereco(),
  };
}

export function gerarRegistroBuffer(): Buffer {
  const { nome, endereco } = gerarRegistro();
  const bufNome = stringParaBufferFixo(nome, TAMANHO_NOME);
  const bufEndereco = stringParaBufferFixo(endereco, TAMANHO_ENDERECO);
  return Buffer.concat([bufNome, bufEndereco]);
}