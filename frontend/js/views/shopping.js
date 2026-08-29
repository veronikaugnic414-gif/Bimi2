import { api } from '../api.js';

export async function renderShopping(container) {
  const items = await api.getShoppingList();

  container.innerHTML = `
    <section class="card">
      <div class="card-header">
        <div>
          <h2 class="text-section-title">Список покупок</h2>
          <p class="text-secondary">Спільні покупки</p>
        </div>
      </div>

      <div style="display: flex; flex-direction: column; gap: 8px;">
        <input type="text" id="shop-name-input" placeholder="Назва продукту..." class="input-field">
        <div class="input-group">
          <input type="number" id="shop-amount-input" placeholder="Кількість" value="1" class="input-field" style="max-width: 90px;">
          <select id="shop-unit-select" class="select-field">
            <option value="шт">шт</option>
            <option value="г">г</option>
            <option value="кг">кг</option>
            <option value="мл">мл</option>
            <option value="л">л</option>
            <option value="уп">упаковка</option>
          </select>
          <button id="btn-add-shop" class="btn btn-primary" style="padding: 0 16px;" type="button" aria-label="Додати">
            <i data-lucide="plus" class="icon-md"></i>
          </button>
        </div>
      </div>
    </section>

    <div style="display: flex; flex-direction: column; gap: 8px;">
      ${items && items.length ? items.map(i => `
        <div class="item-row ${i.is_crossed_out ? 'crossed-row' : ''}">
          <div data-id="${i.id}" class="item-left btn-toggle-shop">
            <i data-lucide="${i.is_crossed_out ? 'check-circle-2' : 'circle'}" class="icon-md" style="color: ${i.is_crossed_out ? 'var(--primary)' : 'var(--text-muted)'};"></i>
            <span class="item-name ${i.is_crossed_out ? 'crossed' : ''}">${i.item_name}</span>
            <span class="badge">${i.amount || '1 шт'}</span>
          </div>
          <button data-id="${i.id}" class="btn-ghost btn-sm btn-delete-shop" style="padding: 4px;" type="button" aria-label="Видалити">
            <i data-lucide="trash-2" class="icon-sm" style="color: var(--danger);"></i>
          </button>
        </div>
      `).join('') : `
        <div class="empty-state card">
          <div class="empty-state-icon"><i data-lucide="shopping-bag" class="icon-md"></i></div>
          <p class="text-card-title" style="font-size: 15px; margin-bottom: 4px;">Список покупок порожній</p>
          <p class="text-secondary">Усе необхідне вже придбано.</p>
        </div>
      `}
    </div>
  `;

  if (window.lucide) window.lucide.createIcons();

  const addHandler = async () => {
    const name = document.getElementById('shop-name-input').value.trim();
    const amount = document.getElementById('shop-amount-input').value;
    const unit = document.getElementById('shop-unit-select').value;

    if (name) {
      await api.addShoppingItem({ item_name: name, amount: `${amount} ${unit}` });
      renderShopping(container);
    }
  };

  document.getElementById('btn-add-shop').onclick = addHandler;

  document.getElementById('shop-name-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addHandler();
  });

  container.querySelectorAll('.btn-toggle-shop').forEach(el => {
    el.onclick = async () => {
      await api.toggleShoppingItem(el.dataset.id);
      renderShopping(container);
    };
  });

  container.querySelectorAll('.btn-delete-shop').forEach(btn => {
    btn.onclick = async (e) => {
      e.stopPropagation();
      await api.deleteShoppingItem(btn.dataset.id);
      renderShopping(container);
    };
  });
}