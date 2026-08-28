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
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h2 class="text-2xl font-bold text-gray-800">Тижневе меню 🥗</h2>
            <p class="text-xs text-purple-600 font-semibold">Обирай страви з візуальним пошуком</p>
          </div>
          <div class="flex gap-2">
            <button id="btn-clear-menu" class="text-xs text-red-500 hover:text-red-700 font-bold bg-red-50 hover:bg-red-100 px-3.5 py-2.5 rounded-xl transition cursor-pointer">
              🧹 Скинути меню
            </button>
            <button id="btn-sync-shop" class="btn-primary text-xs px-4 py-2.5 cursor-pointer">
              🛒 Інгредієнти у Покупки
            </button>
          </div>
        </div>

        <!-- Сітка Днів -->
        <div class="space-y-4">
          ${days.map(day => `
            <div class="soft-card p-4 space-y-3 bg-white rounded-2xl border">
              <h3 class="font-bold text-sm text-purple-900 border-b border-purple-100 pb-1">${day}</h3>
              <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                ${meals.map(meal => {
                  const current = menuItems.find(m => m.day_of_week === day && m.meal_type === meal);
                  const currentRecipe = recipes.find(r => r.id === current?.recipe_id);

                  return `
                    <div class="bg-gray-50 p-3 rounded-2xl border flex flex-col justify-between space-y-2">
                      <div>
                        <span class="text-[10px] font-bold text-purple-600 uppercase">${meal}</span>
                        ${currentRecipe?.photo_url ? `<img src="${currentRecipe.photo_url}" class="w-full h-24 object-cover rounded-xl my-1 shadow-sm">` : ''}
                        <p class="text-xs font-bold text-gray-800 mt-1">${current ? current.description : 'Не обрано'}</p>
                      </div>

                      <button data-day="${day}" data-meal="${meal}" class="btn-select-meal w-full bg-white border border-purple-200 text-purple-700 py-1.5 rounded-xl text-xs font-bold shadow-sm hover:bg-purple-50 cursor-pointer">
                        ${current ? 'Змінити страву 🔄' : '+ Обрати страву'}
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
      <div id="meal-picker-modal" class="hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div class="soft-card p-6 w-full max-w-md space-y-4 max-h-[85vh] overflow-y-auto bg-white rounded-2xl">
          <h3 id="picker-title" class="font-bold text-base text-gray-800">Обери страву</h3>
          
          <input type="text" id="recipe-search-input" placeholder="🔍 Введіть назву для пошуку..." class="w-full bg-gray-50 border-0 rounded-xl px-4 py-2.5 text-xs focus:ring-2 focus:ring-purple-400">

          <div id="recipes-picker-list" class="space-y-2 max-h-60 overflow-y-auto"></div>

          <button id="btn-close-picker" class="w-full py-2 text-xs font-semibold text-gray-500 cursor-pointer">Скасувати</button>
        </div>
      </div>
    `;

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
        listEl.innerHTML = '<p class="text-xs text-gray-400 text-center py-4">Страви не знайдено</p>';
        return;
      }

      listEl.innerHTML = list.map(r => `
        <div data-id="${r.id}" class="picker-item p-2.5 bg-gray-50 hover:bg-purple-50 rounded-xl border flex items-center space-x-3 cursor-pointer transition">
          ${r.photo_url ? `<img src="${r.photo_url}" class="w-12 h-12 object-cover rounded-lg">` : '<div class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center text-lg">🍲</div>'}
          <div>
            <p class="font-bold text-xs text-gray-800">${r.title}</p>
            <p class="text-[10px] text-gray-400">⏱ ${r.cooking_time || 20} хв</p>
          </div>
        </div>
      `).join('');

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

    // 🧹 Кнопка Скинути меню
    document.getElementById('btn-clear-menu').onclick = () => {
      showConfirm('Скинути тижневе меню?', 'Усі обрані страви будуть видалені з розкладу.', async () => {
        await api.clearMenu();
        showToast('Тижневе меню очищено!', 'info');
        renderMenu(container);
      });
    };

    // 🛒 Відправка в покупки
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