/**
 * Submódulo de Controle de Modais (Edição e Lançamento de Ponto) - PontoFlex Pro
 */

import { StorageService } from '../logica/storage.js';
import { EscalaService } from '../logica/escala.js';
import { PontoService } from '../logica/ponto.js';

export class UIModal {
  static vincular(onSalvo) {
    const modal = document.getElementById('modal-editar-ponto');
    const form = document.getElementById('form-editar-ponto');
    const btnFechar = document.getElementById('btn-fechar-modal-ponto');
    const btnCancelar = document.getElementById('btn-cancelar-modal-ponto');

    const fechar = () => modal?.classList.remove('visivel');
    btnFechar?.addEventListener('click', fechar);
    btnCancelar?.addEventListener('click', fechar);

    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const id = document.getElementById('modal-ponto-id').value;
        const data = document.getElementById('modal-ponto-data').value;
        const entrada = document.getElementById('modal-ponto-entrada').value;
        const saidaAlmoco = document.getElementById('modal-ponto-almoco-sai').value;
        const retornoAlmoco = document.getElementById('modal-ponto-almoco-volta').value;
        const saida = document.getElementById('modal-ponto-saida').value;
        const observacao = document.getElementById('modal-ponto-obs').value;
        const ehFolga = document.getElementById('modal-ponto-folga-check').checked;

        const minutos = PontoService.calcularMinutosTrabalhados(
          entrada, saida, saidaAlmoco, retornoAlmoco
        );

        const registro = {
          id: id || undefined,
          data,
          entrada,
          saidaAlmoco,
          retornoAlmoco,
          saida,
          observacao,
          isDiaTrabalhoEscala: !ehFolga,
          totalMinutosTrabalhados: minutos
        };

        StorageService.salvarRegistroPonto(registro);
        fechar();
        if (typeof onSalvo === 'function') onSalvo();
      });
    }
  }

  static abrir(registro) {
    const modal = document.getElementById('modal-editar-ponto');
    if (!modal) return;

    document.getElementById('modal-ponto-id').value = registro.id || '';
    document.getElementById('modal-ponto-data').value = registro.data || '';
    document.getElementById('modal-ponto-entrada').value = registro.entrada || '';
    document.getElementById('modal-ponto-almoco-sai').value = registro.saidaAlmoco || '';
    document.getElementById('modal-ponto-almoco-volta').value = registro.retornoAlmoco || '';
    document.getElementById('modal-ponto-saida').value = registro.saida || '';
    document.getElementById('modal-ponto-obs').value = registro.observacao || '';

    const checkFolga = document.getElementById('modal-ponto-folga-check');
    if (checkFolga) {
      checkFolga.checked = registro.isDiaTrabalhoEscala === false;
    }

    modal.classList.add('visivel');
  }

  static abrirModalEdicao(dataStr) {
    const config = StorageService.obterConfig();
    let ponto = StorageService.obterPontoPorData(dataStr);
    if (!ponto) {
      const isTrabalho = EscalaService.isDiaDeTrabalho(dataStr, config.dataInicioEscala);
      ponto = {
        data: dataStr,
        entrada: '',
        saidaAlmoco: '',
        retornoAlmoco: '',
        saida: '',
        observacao: '',
        isDiaTrabalhoEscala: isTrabalho
      };
    }
    this.abrir(ponto);
  }
}
