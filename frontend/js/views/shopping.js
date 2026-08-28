import { api } from '../api.js';

export async function renderShopping(container) {
  const items = await api.getShoppingList();

  container.innerHTML = `
    <div class="space-y-5">
      <h2 class="text-2xl font-bold text-gray-800">Список покупок 🛒</h2>
      
      <!-- Форма додавання з Enter та вибором одиниць -->
      <div class="soft-card p-4 space-y-3">
        <input type="text" id="shop-name-input" placeholder="Назва продукту..." class="bg-gray-50 border-0 rounded-xl px-4 py-2.5 text-sm w-full">
        
        <div class="flex gap-2">
          <input type="number" id="shop-amount-input" placeholder="Кількість" value="1" class="bg-gray-50 border-0 rounded-xl px-3 py-2 text-sm w-1/2">
          
          <select id="shop-unit-select" class="bg-gray-50 border-0 rounded-xl px-3 py-2 text-sm w-1/2 font-semibold text-purple-700">
            <option value="шт">шт</option>
            <option value="г">г</option>
            <option value="кг">кг</option>
            <option value="мл">мл</option>
            <option value="л">л</option>
            <option value="уп">упаковка</option>
          </select>

          <button id="btn-add-shop" class="btn-primary px-5 py-2 text-sm font-bold">+</button>
        </div>
      </div>

      <!-- Список -->
      <div class="space-y-2.5">
        ${items.map(i => `
          <div class="soft-card p-3.5 flex justify-between items-center ${i.is_crossed_out ? 'opacity-50 bg-gray-100/50' : ''}">
            <div data-id="${i.id}" class="btn-toggle-shop flex-1 cursor-pointer flex items-center gap-3">
              <span class="text-lg">${i.is_crossed_out ? '✅' : '⚪'}</span>
              <span class="text-sm font-semibold text-gray-800 ${i.is_crossed_out ? 'line-through' : ''}">${i.item_name}</span>
              <span class="text-xs text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full font-bold">${i.amount || '1 шт'}</span>
            </div>
            <button data-id="${i.id}" class="btn-delete-shop text-red-400 hover:text-red-600 p-2 text-sm font-bold">❌</button>
          </div>
        `).join('')}
      </div>
    </div>
  `;

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

  // Реакція на натискання Enter у полі вводу
  document.getElementById('shop-name-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addHandler();
  });

  // Перемикач закреслення
  container.querySelectorAll('.btn-toggle-shop').forEach(el => {
    el.onclick = async () => {
      await api.toggleShoppingItem(el.dataset.id);
      renderShopping(container);
    };
  });

  // Видалення через хрестик ❌
  container.querySelectorAll('.btn-delete-shop').forEach(btn => {
    btn.onclick = async (e) => {
      e.stopPropagation();
      await api.deleteShoppingItem(btn.dataset.id);
      renderShopping(container);
    };
  });
}