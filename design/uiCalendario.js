/**
 * Controlador do Calendário Visual da Escala 1x1 - PontoFlex Pro
 */

import { StorageService } from '../logica/storage.js';
import { EscalaService } from '../logica/escala.js';
import { UIModal } from './uiModal.js';

export class UICalendario {
  static anoAtual = new Date().getFullYear();
  static mesAtual = new Date().getMonth() + 1; // 1-12

  static inicializar(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) return;
    this.renderizar();
  }

  static navegarMes(delta) {
    this.mesAtual += delta;
    if (this.mesAtual > 12) {
      this.mesAtual = 1;
      this.anoAtual += 1;
    } else if (this.mesAtual < 1) {
      this.mesAtual = 12;
      this.anoAtual -= 1;
    }
    this.renderizar();
  }

  static irParaHoje() {
    const hoje = new Date();
    this.anoAtual = hoje.getFullYear();
    this.mesAtual = hoje.getMonth() + 1;
    this.renderizar();
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

    // Primeiro dia do mês e total de dias
    const primeiroDia = new Date(this.anoAtual, this.mesAtual - 1, 1);
    const ultimoDia = new Date(this.anoAtual, this.mesAtual, 0);
    const diaSemanaInicio = primeiroDia.getDay(); // 0 (Dom) a 6 (Sáb)
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
          <div class="legenda-item"><span class="legenda-cor folga-trabalhada"></span> Folga Trabalhada (100%)</div>
        </div>

        <div class="grade-dias-semana">
          <div>Dom</div><div>Seg</div><div>Ter</div><div>Qua</div><div>Qui</div><div>Sex</div><div>Sáb</div>
        </div>

        <div class="grade-mes-dias">
    `;

    // Células vazias do início da semana
    for (let i = 0; i < diaSemanaInicio; i++) {
      html += `<div class="celula-dia outro-mes"></div>`;
    }

    // Dias do mês
    for (let dia = 1; dia <= totalDias; dia++) {
      const dataStr = `${this.anoAtual}-${String(this.mesAtual).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
      const isTrabalhoEscala = EscalaService.isDiaDeTrabalho(dataStr, config.dataInicioEscala);
      const ponto = mapaPontos.get(dataStr);
      const temPonto = ponto && ponto.entrada;
      const isHoje = dataStr === hojeStr;

      let classeBadge = 'folga';
      let textoBadge = 'Folga';

      if (isTrabalhoEscala) {
        classeBadge = 'trabalho';
        textoBadge = 'Plantão';
      } else if (temPonto) {
        classeBadge = 'folga-trabalhada';
        textoBadge = 'Extra 100%';
      }

      html += `
        <div class="celula-dia ${isHoje ? 'hoje' : ''}" data-data="${dataStr}">
          ${temPonto ? '<span class="ponto-marcado-dot" title="Ponto Registrado"></span>' : ''}
          <div class="celula-dia-numero">${dia}</div>
          <div class="celula-dia-badge ${classeBadge}">${textoBadge}</div>
        </div>
      `;
    }

    html += `
        </div>
      </div>
    `;

    this.container.innerHTML = html;

    // Vincular botões
    document.getElementById('btn-cal-ant')?.addEventListener('click', () => this.navegarMes(-1));
    document.getElementById('btn-cal-prox')?.addEventListener('click', () => this.navegarMes(1));
    document.getElementById('btn-cal-hoje')?.addEventListener('click', () => this.irParaHoje());

    // Vincular clique nas células
    this.container.querySelectorAll('.celula-dia:not(.outro-mes)').forEach(el => {
      el.addEventListener('click', () => {
        const dataClicada = el.dataset.data;
        UIModal.abrirModalEdicao(dataClicada);
      });
    });
  }
}
