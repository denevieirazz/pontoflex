/**
 * Submódulo de Renderização da Interface Corporativa (DOM Updates) - PontoFlex Pro
 */

import { StorageService } from '../logica/storage.js';
import { PontoService } from '../logica/ponto.js';
import { CalculoSalarioService } from '../logica/calculoSalario.js';
import { AlarmeService } from '../logica/alarme.js';

export class UIRender {
  /**
   * Renderiza os cards e botões do dia atual na aba Ponto
   */
  static renderizarHoje(pontoHoje, statusHoje, config) {
    const badgeHoje = document.getElementById('badge-status-turno-hoje');
    if (badgeHoje) {
      let classe = 'folga';
      let rotulo = '🔵 Folga Prevista';
      if (statusHoje.isTrabalho) {
        classe = 'trabalho';
        rotulo = '🟢 Plantão 1x1 Hoje';
      } else if (pontoHoje && pontoHoje.entrada) {
        classe = 'folga-extra';
        rotulo = '⚡ Plantão em Folga (100%)';
      }
      badgeHoje.className = `badge-status-turno ${classe}`;
      badgeHoje.innerHTML = `<span class="pulso-status"></span> ${rotulo}`;
    }

    // 4 Blocos de Horário CLT
    const elEntrada = document.getElementById('bloco-hora-entrada');
    const elSaidaAlmoco = document.getElementById('bloco-hora-saida-almoco');
    const elRetornoAlmoco = document.getElementById('bloco-hora-retorno-almoco');
    const elSaida = document.getElementById('bloco-hora-saida');
    const elTotalHoje = document.getElementById('display-total-hoje');
    const elExtraHoje = document.getElementById('display-extra-hoje');
    const containerAcoes = document.getElementById('area-acoes-ponto-dinamicas');

    if (pontoHoje) {
      if (elEntrada) elEntrada.textContent = pontoHoje.entrada || '--:--';
      if (elSaidaAlmoco) elSaidaAlmoco.textContent = pontoHoje.saidaAlmoco || '--:--';
      if (elRetornoAlmoco) elRetornoAlmoco.textContent = pontoHoje.retornoAlmoco || '--:--';
      if (elSaida) elSaida.textContent = pontoHoje.saida || '--:--';

      const minTrab = pontoHoje.totalMinutosTrabalhados ||
        PontoService.calcularMinutosTrabalhados(
          pontoHoje.entrada, pontoHoje.saida, pontoHoje.saidaAlmoco, pontoHoje.retornoAlmoco
        );

      const apuracao = PontoService.apurarHorasDoDia({
        minutosTrabalhados: minTrab,
        isDiaTrabalhoEscala: statusHoje.isTrabalho,
        jornadaPadraoHoras: config.jornadaPadraoHoras
      });

      if (elTotalHoje) elTotalHoje.textContent = PontoService.minutosParaHoraStr(apuracao.totalMinutos, true);
      const minutosExtras = apuracao.minutosExtrasNormais + apuracao.minutosExtrasFolga;
      if (elExtraHoje) elExtraHoje.textContent = PontoService.minutosParaHoraStr(minutosExtras, true);

      // Renderiza botões dinâmicos de ponto conforme o estado atual
      if (containerAcoes) {
        if (!pontoHoje.entrada) {
          containerAcoes.innerHTML = `
            <button id="btn-acao-entrada" class="btn-bater-ponto-principal">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
              Registrar Entrada
            </button>
          `;
        } else if (!pontoHoje.saidaAlmoco) {
          containerAcoes.innerHTML = `
            <div class="botoes-ponto-duplos">
              <button id="btn-acao-almoco-saida" class="btn-acao-ponto-sec" style="background:#f59e0b; color:#fff; border:none;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                Saída Intervalo
              </button>
              <button id="btn-acao-saida" class="btn-acao-ponto-sec" style="background:#ef4444; color:#fff; border:none;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                Encerrar Saída
              </button>
            </div>
          `;
        } else if (!pontoHoje.retornoAlmoco) {
          containerAcoes.innerHTML = `
            <button id="btn-acao-almoco-retorno" class="btn-bater-ponto-principal" style="background:linear-gradient(135deg, #3b82f6, #1d4ed8);">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>
              Retornar do Intervalo
            </button>
          `;
        } else if (!pontoHoje.saida) {
          containerAcoes.innerHTML = `
            <button id="btn-acao-saida" class="btn-bater-ponto-principal saida">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              Registrar Saída Final
            </button>
          `;
        } else {
          containerAcoes.innerHTML = `
            <div style="display:flex; flex-direction:column; align-items:center; gap:8px;">
              <span style="font-size:0.9rem; font-weight:700; color:#10b981;">✓ Expediente de Hoje Finalizado</span>
              <button id="btn-ajustar-hoje" class="btn-secundario" style="font-size:0.8rem; padding:8px 16px;">
                ✏️ Ajustar Horários de Hoje
              </button>
            </div>
          `;
        }
      }
    } else {
      if (elEntrada) elEntrada.textContent = '--:--';
      if (elSaidaAlmoco) elSaidaAlmoco.textContent = '--:--';
      if (elRetornoAlmoco) elRetornoAlmoco.textContent = '--:--';
      if (elSaida) elSaida.textContent = '--:--';
      if (elTotalHoje) elTotalHoje.textContent = '0h 00m';
      if (elExtraHoje) elExtraHoje.textContent = '0h 00m';

      if (containerAcoes) {
        containerAcoes.innerHTML = `
          <button id="btn-acao-entrada" class="btn-bater-ponto-principal">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
            Registrar Entrada
          </button>
        `;
      }
    }
  }

