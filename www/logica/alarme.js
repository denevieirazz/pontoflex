/**
 * Gerenciador de Alarme Inteligente para Escala 1x1 (Dia Sim / Dia Não)
 * Resolve a dor do usuário de não precisar alterar o despertador todo dia.
 */

import { EscalaService } from './escala.js';
import { StorageService } from './storage.js';

export class AlarmeService {
  static intervaloVerificacao = null;
  static ultimoMinutoDisparado = '';
  static onDisparoCallback = null;
  static emDisparo = false;

  /**
   * Inicializa o monitoramento do alarme
   */
  static iniciarMonitoramento(onDisparo) {
    this.onDisparoCallback = onDisparo;
    if (this.intervaloVerificacao) clearInterval(this.intervaloVerificacao);

    // Checa a cada 10 segundos
    this.intervaloVerificacao = setInterval(() => {
      this.verificarAlarme();
    }, 10000);

    // Executa uma checagem imediata
    this.verificarAlarme();
  }

  /**
   * Pára o monitoramento
   */
  static pararMonitoramento() {
    if (this.intervaloVerificacao) {
      clearInterval(this.intervaloVerificacao);
      this.intervaloVerificacao = null;
    }
  }

  /**
   * Verifica se o alarme deve disparar agora
   */
  static verificarAlarme() {
    if (this.emDisparo) return;

    const config = StorageService.obterConfig();
    if (!config.alarmeAtivo || !config.alarmeHorario || !config.dataInicioEscala) {
      return;
    }

    const agora = new Date();
    const dataHojeStr = EscalaService.formatarDataISO(agora);
    const horaAtualStr = `${String(agora.getHours()).padStart(2, '0')}:${String(agora.getMinutes()).padStart(2, '0')}`;
    const chaveMinuto = `${dataHojeStr}_${horaAtualStr}`;

    // Evita tocar duas vezes no mesmo minuto
    if (this.ultimoMinutoDisparado === chaveMinuto) {
      return;
    }

    // Só dispara se o horário coincidir exatamente
    if (horaAtualStr !== config.alarmeHorario) {
      return;
    }

    // REGRA DE OURO: Verifica se HOJE é dia de trabalho na escala 1x1
    const ehDiaDeTrabalho = EscalaService.isDiaDeTrabalho(dataHojeStr, config.dataInicioEscala);

    if (ehDiaDeTrabalho) {
      this.ultimoMinutoDisparado = chaveMinuto;
      this.emDisparo = true;
      if (typeof this.onDisparoCallback === 'function') {
        this.onDisparoCallback({
          dataStr: dataHojeStr,
          horario: horaAtualStr,
          som: config.alarmeSom || 'suave',
          mensagem: 'Hora de acordar! Hoje é dia de trabalho na sua escala.'
        });
      }
    }
  }

  /**
   * Informa se o próximo alarme tocará amanhã ou não
   */
  static obterPrevisaoProximoAlarme() {
    const config = StorageService.obterConfig();
    if (!config.alarmeAtivo) {
      return { ativo: false, texto: 'Alarme desligado' };
    }
    if (!config.dataInicioEscala) {
      return { ativo: false, texto: 'Configure a data da escala' };
    }

    const agora = new Date();
    const hojeStr = EscalaService.formatarDataISO(agora);
    const ehTrabalhoHoje = EscalaService.isDiaDeTrabalho(hojeStr, config.dataInicioEscala);

    const amanha = new Date(agora);
    amanha.setDate(agora.getDate() + 1);
    const amanhaStr = EscalaService.formatarDataISO(amanha);
    const ehTrabalhoAmanha = EscalaService.isDiaDeTrabalho(amanhaStr, config.dataInicioEscala);

    const horaAtualMinutos = (agora.getHours() * 60) + agora.getMinutes();
    const [hAlarme, mAlarme] = (config.alarmeHorario || '06:00').split(':').map(Number);
    const alarmeMinutos = (hAlarme * 60) + mAlarme;

    if (ehTrabalhoHoje && horaAtualMinutos < alarmeMinutos) {
      return {
        ativo: true,
        vaiTocar: true,
        quando: 'Hoje',
        horario: config.alarmeHorario,
        texto: `Toca HOJE às ${config.alarmeHorario} (Dia de Trabalho)`
      };
    }

    if (ehTrabalhoAmanha) {
      return {
        ativo: true,
        vaiTocar: true,
        quando: 'Amanhã',
        horario: config.alarmeHorario,
        texto: `Toca AMANHÃ às ${config.alarmeHorario} (Dia de Trabalho)`
      };
    }

    return {
      ativo: true,
      vaiTocar: false,
      quando: 'Folga',
      horario: config.alarmeHorario,
      texto: `Amanhã é FOLGA! O alarme ficará em silêncio para você descansar.`
    };
  }

  /**
   * Alias de previsão de disparo
   */
  static obterPrevisaoProximoDisparo(config) {
    return this.obterPrevisaoProximoAlarme();
  }

  /**
   * Finaliza o disparo atual
   */
  static silenciar() {
    this.emDisparo = false;
  }
}
