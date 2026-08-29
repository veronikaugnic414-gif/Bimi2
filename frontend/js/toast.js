export function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  
  let iconName = 'info';
  let iconColor = 'var(--primary)';

  if (type === 'success') {
    iconName = 'check-circle-2';
    iconColor = '#10B981';
  } else if (type === 'warning') {
    iconName = 'alert-triangle';
    iconColor = '#F59E0B';
  } else if (type === 'error') {
    iconName = 'alert-circle';
    iconColor = 'var(--danger)';
  }

  toast.className = 'toast';
  toast.innerHTML = `
    <i data-lucide="${iconName}" class="icon-sm" style="color: ${iconColor}; flex-shrink: 0;"></i>
    <span>${message}</span>
  `;

  container.appendChild(toast);
  if (window.lucide) window.lucide.createIcons();

  requestAnimationFrame(() => {
    toast.classList.add('show');
  });

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 250);
  }, 2800);
}

export function showConfirm(title, message, onConfirm) {
  const modal = document.createElement('div');
  modal.className = 'modal-backdrop';
  modal.innerHTML = `
    <div class="bottom-sheet" style="text-align: center;">
      <div class="sheet-indicator"></div>
      <div class="empty-state-icon" style="background: var(--danger-surface); color: var(--danger); margin-bottom: 12px;">
        <i data-lucide="help-circle" class="icon-md"></i>
      </div>
      <h3 class="text-card-title">${title}</h3>
      <p class="text-secondary" style="margin-top: 4px; margin-bottom: 20px;">${message}</p>
      
      <div style="display: flex; gap: 8px;">
        <button id="confirm-cancel" class="btn btn-secondary" style="flex: 1;" type="button">Скасувати</button>
        <button id="confirm-ok" class="btn btn-accent-pink" style="flex: 1;" type="button">Підтвердити</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  if (window.lucide) window.lucide.createIcons();

  document.getElementById('confirm-cancel').onclick = () => modal.remove();
  document.getElementById('confirm-ok').onclick = () => {
    onConfirm();
    modal.remove();
  };
}