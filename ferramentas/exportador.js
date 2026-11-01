/**
 * Módulo de Exportação de Relatórios e Folha de Ponto
 * Gera Espelho de Ponto para impressão/PDF, exportação CSV e Backup JSON.
 */

import { PontoService } from '../logica/ponto.js';
import { CalculoSalarioService } from '../logica/calculoSalario.js';

export class ExportadorService {
  /**
   * Prepara os dados para o espelho de ponto impresso / PDF
   */
  static gerarHTMLParaImpressao(resumoConsolidado, holerite, config) {
    const nomeMes = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ][resumoConsolidado.mes - 1];

    let linhasTabela = '';
    const registros = [...resumoConsolidado.registros].sort((a, b) => a.data.localeCompare(b.data));

    registros.forEach(r => {
      const [ano, mes, dia] = r.data.split('-');
      const dataFormatada = `${dia}/${mes}/${ano}`;
      const ap = r.apuracao;

      const badgeTipo = ap.ehFolgaTrabalhada
        ? '<span class="tag-folga-trabalhada">Folga (Extra 100%)</span>'
        : '<span>Trabalho Normal</span>';

      const extrasTxt = ap.ehFolgaTrabalhada
        ? PontoService.minutosParaHoraStr(ap.minutosExtrasFolga, true)
        : PontoService.minutosParaHoraStr(ap.minutosExtrasNormais, true);

      linhasTabela += `
        <tr>
          <td>${dataFormatada}</td>
          <td>${badgeTipo}</td>
          <td>${r.entrada || '--:--'}</td>
          <td>${r.saidaAlmoco && r.retornoAlmoco ? `${r.saidaAlmoco} às ${r.retornoAlmoco}` : '-'}</td>
          <td>${r.saida || '--:--'}</td>
          <td>${PontoService.minutosParaHoraStr(ap.minutosNormais, true)}</td>
          <td><strong>${extrasTxt !== '0h 00m' ? extrasTxt : '-'}</strong></td>
          <td>${r.observacao || ''}</td>
        </tr>
      `;
    });

    return `
      <div class="folha-espelho-ponto">
        <header class="espelho-cabecalho">
          <div class="espelho-titulo">
            <h2>ESPELHO DE PONTO INDIVIDUAL</h2>
            <p>Comprovante de Horas Trabalhadas e Horas Extras</p>
          </div>
          <div class="espelho-dados-principais">
            <div><strong>Colaborador:</strong> ${config.nomeUsuario || 'Não informado'}</div>
            <div><strong>Cargo:</strong> ${config.cargo || 'Não informado'}</div>
            <div><strong>Empresa:</strong> ${config.empresa || 'Não informado'}</div>
            <div><strong>Período:</strong> ${nomeMes} de ${resumoConsolidado.ano}</div>
          </div>
        </header>

        <table class="tabela-espelho">
          <thead>
            <tr>
              <th>Data</th>
              <th>Escala</th>
              <th>Entrada</th>
              <th>Intervalo</th>
              <th>Saída</th>
              <th>Horas Normais</th>
              <th>Horas Extras</th>
              <th>Obs</th>
            </tr>
          </thead>
          <tbody>
            ${linhasTabela || '<tr><td colspan="8" style="text-align:center;">Nenhum registro lançado neste mês.</td></tr>'}
          </tbody>
        </table>

        <footer class="espelho-resumo">
          <div class="resumo-bloco">
            <h3>Totais do Mês</h3>
            <p><strong>Dias Trabalhados:</strong> ${resumoConsolidado.diasTrabalhados}</p>
            <p><strong>Dias de Folga Trabalhados:</strong> ${resumoConsolidado.diasFolgaTrabalhados}</p>
            <p><strong>Total Horas Normais:</strong> ${PontoService.minutosParaHoraStr(resumoConsolidado.totalMinutosNormais, true)}</p>
            <p><strong>Total Horas Extras 50%:</strong> ${PontoService.minutosParaHoraStr(resumoConsolidado.totalMinutosExtras50, true)}</p>
            <p><strong>Total Horas Extras 100%:</strong> ${PontoService.minutosParaHoraStr(resumoConsolidado.totalMinutosExtras100, true)}</p>
          </div>
          <div class="resumo-bloco financeiro">
            <h3>Estimativa Financeira</h3>
            <p><strong>Salário Base:</strong> ${holerite.formatado.salarioBase}</p>
            <p><strong>Valor Hora Base:</strong> ${holerite.formatado.valorHoraBase}</p>
            <p><strong>Total em Horas Extras:</strong> ${holerite.formatado.totalExtrasReais}</p>
            <p class="destaque"><strong>Total Bruto Previsto:</strong> ${holerite.formatado.totalBrutoEstimado}</p>
          </div>
        </footer>

        <div class="assinaturas-espelho">
          <div class="linha-assinatura">
            <div class="traco"></div>
            <span>${config.nomeUsuario || 'Assinatura do Colaborador'}</span>
          </div>
          <div class="linha-assinatura">
            <div class="traco"></div>
            <span>Responsável / Recursos Humanos</span>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Aciona a impressão do espelho de ponto no navegador
   */
  static imprimirEspelho(resumoConsolidado, holerite, config) {
    const areaImpressao = document.getElementById('area-impressao-documento');
    if (!areaImpressao) return;
    areaImpressao.innerHTML = this.gerarHTMLParaImpressao(resumoConsolidado, holerite, config);
    window.print();
  }

  /**
   * Exporta os registros do mês em formato CSV (compatível com Excel PT-BR)
   */
  static exportarCSV(resumoConsolidado, config) {
    const cabecalho = ['Data', 'Dia da Semana', 'Escala', 'Entrada', 'Intervalo Almoço', 'Saída', 'Horas Normais', 'Horas Extras', 'Observação'];
    const linhas = [cabecalho.join(';')];

    const registros = [...resumoConsolidado.registros].sort((a, b) => a.data.localeCompare(b.data));

    registros.forEach(r => {
      const [ano, mes, dia] = r.data.split('-');
      const dataFormatada = `${dia}/${mes}/${ano}`;
      const ap = r.apuracao;

      const escala = ap.ehFolgaTrabalhada ? 'Folga Trabalhada (Extra 100%)' : 'Trabalho Normal';
      const intervalo = (r.saidaAlmoco && r.retornoAlmoco) ? `${r.saidaAlmoco} - ${r.retornoAlmoco}` : '';
      const horasNormais = PontoService.minutosParaHoraStr(ap.minutosNormais);
      const horasExtras = PontoService.minutosParaHoraStr(ap.minutosExtrasNormais + ap.minutosExtrasFolga);

      linhas.push([
        dataFormatada,
        r.nomeDiaSemana || '',
        `"${escala}"`,
        r.entrada || '',
        `"${intervalo}"`,
        r.saida || '',
        horasNormais,
        horasExtras,
        `"${(r.observacao || '').replace(/"/g, '""')}"`
      ].join(';'));
    });

    // Byte Order Mark (BOM) para forçar o Excel a reconhecer caracteres acentuados UTF-8
    const conteudoCSV = '\uFEFF' + linhas.join('\r\n');
    const blob = new Blob([conteudoCSV], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `espelho_ponto_${resumoConsolidado.ano}_${String(resumoConsolidado.mes).padStart(2, '0')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  /**
   * Aciona a exportação de backup completo
   */
  static async baixarBackupJSON() {
    const { BackupService } = await import('./backup.js');
    return BackupService.exportarBackup();
  }
}
