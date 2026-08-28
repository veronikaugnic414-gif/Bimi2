import { api } from '../api.js';
import { showConfirm, showToast } from '../toast.js';

export async function renderFinance(container, currentUser) {
  try {
    const data = await api.getFinanceSummary();
    
    const veronikaSpent = Number(data?.veronika_spent || 0);
    const dashaSpent = Number(data?.dasha_spent || 0);
    const totalSpent = Number(data?.total_spent || (veronikaSpent + dashaSpent));
    const remaining = Number(data?.remaining || Math.max(0, 11000 - totalSpent));
    const expenses = Array.isArray(data?.expenses) ? data.expenses : [];

    container.innerHTML = `
      <div class="space-y-6">
        <div class="flex justify-between items-center">
          <div>
            <h2 class="text-2xl font-black text-gray-900 tracking-tight">Бюджет & Витрати</h2>
            <p class="text-xs text-purple-600 font-bold">Спільний ліміт: 11 000 грн</p>
          </div>
          <button id="btn-reset-finance" class="text-xs text-rose-500 hover:text-rose-700 font-bold bg-rose-50 hover:bg-rose-100 px-3.5 py-2.5 rounded-2xl transition cursor-pointer flex items-center gap-1.5">
            <i data-lucide="rotate-ccw" class="w-3.5 h-3.5"></i> Скинути
          </button>
        </div>

        <div class="grid grid-cols-3 gap-3 text-center">
          <div class="glass-card p-4 rounded-3xl border border-purple-100/60">
            <p class="text-[11px] font-bold text-purple-900">Вероніка</p>
            <p class="text-base font-black text-purple-700 mt-1">${veronikaSpent} грн</p>
          </div>
          <div class="glass-card p-4 rounded-3xl border border-pink-100/60">
            <p class="text-[11px] font-bold text-pink-900">Даша</p>
            <p class="text-base font-black text-pink-600 mt-1">${dashaSpent} грн</p>
          </div>
          <div class="glass-card p-4 rounded-3xl border border-gray-200/60">
            <p class="text-[11px] font-bold text-gray-700">Залишок</p>
            <p class="text-base font-black text-gray-900 mt-1">${remaining} грн</p>
          </div>
        </div>

        <!-- Форма -->
        <div class="glass-card p-6 rounded-3xl space-y-4">
          <h3 class="font-black text-sm text-gray-900 flex items-center gap-2">
            <i data-lucide="plus-circle" class="w-4 h-4 text-purple-600"></i> Додати витрату
          </h3>
          <div class="space-y-3">
            <input type="text" id="expense-title" placeholder="Назва покупки..." class="w-full bg-white/80 border border-purple-100 rounded-2xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-purple-400">
            <div class="flex gap-2">
              <input type="number" id="expense-amount" placeholder="Сума (грн)" class="w-1/2 bg-white/80 border border-purple-100 rounded-2xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-purple-400">
              <select id="expense-payer" class="w-1/2 bg-white/80 border border-purple-100 rounded-2xl px-4 py-2.5 text-xs font-bold text-purple-900 focus:outline-none focus:ring-2 focus:ring-purple-400">
                <option value="1" ${currentUser.id === 1 ? 'selected' : ''}>Вероніка</option>
                <option value="2" ${currentUser.id === 2 ? 'selected' : ''}>Даша</option>
              </select>
            </div>
            <button id="btn-add-expense" class="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold py-3 text-xs rounded-2xl shadow-md shadow-purple-200 transition cursor-pointer flex items-center justify-center gap-2">
              <i data-lucide="check" class="w-4 h-4"></i> Зберегти витрату
            </button>
          </div>
        </div>

        <div class="glass-card p-6 rounded-3xl space-y-3">
          <h3 class="font-black text-sm text-gray-900 flex items-center gap-2">
            <i data-lucide="history" class="w-4 h-4 text-purple-600"></i> Історія витрат
          </h3>
          <div class="space-y-2 max-h-72 overflow-y-auto pr-1">
            ${expenses.length ? expenses.map(e => {
              const isV = Number(e.payer_id) === 1;
              return `
                <div class="p-3.5 bg-white/80 rounded-2xl flex justify-between items-center border border-purple-100/60 shadow-2xs">
                  <div>
                    <p class="font-bold text-xs text-gray-900">${e.title || e.description || 'Покупка'}</p>
                    <p class="text-[10px] font-semibold text-gray-400 mt-0.5">${isV ? 'Вероніка' : 'Даша'}</p>
                  </div>
                  <span class="font-black text-xs ${isV ? 'text-purple-700' : 'text-pink-600'}">+${e.amount} грн</span>
                </div>
              `;
            }).join('') : '<p class="text-xs text-gray-400 font-medium text-center py-4">Витрат поки немає</p>'}
          </div>
        </div>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();

    document.getElementById('btn-add-expense').onclick = async () => {
      const title = document.getElementById('expense-title').value.trim();
      const amount = Number(document.getElementById('expense-amount').value);
      const payerId = Number(document.getElementById('expense-payer').value);

      if (title && amount > 0) {
        // Передаємо і title, і description для повної сумісності з Pydantic
        await api.addExpense({ title: title, description: title, amount: amount, payer_id: payerId });
        showToast('Витрату додано!', 'success');
        renderFinance(container, currentUser);
      } else {
        showToast('Заповни назву та суму!', 'warning');
      }
    };

    document.getElementById('btn-reset-finance').onclick = () => {
      showConfirm('Скинути всі витрати?', 'Історія очиститься, а баланс стане 11 000 грн.', async () => {
        await api.resetExpenses();
        showToast('Бюджет скинуто!', 'info');
        renderFinance(container, currentUser);
      });
    };

  } catch (err) {
    console.error("Finance error:", err);
  }
}