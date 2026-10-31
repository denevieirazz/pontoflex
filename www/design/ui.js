/**
 * Controlador Principal da Interface Corporativa (UI Coordinator) - PontoFlex Pro
 */

import { StorageService } from '../logica/storage.js';
import { EscalaService } from '../logica/escala.js';
import { PontoService } from '../logica/ponto.js';
import { AlarmeService } from '../logica/alarme.js';
import { AudioAlarmeService } from '../ferramentas/audioAlarme.js';
import { SyncDataHoraService } from '../ferramentas/syncDataHora.js';
import { ExportadorService } from '../ferramentas/exportador.js';
import { UIModal } from './uiModal.js';
import { UIRender } from './uiRender.js';
import { UICalendario } from './uiCalendario.js';
import { mostrarToast } from './toast.js';

export class AppUI {
  static abaAtual = 'ponto';
  static mesSelecionado = new Date().getMonth() + 1;
  static anoSelecionado = new Date().getFullYear();

  static async inicializar() {
    // 1. Aguarda carregamento indestrutível de dados (Android SharedPreferences + IndexedDB + LocalStorage)
    await StorageService.inicializar();

    // 2. Vincula componentes e eventos da tela
    this.vincularNavegacaoAbas();
    this.iniciarRelogio();
    this.vincularAcoesPonto();
    this.vincularAcoesEscalaEAlarme();
    this.vincularAcoesExtrato();
    this.vincularAcoesConfig();

    UIModal.vincular(() => this.atualizarTodaInterface());
    UICalendario.inicializar('container-calendario-interativo');

    this.atualizarTodaInterface();
  }

  static vincularNavegacaoAbas() {
    document.querySelectorAll('.btn-nav-aba').forEach(btn => {
      btn.addEventListener('click', () => {
        this.trocarAba(btn.dataset.aba);
      });
    });
  }

  static trocarAba(abaAlvo) {
    this.abaAtual = abaAlvo;
    document.querySelectorAll('.btn-nav-aba').forEach(b => {
      b.classList.toggle('ativa', b.dataset.aba === abaAlvo);
    });
    document.querySelectorAll('.secao-aba').forEach(s => {
      s.classList.toggle('ativa', s.id === `aba-${abaAlvo}`);
    });
    if (abaAlvo === 'escala') {
      UICalendario.renderizar();
    }
    this.atualizarTodaInterface();
  }

  static iniciarRelogio() {
    const atualizar = () => {
      const agora = SyncDataHoraService.obterAgora();
      const h = String(agora.getHours()).padStart(2, '0');
      const m = String(agora.getMinutes()).padStart(2, '0');
      const s = String(agora.getSeconds()).padStart(2, '0');

      const elHora = document.getElementById('relogio-horas-minutos');
      const elSeg = document.getElementById('relogio-segundos');
      if (elHora) elHora.textContent = `${h}:${m}`;
      if (elSeg) elSeg.textContent = `:${s}`;

      const elData = document.getElementById('cabecalho-data-hoje');
      if (elData) {
        const opcoes = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
        elData.textContent = agora.toLocaleDateString('pt-BR', opcoes);
      }
    };
    atualizar();
    setInterval(atualizar, 1000);
  }

