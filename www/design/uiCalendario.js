/**
 * Controlador do Calendário Visual da Escala 1x1 - PontoFlex Pro
 */

import { StorageService } from '../logica/storage.js';
import { EscalaService } from '../logica/escala.js';
import { FeriadosService } from '../logica/feriados.js';
import { UIModal } from './uiModal.js';
import { mostrarToast } from './toast.js';

export class UICalendario {
  static anoAtual = new Date().getFullYear();
  static mesAtual = new Date().getMonth() + 1; // 1-12

  static inicializar(containerId) {
    this.container = document.getElementById(containerId);
    this.renderizar();
    this.renderizarFaixaHome('container-agenda-home');

    // Sincroniza feriados oficiais em background se online
    FeriadosService.sincronizarFeriadosSeOnline(this.anoAtual).then(() => {
      this.renderizar();
      this.renderizarFaixaHome('container-agenda-home');
    });
  }

  static navegarMes(delta) {
    const anoAnterior = this.anoAtual;
    this.mesAtual += delta;
    if (this.mesAtual > 12) {
      this.mesAtual = 1;
      this.anoAtual += 1;
    } else if (this.mesAtual < 1) {
      this.mesAtual = 12;
      this.anoAtual -= 1;
    }
    if (this.anoAtual !== anoAnterior) {
      FeriadosService.sincronizarFeriadosSeOnline(this.anoAtual).then(() => this.renderizar());
    }
    this.renderizar();
  }

  static irParaHoje() {
    const hoje = new Date();
    this.anoAtual = hoje.getFullYear();
    this.mesAtual = hoje.getMonth() + 1;
    this.renderizar();
  }

  static alternarEscalaHoje() {
    const config = StorageService.obterConfig();
    const hoje = new Date();
    const hojeStr = EscalaService.formatarDataISO(hoje);
    const eraTrabalho = EscalaService.isDiaDeTrabalho(hojeStr, config.dataInicioEscala);

    // Se hoje era trabalho, definimos a data de início para ontem (tornando hoje folga)
    const novaRef = new Date(hoje);
    if (eraTrabalho) {
      novaRef.setDate(hoje.getDate() - 1);
    }
    const novaRefStr = EscalaService.formatarDataISO(novaRef);
    StorageService.salvarConfig({ dataInicioEscala: novaRefStr });
    mostrarToast('Escala 1x1 invertida com sucesso!', 'sucesso');
    this.renderizar();
    this.renderizarFaixaHome('container-agenda-home');
  }

  static renderizarFaixaHome(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const config = StorageService.obterConfig();
    const hoje = new Date();
    const dias = [-1, 0, 1, 2, 3];
    const nomesSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

    let html = `<div class="faixa-dias-agenda">`;
    for (const offset of dias) {
      const d = new Date(hoje);
      d.setDate(hoje.getDate() + offset);
      const dataStr = EscalaService.formatarDataISO(d);
      const isTrabalho = EscalaService.isDiaDeTrabalho(dataStr, config.dataInicioEscala);
      const isHoje = offset === 0;

      let rotulo = offset === -1 ? 'Ontem' : (offset === 0 ? 'Hoje' : (offset === 1 ? 'Amanhã' : nomesSemana[d.getDay()]));
      const feriado = FeriadosService.obterFeriado(dataStr);

      let badgeCls = isTrabalho ? 'trabalho' : 'folga';
      let badgeTxt = isTrabalho ? 'Plantão' : 'Folga';
      if (feriado) {
        badgeCls = isTrabalho ? 'trabalho feriado' : 'feriado';
        badgeTxt = isTrabalho ? 'Plantão 100%' : 'Feriado';
      }

      html += `
        <div class="item-dia-agenda ${isHoje ? 'hoje' : ''} ${feriado ? 'feriado' : ''}" data-data="${dataStr}" title="${feriado ? `Feriado: ${feriado.nome}` : ''}">
          <span class="dia-semana">${rotulo}</span>
          <span class="dia-num">${d.getDate()}</span>
          <span class="status-badge celula-dia-badge ${badgeCls}">
            ${badgeTxt}
          </span>
        </div>
      `;
    }
    html += `</div>`;
    container.innerHTML = html;

    container.querySelectorAll('.item-dia-agenda').forEach(el => {
      el.addEventListener('click', () => {
        UIModal.abrirModalEdicao(el.dataset.data);
      });
    });
  }

  static renderizar() {
    if (!this.container) return;

    const config = StorageService.obterConfig();
    const pontos = StorageService.obterPontos();
    const mapaPontos = new Map(pontos.map(p => [p.data, p]));

    const nomesMeses = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];