  /**
   * Renderiza o Chip do Alarme na aba Home (Ponto)
   */
  static renderizarChipAlarmeHome(config, onNavegarAlarme) {
    const elChip = document.getElementById('chip-status-alarme-home');
    if (!elChip) return;

    const previsao = AlarmeService.obterPrevisaoProximoAlarme();
    let texto = '⏰ Alarme: Desativado (Toque p/ ativar)';
    let cor = '#94a3b8';

    if (config.alarmeAtivo) {
      if (previsao.vaiTocar) {
        texto = `⏰ Alarme: Toca ${previsao.quando} às ${previsao.horario} (Plantão)`;
        cor = '#38bdf8';
      } else {
        texto = `😴 Alarme: Silenciado (Amanhã é folga)`;
        cor = '#a78bfa';
      }
    }

    elChip.textContent = texto;
    elChip.style.color = cor;
    elChip.onclick = () => {
      if (typeof onNavegarAlarme === 'function') onNavegarAlarme();
    };
  }

  /**
   * Renderiza o Banner de Salário na aba Home (Ponto)
   */
  static renderizarBannerSalarioHome(config, onSalvarSalario, onNavegarGanhos) {
    const container = document.getElementById('banner-salario-home');
    if (!container) return;

    if (!config.salarioConfigurado) {
      container.innerHTML = `
        <div class="card-banner-salario">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <span style="font-size:0.85rem; font-weight:700; color:#34d399;">💰 Quanto você ganha por mês?</span>
            <span style="font-size:0.7rem; color:var(--texto-secundario);">Cálculo CLT 1x1</span>
          </div>
          <p style="font-size:0.76rem; color:var(--texto-secundario);">Informe seu salário para calcularmos suas horas extras (50% e 100%) em tempo real:</p>
          <div style="display:flex; gap:8px;">
            <input type="number" id="input-salario-home" placeholder="Ex: 2500" value="${config.salarioBase || ''}" style="flex:1; background:var(--bg-input); border:1px solid var(--cor-borda); color:#fff; padding:8px 12px; border-radius:var(--radius-sm); font-size:0.85rem;">
            <button id="btn-salvar-salario-home" class="btn-padrao" style="padding:8px 14px; font-size:0.82rem; white-space:nowrap;">Salvar Salário</button>
          </div>
        </div>
      `;
      document.getElementById('btn-salvar-salario-home')?.addEventListener('click', () => {
        const val = parseFloat(document.getElementById('input-salario-home')?.value) || 0;
        if (typeof onSalvarSalario === 'function') onSalvarSalario(val);
      });
    } else {
      const valorHora = (config.salarioBase / (config.horasMensais || 220));
      container.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(255,255,255,0.03); border:1px solid var(--cor-borda); border-radius:var(--radius-sm); padding:8px 12px; font-size:0.78rem;">
          <span style="color:var(--texto-secundario);">💰 Salário: <strong style="color:#fff;">${CalculoSalarioService.formatarMoeda(config.salarioBase)}</strong> (${CalculoSalarioService.formatarMoeda(valorHora)}/h)</span>
          <button id="btn-abrir-ganhos-home" class="btn-secundario" style="font-size:0.72rem; padding:4px 8px;">Ganhos ↗</button>
        </div>
      `;
      document.getElementById('btn-abrir-ganhos-home')?.addEventListener('click', () => {
        if (typeof onNavegarGanhos === 'function') onNavegarGanhos();
      });
    }
  }

  /**
   * Preenche os formulários da aba de configurações (Ajustes)
   */
  static carregarCamposConfig(config) {
    const setVal = (id, val) => {
      const el = document.getElementById(id);
      if (el && val !== undefined) el.value = val;
    };
    setVal('config-nome', config.nomeUsuario || '');
    setVal('config-empresa', config.empresa || '');
    setVal('config-cargo', config.cargo || '');
    setVal('config-salario-base', config.salarioBase || 2000);
    setVal('config-horas-mensais', config.horasMensais || 220);
    setVal('config-jornada-padrao', config.jornadaPadraoHoras || 8);
    setVal('config-porcentagem-normal', config.porcentagemExtraNormal || 50);
    setVal('config-porcentagem-folga', config.porcentagemExtraFolga || 100);
  }
}
