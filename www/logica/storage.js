/**
 * Motor de Persistência Tripla Indestrutível
 * Camadas: 1. SharedPreferences Nativo (Android) | 2. IndexedDB (LevelDB) | 3. LocalStorage
 * Dados nunca se perdem ao fechar o app, reiniciar o celular ou limpar cache do WebView.
 */

const STORAGE_KEYS = {
  CONFIG: 'pontoflex_config_v2',
  PONTOS: 'pontoflex_registros_v2'
};

const DB_NOME = 'pontoflex_indexeddb';
const DB_VERSAO = 1;

const CONFIG_PADRAO = {
  nomeUsuario: '',
  cargo: '',
  empresa: '',
  salarioBase: 2000.0,
  horasMensais: 220,
  jornadaPadraoHoras: 8,
  porcentagemExtraNormal: 50,
  porcentagemExtraFolga: 100,
  tipoEscala: '1x1',
  dataInicioEscala: '',
  alarmeAtivo: false,
  alarmeHorario: '06:00',
  alarmeSom: 'suave',
  alarmeMinutosAntes: 0
};

export class StorageService {
  static dbPromise = null;
  static cacheConfig = null;
  static cachePontos = null;
  static pronto = false;

  static async obterDB() {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve) => {
      try {
        const req = indexedDB.open(DB_NOME, DB_VERSAO);
        req.onupgradeneeded = (e) => {
          const db = e.target.result;
          if (!db.objectStoreNames.contains('config')) {
            db.createObjectStore('config', { keyPath: 'chave' });
          }
          if (!db.objectStoreNames.contains('pontos')) {
            db.createObjectStore('pontos', { keyPath: 'id' });
          }
        };
        req.onsuccess = (e) => resolve(e.target.result);
        req.onerror = () => resolve(null);
      } catch (err) {
        console.warn('IndexedDB indisponível:', err);
        resolve(null);
      }
    });

    return this.dbPromise;
  }

  static getNativePreferences() {
    try {
      if (window.Capacitor?.Plugins?.Preferences) {
        return window.Capacitor.Plugins.Preferences;
      }
    } catch {
      // Ambiente web padrão
    }
    return null;
  }

  /**
   * Inicializa e sincroniza todas as camadas de armazenamento antes de exibir a interface
   */
  static async inicializar() {
    // 1. Carrega imediatamente do LocalStorage (síncrono, resposta rápida)
    let configLS = null;
    let pontosLS = null;
    try {
      const c = localStorage.getItem(STORAGE_KEYS.CONFIG);
      if (c) configLS = JSON.parse(c);
      const p = localStorage.getItem(STORAGE_KEYS.PONTOS);
      if (p) pontosLS = JSON.parse(p);
    } catch (e) {
      console.warn('Erro ao ler LocalStorage inicial:', e);
    }

    this.cacheConfig = configLS ? { ...CONFIG_PADRAO, ...configLS } : { ...CONFIG_PADRAO };
    this.cachePontos = Array.isArray(pontosLS) ? pontosLS : [];

    // 2. Consulta SharedPreferences nativo do Android via Capacitor
    const prefs = this.getNativePreferences();
    if (prefs) {
      try {
        const { value: configNat } = await prefs.get({ key: STORAGE_KEYS.CONFIG });
        if (configNat) {
          const cfg = JSON.parse(configNat);
          this.cacheConfig = { ...this.cacheConfig, ...cfg };
        }
        const { value: pontosNat } = await prefs.get({ key: STORAGE_KEYS.PONTOS });
        if (pontosNat) {
          const pts = JSON.parse(pontosNat);
          if (Array.isArray(pts) && pts.length > 0) {
            this.mesclarPontos(pts);
          }
        }
      } catch (err) {
        console.warn('Erro ao carregar SharedPreferences:', err);
      }
    }

    // 3. Consulta IndexedDB como camada persistente do navegador / WebView
    try {
      const db = await this.obterDB();
      if (db) {
        await new Promise((resolve) => {
          const tx = db.transaction(['config', 'pontos'], 'readonly');
          const storeCfg = tx.objectStore('config');
          const storePts = tx.objectStore('pontos');

          const reqCfg = storeCfg.get('app_config');
          reqCfg.onsuccess = () => {
            if (reqCfg.result && reqCfg.result.valor) {
              this.cacheConfig = { ...this.cacheConfig, ...reqCfg.result.valor };
            }
          };

          const reqPts = storePts.getAll();
          reqPts.onsuccess = () => {
            if (Array.isArray(reqPts.result) && reqPts.result.length > 0) {
              this.mesclarPontos(reqPts.result);
            }
          };

          tx.oncomplete = () => resolve();
          tx.onerror = () => resolve();
        });
      }
    } catch (err) {
      console.warn('Erro ao sincronizar IndexedDB:', err);
    }

    this.persistirSincronamente();
    this.pronto = true;
    return true;
  }

  static mesclarPontos(novosPontos) {
    if (!Array.isArray(novosPontos)) return;
    const mapa = new Map();
    this.cachePontos.forEach(p => mapa.set(p.data || p.id, p));
    novosPontos.forEach(p => {
      const chave = p.data || p.id;
      mapa.set(chave, { ...(mapa.get(chave) || {}), ...p });
    });
    this.cachePontos = Array.from(mapa.values());
    this.cachePontos.sort((a, b) => b.data.localeCompare(a.data));
  }

  static async persistirTudo() {
    this.persistirSincronamente();

    // 1. SharedPreferences Nativo (Android - Gravação Permanente)
    const prefs = this.getNativePreferences();
    if (prefs) {
      try {
        await prefs.set({ key: STORAGE_KEYS.CONFIG, value: JSON.stringify(this.cacheConfig) });
        await prefs.set({ key: STORAGE_KEYS.PONTOS, value: JSON.stringify(this.cachePontos) });
      } catch (err) {
        console.warn('Erro no SharedPreferences nativo:', err);
      }
    }

    // 2. IndexedDB
    try {
      const db = await this.obterDB();
      if (db) {
        const tx = db.transaction(['config', 'pontos'], 'readwrite');
        tx.objectStore('config').put({ chave: 'app_config', valor: this.cacheConfig });
        const pStore = tx.objectStore('pontos');
        pStore.clear();
        this.cachePontos.forEach(p => pStore.put(p));
      }
    } catch (err) {
      console.warn('Erro ao gravar no IndexedDB:', err);
    }
  }

  static persistirSincronamente() {
    try {
      localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(this.cacheConfig));
      localStorage.setItem(STORAGE_KEYS.PONTOS, JSON.stringify(this.cachePontos));
    } catch (err) {
      console.warn('Erro ao salvar no LocalStorage:', err);
    }
  }

  static obterConfig() {
    if (!this.cacheConfig) {
      try {
        const dados = localStorage.getItem(STORAGE_KEYS.CONFIG);
        this.cacheConfig = dados ? { ...CONFIG_PADRAO, ...JSON.parse(dados) } : { ...CONFIG_PADRAO };
      } catch {
        this.cacheConfig = { ...CONFIG_PADRAO };
      }
    }
    return { ...this.cacheConfig };
  }

  static salvarConfig(novaConfig) {
    this.cacheConfig = { ...this.obterConfig(), ...novaConfig };
    this.persistirTudo();
    return this.cacheConfig;
  }

  static obterPontos() {
    if (!this.cachePontos) {
      try {
        const dados = localStorage.getItem(STORAGE_KEYS.PONTOS);
        this.cachePontos = dados ? JSON.parse(dados) : [];
      } catch {
        this.cachePontos = [];
      }
    }
    return [...this.cachePontos];
  }

  static obterPontoPorData(dataStr) {
    return this.obterPontos().find(p => p.data === dataStr) || null;
  }

  static salvarRegistroPonto(registro) {
    const pontos = this.obterPontos();
    const indice = pontos.findIndex(p => (registro.id && p.id === registro.id) || p.data === registro.data);

    const normalizado = {
      id: registro.id || (indice >= 0 ? pontos[indice].id : `pt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`),
      ...registro
    };

    if (indice >= 0) {
      pontos[indice] = { ...pontos[indice], ...normalizado };
    } else {
      pontos.unshift(normalizado);
    }

    pontos.sort((a, b) => b.data.localeCompare(a.data));
    this.cachePontos = pontos;
    this.persistirTudo();
    return normalizado;
  }

  static excluirRegistro(id) {
    this.cachePontos = this.obterPontos().filter(p => p.id !== id);
    this.persistirTudo();
    return true;
  }

  static exportarTudoParaJSON() {
    return JSON.stringify({
      app: 'PontoFlex Pro',
      versao: 2,
      geradoEm: new Date().toISOString(),
      config: this.obterConfig(),
      pontos: this.obterPontos()
    }, null, 2);
  }

  static importarDeJSON(jsonString) {
    try {
      const objeto = JSON.parse(jsonString);
      if (!objeto.config && !objeto.pontos) throw new Error('Estrutura de dados inválida.');
      if (objeto.config) this.cacheConfig = { ...CONFIG_PADRAO, ...objeto.config };
      if (Array.isArray(objeto.pontos)) this.cachePontos = objeto.pontos;
      this.persistirTudo();
      return { sucesso: true, totalPontos: this.cachePontos.length };
    } catch (e) {
      return { sucesso: false, erro: e.message };
    }
  }
}
