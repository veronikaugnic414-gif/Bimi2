import { api } from '../api.js';
import { showConfirm, showToast } from '../toast.js';

const days = ["Понеділок", "Вівторок", "Середа", "Четвер", "П'ятниця", "Субота", "Неділя"];
const meals = ["Сніданок", "Обід", "Вечеря"];

export async function renderMenu(container) {
  try {
    const menuItems = await api.getMenu();
    const recipes = await api.getRecipes();

    container.innerHTML = `
      <div class="space-y-6">
        <!-- Шапка Меню -->
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 class="text-2xl font-bold text-gray-800">Тижневе меню</h2>
            <p class="text-xs text-purple-600 font-semibold mt-1">Обирай страви з візуальним пошуком</p>
          </div>
          <div class="flex gap-2 w-full sm:w-auto">
            <button id="btn-clear-menu" class="flex-1 sm:flex-none flex items-center justify-center gap-2 text-xs text-rose-500 hover:text-rose-700 font-bold bg-rose-50 hover:bg-rose-100 px-5 py-3 rounded-full transition cursor-pointer">
              <i data-lucide="trash" class="w-4 h-4"></i> Скинути
            </button>
            <button id="btn-sync-shop" class="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold px-5 py-3 rounded-full shadow-lg shadow-purple-500/30 transition cursor-pointer">
              <i data-lucide="shopping-bag" class="w-4 h-4"></i> У покупки
            </button>
          </div>
        </div>

        <!-- Сітка Днів -->
        <div class="space-y-5">
          ${days.map(day => `
            <div class="soft-card p-5 space-y-4 bg-white rounded-3xl border">
              <h3 class="font-bold text-sm text-purple-900 border-b border-purple-100 pb-2">${day}</h3>
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                ${meals.map(meal => {
                  const current = menuItems.find(m => m.day_of_week === day && m.meal_type === meal);
                  const currentRecipe = recipes.find(r => r.id === current?.recipe_id);

                  return `
                    <div class="bg-gray-50/80 p-4 rounded-3xl border flex flex-col justify-between space-y-3">
                      <div>
                        <span class="text-[10px] font-bold text-purple-600 uppercase tracking-wider">${meal}</span>
                        ${currentRecipe?.photo_url ? `<img src="${currentRecipe.photo_url}" class="w-full h-28 object-cover rounded-2xl my-2 shadow-sm">` : ''}
                        <p class="text-sm font-bold text-gray-800 mt-1">${current ? current.description : 'Не обрано'}</p>
                      </div>

                      <button data-day="${day}" data-meal="${meal}" class="btn-select-meal w-full bg-white border border-purple-200 text-purple-700 py-2.5 rounded-full text-xs font-bold shadow-sm hover:bg-purple-50 transition cursor-pointer flex items-center justify-center gap-2">
                        ${current ? '<i data-lucide="refresh-cw" class="w-3.5 h-3.5"></i> Змінити' : '<i data-lucide="plus" class="w-4 h-4"></i> Обрати'}
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
      <div id="meal-picker-modal" class="hidden fixed inset-0 bg-black/40 backdrop-blur-md z-50 flex items-center justify-center p-4">
        <div class="soft-card p-6 w-full max-w-md space-y-5 max-h-[85vh] overflow-y-auto bg-white rounded-[2rem] shadow-2xl">
          <h3 id="picker-title" class="font-bold text-lg text-gray-800 text-center">Обери страву</h3>
          
          <div class="relative">
            <i data-lucide="search" class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"></i>
            <input type="text" id="recipe-search-input" placeholder="Пошук..." class="w-full bg-gray-50 border-0 rounded-full pl-11 pr-4 py-3 text-sm focus:ring-2 focus:ring-purple-400 outline-none">
          </div>

          <div id="recipes-picker-list" class="space-y-2 max-h-60 overflow-y-auto pr-1"></div>

          <button id="btn-close-picker" class="w-full py-3 bg-gray-100 hover:bg-gray-200 rounded-full text-sm font-bold text-gray-600 transition cursor-pointer">Скасувати</button>
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
      const filtered = recipes.filter(r => r.title.toLowerCase().includes(q));
      renderPickerList(filtered);
    };

    function renderPickerList(list) {
      const listEl = document.getElementById('recipes-picker-list');
      if (!list.length) {
        listEl.innerHTML = '<p class="text-xs text-gray-400 text-center py-6">Страви не знайдено</p>';
        return;
      }

      listEl.innerHTML = list.map(r => `
        <div data-id="${r.id}" class="picker-item p-3 bg-gray-50 hover:bg-purple-50 rounded-2xl flex items-center space-x-4 cursor-pointer transition">
          ${r.photo_url ? `<img src="${r.photo_url}" class="w-14 h-14 object-cover rounded-xl shadow-sm">` : '<div class="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center text-purple-500"><i data-lucide="utensils" class="w-6 h-6"></i></div>'}
          <div>
            <p class="font-bold text-sm text-gray-800">${r.title}</p>
            <p class="text-[10px] text-gray-500 mt-0.5 flex items-center gap-1"><i data-lucide="clock" class="w-3 h-3"></i> ${r.cooking_time || 20} хв</p>
          </div>
        </div>
      `).join('');

      if (window.lucide) window.lucide.createIcons();

      listEl.querySelectorAll('.picker-item').forEach(item => {
        item.onclick = async () => {
          const recipeId = parseInt(item.dataset.id);
          const recipe = recipes.find(r => r.id === recipeId);
          await api.addMenuItem({
            day_of_week: targetDay,
            meal_type: targetMeal,
            recipe_id: recipeId,
            description: recipe.title
          });
          pickerModal.classList.add('hidden');
          showToast(`Оновлено: ${recipe.title}`, 'success');
          renderMenu(container);
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
      const res = await api.generateShoppingFromMenu();
      if (res.message.includes("порожнє")) {
        showToast(res.message, 'warning');
      } else {
        showToast(res.message, 'success');
      }
    };

  } catch (err) {
    console.error("Menu error:", err);
  }
}