  static vincularAcoesPonto() {
    const containerAcoes = document.getElementById('area-acoes-ponto-dinamicas');
    if (!containerAcoes) return;

    containerAcoes.addEventListener('click', (e) => {
      const botao = e.target.closest('button');
      if (!botao) return;

      const agora = SyncDataHoraService.obterAgora();
      const hojeStr = EscalaService.formatarDataISO(agora);
      const horaStr = `${String(agora.getHours()).padStart(2, '0')}:${String(agora.getMinutes()).padStart(2, '0')}`;
      const config = StorageService.obterConfig();

      let pontoHoje = StorageService.obterPontoPorData(hojeStr);
      const isTrabalho = EscalaService.isDiaDeTrabalho(hojeStr, config.dataInicioEscala);

      if (botao.id === 'btn-acao-entrada') {
        pontoHoje = {
          data: hojeStr,
          entrada: horaStr,
          saidaAlmoco: '',
          retornoAlmoco: '',
          saida: '',
          isDiaTrabalhoEscala: isTrabalho,
          totalMinutosTrabalhados: 0
        };
        StorageService.salvarRegistroPonto(pontoHoje);
        mostrarToast(`Entrada registrada: ${horaStr}`, 'sucesso');
      } else if (botao.id === 'btn-acao-almoco-saida') {
        pontoHoje.saidaAlmoco = horaStr;
        StorageService.salvarRegistroPonto(pontoHoje);
        mostrarToast(`Saída para almoço: ${horaStr}`, 'sucesso');
      } else if (botao.id === 'btn-acao-almoco-retorno') {
        pontoHoje.retornoAlmoco = horaStr;
        StorageService.salvarRegistroPonto(pontoHoje);
        mostrarToast(`Retorno do almoço: ${horaStr}`, 'sucesso');
      } else if (botao.id === 'btn-acao-saida') {
        pontoHoje.saida = horaStr;
        pontoHoje.totalMinutosTrabalhados = PontoService.calcularMinutosTrabalhados(
          pontoHoje.entrada, pontoHoje.saida, pontoHoje.saidaAlmoco, pontoHoje.retornoAlmoco
        );
        StorageService.salvarRegistroPonto(pontoHoje);
        mostrarToast(`Saída final: ${horaStr}`, 'sucesso');
      } else if (botao.id === 'btn-ajustar-hoje') {
        UIModal.abrir(pontoHoje);
      }

      this.atualizarTodaInterface();
    });

    document.getElementById('btn-lancamento-manual-hoje')?.addEventListener('click', () => {
      const agora = SyncDataHoraService.obterAgora();
      const hojeStr = EscalaService.formatarDataISO(agora);
      UIModal.abrirModalEdicao(hojeStr);
    });
  }

  static vincularAcoesEscalaEAlarme() {
    const switchAlarme = document.getElementById('switch-alarme-ativo');
    switchAlarme?.addEventListener('change', (e) => {
      StorageService.salvarConfig({ alarmeAtivo: e.target.checked });
      mostrarToast(e.target.checked ? 'Alarme 1x1 ativado' : 'Alarme desativado', 'sucesso');
      this.atualizarTodaInterface();
    });

    document.getElementById('btn-testar-som-alarme')?.addEventListener('click', () => {
      const config = StorageService.obterConfig();
      AudioAlarmeService.tocarBipeTeste(config.alarmeSom);
      mostrarToast('Reproduzindo som de teste...', 'sucesso');
    });

    document.getElementById('btn-salvar-ajustes-alarme')?.addEventListener('click', () => {
      const horario = document.getElementById('input-alarme-horario')?.value || '06:00';
      const som = document.getElementById('select-alarme-som')?.value || 'suave';
      StorageService.salvarConfig({ alarmeHorario: horario, alarmeSom: som });
      mostrarToast('Horário do alarme salvo com sucesso', 'sucesso');
      this.atualizarTodaInterface();
    });

    document.getElementById('btn-salvar-inicio-escala')?.addEventListener('click', () => {
      const dataInicio = document.getElementById('input-inicio-escala')?.value;
      if (!dataInicio) {
        mostrarToast('Selecione uma data para o início da escala', 'alerta');
        return;
      }
      StorageService.salvarConfig({ dataInicioEscala: dataInicio });
      mostrarToast('Início da escala 1x1 atualizado!', 'sucesso');
      UICalendario.renderizar();
      this.atualizarTodaInterface();
    });

    document.getElementById('btn-silenciar-alarme')?.addEventListener('click', () => {
      AudioAlarmeService.parar();
      document.getElementById('tela-alarme-modal')?.classList.remove('ativa');
    });
  }

