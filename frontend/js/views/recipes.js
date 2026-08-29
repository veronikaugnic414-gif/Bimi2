import { api } from '../api.js';
import { showConfirm, showToast } from '../toast.js';

let tempIngredients = [];

export async function renderRecipes(container) {
  try {
    const recipes = await api.getRecipes();

    container.innerHTML = `
      <div class="space-y-6">
        <div class="flex justify-between items-center">
          <div>
            <h2 class="text-2xl font-black text-gray-900 tracking-tight">Книга Рецептів</h2>
            <p class="text-xs text-purple-600 font-bold">Ваші улюблені страви</p>
          </div>
          <button id="btn-open-recipe-modal" class="bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-xs px-4 py-2.5 rounded-2xl shadow-md transition cursor-pointer flex items-center gap-1.5">
            <i data-lucide="plus" class="w-4 h-4"></i> Новий рецепт
          </button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          ${recipes.length ? recipes.map(r => `
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

                  <!-- Обрізка безнадійного довгого тексту без виліту за межі -->
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
                <button data-id="${r.id}" class="btn-delete-recipe text-rose-400 hover:text-rose-600 text-xs font-bold cursor-pointer p-1">
                  <i data-lucide="trash-2" class="w-4 h-4"></i>
                </button>
              </div>
            </div>
          `).join('') : '<p class="text-xs text-gray-400 font-medium text-center py-8 col-span-2">Рецептів поки немає</p>'}
        </div>
      </div>

      <!-- МОДАЛКА ПОВНОГО ТЕКСТУ РЕЦЕПТА -->
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

      <!-- МОДАЛКА СТВОРЕННЯ -->
      <div id="recipe-modal" class="hidden fixed inset-0 bg-purple-950/20 backdrop-blur-xl z-50 flex items-center justify-center p-4">
        <div class="glass-card p-6 w-full max-w-md space-y-4 rounded-3xl max-h-[90vh] overflow-y-auto shadow-2xl">
          <h3 class="font-black text-lg text-gray-900 flex items-center gap-2">
            <i data-lucide="chef-hat" class="w-5 h-5 text-purple-600"></i> Новий рецепт
          </h3>
          
          <div class="space-y-3">
            <input type="text" id="rec-title" placeholder="Назва страви..." class="w-full bg-white/80 border border-purple-100 rounded-2xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-purple-400">
            <input type="number" id="rec-time" placeholder="Час приготування (хв)" value="20" class="w-full bg-white/80 border border-purple-100 rounded-2xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-purple-400">
            
            <div>
              <label class="block text-xs font-bold text-gray-700 mb-1">Фото страви (з ПК):</label>
              <input type="file" id="rec-file-input" accept="image/*" class="w-full text-xs text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-purple-100 file:text-purple-800 cursor-pointer">
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

    container.querySelectorAll('.btn-view-recipe').forEach(btn => {
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

    container.querySelectorAll('.btn-delete-recipe').forEach(btn => {
      btn.onclick = (e) => {
        e.stopPropagation();
        showConfirm('Видалити рецепт?', 'Цю дію неможливо скасувати', async () => {
          await api.deleteRecipe(btn.dataset.id);
          showToast('Рецепт видалено', 'info');
          renderRecipes(container);
        });
      };
    });

    const modal = document.getElementById('recipe-modal');
    document.getElementById('btn-open-recipe-modal').onclick = () => {
      tempIngredients = [];
      const prev = document.getElementById('ing-list-preview');
      if (prev) prev.innerHTML = '';
      modal.classList.remove('hidden');
    };
    document.getElementById('btn-close-rec').onclick = () => modal.classList.add('hidden');

    document.getElementById('btn-add-ing-row').onclick = () => {
      const name = document.getElementById('ing-name').value.trim();
      const qty = document.getElementById('ing-qty').value || '1';
      const unit = document.getElementById('ing-unit').value;

      if (name) {
        tempIngredients.push({ name, amount: `${qty} ${unit}` });
        document.getElementById('ing-name').value = '';
        document.getElementById('ing-qty').value = '';
        
        document.getElementById('ing-list-preview').innerHTML = tempIngredients.map(i => 
          `<span class="text-[10px] bg-purple-100 text-purple-900 px-2.5 py-1 rounded-xl font-bold">${i.name} (${i.amount})</span>`
        ).join('');
      }
    };

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
        photo_url: "",
        instructions: inst || "",
        ingredients: tempIngredients
      };

      if (fileInput.files && fileInput.files[0]) {
        const reader = new FileReader();
        reader.onload = async (e) => {
          payload.photo_url = e.target.result;
          await api.createRecipe(payload);
          showToast('Рецепт успішно додано!', 'success');
          modal.classList.add('hidden');
          renderRecipes(container);
        };
        reader.readAsDataURL(fileInput.files[0]);
      } else {
        await api.createRecipe(payload);
        showToast('Рецепт успішно додано!', 'success');
        modal.classList.add('hidden');
        renderRecipes(container);
      }
    };

  } catch (err) {
    console.error("Error in renderRecipes:", err);
  }
}