import { api } from '../api.js';
import { showConfirm, showToast } from '../toast.js';

let tempIngredients = [];
let editingRecipeId = null;
let existingPhotoUrl = "";

export async function renderRecipes(container) {
  try {
    const allRecipes = await api.getRecipes();

    container.innerHTML = `
      <div class="space-y-6">
        <div class="flex justify-between items-center">
          <div>
            <h2 class="text-2xl font-black text-gray-900 tracking-tight">Книга Рецептів</h2>
            <p class="text-xs text-purple-600 font-bold">Ваші улюблені страви</p>
          </div>
          <button id="btn-open-recipe-modal" class="bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-xs px-4 py-2.5 rounded-2xl shadow-md transition cursor-pointer flex items-center gap-1.5 shrink-0">
            <i data-lucide="plus" class="w-4 h-4"></i> Новий рецепт
          </button>
        </div>

        <!-- Пошук страв -->
        <div class="relative">
          <i data-lucide="search" class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"></i>
          <input type="text" id="recipe-filter-input" placeholder="Пошук страви або інгредієнта..." class="w-full bg-white/80 border border-purple-100 rounded-full pl-11 pr-4 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-purple-400 transition-all">
        </div>

        <div id="recipes-grid" class="grid grid-cols-1 md:grid-cols-2 gap-4">
          ${renderRecipeCards(allRecipes)}
        </div>
      </div>

      <!-- МОДАЛКА ПЕРЕГЛЯДУ РЕЦЕПТА -->
      <div id="recipe-view-modal" class="hidden fixed inset-0 bg-purple-950/20 backdrop-blur-xl z-50 flex items-center justify-center p-4">
        <div class="glass-card p-6 w-full max-w-md rounded-3xl space-y-4 max-h-[85vh] overflow-y-auto shadow-2xl border border-white/80">
          <div class="flex justify-between items-start">
            <h3 id="recipe-modal-title" class="font-black text-lg text-gray-900 break-all max-w-[80%]"></h3>
            <span id="recipe-modal-time" class="text-xs font-bold px-2.5 py-1 bg-purple-100 text-purple-800 rounded-xl"></span>
          </div>

          <div>
            <h4 class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Інструкція приготування:</h4>
            <p id="recipe-modal-text" class="text-xs text-gray-700 font-medium leading-relaxed whitespace-pre-wrap break-all bg-white/60 p-3.5 rounded-2xl border border-purple-100/60"></p>
          </div>

          <button id="btn-close-recipe-view" class="w-full py-2.5 bg-gray-100 text-gray-700 font-bold text-xs rounded-2xl cursor-pointer">Закрити</button>
        </div>
      </div>

      <!-- МОДАЛКА СТВОРЕННЯ / РЕДАГУВАННЯ -->
      <div id="recipe-modal" class="hidden fixed inset-0 bg-purple-950/20 backdrop-blur-xl z-50 flex items-center justify-center p-4">
        <div class="glass-card p-6 w-full max-w-md space-y-4 rounded-3xl max-h-[90vh] overflow-y-auto shadow-2xl">
          <h3 id="recipe-form-title" class="font-black text-lg text-gray-900 flex items-center gap-2">
            <i data-lucide="chef-hat" class="w-5 h-5 text-purple-600"></i> Новий рецепт
          </h3>
          
          <div class="space-y-3">
            <input type="text" id="rec-title" placeholder="Назва страви..." class="w-full bg-white/80 border border-purple-100 rounded-2xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-purple-400">
            <input type="number" id="rec-time" placeholder="Час приготування (хв)" value="20" class="w-full bg-white/80 border border-purple-100 rounded-2xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-purple-400">
            
            <div>
              <label class="block text-xs font-bold text-gray-700 mb-1">Фото страви:</label>
              <input type="file" id="rec-file-input" accept="image/*" class="w-full text-xs text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-purple-100 file:text-purple-800 cursor-pointer">
              <p id="rec-existing-photo-hint" class="text-[10px] text-purple-600 font-bold mt-1 hidden">✓ Поточне фото збережено (оберіть файл, якщо хочете замінити)</p>
            </div>

            <textarea id="rec-inst" placeholder="Інструкція приготування..." class="w-full bg-white/80 border border-purple-100 rounded-2xl px-4 py-2.5 text-xs font-medium h-20 focus:outline-none focus:ring-2 focus:ring-purple-400"></textarea>
            
            <div class="border-t border-purple-100/60 pt-3 space-y-2">
              <label class="block text-xs font-bold text-gray-800">Додати інгредієнт:</label>
              <div class="flex gap-2">
                <input type="text" id="ing-name" placeholder="Назва" class="w-1/2 bg-white/80 border border-purple-100 rounded-2xl px-3 py-2 text-xs font-semibold">
                <input type="number" id="ing-qty" placeholder="К-сть" class="w-1/4 bg-white/80 border border-purple-100 rounded-2xl px-2 py-2 text-xs font-semibold">
                <select id="ing-unit" class="w-1/4 bg-white/80 border border-purple-100 rounded-2xl px-1 py-2 text-xs font-bold text-purple-900">
                  <option value="г">г</option>
                  <option value="кг">кг</option>
                  <option value="шт">шт</option>
                  <option value="мл">мл</option>
                  <option value="л">л</option>
                  <option value="ст. л.">ст. л.</option>
                  <option value="ч. л.">ч. л.</option>
                </select>
              </div>
              <button type="button" id="btn-add-ing-row" class="w-full bg-purple-100/80 text-purple-900 py-2 rounded-2xl text-xs font-bold flex items-center justify-center gap-1">+ Додати інгредієнт</button>
              
              <div id="ing-list-preview" class="flex flex-wrap gap-1 pt-1"></div>
            </div>
          </div>

          <div class="flex justify-end gap-2 pt-3 border-t border-purple-100/60">
            <button id="btn-close-rec" class="px-4 py-2.5 text-xs font-bold text-gray-500 cursor-pointer">Скасувати</button>
            <button id="btn-save-rec" class="bg-purple-600 text-white font-bold px-5 py-2.5 text-xs rounded-2xl shadow-md cursor-pointer">Зберегти рецепт</button>
          </div>
        </div>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
    attachRecipeEvents(allRecipes);

    // Інтерактивний пошук
    const searchInput = document.getElementById('recipe-filter-input');
    if (searchInput) {
      searchInput.oninput = (e) => {
        const query = e.target.value.toLowerCase().trim();
        const filtered = allRecipes.filter(r => {
          const matchTitle = (r.title || '').toLowerCase().includes(query);
          const matchIng = (r.ingredients || []).some(i => {
            const name = typeof i === 'object' ? i.name : String(i);
            return (name || '').toLowerCase().includes(query);
          });
          return matchTitle || matchIng;
        });

        const grid = document.getElementById('recipes-grid');
        grid.innerHTML = renderRecipeCards(filtered);
        if (window.lucide) window.lucide.createIcons();
        attachRecipeEvents(allRecipes);
      };
    }

  } catch (err) {
    console.error("Error in renderRecipes:", err);
  }
}

function renderRecipeCards(recipes) {
  if (!recipes.length) {
    return '<p class="text-xs text-gray-400 font-medium text-center py-8 col-span-2">Рецептів не знайдено</p>';
  }

  return recipes.map(r => `
    <div class="glass-card rounded-3xl overflow-hidden flex flex-col justify-between border border-purple-100/60 shadow-xs">
      <div>
        ${r.photo_url ? `
          <div class="w-full h-44 overflow-hidden relative">
            <img src="${r.photo_url}" class="w-full h-full object-cover">
          </div>
        ` : `
          <div class="w-full h-36 bg-purple-100/40 flex items-center justify-center text-purple-400">
            <i data-lucide="utensils" class="w-8 h-8 opacity-60"></i>
          </div>
        `}

        <div class="p-5 space-y-3">
          <div class="flex justify-between items-start gap-2">
            <h3 class="font-black text-sm text-gray-900 leading-tight break-all max-w-[70%]">${r.title}</h3>
            <span class="text-[10px] font-bold px-2.5 py-1 bg-purple-100/80 text-purple-800 rounded-xl whitespace-nowrap flex items-center gap-1 shrink-0">
              <i data-lucide="clock" class="w-3 h-3"></i> ${r.cooking_time || 20} хв
            </span>
          </div>

          <p class="text-xs text-gray-500 font-medium line-clamp-2 break-all max-w-full leading-relaxed">${r.instructions || 'Без інструкції'}</p>

          ${(r.ingredients && r.ingredients.length) ? `
            <div class="pt-1">
              <p class="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Інгредієнти:</p>
              <div class="flex flex-wrap gap-1">
                ${r.ingredients.map(i => `
                  <span class="text-[10px] bg-white/90 border border-purple-100 text-purple-900 px-2.5 py-0.5 rounded-xl font-bold shadow-2xs">
                    ${i.name || i} ${i.amount ? `(${i.amount})` : ''}
                  </span>
                `).join('')}
              </div>
            </div>
          ` : ''}
        </div>
      </div>

      <div class="p-5 pt-0 flex justify-between items-center border-t border-purple-100/40 mt-3">
        <button data-id="${r.id}" class="btn-view-recipe text-xs font-bold text-purple-700 hover:text-purple-900 flex items-center gap-1.5 cursor-pointer py-1">
          <i data-lucide="eye" class="w-3.5 h-3.5"></i> Детальніше
        </button>
        <div class="flex items-center gap-1">
          <button data-id="${r.id}" class="btn-edit-recipe text-purple-600 hover:text-purple-800 p-1.5 text-xs font-bold cursor-pointer" title="Редагувати">
            <i data-lucide="edit-3" class="w-4 h-4"></i>
          </button>
          <button data-id="${r.id}" class="btn-delete-recipe text-rose-400 hover:text-rose-600 p-1.5 text-xs font-bold cursor-pointer" title="Видалити">
            <i data-lucide="trash-2" class="w-4 h-4"></i>
          </button>
        </div>
      </div>
    </div>
  `).join('');
}

function updateIngredientsPreview() {
  const prev = document.getElementById('ing-list-preview');
  if (!prev) return;
  prev.innerHTML = tempIngredients.map((i, idx) => `
    <span class="text-[10px] bg-purple-100 text-purple-900 px-2.5 py-1 rounded-xl font-bold flex items-center gap-1">
      ${i.name} (${i.amount})
      <button type="button" data-idx="${idx}" class="btn-remove-ing text-rose-500 hover:text-rose-700 font-black cursor-pointer">×</button>
    </span>
  `).join('');

  prev.querySelectorAll('.btn-remove-ing').forEach(btn => {
    btn.onclick = () => {
      const idx = parseInt(btn.dataset.idx);
      tempIngredients.splice(idx, 1);
      updateIngredientsPreview();
    };
  });
}

function attachRecipeEvents(recipes) {
  // Перегляд
  document.querySelectorAll('.btn-view-recipe').forEach(btn => {
    btn.onclick = () => {
      const recipeId = parseInt(btn.dataset.id);
      const r = recipes.find(rec => rec.id === recipeId);
      if (r) {
        document.getElementById('recipe-modal-title').innerText = r.title;
        document.getElementById('recipe-modal-time').innerText = `${r.cooking_time || 20} хв`;
        document.getElementById('recipe-modal-text').innerText = r.instructions || 'Інструкція відсутня';
        document.getElementById('recipe-view-modal').classList.remove('hidden');
      }
    };
  });

  document.getElementById('btn-close-recipe-view').onclick = () => {
    document.getElementById('recipe-view-modal').classList.add('hidden');
  };

  // Редагування рецепта
  document.querySelectorAll('.btn-edit-recipe').forEach(btn => {
    btn.onclick = () => {
      const recipeId = parseInt(btn.dataset.id);
      const r = recipes.find(rec => rec.id === recipeId);
      if (!r) return;

      editingRecipeId = recipeId;
      existingPhotoUrl = r.photo_url || "";

      document.getElementById('recipe-form-title').innerHTML = `<i data-lucide="edit-3" class="w-5 h-5 text-purple-600"></i> Редагувати рецепт`;
      document.getElementById('rec-title').value = r.title || '';
      document.getElementById('rec-time').value = r.cooking_time || 20;
      document.getElementById('rec-inst').value = r.instructions || '';
      document.getElementById('rec-file-input').value = '';

      const photoHint = document.getElementById('rec-existing-photo-hint');
      if (existingPhotoUrl) {
        photoHint.classList.remove('hidden');
      } else {
        photoHint.classList.add('hidden');
      }

      tempIngredients = Array.isArray(r.ingredients) ? JSON.parse(JSON.stringify(r.ingredients)) : [];
      updateIngredientsPreview();

      document.getElementById('recipe-modal').classList.remove('hidden');
      if (window.lucide) window.lucide.createIcons();
    };
  });

  // Видалення рецепта
  document.querySelectorAll('.btn-delete-recipe').forEach(btn => {
    btn.onclick = (e) => {
      e.stopPropagation();
      showConfirm('Видалити рецепт?', 'Цю дію неможливо скасувати', async () => {
        await api.deleteRecipe(btn.dataset.id);
        showToast('Рецепт видалено', 'info');
        renderRecipes(document.getElementById('app-content'));
      });
    };
  });

  // Відкриття для створення нового
  const modal = document.getElementById('recipe-modal');
  document.getElementById('btn-open-recipe-modal').onclick = () => {
    editingRecipeId = null;
    existingPhotoUrl = "";
    document.getElementById('recipe-form-title').innerHTML = `<i data-lucide="chef-hat" class="w-5 h-5 text-purple-600"></i> Новий рецепт`;
    document.getElementById('rec-title').value = '';
    document.getElementById('rec-time').value = '20';
    document.getElementById('rec-inst').value = '';
    document.getElementById('rec-file-input').value = '';
    document.getElementById('rec-existing-photo-hint').classList.add('hidden');
    tempIngredients = [];
    updateIngredientsPreview();
    modal.classList.remove('hidden');
    if (window.lucide) window.lucide.createIcons();
  };

  document.getElementById('btn-close-rec').onclick = () => modal.classList.add('hidden');

  // Додавання інгредієнта у формі
  document.getElementById('btn-add-ing-row').onclick = () => {
    const name = document.getElementById('ing-name').value.trim();
    const qty = document.getElementById('ing-qty').value || '1';
    const unit = document.getElementById('ing-unit').value;

    if (name) {
      tempIngredients.push({ name, amount: `${qty} ${unit}` });
      document.getElementById('ing-name').value = '';
      document.getElementById('ing-qty').value = '';
      updateIngredientsPreview();
    }
  };

  // Збереження (Створення або Оновлення)
  document.getElementById('btn-save-rec').onclick = async () => {
    const title = document.getElementById('rec-title').value.trim();
    const timeVal = parseInt(document.getElementById('rec-time').value);
    const time = isNaN(timeVal) ? 20 : timeVal;
    const inst = document.getElementById('rec-inst').value;
    const fileInput = document.getElementById('rec-file-input');

    if (!title) {
      showToast('Вкажи назву страви!', 'warning');
      return;
    }

    const payload = {
      title: title,
      cooking_time: Number(time),
      photo_url: existingPhotoUrl,
      instructions: inst || "",
      ingredients: tempIngredients
    };

    const saveAction = async () => {
      if (editingRecipeId) {
        await api.updateRecipe(editingRecipeId, payload);
        showToast('Рецепт успішно оновлено! ✨', 'success');
      } else {
        await api.createRecipe(payload);
        showToast('Рецепт успішно додано! 🎉', 'success');
      }
      modal.classList.add('hidden');
      renderRecipes(document.getElementById('app-content'));
    };

    if (fileInput.files && fileInput.files[0]) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        payload.photo_url = e.target.result;
        await saveAction();
      };
      reader.readAsDataURL(fileInput.files[0]);
    } else {
      await saveAction();
    }
  };
}