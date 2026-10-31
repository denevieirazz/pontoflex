/**
 * PontoFlex Pro - Ponto de Entrada da Aplicação
 */

import { AppUI } from './design/ui.js';
import { AlarmeService } from './logica/alarme.js';
import { AudioAlarmeService } from './ferramentas/audioAlarme.js';
import { AtualizadorService } from './ferramentas/atualizador.js';
import { SyncDataHoraService } from './ferramentas/syncDataHora.js';

// Inicialização Principal dos Controladores e Armazenamento
await AppUI.inicializar();

// Filtro Inicial de Data do Mês
const inputFiltro = document.getElementById('filtro-mes-ano');
if (inputFiltro) {
  const hoje = new Date();
  inputFiltro.value = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`;
}

// Monitoramento do Alarme Inteligente 1x1
AlarmeService.iniciarMonitoramento((dadosAlarme) => {
  AudioAlarmeService.iniciar(dadosAlarme.som);
  document.getElementById('tela-alarme-modal')?.classList.add('ativa');
});

// Monitoramento de Conectividade e Modo Offline
const badgeConexao = document.getElementById('badge-status-conexao');
const textoConexao = document.getElementById('texto-status-conexao');
const atualizarBadgeRede = (online) => {
  if (!badgeConexao || !textoConexao) return;
  badgeConexao.className = online ? 'badge-status-rede online' : 'badge-status-rede offline';
  textoConexao.textContent = online ? 'Horário Sincronizado' : '100% Offline';
};

SyncDataHoraService.monitorarConexao(atualizarBadgeRede);
atualizarBadgeRede(navigator.onLine);

// Atualização PWA (OTA)
AtualizadorService.inicializar({
  onNovaVersao: () => {
    document.getElementById('banner-nova-versao')?.classList.add('visivel');
  }
});

document.getElementById('btn-atualizar-app')?.addEventListener('click', () => {
  AtualizadorService.aplicarAtualizacao();
});