    const dataHoje = new Date();
    const hojeStr = EscalaService.formatarDataISO(dataHoje);

    const primeiroDia = new Date(this.anoAtual, this.mesAtual - 1, 1);
    const ultimoDia = new Date(this.anoAtual, this.mesAtual, 0);
    const diaSemanaInicio = primeiroDia.getDay();
    const totalDias = ultimoDia.getDate();

    let html = `
      <div class="calendario-container">
        <div class="calendario-navegacao">
          <div class="calendario-mes-ano">${nomesMeses[this.mesAtual - 1]} ${this.anoAtual}</div>
          <div class="calendario-nav-botoes">
            <button id="btn-cal-ant" class="btn-nav-cal" title="Mês Anterior">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg>
            </button>
            <button id="btn-cal-hoje" class="btn-secundario" style="padding:6px 12px; font-size:0.75rem;">Hoje</button>
            <button id="btn-cal-prox" class="btn-nav-cal" title="Próximo Mês">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>
            </button>
          </div>
        </div>

        <div class="calendario-legenda">
          <div class="legenda-item"><span class="legenda-cor trabalho"></span> Plantão (1x1)</div>
          <div class="legenda-item"><span class="legenda-cor folga"></span> Folga</div>
          <div class="legenda-item"><span class="legenda-cor folga-trabalhada"></span> Folga Trab. (100%)</div>
          <div class="legenda-item"><span class="legenda-cor feriado"></span> 🇧🇷 Feriado (100%)</div>
        </div>

        <div class="grade-dias-semana">
          <div>Dom</div><div>Seg</div><div>Ter</div><div>Qua</div><div>Qui</div><div>Sex</div><div>Sáb</div>
        </div>

        <div class="grade-mes-dias">
    `;

    for (let i = 0; i < diaSemanaInicio; i++) {
      html += `<div class="celula-dia outro-mes"></div>`;
    }

    for (let dia = 1; dia <= totalDias; dia++) {
      const dataStr = `${this.anoAtual}-${String(this.mesAtual).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
      const isTrabalhoEscala = EscalaService.isDiaDeTrabalho(dataStr, config.dataInicioEscala);
      const ponto = mapaPontos.get(dataStr);
      const temPonto = ponto && ponto.entrada;
      const isHoje = dataStr === hojeStr;
      const feriado = FeriadosService.obterFeriado(dataStr);
      const ehFeriado = Boolean(feriado);
      const nomeFeriado = feriado ? feriado.nome : '';

      let classeBadge = 'folga';
      let textoBadge = 'Folga';

      if (ehFeriado && temPonto) {
        classeBadge = 'feriado-trabalhado';
        textoBadge = '100% Feriado';
      } else if (ehFeriado) {
        classeBadge = isTrabalhoEscala ? 'trabalho feriado' : 'feriado';
        textoBadge = isTrabalhoEscala ? 'Plantão 100%' : 'Feriado';
      } else if (isTrabalhoEscala) {
        classeBadge = 'trabalho';
        textoBadge = 'Plantão';
      } else if (temPonto) {
        classeBadge = 'folga-trabalhada';
        textoBadge = 'Extra 100%';
      }

      html += `
        <div class="celula-dia ${isHoje ? 'hoje' : ''} ${ehFeriado ? 'feriado' : ''}" data-data="${dataStr}" title="${ehFeriado ? `Feriado Nacional: ${nomeFeriado}` : ''}">
          ${temPonto ? '<span class="ponto-marcado-dot" title="Ponto Registrado"></span>' : ''}
          <div class="celula-dia-numero">${dia}</div>
          ${ehFeriado ? `<span class="dia-feriado-mini" title="${nomeFeriado}">🇧🇷 ${nomeFeriado}</span>` : ''}
          <div class="celula-dia-badge ${classeBadge}">${textoBadge}</div>
        </div>
      `;
    }

    html += `
        </div>
      </div>
    `;

    this.container.innerHTML = html;

    document.getElementById('btn-cal-ant')?.addEventListener('click', () => this.navegarMes(-1));
    document.getElementById('btn-cal-prox')?.addEventListener('click', () => this.navegarMes(1));
    document.getElementById('btn-cal-hoje')?.addEventListener('click', () => this.irParaHoje());

    this.container.querySelectorAll('.celula-dia:not(.outro-mes)').forEach(el => {
      el.addEventListener('click', () => {
        UIModal.abrirModalEdicao(el.dataset.data);
      });
    });
  }
}
