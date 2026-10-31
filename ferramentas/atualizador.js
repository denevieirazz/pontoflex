/**
 * Módulo de Atualização do Aplicativo (OTA - Over The Air) e Instalação PWA
 * Resolve o problema de não precisar reinstalar APK manualmente toda vez.
 */

export class AtualizadorService {
  static eventoInstalacaoPWA = null;
  static swRegistration = null;

  /**
   * Registra o Service Worker e monitora atualizações
   */
  static inicializar(callbacks = {}) {
    const { onNovaVersao, onInstalavel } = callbacks;

    // Captura o evento de instalação do app na tela inicial
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.eventoInstalacaoPWA = e;
      if (typeof onInstalavel === 'function') {
        onInstalavel(true);
      }
    });

    // Se o navegador suporta Service Workers
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
          .then((reg) => {
            this.swRegistration = reg;

            // Se já há um worker esperando, já temos nova versão!
            if (reg.waiting && typeof onNovaVersao === 'function') {
              onNovaVersao();
            }

            // Monitora novas versões encontradas
            reg.addEventListener('updatefound', () => {
              const novoWorker = reg.installing;
              if (novoWorker) {
                novoWorker.addEventListener('statechange', () => {
                  if (novoWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    if (typeof onNovaVersao === 'function') {
                      onNovaVersao();
                    }
                  }
                });
              }
            });
          })
          .catch((err) => {
            console.warn('Falha ao registrar Service Worker:', err);
          });

        // Quando o controller mudar (após skipWaiting), recarrega
        let recarregando = false;
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          if (!recarregando) {
            recarregando = true;
            window.location.reload();
          }
        });
      });
    }
  }

  /**
   * Força a aplicação da nova versão do app sem reinstalação manual
   */
  static aplicarAtualizacao() {
    if (this.swRegistration && this.swRegistration.waiting) {
      this.swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
    } else {
      window.location.reload();
    }
  }

  /**
   * Dispara a tela de instalação como aplicativo nativo no celular
   */
  static async solicitarInstalacao() {
    if (!this.eventoInstalacaoPWA) return false;
    this.eventoInstalacaoPWA.prompt();
    const { outcome } = await this.eventoInstalacaoPWA.userChoice;
    this.eventoInstalacaoPWA = null;
    return outcome === 'accepted';
  }
}
