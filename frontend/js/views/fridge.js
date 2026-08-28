import { api } from '../api.js';
import { showToast } from '../toast.js';

export async function renderFridge(container) {
  try {
    const items = await api.getFridgeItems();

    container.innerHTML = `
      <div class="space-y-6">
        <div>
          <h2 class="text-2xl font-black text-gray-900 tracking-tight">Холодильник</h2>
          <p class="text-xs text-purple-600 font-bold">Наявні продукти та запаси</p>
        </div>

        <!-- Форма з охайною панеллю вибору одиниць -->
        <div class="glass-card p-6 rounded-3xl space-y-4">
          <h3 class="font-black text-sm text-gray-900 flex items-center gap-2">
            <i data-lucide="plus-circle" class="w-4 h-4 text-purple-600"></i> Додати продукт
          </h3>
          <div class="space-y-3">
            <input type="text" id="fridge-name" placeholder="Назва продукту..." class="w-full bg-white/80 border border-purple-100 rounded-2xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-purple-400">
            
            <div class="flex gap-2">
              <input type="number" id="fridge-qty" placeholder="Кількість" value="1" class="w-1/2 bg-white/80 border border-purple-100 rounded-2xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-purple-400">
              <select id="fridge-unit" class="w-1/2 bg-white/80 border border-purple-100 rounded-2xl px-4 py-2.5 text-xs font-bold text-purple-900 focus:outline-none focus:ring-2 focus:ring-purple-400">
                <option value="шт">шт</option>
                <option value="г">г</option>
                <option value="кг">кг</option>
                <option value="мл">мл</option>
                <option value="л">л</option>
                <option value="упаковка">упаковка</option>
              </select>
            </div>

            <button id="btn-add-fridge" class="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold py-3 text-xs rounded-2xl shadow-md shadow-purple-200 transition cursor-pointer flex items-center justify-center gap-2">
              <i data-lucide="archive" class="w-4 h-4"></i> Зберегти продукт
            </button>
          </div>
        </div>

        <!-- Список продукції -->
        <div class="space-y-2">
          ${items.length ? items.map(item => `
            <div class="glass-card p-4 rounded-3xl flex justify-between items-center border border-purple-100/60 shadow-2xs">
              <div>
                <p class="font-bold text-xs text-gray-900">${item.item_name}</p>
                <p class="text-[10px] font-extrabold text-purple-600 mt-0.5">${item.amount || '1 шт'}</p>
              </div>
              <button data-id="${item.id}" class="btn-delete-fridge text-rose-400 hover:text-rose-600 p-2 font-bold cursor-pointer transition">
                <i data-lucide="trash-2" class="w-4 h-4"></i>
              </button>
            </div>
          `).join('') : '<p class="text-xs text-gray-400 font-medium text-center py-6">Холодильник порожній</p>'}
        </div>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();

    document.getElementById('btn-add-fridge').onclick = async () => {
      const name = document.getElementById('fridge-name').value.trim();
      const qty = document.getElementById('fridge-qty').value || '1';
      const unit = document.getElementById('fridge-unit').value;

      if (name) {
        await api.addFridgeItem({ item_name: name, amount: `${qty} ${unit}` });
        showToast('Продукт збережено!', 'success');
        renderFridge(container);
      } else {
        showToast('Введіть назву продукту', 'warning');
      }
    };

    container.querySelectorAll('.btn-delete-fridge').forEach(btn => {
      btn.onclick = async () => {
        await api.deleteFridgeItem(btn.dataset.id);
        showToast('Видалено з холодильника', 'info');
        renderFridge(container);
      };
    });

  } catch (err) {
    console.error("Fridge error:", err);
  }
}