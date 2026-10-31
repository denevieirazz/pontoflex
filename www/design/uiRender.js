/**
 * Submódulo de Renderização da Interface Corporativa (DOM Updates) - PontoFlex Pro
 */

import { StorageService } from '../logica/storage.js';
import { PontoService } from '../logica/ponto.js';
import { CalculoSalarioService } from '../logica/calculoSalario.js';

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

      // Renderiza os botões dinâmicos de ponto conforme o estado atual
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
   * Atualiza a frase de previsão do alarme inteligente
   */
  static renderizarPrevisaoAlarme(previsao) {
    const elTexto = document.getElementById('texto-previsao-alarme');
    if (elTexto) {
      elTexto.textContent = previsao.texto;
      elTexto.style.color = previsao.vaiTocar ? '#38bdf8' : '#94a3b8';
    }
  }

  /**
   * Renderiza os 4 KPI Cards e a listagem do histórico/extrato
   */
  static renderizarHistoricoEFinanceiro(ano, mes, config, onEditar, onExcluir) {
    const pontos = StorageService.obterPontos();
    const resumo = PontoService.consolidarMes(
      pontos, ano, mes, config.dataInicioEscala, config.jornadaPadraoHoras
    );
    const holerite = CalculoSalarioService.calcularHoleriteEstimado(resumo, config);

    // Atualiza KPIs Corporativos
    const elKpiSalario = document.getElementById('kpi-valor-salario');
    const elKpiHorasNormais = document.getElementById('kpi-valor-horas-normais');
    const elKpiHorasExtras = document.getElementById('kpi-valor-horas-extras');
    const elKpiPlantoes = document.getElementById('kpi-valor-plantoes');

    if (elKpiSalario) elKpiSalario.textContent = holerite.formatado.totalBrutoEstimado;
    if (elKpiHorasNormais) elKpiHorasNormais.textContent = PontoService.minutosParaHoraStr(resumo.totalMinutosNormais, true);
    if (elKpiHorasExtras) elKpiHorasExtras.textContent = PontoService.minutosParaHoraStr(resumo.totalMinutosExtrasGerais, true);
    if (elKpiPlantoes) elKpiPlantoes.textContent = `${resumo.diasTrabalhados} dias`;

    // Lista de registros do histórico
    const listaEl = document.getElementById('lista-registros-historico');
    if (!listaEl) return;

    if (resumo.registros.length === 0) {
      listaEl.innerHTML = '<div style="text-align:center; padding:32px; color:var(--texto-suave); font-size:0.9rem;">Nenhum ponto registrado neste mês.</div>';
      return;
    }

    listaEl.innerHTML = resumo.registros.map(r => {
      const [a, m, dia] = r.data.split('-');
      const dataFmt = `${dia}/${m}/${a}`;
      const ap = r.apuracao;
      const totalExtras = ap.minutosExtrasNormais + ap.minutosExtrasFolga;
      const temExtra = totalExtras > 0;

      let badgeTipo = ap.ehFolgaTrabalhada ?
        '<span class="badge-status-turno folga-extra" style="font-size:0.7rem; padding:2px 8px;">Folga Trabalhada (100%)</span>' :
        '<span class="badge-status-turno trabalho" style="font-size:0.7rem; padding:2px 8px;">Plantão 1x1</span>';

      return `
        <div class="item-registro-historico">
          <div class="registro-topo">
            <div class="registro-data-badge">
              <span class="registro-data-texto">${dataFmt}</span>
              ${badgeTipo}
            </div>
            ${temExtra ? `<span style="font-size:0.75rem; font-weight:700; color:#fbbf24;">+${PontoService.minutosParaHoraStr(totalExtras, true)} HE</span>` : ''}
          </div>

          <div class="registro-horarios-linha">
            <span>Entrada: <strong>${r.entrada || '--:--'}</strong></span>
            <span>Almoço: <strong>${r.saidaAlmoco ? `${r.saidaAlmoco} às ${r.retornoAlmoco || '--:--'}` : 'N/A'}</strong></span>
            <span>Saída: <strong>${r.saida || '--:--'}</strong></span>
          </div>

          <div class="registro-rodape-resumo">
            <span>Total Trabalhado: <strong>${PontoService.minutosParaHoraStr(ap.totalMinutos, true)}</strong></span>
            <div style="display:flex; gap:6px;">
              <button class="btn-secundario btn-editar-item" data-id="${r.id}" style="padding:4px 10px; font-size:0.75rem;">Editar</button>
              <button class="btn-secundario btn-excluir-item" data-id="${r.id}" style="padding:4px 10px; font-size:0.75rem; color:#ef4444;">Excluir</button>
            </div>
          </div>
        </div>
      `;
    }).join('');

    listaEl.querySelectorAll('.btn-editar-item').forEach(b => {
      b.addEventListener('click', () => {
        const ponto = pontos.find(p => p.id === b.dataset.id);
        if (ponto && typeof onEditar === 'function') onEditar(ponto);
      });
    });

    listaEl.querySelectorAll('.btn-excluir-item').forEach(b => {
      b.addEventListener('click', () => {
        if (typeof onExcluir === 'function') onExcluir(b.dataset.id);
      });
    });
  }

  /**
   * Preenche os formulários da aba de configurações
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
    setVal('input-inicio-escala', config.dataInicioEscala || '');
    setVal('input-alarme-horario', config.alarmeHorario || '06:00');
    setVal('select-alarme-som', config.alarmeSom || 'suave');

    const switchAlarme = document.getElementById('switch-alarme-ativo');
    if (switchAlarme) switchAlarme.checked = !!config.alarmeAtivo;
  }
}
