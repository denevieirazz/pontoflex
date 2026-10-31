/**
 * Motor de Cálculo Salarial e Estimativa de Horas Extras
 */

export class CalculoSalarioService {
  /**
   * Formata número para moeda Real Brasileiro (R$ 1.234,56)
   */
  static formatarMoeda(valor) {
    if (isNaN(valor)) valor = 0;
    return valor.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  /**
   * Converte minutos em fração decimal de horas (ex: 90 minutos -> 1.5 horas)
   */
  static minutosParaHorasDecimais(minutos) {
    if (!minutos || isNaN(minutos)) return 0;
    return minutos / 60;
  }

  /**
   * Realiza todo o cálculo financeiro do mês
   * @param {Object} resumoConsolidado Retorno do PontoService.consolidarMes
   * @param {Object} config Configurações salariais do usuário
   */
  static calcularHoleriteEstimado(resumoConsolidado, config) {
    const salarioBase = Number(config.salarioBase) || 0;
    const divisorMensal = Number(config.horasMensais) || 220;
    const taxaExtra50 = (Number(config.porcentagemExtraNormal) || 50) / 100;
    const taxaExtra100 = (Number(config.porcentagemExtraFolga) || 100) / 100;

    // Valor da hora normal de trabalho
    const valorHoraBase = divisorMensal > 0 ? (salarioBase / divisorMensal) : 0;

    // Horas em formato decimal
    const horasNormais = this.minutosParaHorasDecimais(resumoConsolidado.totalMinutosNormais);
    const horasExtras50 = this.minutosParaHorasDecimais(resumoConsolidado.totalMinutosExtras50);
    const horasExtras100 = this.minutosParaHorasDecimais(resumoConsolidado.totalMinutosExtras100);
    const horasExtrasTotais = horasExtras50 + horasExtras100;

    // Valores unitários de cada tipo de hora extra
    const valorHoraExtra50 = valorHoraBase * (1 + taxaExtra50);
    const valorHoraExtra100 = valorHoraBase * (1 + taxaExtra100);

    // Total a receber em R$ de horas extras
    const totalExtra50Reais = horasExtras50 * valorHoraExtra50;
    const totalExtra100Reais = horasExtras100 * valorHoraExtra100;
    const totalExtrasReais = totalExtra50Reais + totalExtra100Reais;

    // Estimativa de DSR (Descanso Semanal Remunerado) sobre Horas Extras:
    // Média padrão CLT: ~16.6% do valor das horas extras (ou 1/6)
    const estimativaDSR = totalExtrasReais > 0 ? (totalExtrasReais * 0.1666) : 0;

    // Salário bruto total estimado
    const totalBrutoEstimado = salarioBase + totalExtrasReais + estimativaDSR;

    return {
      salarioBase,
      divisorMensal,
      valorHoraBase,
      taxaExtra50: taxaExtra50 * 100,
      taxaExtra100: taxaExtra100 * 100,
      horasNormais,
      horasExtras50,
      horasExtras100,
      horasExtrasTotais,
      valorHoraExtra50,
      valorHoraExtra100,
      totalExtra50Reais,
      totalExtra100Reais,
      totalExtrasReais,
      estimativaDSR,
      totalBrutoEstimado,
      // Versões formatadas em string para exibição rápida
      formatado: {
        salarioBase: this.formatarMoeda(salarioBase),
        valorHoraBase: this.formatarMoeda(valorHoraBase),
        valorHoraExtra50: this.formatarMoeda(valorHoraExtra50),
        valorHoraExtra100: this.formatarMoeda(valorHoraExtra100),
        totalExtra50Reais: this.formatarMoeda(totalExtra50Reais),
        totalExtra100Reais: this.formatarMoeda(totalExtra100Reais),
        totalExtrasReais: this.formatarMoeda(totalExtrasReais),
        estimativaDSR: this.formatarMoeda(estimativaDSR),
        totalBrutoEstimado: this.formatarMoeda(totalBrutoEstimado)
      }
    };
  }
}
