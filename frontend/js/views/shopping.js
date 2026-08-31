import { api } from '../api.js';

export async function renderShopping(container) {
  const items = await api.getShoppingList();

  container.innerHTML = `
    <div class="space-y-6">
      <h2 class="text-2xl font-bold text-gray-800">Список покупок</h2>
      
      <!-- Форма додавання -->
      <div class="soft-card p-5 space-y-4 rounded-3xl">
        <input type="text" id="shop-name-input" placeholder="Назва продукту..." class="bg-gray-50 border-0 rounded-full px-5 py-3.5 text-sm w-full outline-none transition-all">
        
        <div class="flex gap-2">
          <input type="number" id="shop-amount-input" placeholder="Кількість" value="1" class="bg-gray-50 border-0 rounded-full px-5 py-3.5 text-sm w-1/2 outline-none transition-all">
          
          <select id="shop-unit-select" class="bg-gray-50 border-0 rounded-full px-5 py-3.5 text-sm w-1/2 font-semibold text-purple-600 outline-none cursor-pointer transition-all">
            <option value="шт">шт</option>
            <option value="г">г</option>
            <option value="кг">кг</option>
            <option value="мл">мл</option>
            <option value="л">л</option>
            <option value="ст. л.">ст. л.</option>
            <option value="ч. л.">ч. л.</option>
            <option value="уп">упаковка</option>
          </select>

          <button id="btn-add-shop" class="bg-purple-600 hover:bg-purple-700 text-white rounded-full w-14 flex items-center justify-center shrink-0 shadow-lg shadow-purple-500/30 transition-transform hover:scale-105 cursor-pointer">
            <i data-lucide="plus" class="w-6 h-6"></i>
          </button>
        </div>
      </div>

      <!-- Список -->
      <div class="space-y-3">
        ${items.map(i => `
          <div class="soft-card p-4 rounded-3xl flex justify-between items-center transition-all ${i.is_crossed_out ? 'opacity-50 grayscale' : ''}">
            <div data-id="${i.id}" class="btn-toggle-shop flex-1 cursor-pointer flex items-center gap-4">
              <div class="w-7 h-7 rounded-full flex items-center justify-center border-2 transition-colors ${i.is_crossed_out ? 'bg-purple-500 border-purple-500' : 'border-gray-300'}">
                ${i.is_crossed_out ? '<i data-lucide="check" class="w-4 h-4 text-white"></i>' : ''}
              </div>
              <span class="text-base font-semibold text-gray-800 ${i.is_crossed_out ? 'line-through text-gray-400' : ''}">${i.item_name}</span>
              <span class="text-xs text-purple-700 bg-purple-100/80 px-3 py-1.5 rounded-full font-bold ml-auto">${i.amount || '1 шт'}</span>
            </div>
            <button data-id="${i.id}" class="btn-delete-shop text-rose-400 hover:text-rose-600 bg-rose-50 hover:bg-rose-100 p-3 rounded-full ml-3 transition-colors cursor-pointer">
              <i data-lucide="trash-2" class="w-4 h-4"></i>
            </button>
          </div>
        `).join('')}
      </div>
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