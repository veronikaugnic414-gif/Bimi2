import { api } from '../api.js';
import { showConfirm, showToast } from '../toast.js';

export async function renderShopping(container) {
  try {
    const rawItems = await api.getShoppingList();
    const items = Array.isArray(rawItems) ? rawItems : [];

    container.innerHTML = `
      <div class="space-y-6">
        <div class="flex justify-between items-center">
          <div>
            <h2 class="text-2xl font-black text-gray-900 tracking-tight">Список покупок</h2>
            <p class="text-xs text-purple-600 font-bold">Усе необхідне для дому та страв</p>
          </div>
          ${items.length ? `
            <button id="btn-clear-shopping" class="flex items-center gap-1.5 text-xs text-rose-500 hover:text-rose-700 font-bold bg-rose-50/80 hover:bg-rose-100/80 px-4 py-2.5 rounded-2xl border border-rose-100 transition cursor-pointer shrink-0">
              <i data-lucide="trash" class="w-4 h-4"></i> Очистити
            </button>
          ` : ''}
        </div>
        
        <!-- Форма додавання -->
        <div class="glass-card p-6 space-y-4 rounded-3xl">
          <input type="text" id="shop-name-input" placeholder="Назва продукту (натисни Enter)..." class="w-full bg-white/80 border border-purple-100 rounded-2xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-purple-400">
          
          <div class="flex gap-2">
            <input type="number" id="shop-amount-input" placeholder="Кількість" value="1" class="w-1/2 bg-white/80 border border-purple-100 rounded-2xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-purple-400">
            
            <select id="shop-unit-select" class="w-1/2 bg-white/80 border border-purple-100 rounded-2xl px-4 py-2.5 text-xs font-bold text-purple-900 focus:outline-none focus:ring-2 focus:ring-purple-400">
              <option value="шт">шт</option>
              <option value="г">г</option>
              <option value="кг">кг</option>
              <option value="мл">мл</option>
              <option value="л">л</option>
              <option value="ст. л.">ст. л.</option>
              <option value="ч. л.">ч. л.</option>
              <option value="упаковка">упаковка</option>
            </select>

            <button id="btn-add-shop" class="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-2xl px-5 text-xs font-bold shadow-md shadow-purple-200 transition cursor-pointer flex items-center justify-center shrink-0">
              <i data-lucide="plus" class="w-4 h-4"></i>
            </button>
          </div>
        </div>

        <!-- Список покупок -->
        <div class="space-y-2">
          ${items.length ? items.map(i => `
            <div class="glass-card p-4 rounded-3xl flex justify-between items-center border border-purple-100/60 shadow-2xs transition ${i.is_crossed_out ? 'opacity-50 grayscale' : ''}">
              <div data-id="${i.id}" class="btn-toggle-shop flex-1 cursor-pointer flex items-center gap-3">
                <i data-lucide="${i.is_crossed_out ? 'check-circle-2' : 'circle'}" class="w-5 h-5 ${i.is_crossed_out ? 'text-purple-600' : 'text-gray-300'}"></i>
                <span class="text-xs font-bold ${i.is_crossed_out ? 'line-through text-gray-400' : 'text-gray-900'}">${i.item_name}</span>
                <span class="text-[10px] text-purple-900 bg-purple-100/80 px-2.5 py-1 rounded-full font-bold ml-auto">${i.amount || '1 шт'}</span>
              </div>
              <button data-id="${i.id}" class="btn-delete-shop text-rose-400 hover:text-rose-600 p-2 font-bold cursor-pointer transition">
                <i data-lucide="trash-2" class="w-4 h-4"></i>
              </button>
            </div>
          `).join('') : '<p class="text-xs text-gray-400 font-medium text-center py-8">Список покупок порожній</p>'}
        </div>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();

    const clearBtn = document.getElementById('btn-clear-shopping');
    if (clearBtn) {
      clearBtn.onclick = () => {
        showConfirm('Очистити список покупок?', 'Усі товари будуть видалені зі списку.', async () => {
          await api.clearShoppingList();
          showToast('Список покупок очищено!', 'info');
          renderShopping(container);
        });
      };
    }

    const addHandler = async () => {
      const nameInput = document.getElementById('shop-name-input');
      const name = nameInput.value.trim();
      const amount = document.getElementById('shop-amount-input').value || '1';
      const unit = document.getElementById('shop-unit-select').value;

      if (name) {
        await api.addShoppingItem({ item_name: name, amount: `${amount} ${unit}` });
        renderShopping(container);
      }
    };

    document.getElementById('btn-add-shop').onclick = addHandler;

    document.getElementById('shop-name-input').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        addHandler();
      }
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

  } catch (err) {
    console.error("Shopping render error:", err);
  }
}