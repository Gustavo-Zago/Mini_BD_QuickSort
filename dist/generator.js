"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TAMANHO_REGISTRO = exports.TAMANHO_ENDERECO = exports.TAMANHO_NOME = void 0;
exports.stringParaBufferFixo = stringParaBufferFixo;
exports.bufferFixoParaString = bufferFixoParaString;
exports.gerarNome = gerarNome;
exports.gerarEndereco = gerarEndereco;
exports.gerarRegistro = gerarRegistro;
exports.gerarRegistroBuffer = gerarRegistroBuffer;
const pt_BR_1 = require("@faker-js/faker/locale/pt_BR");
// ─── Tamanhos fixos definidos pelo exercício ──────────────────────────────────
exports.TAMANHO_NOME = 100; // bytes
exports.TAMANHO_ENDERECO = 200; // bytes
exports.TAMANHO_REGISTRO = exports.TAMANHO_NOME + exports.TAMANHO_ENDERECO; // 300 bytes
// ─── Padding ──────────────────────────────────────────────────────────────────
function stringParaBufferFixo(texto, tamanho) {
    const buffer = Buffer.alloc(tamanho, 0); // preenche tudo com \0
    buffer.write(texto, 0, tamanho, 'utf8'); // escreve o texto no início
    return buffer;
}
function bufferFixoParaString(buffer) {
    return buffer.toString('utf8').replace(/\0/g, '').trim();
}
// ─── Geração de dados ─────────────────────────────────────────────────────────
function gerarNome() {
    const nome = pt_BR_1.faker.person.fullName();
    return nome.substring(0, exports.TAMANHO_NOME);
}
function gerarEndereco() {
    const endereco = [
        pt_BR_1.faker.location.street(),
        pt_BR_1.faker.location.buildingNumber(),
        pt_BR_1.faker.location.city(),
        pt_BR_1.faker.location.state(),
        `CEP: ${pt_BR_1.faker.location.zipCode('#####-###')}`,
    ].join(', ');
    return endereco.substring(0, exports.TAMANHO_ENDERECO);
}
function gerarRegistro() {
    return {
        nome: gerarNome(),
        endereco: gerarEndereco(),
    };
}
function gerarRegistroBuffer() {
    const { nome, endereco } = gerarRegistro();
    const bufNome = stringParaBufferFixo(nome, exports.TAMANHO_NOME);
    const bufEndereco = stringParaBufferFixo(endereco, exports.TAMANHO_ENDERECO);
    return Buffer.concat([bufNome, bufEndereco]); // 300 bytes exatos
}
