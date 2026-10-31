/**
 * Serviço de Notificações Toast Não-bloqueantes
 */

export function mostrarToast(mensagem, tipo = 'sucesso') {
  let container = document.getElementById('container-toast');
  if (!container) {
    container = document.createElement('div');
    container.id = 'container-toast';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast-msg ${tipo}`;

  const icone = tipo === 'sucesso' ? '✅' : tipo === 'alerta' ? '⚠️' : 'ℹ️';
  toast.innerHTML = `<span>${icone}</span><span>${mensagem}</span>`;

  container.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 3000);
}
