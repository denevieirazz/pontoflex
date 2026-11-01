/**
 * Controlador Principal da Interface Corporativa (UI Coordinator) - PontoFlex Pro
 */

import { StorageService } from '../logica/storage.js';
import { EscalaService } from '../logica/escala.js';
import { PontoService } from '../logica/ponto.js';
import { AlarmeService } from '../logica/alarme.js';
import { SyncDataHoraService } from '../ferramentas/syncDataHora.js';
import { ExportadorService } from '../ferramentas/exportador.js';
import { UIModal } from './uiModal.js';
import { UIRender } from './uiRender.js';
import { UICalendario } from './uiCalendario.js';
import { UIAlarme } from './uiAlarme.js';
import { UIGanhos } from './uiGanhos.js';
import { mostrarToast } from './toast.js';

export class AppUI {
  static abaAtual = 'ponto';

  static async inicializar() {
    await StorageService.inicializar();

    this.vincularNavegacaoAbas();
    this.iniciarRelogio();
    this.vincularAcoesPonto();
    this.vincularAcoesCalendario();
    this.vincularAcoesConfig();

    UIAlarme.vincular(() => this.atualizarTodaInterface());
    UIGanhos.vincular(
      () => this.atualizarTodaInterface(),
      (ponto) => UIModal.abrir(ponto),
      (id) => this.excluirPonto(id)
    );
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

    if (abaAlvo === 'calendario') {
      UICalendario.renderizar();
    } else if (abaAlvo === 'alarme') {
      UIAlarme.renderizar();
    } else if (abaAlvo === 'ganhos') {
      UIGanhos.renderizar();
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

    document.getElementById('btn-ver-calendario-completo')?.addEventListener('click', () => {
      this.trocarAba('calendario');
    });
  }

  static vincularAcoesCalendario() {
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

    document.getElementById('btn-inverter-escala')?.addEventListener('click', () => {
      UICalendario.alternarEscalaHoje();
      this.atualizarTodaInterface();
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

  static excluirPonto(id) {
    if (confirm('Deseja excluir este registro de ponto permanentemente?')) {
      StorageService.excluirRegistro(id);
      mostrarToast('Registro removido', 'sucesso');
      this.atualizarTodaInterface();
      UICalendario.renderizar();
    }
  }

  static atualizarTodaInterface() {
    const agora = SyncDataHoraService.obterAgora();
    const hojeStr = EscalaService.formatarDataISO(agora);
    const config = StorageService.obterConfig();
    const pontoHoje = StorageService.obterPontoPorData(hojeStr);
    const statusHoje = EscalaService.obterStatusHoje(config.dataInicioEscala);

    UIRender.renderizarHoje(pontoHoje, statusHoje, config);
    UIRender.renderizarChipAlarmeHome(config, () => this.trocarAba('alarme'));
    UIRender.renderizarBannerSalarioHome(
      config,
      (val) => {
        StorageService.salvarConfig({ salarioBase: val, salarioConfigurado: true });
        mostrarToast('Salário definido com sucesso!', 'sucesso');
        this.atualizarTodaInterface();
      },
      () => this.trocarAba('ganhos')
    );

    UICalendario.renderizarFaixaHome('container-agenda-home');
    UIAlarme.renderizar();
    UIGanhos.renderizar();
    UIRender.carregarCamposConfig(config);

    const inputDataEscala = document.getElementById('input-inicio-escala');
    if (inputDataEscala && config.dataInicioEscala) {
      inputDataEscala.value = config.dataInicioEscala;
    }
  }
}
