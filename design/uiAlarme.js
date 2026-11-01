/**
 * Controlador de Interface da Tela de Alarme Inteligente 1x1 - PontoFlex Pro
 */

import { StorageService } from '../logica/storage.js';
import { AlarmeService } from '../logica/alarme.js';
import { AudioAlarmeService } from '../ferramentas/audioAlarme.js';
import { mostrarToast } from './toast.js';

export class UIAlarme {
  static vincular(onAtualizar) {
    const switchAlarme = document.getElementById('switch-alarme-tela');
    switchAlarme?.addEventListener('change', (e) => {
      StorageService.salvarConfig({ alarmeAtivo: e.target.checked });
      mostrarToast(e.target.checked ? '🔔 Alarme inteligente ATIVADO' : 'Alarme desativado', 'sucesso');
      this.renderizar();
      if (typeof onAtualizar === 'function') onAtualizar();
    });

    document.getElementById('btn-testar-som-tela')?.addEventListener('click', () => {
      const som = document.getElementById('select-alarme-som-tela')?.value || 'suave';
      AudioAlarmeService.tocarBipeTeste(som);
      mostrarToast('🔊 Reproduzindo toque de teste...', 'sucesso');
    });

    document.getElementById('btn-salvar-alarme-tela')?.addEventListener('click', () => {
      const horario = document.getElementById('input-alarme-horario-tela')?.value || '06:00';
      const som = document.getElementById('select-alarme-som-tela')?.value || 'suave';
      const ativo = document.getElementById('switch-alarme-tela')?.checked ?? true;

      StorageService.salvarConfig({
        alarmeAtivo: ativo,
        alarmeHorario: horario,
        alarmeSom: som
      });

      mostrarToast('Configurações do Alarme salvas com sucesso!', 'sucesso');
      this.renderizar();
      if (typeof onAtualizar === 'function') onAtualizar();
    });

    document.getElementById('btn-silenciar-alarme')?.addEventListener('click', () => {
      AudioAlarmeService.parar();
      AlarmeService.silenciar();
      document.getElementById('tela-alarme-modal')?.classList.remove('ativa');
      mostrarToast('Alarme silenciado. Bom plantão!', 'sucesso');
    });
  }

  static renderizar() {
    const config = StorageService.obterConfig();
    const previsao = AlarmeService.obterPrevisaoProximoAlarme();

    // Atualiza relógio gigante
    const elRelogio = document.getElementById('alarme-display-hora');
    if (elRelogio) {
      elRelogio.textContent = config.alarmeHorario || '06:00';
    }

    // Atualiza switch
    const switchAlarme = document.getElementById('switch-alarme-tela');
    if (switchAlarme) {
      switchAlarme.checked = !!config.alarmeAtivo;
    }

    // Atualiza inputs
    const inputHora = document.getElementById('input-alarme-horario-tela');
    if (inputHora && config.alarmeHorario) {
      inputHora.value = config.alarmeHorario;
    }

    const selectSom = document.getElementById('select-alarme-som-tela');
    if (selectSom && config.alarmeSom) {
      selectSom.value = config.alarmeSom;
    }

    // Atualiza card de status inteligente
    const cardStatus = document.getElementById('card-status-alarme-box');
    const iconeStatus = document.getElementById('icone-alarme-status-box');
    const tituloStatus = document.getElementById('titulo-alarme-status-box');
    const descStatus = document.getElementById('desc-alarme-status-box');

    if (!cardStatus || !tituloStatus || !descStatus) return;

    if (!config.alarmeAtivo) {
      cardStatus.className = 'card-status-alarme-inteligente desativado';
      if (iconeStatus) iconeStatus.className = 'icone-alarme-status desativado';
      tituloStatus.textContent = 'Alarme Desativado';
      descStatus.textContent = 'Ative para que o despertador toque apenas nos dias de plantão 1x1.';
    } else if (previsao.vaiTocar) {
      cardStatus.className = 'card-status-alarme-inteligente';
      if (iconeStatus) iconeStatus.className = 'icone-alarme-status trabalho';
      tituloStatus.textContent = `Próximo Plantão: ${previsao.quando} às ${previsao.horario}`;
      descStatus.textContent = `Identificado dia de trabalho na escala 1x1. O despertador vai tocar pontualmente.`;
    } else {
      cardStatus.className = 'card-status-alarme-inteligente folga';
      if (iconeStatus) iconeStatus.className = 'icone-alarme-status folga';
      tituloStatus.textContent = 'Alarme Silenciado (Dia de Folga 😴)';
      descStatus.textContent = 'Amanhã é sua folga na escala 1x1. O despertador não tocará para você descansar.';
    }
  }
}
