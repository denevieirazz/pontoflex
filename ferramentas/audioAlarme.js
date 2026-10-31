/**
 * Sintetizador de Áudio para Alarme (100% Offline via Web Audio API)
 * Não necessita de arquivos externos de áudio, funciona em qualquer dispositivo.
 */

export class AudioAlarmeService {
  static audioCtx = null;
  static loopInterval = null;
  static estaTocando = false;

  /**
   * Obtém ou inicializa o AudioContext do navegador
   */
  static obterContexto() {
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      this.audioCtx = new AudioContextClass();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  /**
   * Toca uma nota individual com rampa de ataque e decaimento
   */
  static emitirTom(frequencia, duracaoSegundos, tipoOnda = 'sine', volumeMax = 0.3) {
    try {
      const ctx = this.obterContexto();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = tipoOnda;
      osc.frequency.setValueAtTime(frequencia, ctx.currentTime);

      // Envelope de volume suave (Attack -> Decay)
      gain.gain.setValueAtTime(0.001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(volumeMax, ctx.currentTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duracaoSegundos);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + duracaoSegundos);
    } catch (e) {
      console.warn('Áudio bloqueado ou não suportado:', e);
    }
  }

  /**
   * Padrão sonoro: Sino Suave
   */
  static tocarPadraoSuave() {
    // Acorde suave estilo sino matinal (Fá sustenido maior pentatônica)
    const notas = [554.37, 659.25, 830.61]; // C#5, E5, G#5
    notas.forEach((freq, idx) => {
      setTimeout(() => {
        this.emitirTom(freq, 0.8, 'sine', 0.25);
      }, idx * 220);
    });
  }

  /**
   * Padrão sonoro: Despertador Clássico
   */
  static tocarPadraoClassico() {
    // Bip duplo tradicional
    this.emitirTom(880, 0.12, 'square', 0.18);
    setTimeout(() => {
      this.emitirTom(880, 0.12, 'square', 0.18);
    }, 180);
  }

  /**
   * Padrão sonoro: Energético
   */
  static tocarPadraoVigoroso() {
    // Arpejo ascendente de alerta
    const notas = [523.25, 659.25, 783.99, 1046.50];
    notas.forEach((freq, idx) => {
      setTimeout(() => {
        this.emitirTom(freq, 0.15, 'triangle', 0.3);
      }, idx * 120);
    });
  }

  /**
   * Dispara o alarme em loop até ser silenciado
   */
  static iniciar(tipoSom = 'suave') {
    this.parar();
    this.estaTocando = true;

    const tocarCiclo = () => {
      if (!this.estaTocando) return;

      if (tipoSom === 'classico') {
        this.tocarPadraoClassico();
      } else if (tipoSom === 'vigoroso') {
        this.tocarPadraoVigoroso();
      } else {
        this.tocarPadraoSuave();
      }

      // Vibração no celular se disponível
      if (navigator.vibrate) {
        navigator.vibrate([400, 200, 400]);
      }
    };

    tocarCiclo();
    this.loopInterval = setInterval(tocarCiclo, 1800);
  }

  /**
   * Testa o som por 3 segundos
   */
  static testar(tipoSom = 'suave') {
    this.iniciar(tipoSom);
    setTimeout(() => {
      this.parar();
    }, 3600);
  }

  /**
   * Pára o alarme imediatamente
   */
  static parar() {
    this.estaTocando = false;
    if (this.loopInterval) {
      clearInterval(this.loopInterval);
      this.loopInterval = null;
    }
    if (navigator.vibrate) {
      navigator.vibrate(0);
    }
  }
}
