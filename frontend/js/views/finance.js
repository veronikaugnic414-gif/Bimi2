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
      <section class="card">
        <div class="card-header">
          <div>
            <h2 class="text-section-title">Бюджет & Витрати</h2>
            <p class="text-secondary">Спільний ліміт: 11 000 ₴</p>
          </div>
          <button id="btn-reset-finance" class="btn btn-danger-ghost btn-sm" type="button">
            <i data-lucide="rotate-ccw" class="icon-sm"></i>
            <span>Скинути</span>
          </button>
        </div>

        <div class="budget-grid" style="margin-top: 4px;">
          <div class="stat-pill veronika">
            <div class="stat-pill-label">Вероніка</div>
            <div class="stat-pill-value">${veronikaSpent} ₴</div>
          </div>
          <div class="stat-pill dasha">
            <div class="stat-pill-label">Даша</div>
            <div class="stat-pill-value">${dashaSpent} ₴</div>
          </div>
          <div class="stat-pill remaining">
            <div class="stat-pill-label">Залишок</div>
            <div class="stat-pill-value">${remaining} ₴</div>
          </div>
        </div>
      </section>

      <!-- Додати витрату -->
      <section class="card">
        <h3 class="text-card-title" style="font-size: 15px; margin-bottom: 12px;">Додати витрату</h3>
        <div style="display: flex; flex-direction: column; gap: 8px;">
          <input type="text" id="expense-title" placeholder="Назва покупки..." class="input-field">
          <div class="input-group">
            <input type="number" id="expense-amount" placeholder="Сума (грн)" class="input-field">
            <select id="expense-payer" class="select-field">
              <option value="1" ${currentUser.id === 1 ? 'selected' : ''}>Вероніка</option>
              <option value="2" ${currentUser.id === 2 ? 'selected' : ''}>Даша</option>
            </select>
          </div>
          <button id="btn-add-expense" class="btn btn-primary" style="margin-top: 4px;" type="button">Зберегти витрату</button>
        </div>
      </section>

      <!-- Історія -->
      <section class="card">
        <h3 class="text-card-title" style="font-size: 15px; margin-bottom: 12px;">Історія витрат</h3>
        <div style="display: flex; flex-direction: column; gap: 8px; max-height: 320px; overflow-y: auto;">
          ${expenses.length ? expenses.map(e => {
            const isV = Number(e.payer_id) === 1;
            return `
              <div class="item-row">
                <div>
                  <div class="text-body" style="font-size: 13px; font-weight: 600;">${e.title || e.description || 'Покупка'}</div>
                  <div class="text-muted" style="font-size: 11px; margin-top: 1px;">${isV ? 'Вероніка' : 'Даша'}</div>
                </div>
                <span style="font-size: 14px; font-weight: 700; color: ${isV ? 'var(--text-accent-purple)' : 'var(--text-accent-pink)'};">+${e.amount} ₴</span>
              </div>
            `;
          }).join('') : '<p class="empty-state">Витрат поки немає</p>'}
        </div>
      </section>
    `;

    if (window.lucide) window.lucide.createIcons();

    document.getElementById('btn-add-expense').onclick = async () => {
      const title = document.getElementById('expense-title').value.trim();
      const amount = Number(document.getElementById('expense-amount').value);
      const payerId = Number(document.getElementById('expense-payer').value);

      if (title && amount > 0) {
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