import { api } from '../api.js';
import { showConfirm, showToast } from '../toast.js';

const days = ["Понеділок", "Вівторок", "Середа", "Четвер", "П'ятниця", "Субота", "Неділя"];
const meals = ["Сніданок", "Обід", "Вечеря"];

export async function renderMenu(container) {
  try {
    const rawMenu = await api.getMenu();
    const rawRecipes = await api.getRecipes();

    const menuItems = Array.isArray(rawMenu) ? rawMenu : [];
    const recipes = Array.isArray(rawRecipes) ? rawRecipes : [];

    container.innerHTML = `
      <div class="space-y-6">
        <!-- Шапка Меню -->
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 class="text-2xl font-black text-gray-900 tracking-tight">Тижневе меню</h2>
            <p class="text-xs text-purple-600 font-bold mt-0.5">Обирай страви з візуальним пошуком</p>
          </div>
          <div class="flex gap-2 w-full sm:w-auto">
            <button id="btn-clear-menu" class="flex-1 sm:flex-none flex items-center justify-center gap-1.5 text-xs text-rose-500 hover:text-rose-700 font-bold bg-rose-50/80 hover:bg-rose-100/80 px-4 py-2.5 rounded-2xl border border-rose-100 transition cursor-pointer">
              <i data-lucide="trash" class="w-4 h-4"></i> Скинути
            </button>
            <button id="btn-sync-shop" class="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-bold px-4 py-2.5 rounded-2xl shadow-md shadow-purple-200 transition cursor-pointer">
              <i data-lucide="shopping-bag" class="w-4 h-4"></i> У покупки
            </button>
          </div>
        </div>

        <!-- Сітка Днів -->
        <div class="space-y-5">
          ${days.map(day => `
            <div class="glass-card p-5 space-y-4 rounded-3xl border border-purple-100/60">
              <h3 class="font-black text-sm text-purple-950 border-b border-purple-100/60 pb-2">${day}</h3>
              <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                ${meals.map(meal => {
                  const current = menuItems.find(m => m.day_of_week === day && m.meal_type === meal);
                  const currentRecipe = recipes.find(r => r.id === current?.recipe_id);

                  return `
                    <div class="bg-purple-50/40 p-3.5 rounded-2xl border border-purple-100/50 flex flex-col justify-between space-y-2.5">
                      <div>
                        <span class="text-[10px] font-extrabold text-purple-600 uppercase tracking-wider">${meal}</span>
                        ${currentRecipe?.photo_url ? `<img src="${currentRecipe.photo_url}" class="w-full h-24 object-cover rounded-xl my-1.5 shadow-2xs">` : ''}
                        <p class="text-xs font-bold text-gray-900 mt-1 line-clamp-1">${current ? current.description : 'Не обрано'}</p>
                      </div>

                      <button data-day="${day}" data-meal="${meal}" class="btn-select-meal w-full bg-white/90 border border-purple-200 text-purple-800 py-2 rounded-xl text-xs font-bold shadow-2xs hover:bg-purple-50 transition cursor-pointer flex items-center justify-center gap-1.5">
                        ${current ? '<i data-lucide="refresh-cw" class="w-3.5 h-3.5 text-purple-600"></i> Змінити' : '<i data-lucide="plus" class="w-3.5 h-3.5 text-purple-600"></i> Обрати'}
                      </button>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Модальне вікно вибору страви -->
      <div id="meal-picker-modal" class="hidden fixed inset-0 bg-purple-950/20 backdrop-blur-xl z-50 flex items-center justify-center p-4">
        <div class="glass-card p-6 w-full max-w-md space-y-4 max-h-[85vh] overflow-y-auto rounded-3xl shadow-2xl">
          <h3 id="picker-title" class="font-black text-base text-gray-900 text-center">Обери страву</h3>
          
          <div class="relative">
            <i data-lucide="search" class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"></i>
            <input type="text" id="recipe-search-input" placeholder="Пошук страви..." class="w-full bg-white/80 border border-purple-100 rounded-full pl-11 pr-4 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-purple-400">
          </div>

          <div id="recipes-picker-list" class="space-y-2 max-h-60 overflow-y-auto pr-1"></div>

          <button id="btn-close-picker" class="w-full py-2.5 bg-gray-100 hover:bg-gray-200 rounded-2xl text-xs font-bold text-gray-700 transition cursor-pointer">Скасувати</button>
        </div>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();

    let targetDay = '';
    let targetMeal = '';
    const pickerModal = document.getElementById('meal-picker-modal');

    container.querySelectorAll('.btn-select-meal').forEach(btn => {
      btn.onclick = () => {
        targetDay = btn.dataset.day;
        targetMeal = btn.dataset.meal;
        document.getElementById('picker-title').innerText = `${targetDay} • ${targetMeal}`;
        const searchInput = document.getElementById('recipe-search-input');
        if (searchInput) searchInput.value = '';
        renderPickerList(recipes);
        pickerModal.classList.remove('hidden');
      };
    });

    document.getElementById('btn-close-picker').onclick = () => pickerModal.classList.add('hidden');

    document.getElementById('recipe-search-input').oninput = (e) => {
      const q = e.target.value.toLowerCase().trim();
      const filtered = recipes.filter(r => (r.title || '').toLowerCase().includes(q));
      renderPickerList(filtered);
    };

    function renderPickerList(list) {
      const listEl = document.getElementById('recipes-picker-list');
      if (!list.length) {
        listEl.innerHTML = '<p class="text-xs text-gray-400 font-medium text-center py-6">Страви не знайдено</p>';
        return;
      }

      listEl.innerHTML = list.map(r => `
        <div data-id="${r.id}" class="picker-item p-3 bg-white/70 hover:bg-purple-50/80 rounded-2xl flex items-center space-x-3 cursor-pointer border border-purple-100/40 transition">
          ${r.photo_url ? `<img src="${r.photo_url}" class="w-12 h-12 object-cover rounded-xl shadow-2xs shrink-0">` : '<div class="w-12 h-12 bg-purple-100/60 rounded-xl flex items-center justify-center text-purple-500 shrink-0"><i data-lucide="utensils" class="w-5 h-5"></i></div>'}
          <div class="flex-1 min-w-0">
            <p class="font-bold text-xs text-gray-900 truncate">${r.title}</p>
            <p class="text-[10px] font-semibold text-gray-400 mt-0.5 flex items-center gap-1"><i data-lucide="clock" class="w-3 h-3 text-purple-500"></i> ${r.cooking_time || 20} хв</p>
          </div>
        </div>
      `).join('');

      if (window.lucide) window.lucide.createIcons();

      listEl.querySelectorAll('.picker-item').forEach(item => {
        item.onclick = async () => {
          const recipeId = parseInt(item.dataset.id);
          const recipe = recipes.find(r => r.id === recipeId);
          if (recipe) {
            await api.addMenuItem({
              day_of_week: targetDay,
              meal_type: targetMeal,
              recipe_id: recipeId,
              description: recipe.title
            });
            pickerModal.classList.add('hidden');
            showToast(`Оновлено: ${recipe.title}`, 'success');
            renderMenu(container);
          }
        };
      });
    }

    document.getElementById('btn-clear-menu').onclick = () => {
      showConfirm('Скинути тижневе меню?', 'Усі обрані страви будуть видалені з розкладу.', async () => {
        await api.clearMenu();
        showToast('Тижневе меню очищено!', 'info');
        renderMenu(container);
      });
    };

    document.getElementById('btn-sync-shop').onclick = async () => {
      try {
        showToast('Формуємо список покупок...', 'info');
        const res = await api.generateShoppingFromMenu();
        
        const message = res?.message || res?.detail || 'Інгредієнти додано у покупки!';
        const status = res?.status || (message.includes('порожнє') ? 'warning' : 'success');

        if (status === 'warning') {
          showToast(message, 'warning');
        } else if (status === 'info') {
          showToast(message, 'info');
        } else {
          showToast(message, 'success');
        }
      } catch (err) {
        console.error("Помилка генерації покупок:", err);
        showToast('Не вдалося згенерувати список покупок', 'error');
      }
    };

  } catch (err) {
    console.error("Menu error:", err);
  }
}