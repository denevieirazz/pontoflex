/**
 * Motor de Cálculo de Horas Trabalhadas e Horas Extras
 */

export class PontoService {
  /**
   * Converte "HH:MM" para minutos totais do dia (0 a 1439)
   */
  static horaParaMinutos(horaStr) {
    if (!horaStr || typeof horaStr !== 'string' || !horaStr.includes(':')) return 0;
    const [h, m] = horaStr.split(':').map(Number);
    return (h * 60) + (m || 0);
  }

  /**
   * Converte minutos totais para string formatada "HH:MM" ou "Xh Ym"
   */
  static minutosParaHoraStr(minutosTotais, formatoAmigavel = false) {
    if (isNaN(minutosTotais) || minutosTotais <= 0) {
      return formatoAmigavel ? '0h 00m' : '00:00';
    }
    const h = Math.floor(minutosTotais / 60);
    const m = Math.floor(minutosTotais % 60);
    if (formatoAmigavel) {
      return `${h}h ${String(m).padStart(2, '0')}m`;
    }
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }

  /**
   * Calcula os minutos trabalhados no dia levando em consideração intervalo e turnos noturnos
   */
  static calcularMinutosTrabalhados(entrada, saida, saidaAlmoco = '', retornoAlmoco = '') {
    if (!entrada || !saida) return 0;

    let minEntrada = this.horaParaMinutos(entrada);
    let minSaida = this.horaParaMinutos(saida);

    // Tratamento de turno noturno (ex: entrou 22:00 e saiu 06:00 do dia seguinte)
    if (minSaida < minEntrada) {
      minSaida += 24 * 60;
    }

    let totalBruto = minSaida - minEntrada;

    // Desconta intervalo de almoço se preenchido
    if (saidaAlmoco && retornoAlmoco) {
      let minAlmocoSai = this.horaParaMinutos(saidaAlmoco);
      let minAlmocoVolta = this.horaParaMinutos(retornoAlmoco);
      if (minAlmocoVolta < minAlmocoSai) {
        minAlmocoVolta += 24 * 60;
      }
      const duracaoAlmoco = minAlmocoVolta - minAlmocoSai;
      if (duracaoAlmoco > 0 && duracaoAlmoco < totalBruto) {
        totalBruto -= duracaoAlmoco;
      }
    }

    return Math.max(0, totalBruto);
  }

  /**
   * Calcula a divisão entre horas normais e horas extras de um registro
   * @param {Object} params
   * @param {number} params.minutosTrabalhados
   * @param {boolean} params.isDiaTrabalhoEscala Se era dia previsto de trabalho na escala 1x1
   * @param {number} params.jornadaPadraoHoras Ex: 8 ou 12
   */
  static apurarHorasDoDia({ minutosTrabalhados, isDiaTrabalhoEscala, jornadaPadraoHoras = 8 }) {
    const minutosJornadaPadrao = jornadaPadraoHoras * 60;

    // CASO 1: Trabalhou em dia de folga (plantão extra / folga vendida / bico)
    // Na legislação e prática, todo o tempo trabalhado na folga é considerado HORA EXTRA (100%)
    if (!isDiaTrabalhoEscala) {
      return {
        minutosNormais: 0,
        minutosExtrasNormais: 0, // Extras 50%
        minutosExtrasFolga: minutosTrabalhados, // Extras 100%
        totalMinutos: minutosTrabalhados,
        ehFolgaTrabalhada: true
      };
    }

    // CASO 2: Dia normal de trabalho
    if (minutosTrabalhados <= minutosJornadaPadrao) {
      return {
        minutosNormais: minutosTrabalhados,
        minutosExtrasNormais: 0,
        minutosExtrasFolga: 0,
        totalMinutos: minutosTrabalhados,
        ehFolgaTrabalhada: false
      };
    }

    // Ultrapassou a jornada padrão no dia normal
    const minutosExtras = minutosTrabalhados - minutosJornadaPadrao;
    return {
      minutosNormais: minutosJornadaPadrao,
      minutosExtrasNormais: minutosExtras,
      minutosExtrasFolga: 0,
      totalMinutos: minutosTrabalhados,
      ehFolgaTrabalhada: false
    };
  }

  /**
   * Consolida todos os pontos de um mês/ano selecionado
   */
  static consolidarMes(pontos, ano, mes, dataInicioEscala, jornadaPadraoHoras = 8) {
    const mesFormatado = String(mes).padStart(2, '0');
    const prefixo = `${ano}-${mesFormatado}`;

    const pontosDoMes = pontos.filter(p => p.data && p.data.startsWith(prefixo));

    let totalMinutosGerais = 0;
    let totalMinutosNormais = 0;
    let totalMinutosExtras50 = 0;
    let totalMinutosExtras100 = 0;
    let diasTrabalhados = 0;
    let diasFolgaTrabalhados = 0;

    // Mapeamento enriquecido
    const registrosDetalhados = pontosDoMes.map(p => {
      // Se não houver data de escala configurada, assume dia normal
      const isDiaTrabalhoEscala = dataInicioEscala
        ? (p.isDiaTrabalhoEscala !== undefined ? p.isDiaTrabalhoEscala : true)
        : true;

      const minutosTrabalhados = p.totalMinutosTrabalhados ||
        this.calcularMinutosTrabalhados(p.entrada, p.saida, p.saidaAlmoco, p.retornoAlmoco);

      const apuracao = this.apurarHorasDoDia({
        minutosTrabalhados,
        isDiaTrabalhoEscala,
        jornadaPadraoHoras
      });

      if (minutosTrabalhados > 0) {
        diasTrabalhados++;
        if (apuracao.ehFolgaTrabalhada) diasFolgaTrabalhados++;
      }

      totalMinutosGerais += apuracao.totalMinutos;
      totalMinutosNormais += apuracao.minutosNormais;
      totalMinutosExtras50 += apuracao.minutosExtrasNormais;
      totalMinutosExtras100 += apuracao.minutosExtrasFolga;

      return {
        ...p,
        totalMinutosTrabalhados: minutosTrabalhados,
        apuracao
      };
    });

    return {
      ano,
      mes,
      diasTrabalhados,
      diasFolgaTrabalhados,
      totalMinutosGerais,
      totalMinutosNormais,
      totalMinutosExtras50,
      totalMinutosExtras100,
      totalMinutosExtrasGerais: totalMinutosExtras50 + totalMinutosExtras100,
      registros: registrosDetalhados
    };
  }
}
