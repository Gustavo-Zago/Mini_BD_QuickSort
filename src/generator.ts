import { faker } from '@faker-js/faker/locale/pt_BR';

// ─── Tamanhos fixos definidos pelo exercício ──────────────────────────────────
export const TAMANHO_NOME = 100; // bytes
export const TAMANHO_ENDERECO = 200; // bytes
export const TAMANHO_REGISTRO = TAMANHO_NOME + TAMANHO_ENDERECO; // 300 bytes

// ─── Padding ──────────────────────────────────────────────────────────────────

export function stringParaBufferFixo(texto: string, tamanho: number): Buffer {
  const buffer = Buffer.alloc(tamanho, 0);   // preenche tudo com \0
  buffer.write(texto, 0, tamanho, 'utf8');   // escreve o texto no início
  return buffer;
}

export function bufferFixoParaString(buffer: Buffer): string {
  return buffer.toString('utf8').replace(/\0/g, '').trim();
}

// ─── Geração de dados ─────────────────────────────────────────────────────────

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

export function gerarRegistro(): { nome: string; endereco: string } {
  return {
    nome: gerarNome(),
    endereco: gerarEndereco(),
  };
}

export function gerarRegistroBuffer(): Buffer {
  const { nome, endereco } = gerarRegistro();
  const bufNome = stringParaBufferFixo(nome, TAMANHO_NOME);
  const bufEndereco = stringParaBufferFixo(endereco, TAMANHO_ENDERECO);
  return Buffer.concat([bufNome, bufEndereco]); // 300 bytes exatos
}
