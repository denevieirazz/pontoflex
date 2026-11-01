/**
 * Gerenciador de Backup e Restauração de Dados - PontoFlex Pro
 * Exportação segura (Download/Compartilhamento) e Importação à prova de perdas.
 */

import { StorageService } from '../logica/storage.js';
import { CalculoSalarioService } from '../logica/calculoSalario.js';

export class BackupService {
  /**
   * Retorna resumo dos dados atuais para exibição no card de backup
   */
  static obterResumoAtual() {
    const pontos = StorageService.obterPontos();
    const config = StorageService.obterConfig();
    return {
      totalPontos: pontos.length,
      salarioFormatado: CalculoSalarioService.formatarMoeda(config.salarioBase || 0),
      escala: config.tipoEscala || '1x1'
    };
  }

  /**
   * Exporta arquivo de backup completo (.json)
   */
  static async exportarBackup() {
    const jsonString = StorageService.exportarTudoParaJSON();
    const d = new Date();
    const dia = String(d.getDate()).padStart(2, '0');
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const ano = d.getFullYear();
    const hora = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    const nomeArquivo = `PontoFlex_Backup_${dia}-${mes}-${ano}_${hora}h${min}.json`;

    // Suporte a compartilhamento móvel nativo (WhatsApp, Drive, Arquivos)
    if (navigator.canShare && typeof File !== 'undefined') {
      try {
        const file = new File([jsonString], nomeArquivo, { type: 'application/json' });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: 'Backup PontoFlex Pro',
            text: `Backup dos meus pontos e escala (${dia}/${mes}/${ano})`
          });
          return { sucesso: true, metodo: 'compartilhado', nomeArquivo };
        }
      } catch (err) {
        if (err.name === 'AbortError') return { sucesso: false, cancelado: true };
      }
    }

    // Download tradicional via Blob
    const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = nomeArquivo;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    return { sucesso: true, metodo: 'download', nomeArquivo };
  }

  /**
   * Lê e restaura arquivo de backup a partir de um File do input
   */
  static async restaurarDeArquivo(arquivo) {
    if (!arquivo) throw new Error('Nenhum arquivo selecionado.');

    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const conteudo = e.target.result;
          const objeto = JSON.parse(conteudo);

          if (!objeto || typeof objeto !== 'object') {
            throw new Error('Arquivo não é um backup JSON válido.');
          }

          if (!objeto.pontos && !objeto.config) {
            throw new Error('Estrutura de dados não reconhecida como backup do PontoFlex.');
          }

          const resultado = StorageService.importarDeJSON(conteudo);
          if (!resultado.sucesso) {
            throw new Error(resultado.erro || 'Falha ao processar dados.');
          }

          const pontosRestaurados = Array.isArray(objeto.pontos) ? objeto.pontos.length : 0;
          const configRestaurada = objeto.config || {};
          const salarioFmt = CalculoSalarioService.formatarMoeda(configRestaurada.salarioBase || 0);

          resolve({
            sucesso: true,
            totalPontos: pontosRestaurados,
            salarioBase: salarioFmt,
            dataInicioEscala: configRestaurada.dataInicioEscala || '',
            geradoEm: objeto.geradoEm || null
          });
        } catch (err) {
          reject(err);
        }
      };

      reader.onerror = () => reject(new Error('Erro ao ler o arquivo no dispositivo.'));
      reader.readAsText(arquivo);
    });
  }
}
