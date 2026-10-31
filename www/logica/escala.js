/**
 * Motor de Cálculo da Escala (Dia Sim / Dia Não - 1x1)
 * Permite prever dias de trabalho e folga com base em uma data de referência.
 */

export class EscalaService {
  /**
   * Converte string YYYY-MM-DD para objeto Date normalizado para meia-noite UTC local
   */
  static normalizarData(dataStr) {
    if (!dataStr) return new Date();
    const [ano, mes, dia] = dataStr.split('-').map(Number);
    return new Date(ano, mes - 1, dia, 0, 0, 0, 0);
  }

  /**
   * Formata objeto Date para YYYY-MM-DD
   */
  static formatarDataISO(date) {
    const ano = date.getFullYear();
    const mes = String(date.getMonth() + 1).padStart(2, '0');
    const dia = String(date.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
  }

  /**
   * Calcula a diferença exata em dias inteiros entre duas datas
   */
  static diferencaEmDias(dataAlvo, dataReferencia) {
    const msPorDia = 1000 * 60 * 60 * 24;
    const d1 = this.normalizarData(dataAlvo).getTime();
    const d0 = this.normalizarData(dataReferencia).getTime();
    return Math.round((d1 - d0) / msPorDia);
  }

  /**
   * Verifica se uma data específica é dia de trabalho ou folga
   * @param {string} dataAlvo YYYY-MM-DD
   * @param {string} dataInicioEscala YYYY-MM-DD (Dia em que sabidamente foi trabalho)
   * @returns {boolean} true se for dia de trabalho, false se for folga
   */
  static isDiaDeTrabalho(dataAlvo, dataInicioEscala) {
    if (!dataInicioEscala) return false;
    const diff = this.diferencaEmDias(dataAlvo, dataInicioEscala);
    // Na escala 1x1: dia 0 = trabalho, dia 1 = folga, dia 2 = trabalho...
    // O operador resto em JS pode ser negativo para datas anteriores, corrigimos com Math.abs ou módulo positivo:
    const mod = ((diff % 2) + 2) % 2;
    return mod === 0;
  }

  /**
   * Retorna os detalhes de status de uma data (Trabalho / Folga)
   */
  static obterStatusDia(dataAlvo, dataInicioEscala) {
    if (!dataInicioEscala) {
      return {
        configurada: false,
        isTrabalho: false,
        tipo: 'indefinido',
        rotulo: 'Escala não definida',
        descricao: 'Defina o dia inicial nas configurações.'
      };
    }

    const ehTrabalho = this.isDiaDeTrabalho(dataAlvo, dataInicioEscala);
    return {
      configurada: true,
      isTrabalho: ehTrabalho,
      tipo: ehTrabalho ? 'trabalho' : 'folga',
      rotulo: ehTrabalho ? 'Dia de Trabalho' : 'Dia de Folga',
      descricao: ehTrabalho
        ? 'Plantão / Turno programado na sua escala 1x1.'
        : 'Folga programada na sua escala 1x1.'
    };
  }

  /**
   * Gera a lista completa de dias de um determinado mês e ano com seus status
   * @param {number} ano
   * @param {number} mes (1 a 12)
   * @param {string} dataInicioEscala YYYY-MM-DD
   */
  static obterCalendarioMes(ano, mes, dataInicioEscala) {
    const resultado = [];
    const totalDias = new Date(ano, mes, 0).getDate();

    for (let dia = 1; dia <= totalDias; dia++) {
      const dataStr = `${ano}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
      const status = this.obterStatusDia(dataStr, dataInicioEscala);
      const dataObj = new Date(ano, mes - 1, dia);

      resultado.push({
        dia,
        dataStr,
        diaSemana: dataObj.getDay(), // 0 = Domingo, 6 = Sábado
        nomeDiaSemana: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][dataObj.getDay()],
        isTrabalho: status.isTrabalho,
        tipo: status.tipo
      });
    }

    return resultado;
  }

  /**
   * Encontra a próxima data de trabalho a partir de hoje
   */
  static obterProximoDiaTrabalho(dataInicioEscala) {
    if (!dataInicioEscala) return null;
    const hoje = new Date();
    for (let i = 0; i < 30; i++) {
      const d = new Date(hoje);
      d.setDate(hoje.getDate() + i);
      const dataStr = this.formatarDataISO(d);
      if (this.isDiaDeTrabalho(dataStr, dataInicioEscala)) {
        return { dataStr, diasFaltando: i };
      }
    }
    return null;
  }

  /**
   * Retorna o status da data de hoje
   */
  static obterStatusHoje(dataInicioEscala) {
    const hojeStr = this.formatarDataISO(new Date());
    return this.obterStatusDia(hojeStr, dataInicioEscala);
  }
}
