/**
 * Sincronizador de Data e Hora e Monitor de Conectividade
 * Permite checar a hora oficial na rede quando houver internet,
 * funcionando 100% offline com o relógio local caso contrário.
 */

export class SyncDataHoraService {
  static diferencaMilissegundosServidor = 0;
  static ultimaSincronizacao = null;
  static statusOnline = navigator.onLine;

  /**
   * Inicializa ouvintes de eventos online/offline
   */
  static monitorarConexao(onStatusChange) {
    window.addEventListener('online', () => {
      this.statusOnline = true;
      this.sincronizarComRede();
      if (typeof onStatusChange === 'function') onStatusChange(true);
    });

    window.addEventListener('offline', () => {
      this.statusOnline = false;
      if (typeof onStatusChange === 'function') onStatusChange(false);
    });

    // Tentativa inicial se estiver online
    if (this.statusOnline) {
      this.sincronizarComRede();
    }
  }

  /**
   * Tenta sincronizar a hora com um servidor NTP/HTTP público
   */
  static async sincronizarComRede() {
    if (!navigator.onLine) return false;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);

      // Usamos uma requisição HEAD ultraleve que retorna o cabeçalho 'date'
      const resposta = await fetch('https://www.cloudflare.com/cdn-cgi/trace', {
        method: 'GET',
        cache: 'no-store',
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (resposta.ok) {
        const texto = await resposta.text();
        const linhaTs = texto.split('\n').find(l => l.startsWith('ts='));
        if (linhaTs) {
          const timestampUnixSegundos = parseFloat(linhaTs.replace('ts=', ''));
          const dataRedeMs = timestampUnixSegundos * 1000;
          this.diferencaMilissegundosServidor = dataRedeMs - Date.now();
          this.ultimaSincronizacao = new Date(dataRedeMs);
          return true;
        }
      }
    } catch {
      // Falha silenciosa: offline total, usa relógio do dispositivo
    }
    return false;
  }

  /**
   * Obtém a data/hora atual precisa (ajustada pelo servidor se disponível, ou local)
   */
  static obterAgora() {
    const agoraMs = Date.now() + this.diferencaMilissegundosServidor;
    return new Date(agoraMs);
  }

  /**
   * Obtém status legível da conectividade
   */
  static obterStatus() {
    return {
      online: navigator.onLine,
      sincronizado: this.ultimaSincronizacao !== null,
      ultimaSync: this.ultimaSincronizacao
    };
  }
}
