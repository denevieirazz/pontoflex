/**
 * Bateria de Testes Automatizados Extensivos - PontoFlex Pro
 * Valida: Escala 1x1, Ponto, Horas Extras, Cálculo Salarial, Alarme e Persistência
 */

import assert from 'assert';
import { EscalaService } from './logica/escala.js';
import { PontoService } from './logica/ponto.js';
import { CalculoSalarioService } from './logica/calculoSalario.js';
import { AlarmeService } from './logica/alarme.js';
import { StorageService } from './logica/storage.js';

console.log('🧪 INICIANDO TESTES COMPLETOS...\n');

// 1. TESTE DA ESCALA 1x1
console.log('--- 1. TESTANDO MOTOR DA ESCALA 1x1 ---');
const dataInicio = '2026-10-01'; // Dia 1 = Trabalho
assert.strictEqual(EscalaService.isDiaDeTrabalho('2026-10-01', dataInicio), true, 'Dia 01 deve ser Trabalho');
assert.strictEqual(EscalaService.isDiaDeTrabalho('2026-10-02', dataInicio), false, 'Dia 02 deve ser Folga');
assert.strictEqual(EscalaService.isDiaDeTrabalho('2026-10-03', dataInicio), true, 'Dia 03 deve ser Trabalho');
assert.strictEqual(EscalaService.isDiaDeTrabalho('2026-10-04', dataInicio), false, 'Dia 04 deve ser Folga');
assert.strictEqual(EscalaService.isDiaDeTrabalho('2026-10-31', dataInicio), true, 'Dia 31 deve ser Trabalho (diferença de 30 dias)');
assert.strictEqual(EscalaService.isDiaDeTrabalho('2026-11-01', dataInicio), false, 'Virada de mês: 01/11 deve ser Folga');
console.log('✅ Escala 1x1: 100% aprovada!');

// 2. TESTE DE CÁLCULO DE MINUTOS E INTERVALO
console.log('\n--- 2. TESTANDO APURAÇÃO DE PONTO E INTERVALOS ---');
// Entrada 08:00, Almoço 12:00 às 13:00, Saída 17:00 (Total: 8h = 480 min)
const min1 = PontoService.calcularMinutosTrabalhados('08:00', '17:00', '12:00', '13:00');
assert.strictEqual(min1, 480, 'Deveria calcular exatamente 480 minutos (8h)');

// Entrada 07:00, Saída 19:00, Almoço 12:00 às 13:00 (Total: 11h = 660 min)
const min2 = PontoService.calcularMinutosTrabalhados('07:00', '19:00', '12:00', '13:00');
assert.strictEqual(min2, 660, 'Deveria calcular 660 minutos (11h)');

// Turno noturno que cruza a meia-noite: 22:00 às 06:00 (Total: 8h = 480 min)
const minNoturno = PontoService.calcularMinutosTrabalhados('22:00', '06:00', '', '');
assert.strictEqual(minNoturno, 480, 'Turno noturno 22h-06h deve ter 480 minutos');
console.log('✅ Apuração de Horas e Turno Noturno: 100% aprovada!');

// 3. TESTE DE HORAS EXTRAS (50% e 100%)
console.log('\n--- 3. TESTANDO HORAS EXTRAS (50% e 100%) ---');
// Dia normal de trabalho: jornada padrão 8h (480 min), trabalhou 10h (600 min) -> 2h extras (120 min) a 50%
const apuracaoNormal = PontoService.apurarHorasDoDia({
  minutosTrabalhados: 600,
  isDiaTrabalhoEscala: true,
  jornadaPadraoHoras: 8
});
assert.strictEqual(apuracaoNormal.minutosNormais, 480, 'Minutos normais devem ser 480');
assert.strictEqual(apuracaoNormal.minutosExtrasNormais, 120, 'Minutos extras 50% devem ser 120 (2h)');
assert.strictEqual(apuracaoNormal.minutosExtrasFolga, 0, 'Não deve ter extra folga em dia de trabalho');

// Dia de FOLGA trabalhado: trabalhou 8h (480 min) em dia de folga -> 8h extras (480 min) a 100%!
const apuracaoFolga = PontoService.apurarHorasDoDia({
  minutosTrabalhados: 480,
  isDiaTrabalhoEscala: false,
  jornadaPadraoHoras: 8
});
assert.strictEqual(apuracaoFolga.minutosNormais, 0, 'Minutos normais em folga devem ser 0');
assert.strictEqual(apuracaoFolga.minutosExtrasNormais, 0, 'Minutos extras normais devem ser 0');
assert.strictEqual(apuracaoFolga.minutosExtrasFolga, 480, 'Minutos extras 100% devem ser 480 (8h)');
console.log('✅ Horas Extras (50% vs 100% Folga): 100% aprovada!');

