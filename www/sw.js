/**
 * Service Worker - PWA 100% Offline
 * Armazena todos os recursos estáticos em cache e gerencia atualizações instantâneas.
 */

const CACHE_NAME = 'pontoflex-cache-v3.3.0';

// Recursos necessários para funcionamento 100% offline
const ARQUIVOS_CACHE = [
  './',
  './index.html',
  './app.js',
  './manifest.webmanifest',
  './design/tokens.css',
  './design/layout.css',
  './design/componentes.css',
  './design/forms.css',
  './design/kpi.css',
  './design/alarme.css',
  './design/calendario.css',
  './design/modal.css',
  './design/toast.css',
  './design/relatorio.css',
  './design/ui.js',
  './design/uiModal.js',
  './design/uiRender.js',
  './design/uiCalendario.js',
  './design/uiAlarme.js',
  './design/uiGanhos.js',
  './design/toast.js',
  './logica/storage.js',
  './logica/escala.js',
  './logica/ponto.js',
  './logica/calculoSalario.js',
  './logica/feriados.js',
  './logica/alarme.js',
  './ferramentas/audioAlarme.js',
  './ferramentas/exportador.js',
  './ferramentas/backup.js',
  './ferramentas/syncDataHora.js',
  './ferramentas/atualizador.js',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', (evento) => {
  evento.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ARQUIVOS_CACHE).catch((err) => {
        console.warn('Algum arquivo não pôde ser pré-armazenado no cache:', err);
      });
    })
  );
});

self.addEventListener('activate', (evento) => {
  evento.waitUntil(
    caches.keys().then((nomesChaves) => {
      return Promise.all(
        nomesChaves.map((chave) => {
          if (chave !== CACHE_NAME) {
            console.log('Removendo cache antigo:', chave);
            return caches.delete(chave);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (evento) => {
  // Ignora requisições de outras origens ou de sincronização de hora externa
  if (!evento.request.url.startsWith(self.location.origin)) {
    return;
  }

  evento.respondWith(
    caches.match(evento.request).then((respostaCache) => {
      if (respostaCache) {
        // Retorna do cache imediatamente para máxima velocidade offline
        // Em paralelo, tenta atualizar o cache se houver conexão
        fetch(evento.request).then((respostaRede) => {
          if (respostaRede && respostaRede.status === 200) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(evento.request, respostaRede);
            });
          }
        }).catch(() => {
          // Offline, operação normal com cache
        });
        return respostaCache;
      }

      // Se não estava no cache, busca na rede
      return fetch(evento.request).then((respostaRede) => {
        if (!respostaRede || respostaRede.status !== 200 || respostaRede.type !== 'basic') {
          return respostaRede;
        }
        const respostaClonada = respostaRede.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(evento.request, respostaClonada);
        });
        return respostaRede;
      });
    }).catch(() => {
      // Fallback em caso de erro total offline
      return caches.match('./index.html');
    })
  );
});

// Permite que o cliente solicite atualização imediata
self.addEventListener('message', (evento) => {
  if (evento.data && evento.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
