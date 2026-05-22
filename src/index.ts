// ─────────────────────────────────────────────────────────────────────────────
//  Mini Banco de Dados Sequencial
//  Ponto de entrada principal
// ─────────────────────────────────────────────────────────────────────────────

import { gerarRegistro, gerarRegistroBuffer } from '../src/generator';

async function main() {

  // Teste da biblioteca de geração (já funciona)
  console.log('── Teste do gerador ──');
  const registro = gerarRegistro();
  console.log('Nome:     ', registro.nome);
  console.log('Endereço: ', registro.endereco);

  const buffer = gerarRegistroBuffer();
  console.log(`\nBuffer gerado: ${buffer.length} bytes`); // deve ser 300

  // TODO: ETAPA 1 → gerar e gravar 10.000.000 de registros no arquivo
  // TODO: ETAPA 2 → construir e ordenar o índice com Quick Sort
  // TODO: ETAPA 3 → demonstrar busca rápida pelo índice

}

main().catch(console.error);