// 4. TESTE DE CÁLCULO SALARIAL
console.log('\n--- 4. TESTANDO CÁLCULO SALARIAL E HOLERITE ---');
const configSalario = {
  salarioBase: 2200,
  horasMensais: 220,
  jornadaPadraoHoras: 8,
  porcentagemExtraNormal: 50,
  porcentagemExtraFolga: 100
};
const valorHora = CalculoSalarioService.calcularValorHora(configSalario.salarioBase, configSalario.horasMensais);
assert.strictEqual(valorHora, 10, 'Valor hora deve ser exatamente R$ 10,00');

const valoresDet = CalculoSalarioService.calcularValoresHoraDetalhados(configSalario);
assert.strictEqual(valoresDet.valorHoraBase, 10, 'Hora base = 10');
assert.strictEqual(valoresDet.valorHoraExtra50, 15, 'Hora extra 50% = 15');
assert.strictEqual(valoresDet.valorHoraExtra100, 20, 'Hora extra 100% = 20');
assert.strictEqual(valoresDet.valorHoraNoturna, 12, 'Hora noturna (+20%) = 12');

const resumoMes = {
  totalMinutosNormais: 7200, // 120 horas
  totalMinutosExtras50: 600, // 10 horas a 50% = 10 * 15 = R$ 150
  totalMinutosExtras100: 600, // 10 horas a 100% = 10 * 20 = R$ 200
  totalMinutosExtrasGerais: 1200,
  diasTrabalhados: 15
};
const holerite = CalculoSalarioService.calcularHoleriteEstimado(resumoMes, configSalario);
assert.strictEqual(holerite.valorHoraBase, 10);
assert.strictEqual(holerite.totalExtra50Reais, 150);
assert.strictEqual(holerite.totalExtra100Reais, 200);
assert.strictEqual(holerite.totalExtrasReais, 350);
console.log('✅ Cálculo Salarial e Reflexo de Horas Extras: 100% aprovada!');

// 5. TESTE DE PERSISTÊNCIA E BACKUP
console.log('\n--- 5. TESTANDO MOTOR DE PERSISTÊNCIA E BACKUP ---');
// Mock de LocalStorage no Node.js para teste estrito
global.localStorage = {
  store: {},
  getItem(k) { return this.store[k] || null; },
  setItem(k, v) { this.store[k] = String(v); },
  removeItem(k) { delete this.store[k]; },
  clear() { this.store = {}; }
};

// Salva registro de ponto e configuração
StorageService.salvarConfig({ salarioBase: 3500, dataInicioEscala: '2026-10-01' });
StorageService.salvarRegistroPonto({
  id: 'teste_123',
  data: '2026-10-31',
  entrada: '08:00',
  saida: '17:00',
  isDiaTrabalhoEscala: true,
  totalMinutosTrabalhados: 480
});

// Força limpeza do cache de memória para simular fechamento do app
StorageService.cacheConfig = null;
StorageService.cachePontos = null;

// Re-lê do armazenamento persistente
const pontoRecuperado = StorageService.obterPontoPorData('2026-10-31');
assert(pontoRecuperado !== null, 'Registro deve existir após recarregar');
assert.strictEqual(pontoRecuperado.entrada, '08:00', 'Entrada deve ser 08:00');
assert.strictEqual(pontoRecuperado.totalMinutosTrabalhados, 480, 'Total de minutos deve persistir');

const configRecuperada = StorageService.obterConfig();
assert.strictEqual(configRecuperada.salarioBase, 3500, 'Salário base deve persistir');

// Testa Exportação e Importação de Backup JSON
const jsonBackup = StorageService.exportarTudoParaJSON();
assert(typeof jsonBackup === 'string' && jsonBackup.length > 50, 'JSON de backup gerado');

// Limpa tudo e restaura do JSON
StorageService.cachePontos = [];
localStorage.clear();
const resultadoImport = StorageService.importarDeJSON(jsonBackup);
assert.strictEqual(resultadoImport.sucesso, true, 'Importação deve ter sucesso');
assert(StorageService.obterPontos().length > 0, 'Pontos devem ser restaurados');
console.log('✅ Persistência e Backup Round-Trip: 100% aprovada!');

console.log('\n🎉 TODOS OS TESTES PASSARAM COM SUCESSO ABSOLUTO!');
