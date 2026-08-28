export function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  
  let iconName = 'info';
  let colorClasses = 'bg-white/90 border-purple-200 text-purple-900';

  if (type === 'success') {
    iconName = 'check-circle-2';
    colorClasses = 'bg-white/90 border-emerald-200 text-emerald-950';
  } else if (type === 'warning') {
    iconName = 'alert-triangle';
    colorClasses = 'bg-white/90 border-amber-200 text-amber-950';
  } else if (type === 'error') {
    iconName = 'alert-circle';
    colorClasses = 'bg-white/90 border-rose-200 text-rose-950';
  }

  toast.className = `glass-card border px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 text-xs font-bold transition-all transform translate-y-2 opacity-0 ${colorClasses}`;
  toast.innerHTML = `
    <i data-lucide="${iconName}" class="w-4 h-4 shrink-0"></i>
    <span>${message}</span>
  `;

  container.appendChild(toast);
  if (window.lucide) window.lucide.createIcons();

  requestAnimationFrame(() => {
    toast.classList.remove('translate-y-2', 'opacity-0');
  });

  setTimeout(() => {
    toast.classList.add('opacity-0', '-translate-y-2');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

export function showConfirm(title, message, onConfirm) {
  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 bg-purple-950/20 backdrop-blur-xl z-50 flex items-center justify-center p-4';
  modal.innerHTML = `
    <div class="glass-card p-6 w-full max-w-sm text-center rounded-3xl shadow-2xl border border-white/80 space-y-4">
      <div class="w-12 h-12 mx-auto bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center">
        <i data-lucide="help-circle" class="w-6 h-6"></i>
      </div>
      <div>
        <h3 class="font-black text-base text-gray-900">${title}</h3>
        <p class="text-xs text-gray-500 font-medium mt-1">${message}</p>
      </div>
      <div class="flex gap-2 pt-2">
        <button id="confirm-cancel" class="w-1/2 py-2.5 text-xs font-bold text-gray-500 bg-gray-100 hover:bg-gray-200 rounded-2xl transition cursor-pointer">Скасувати</button>
        <button id="confirm-ok" class="w-1/2 py-2.5 text-xs font-bold text-white bg-rose-500 hover:bg-rose-600 rounded-2xl shadow-md transition cursor-pointer">Підтвердити</button>
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