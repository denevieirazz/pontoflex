/**
 * Motor de Feriados Nacionais Brasileiros - PontoFlex Pro
 * Suporta cálculo autônomo offline (feriados fixos + móveis pela Páscoa)
 * e sincronização automática via BrasilAPI quando houver conexão à internet.
 */

export class FeriadosService {
  static cacheFeriados = new Map();
  static sincronizando = false;

  /**
   * Calcula a data do Domingo de Páscoa pelo Algoritmo de Meeus/Jones/Butcher
   */
  static calcularPascoa(ano) {
    const a = ano % 19;
    const b = Math.floor(ano / 100);
    const c = ano % 100;
    const d = Math.floor(b / 4);
    const e = b % 4;
    const f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4);
    const k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const mes = Math.floor((h + l - 7 * m + 114) / 31);
    const dia = ((h + l - 7 * m + 114) % 31) + 1;
    return new Date(ano, mes - 1, dia, 12, 0, 0);
  }

  /**
   * Adiciona ou subtrai dias de uma data
   */
  static somarDias(dataBase, dias) {
    const d = new Date(dataBase);
    d.setDate(d.getDate() + dias);
    return d;
  }

  /**
   * Formata objeto Date para 'YYYY-MM-DD'
   */
  static formatarISO(d) {
    const ano = d.getFullYear();
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const dia = String(d.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
  }

  /**
   * Gera a lista completa de feriados nacionais brasileiros para o ano
   */
  static calcularFeriadosAno(ano) {
    const pascoa = this.calcularPascoa(ano);
    const carnaval = this.somarDias(pascoa, -47);
    const sextaSanta = this.somarDias(pascoa, -2);
    const corpusChristi = this.somarDias(pascoa, 60);

    return [
      { data: `${ano}-01-01`, nome: 'Confraternização Universal' },
      { data: this.formatarISO(carnaval), nome: 'Carnaval' },
      { data: this.formatarISO(sextaSanta), nome: 'Sexta-feira Santa' },
      { data: this.formatarISO(pascoa), nome: 'Páscoa' },
      { data: `${ano}-04-21`, nome: 'Tiradentes' },
      { data: `${ano}-05-01`, nome: 'Dia do Trabalhador' },
      { data: this.formatarISO(corpusChristi), nome: 'Corpus Christi' },
      { data: `${ano}-09-07`, nome: 'Independência do Brasil' },
      { data: `${ano}-10-12`, nome: 'Nossa Senhora Aparecida' },
      { data: `${ano}-11-02`, nome: 'Finados' },
      { data: `${ano}-11-15`, nome: 'Proclamação da República' },
      { data: `${ano}-11-20`, nome: 'Dia da Consciência Negra' },
      { data: `${ano}-12-25`, nome: 'Natal' }
    ];
  }

  /**
   * Obtém os feriados do ano (do cache local ou gerados offline)
   */
  static obterFeriadosAno(ano) {
    if (this.cacheFeriados.has(ano)) {
      return this.cacheFeriados.get(ano);
    }

    // Tenta ler do LocalStorage
    try {
      const storageKey = `pontoflex_feriados_${ano}`;
      const salvo = localStorage.getItem(storageKey);
      if (salvo) {
        const parsed = JSON.parse(salvo);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.cacheFeriados.set(ano, parsed);
          return parsed;
        }
      }
    } catch (_) {}

    // Fallback garantido 100% offline
    const calculados = this.calcularFeriadosAno(ano);
    this.cacheFeriados.set(ano, calculados);
    return calculados;
  }

  /**
   * Verifica se uma data ISO ('YYYY-MM-DD') é feriado
   */
  static obterFeriado(dataISO) {
    if (!dataISO || typeof dataISO !== 'string') return null;
    const ano = parseInt(dataISO.slice(0, 4), 10);
    if (isNaN(ano)) return null;

    const feriados = this.obterFeriadosAno(ano);
    return feriados.find(f => f.data === dataISO) || null;
  }

  /**
   * Retorna true se a data for feriado
   */
  static ehFeriado(dataISO) {
    return Boolean(this.obterFeriado(dataISO));
  }

  /**
   * Retorna o nome do feriado ou string vazia
   */
  static obterNomeFeriado(dataISO) {
    const feriado = this.obterFeriado(dataISO);
    return feriado ? feriado.nome : '';
  }

  /**
   * Sincroniza feriados com a BrasilAPI se o dispositivo estiver online
   */
  static async sincronizarFeriadosSeOnline(ano) {
    if (typeof navigator !== 'undefined' && !navigator.onLine) return;
    if (this.sincronizando) return;

    this.sincronizando = true;
    try {
      const resp = await fetch(`https://brasilapi.com.br/api/feriados/v1/${ano}`);
      if (resp.ok) {
        const listaAPI = await resp.json();
        if (Array.isArray(listaAPI) && listaAPI.length > 0) {
          const feriadosFormatados = listaAPI.map(f => ({
            data: f.date,
            nome: f.name
          }));
          // Garante que Consciência Negra e Corpus Christi estejam presentes
          const base = this.calcularFeriadosAno(ano);
          for (const item of base) {
            if (!feriadosFormatados.some(f => f.data === item.data)) {
              feriadosFormatados.push(item);
            }
          }
          feriadosFormatados.sort((a, b) => a.data.localeCompare(b.data));
          this.cacheFeriados.set(ano, feriadosFormatados);
          localStorage.setItem(`pontoflex_feriados_${ano}`, JSON.stringify(feriadosFormatados));
        }
      }
    } catch (_) {
      // Falha silenciosa: o app continua 100% com o cálculo local
    } finally {
      this.sincronizando = false;
    }
  }
}
