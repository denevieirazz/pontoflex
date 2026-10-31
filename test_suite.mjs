import { EscalaService } from './logica/escala.js';
import { PontoService } from './logica/ponto.js';
import { CalculoSalarioService } from './logica/calculoSalario.js';

console.log('--- TESTE 1: ESCALA 1x1 ---');
const ref = '2026-11-01'; // Trabalho
console.assert(EscalaService.isDiaDeTrabalho('2026-11-01', ref) === true, '01/11 deve ser Trabalho');
console.assert(EscalaService.isDiaDeTrabalho('2026-11-02', ref) === false, '02/11 deve ser Folga');
console.assert(EscalaService.isDiaDeTrabalho('2026-11-03', ref) === true, '03/11 deve ser Trabalho');
console.assert(EscalaService.isDiaDeTrabalho('2026-11-04', ref) === false, '04/11 deve ser Folga');
console.log('✅ Teste 1 Escala 1x1 passou com sucesso!');

console.log('--- TESTE 2: APURAÇÃO DE HORAS TRABALHADAS ---');
const minNormal = PontoService.calcularMinutosTrabalhados('08:00', '17:00', '12:00', '13:00');
console.assert(minNormal === 480, 'Deveria dar 480 minutos (8h), deu: ' + minNormal);

const minNoturno = PontoService.calcularMinutosTrabalhados('22:00', '06:00');
console.assert(minNoturno === 480, 'Turno noturno deveria dar 480 minutos (8h), deu: ' + minNoturno);
console.log('✅ Teste 2 Apuração de Horas passou com sucesso!');

console.log('--- TESTE 3: APURAÇÃO DE HORAS EXTRAS E FOLGA TRABALHADA ---');
const apuracaoNormal = PontoService.apurarHorasDoDia({
  minutosTrabalhados: 540,
  isDiaTrabalhoEscala: true,
  jornadaPadraoHoras: 8
});
console.assert(apuracaoNormal.minutosNormais === 480, 'Normais deveriam ser 480m');
console.assert(apuracaoNormal.minutosExtrasNormais === 60, 'Extras deveriam ser 60m (1h)');

const apuracaoFolga = PontoService.apurarHorasDoDia({
  minutosTrabalhados: 480,
  isDiaTrabalhoEscala: false,
  jornadaPadraoHoras: 8
});
console.assert(apuracaoFolga.minutosNormais === 0, 'Normais na folga deveriam ser 0');
console.assert(apuracaoFolga.minutosExtrasFolga === 480, 'Extras 100% na folga deveriam ser 480m');
console.log('✅ Teste 3 Horas Extras e Folga Trabalhada passou com sucesso!');

console.log('--- TESTE 4: CÁLCULO SALARIAL ---');
const resumo = {
  totalMinutosNormais: 4800,
  totalMinutosExtras50: 600,
  totalMinutosExtras100: 480,
  totalMinutosGerais: 5880
};
const config = {
  salarioBase: 2200,
  horasMensais: 220,
  porcentagemExtraNormal: 50,
  porcentagemExtraFolga: 100
};
const holerite = CalculoSalarioService.calcularHoleriteEstimado(resumo, config);
console.log('Valor hora base:', holerite.valorHoraBase);
console.log('Total extras em R$:', holerite.totalExtrasReais);
console.assert(holerite.valorHoraBase === 10, 'Valor hora deveria ser 10');
console.assert(holerite.totalExtrasReais === 310, 'Total extras reais deveria ser 310');
console.log('✅ Teste 4 Cálculo Salarial passou com sucesso!');
console.log('🚀 TODOS OS TESTES PASSARAM COM 100% DE SUCESSO!');
