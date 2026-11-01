/**
 * Controlador de Interface do Módulo de Ganhos e Salário CLT - PontoFlex Pro
 */

import { StorageService } from '../logica/storage.js';
import { PontoService } from '../logica/ponto.js';
import { CalculoSalarioService } from '../logica/calculoSalario.js';
import { ExportadorService } from '../ferramentas/exportador.js';
import { mostrarToast } from './toast.js';

export class UIGanhos {
  static vincular(onAtualizar, onEditarPonto, onExcluirPonto) {
    // Salvar Salário e Carga Horária na aba Ganhos
    document.getElementById('form-ganhos-salario')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const salario = parseFloat(document.getElementById('ganhos-salario-base')?.value) || 0;
      const horas = parseInt(document.getElementById('ganhos-horas-mensais')?.value, 10) || 220;

      StorageService.salvarConfig({
        salarioBase: salario,
        horasMensais: horas,
        salarioConfigurado: true
      });

      mostrarToast('Salário e valor da hora recalculados com sucesso!', 'sucesso');
      if (typeof onAtualizar === 'function') onAtualizar();
    });

    // Filtro de Mês/Ano
    document.getElementById('filtro-mes-ano')?.addEventListener('change', () => {
      if (typeof onAtualizar === 'function') onAtualizar();
    });

    // Botões de Exportação Corporativa
    document.getElementById('btn-gerar-espelho-pdf')?.addEventListener('click', () => {
      const config = StorageService.obterConfig();
      const pontos = StorageService.obterPontos();
      const [ano, mes] = this.obterMesAnoSelecionado();
      const resumo = PontoService.consolidarMes(
        pontos, ano, mes, config.dataInicioEscala, config.jornadaPadraoHoras
      );
      const holerite = CalculoSalarioService.calcularHoleriteEstimado(resumo, config);
      ExportadorService.imprimirEspelhoPonto(resumo, holerite, config);
    });

    document.getElementById('btn-exportar-csv')?.addEventListener('click', () => {
      const config = StorageService.obterConfig();
      const pontos = StorageService.obterPontos();
      const [ano, mes] = this.obterMesAnoSelecionado();
      const resumo = PontoService.consolidarMes(
        pontos, ano, mes, config.dataInicioEscala, config.jornadaPadraoHoras
      );
      ExportadorService.exportarCSV(resumo, config);
      mostrarToast('Planilha CSV gerada para download!', 'sucesso');
    });

    this.onEditarPonto = onEditarPonto;
    this.onExcluirPonto = onExcluirPonto;
  }

  static obterMesAnoSelecionado() {
    const inputFiltro = document.getElementById('filtro-mes-ano');
    if (inputFiltro && inputFiltro.value) {
      const [a, m] = inputFiltro.value.split('-');
      return [parseInt(a, 10), parseInt(m, 10)];
    }
    const agora = new Date();
    return [agora.getFullYear(), agora.getMonth() + 1];
  }

  static renderizar() {
    const config = StorageService.obterConfig();
    const [ano, mes] = this.obterMesAnoSelecionado();

    // Atualiza inputs de salário na aba Ganhos
    const inputSalario = document.getElementById('ganhos-salario-base');
    const inputHoras = document.getElementById('ganhos-horas-mensais');
    if (inputSalario && config.salarioBase !== undefined) {
      inputSalario.value = config.salarioBase;
    }
    if (inputHoras && config.horasMensais !== undefined) {
      inputHoras.value = config.horasMensais;
    }

    // Calcula e exibe os 4 valores de hora unitários
    const valoresHora = CalculoSalarioService.calcularValoresHoraDetalhados(config);
    const elHoraBase = document.getElementById('display-hora-base');
    const elHora50 = document.getElementById('display-hora-extra-50');
    const elHora100 = document.getElementById('display-hora-extra-100');
    const elHoraNoturna = document.getElementById('display-hora-noturna');

    if (elHoraBase) elHoraBase.textContent = `${valoresHora.formatado.valorHoraBase}/h`;
    if (elHora50) elHora50.textContent = `${valoresHora.formatado.valorHoraExtra50}/h`;
    if (elHora100) elHora100.textContent = `${valoresHora.formatado.valorHoraExtra100}/h`;
    if (elHoraNoturna) elHoraNoturna.textContent = `${valoresHora.formatado.valorHoraNoturna}/h`;

    // Consolidação do mês
    const pontos = StorageService.obterPontos();
    const resumo = PontoService.consolidarMes(
      pontos, ano, mes, config.dataInicioEscala, config.jornadaPadraoHoras
    );
    const holerite = CalculoSalarioService.calcularHoleriteEstimado(resumo, config);

    // KPIs corporativos
    const elSalarioTotal = document.getElementById('kpi-valor-salario');
    const elHorasNormais = document.getElementById('kpi-valor-horas-normais');
    const elHorasExtras = document.getElementById('kpi-valor-horas-extras');
    const elPlantoes = document.getElementById('kpi-valor-plantoes');

    if (elSalarioTotal) elSalarioTotal.textContent = holerite.formatado.totalBrutoEstimado;
    if (elHorasNormais) elHorasNormais.textContent = PontoService.minutosParaHoraStr(resumo.totalMinutosNormais, true);
    if (elHorasExtras) elHorasExtras.textContent = PontoService.minutosParaHoraStr(resumo.totalMinutosExtrasGerais, true);
    if (elPlantoes) elPlantoes.textContent = `${resumo.diasTrabalhados} dias`;

    // Demonstrativo de Proventos Detalhado
    const elDemoBase = document.getElementById('demo-salario-base');
    const elDemo50 = document.getElementById('demo-total-extra-50');
    const elDemo100 = document.getElementById('demo-total-extra-100');
    const elDemoDSR = document.getElementById('demo-total-dsr');
    const elDemoTotal = document.getElementById('demo-total-bruto');

    if (elDemoBase) elDemoBase.textContent = holerite.formatado.salarioBase;
    if (elDemo50) elDemo50.textContent = holerite.formatado.totalExtra50Reais;
    if (elDemo100) elDemo100.textContent = holerite.formatado.totalExtra100Reais;
    if (elDemoDSR) elDemoDSR.textContent = holerite.formatado.estimativaDSR;
    if (elDemoTotal) elDemoTotal.textContent = holerite.formatado.totalBrutoEstimado;

    // Renderiza a lista de pontos do histórico
    this.renderizarListaHistorico(resumo, pontos);
  }

  static renderizarListaHistorico(resumo, pontos) {
    const listaEl = document.getElementById('lista-registros-historico');
    if (!listaEl) return;

    if (resumo.registros.length === 0) {
      listaEl.innerHTML = '<div style="text-align:center; padding:28px; color:var(--texto-suave); font-size:0.85rem;">Nenhum ponto registrado neste mês.</div>';
      return;
    }

    listaEl.innerHTML = resumo.registros.map(r => {
      const [a, m, dia] = r.data.split('-');
      const dataFmt = `${dia}/${m}/${a}`;
      const ap = r.apuracao;
      const totalExtras = ap.minutosExtrasNormais + ap.minutosExtrasFolga;
      const temExtra = totalExtras > 0;

      let badgeTipo = ap.ehFolgaTrabalhada ?
        '<span class="badge-status-turno folga-extra" style="font-size:0.68rem; padding:2px 6px;">Folga Trabalhada (100%)</span>' :
        '<span class="badge-status-turno trabalho" style="font-size:0.68rem; padding:2px 6px;">Plantão 1x1</span>';

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
            <span>Almoço: <strong>${r.saidaAlmoco ? `${r.saidaAlmoco} - ${r.retornoAlmoco || '--:--'}` : 'N/A'}</strong></span>
            <span>Saída: <strong>${r.saida || '--:--'}</strong></span>
          </div>
          <div class="registro-rodape-resumo">
            <span>Total: <strong>${PontoService.minutosParaHoraStr(ap.totalMinutos, true)}</strong></span>
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
        if (ponto && typeof this.onEditarPonto === 'function') this.onEditarPonto(ponto);
      });
    });

    listaEl.querySelectorAll('.btn-excluir-item').forEach(b => {
      b.addEventListener('click', () => {
        if (typeof this.onExcluirPonto === 'function') this.onExcluirPonto(b.dataset.id);
      });
    });
  }
}