  static vincularAcoesExtrato() {
    const inputFiltro = document.getElementById('filtro-mes-ano');
    inputFiltro?.addEventListener('change', (e) => {
      const [a, m] = e.target.value.split('-');
      if (a && m) {
        this.anoSelecionado = parseInt(a, 10);
        this.mesSelecionado = parseInt(m, 10);
        this.atualizarTodaInterface();
      }
    });

    document.getElementById('btn-gerar-espelho-pdf')?.addEventListener('click', () => {
      const config = StorageService.obterConfig();
      const pontos = StorageService.obterPontos();
      const resumo = PontoService.consolidarMes(pontos, this.anoSelecionado, this.mesSelecionado, config.dataInicioEscala, config.jornadaPadraoHoras);
      const holerite = CalculoSalarioService.calcularHoleriteEstimado(resumo, config);
      ExportadorService.imprimirEspelhoPonto(resumo, holerite, config);
    });

    document.getElementById('btn-exportar-csv')?.addEventListener('click', () => {
      const config = StorageService.obterConfig();
      const pontos = StorageService.obterPontos();
      const resumo = PontoService.consolidarMes(pontos, this.anoSelecionado, this.mesSelecionado, config.dataInicioEscala, config.jornadaPadraoHoras);
      ExportadorService.exportarCSV(resumo, config);
      mostrarToast('Planilha CSV gerada para download!', 'sucesso');
    });

    document.getElementById('btn-exportar-backup')?.addEventListener('click', () => {
      ExportadorService.baixarBackupJSON();
      mostrarToast('Backup JSON completo salvo!', 'sucesso');
    });

    document.getElementById('input-importar-backup')?.addEventListener('change', (e) => {
      const arquivo = e.target.files?.[0];
      if (!arquivo) return;
      const reader = new FileReader();
      reader.onload = (evt) => {
        const resultado = StorageService.importarDeJSON(evt.target.result);
        if (resultado.sucesso) {
          mostrarToast(`Backup restaurado! ${resultado.totalPontos} pontos carregados.`, 'sucesso');
          this.atualizarTodaInterface();
          UICalendario.renderizar();
        } else {
          mostrarToast('Erro ao importar backup: ' + resultado.erro, 'erro');
        }
      };
      reader.readAsText(arquivo);
    });
  }

  static vincularAcoesConfig() {
    const formSalario = document.getElementById('form-config-salario');
    formSalario?.addEventListener('submit', (e) => {
      e.preventDefault();
      const configAtualizada = {
        nomeUsuario: document.getElementById('config-nome')?.value || '',
        empresa: document.getElementById('config-empresa')?.value || '',
        cargo: document.getElementById('config-cargo')?.value || '',
        salarioBase: parseFloat(document.getElementById('config-salario-base')?.value) || 2000,
        horasMensais: parseInt(document.getElementById('config-horas-mensais')?.value, 10) || 220,
        jornadaPadraoHoras: parseInt(document.getElementById('config-jornada-padrao')?.value, 10) || 8,
        porcentagemExtraNormal: parseInt(document.getElementById('config-porcentagem-normal')?.value, 10) || 50,
        porcentagemExtraFolga: parseInt(document.getElementById('config-porcentagem-folga')?.value, 10) || 100
      };
      StorageService.salvarConfig(configAtualizada);
      mostrarToast('Configurações salvas permanentemente!', 'sucesso');
      this.atualizarTodaInterface();
    });
  }

  static atualizarTodaInterface() {
    const agora = SyncDataHoraService.obterAgora();
    const hojeStr = EscalaService.formatarDataISO(agora);
    const config = StorageService.obterConfig();
    const pontoHoje = StorageService.obterPontoPorData(hojeStr);

    const statusHoje = EscalaService.obterStatusHoje(config.dataInicioEscala);
    UIRender.renderizarHoje(pontoHoje, statusHoje, config);

    const previsaoAlarme = AlarmeService.obterPrevisaoProximoDisparo(config);
    UIRender.renderizarPrevisaoAlarme(previsaoAlarme);

    UIRender.renderizarHistoricoEFinanceiro(
      this.anoSelecionado,
      this.mesSelecionado,
      config,
      (ponto) => UIModal.abrir(ponto),
      (id) => {
        if (confirm('Deseja excluir este registro de ponto permanentemente?')) {
          StorageService.excluirRegistro(id);
          mostrarToast('Registro removido', 'sucesso');
          this.atualizarTodaInterface();
          UICalendario.renderizar();
        }
      }
    );

    UIRender.carregarCamposConfig(config);
  }
}
