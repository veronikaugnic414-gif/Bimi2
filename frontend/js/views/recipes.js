import { api } from '../api.js';
import { showConfirm, showToast } from '../toast.js';

let tempIngredients = [];

export async function renderRecipes(container) {
  try {
    const recipes = await api.getRecipes();

    container.innerHTML = `
      <section class="card" style="margin-bottom: 16px;">
        <div class="card-header" style="margin-bottom: 0;">
          <div>
            <h2 class="text-section-title">Книга рецептів</h2>
            <p class="text-secondary">Улюблені домашні страви</p>
          </div>
          <button id="btn-open-recipe-modal" class="btn btn-primary btn-sm" type="button">
            <i data-lucide="plus" class="icon-sm"></i>
            <span>Новий рецепт</span>
          </button>
        </div>
      </section>

      <div style="display: grid; grid-template-columns: 1fr; gap: 12px;">
        ${recipes.length ? recipes.map(r => `
          <div class="card" style="padding: 14px; margin-bottom: 0;">
            ${r.photo_url ? `
              <div style="width: 100%; height: 140px; border-radius: var(--radius-md); overflow: hidden; margin-bottom: 12px;">
                <img src="${r.photo_url}" style="width: 100%; height: 100%; object-fit: cover;">
              </div>
            ` : ''}

            <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 8px;">
              <h3 class="text-card-title" style="font-size: 15px;">${r.title}</h3>
              <span class="badge" style="display: inline-flex; align-items: center; gap: 4px; font-size: 10px;">
                <i data-lucide="clock" class="icon-sm"></i>
                <span>${r.cooking_time || 20} хв</span>
              </span>
            </div>

            <p class="text-secondary" style="margin-top: 6px; font-size: 12px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">${r.instructions || 'Без інструкції'}</p>

            ${(r.ingredients && r.ingredients.length) ? `
              <div style="display: flex; flex-wrap: wrap; gap: 4px; margin-top: 10px;">
                ${r.ingredients.map(i => `
                  <span class="badge" style="background: var(--surface-elevated); border: 1px solid var(--border); color: var(--text-secondary); font-size: 10px;">
                    ${i.name || i} ${i.amount ? `(${i.amount})` : ''}
                  </span>
                `).join('')}
              </div>
            ` : ''}

            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 12px; padding-top: 10px; border-top: 1px solid var(--border);">
              <button data-id="${r.id}" class="btn-view-recipe btn btn-secondary btn-sm" type="button">
                <i data-lucide="eye" class="icon-sm"></i>
                <span>Детальніше</span>
              </button>
              <button data-id="${r.id}" class="btn-delete-recipe btn-ghost btn-sm" style="padding: 4px;" type="button" aria-label="Видалити">
                <i data-lucide="trash-2" class="icon-sm" style="color: var(--danger);"></i>
              </button>
            </div>
          </div>
        `).join('') : `
          <div class="empty-state card">
            <div class="empty-state-icon"><i data-lucide="book-open" class="icon-md"></i></div>
            <p class="text-card-title" style="font-size: 15px; margin-bottom: 4px;">Рецептів поки немає</p>
            <p class="text-secondary">Додай перший рецепт своєї улюбленої страви.</p>
          </div>
        `}
      </div>

      <!-- Детальний перегляд рецепту (Bottom Sheet) -->
      <div id="recipe-view-modal" class="modal-backdrop hidden" role="dialog">
        <div class="bottom-sheet">
          <div class="sheet-indicator"></div>
          <div class="card-header">
            <div>
              <h3 id="recipe-modal-title" class="text-card-title"></h3>
              <span id="recipe-modal-time" class="badge" style="margin-top: 4px; display: inline-block;"></span>
            </div>
            <button id="btn-close-recipe-view" class="btn-ghost btn-sm" type="button">Закрити</button>
          </div>

          <div style="margin-top: 12px;">
            <div class="text-muted" style="font-size: 11px; text-transform: uppercase; font-weight: 600; margin-bottom: 6px;">Інструкція:</div>
            <p id="recipe-modal-text" class="text-body" style="font-size: 14px; background: var(--surface-elevated); padding: 14px; border-radius: var(--radius-md); border: 1px solid var(--border); white-space: pre-wrap; line-height: 1.5;"></p>
          </div>
        </div>
      </div>

      <!-- Створення рецепту (Bottom Sheet) -->
      <div id="recipe-modal" class="modal-backdrop hidden" role="dialog">
        <div class="bottom-sheet">
          <div class="sheet-indicator"></div>
          <div class="card-header">
            <h3 class="text-card-title">Новий рецепт</h3>
            <button id="btn-close-rec" class="btn-ghost btn-sm" type="button">Закрити</button>
          </div>

          <div style="display: flex; flex-direction: column; gap: 10px;">
            <input type="text" id="rec-title" placeholder="Назва страви..." class="input-field">
            <input type="number" id="rec-time" placeholder="Час приготування (хв)" value="20" class="input-field">
            
            <div>
              <label class="text-secondary" style="font-size: 12px; margin-bottom: 4px; display: block;">Фото страви:</label>
              <input type="file" id="rec-file-input" accept="image/*" class="input-field" style="padding-top: 8px;">
            </div>

            <textarea id="rec-inst" placeholder="Інструкція приготування..." class="input-field"></textarea>

            <div style="border-top: 1px solid var(--border); padding-top: 10px; margin-top: 4px;">
              <label class="text-secondary" style="font-size: 12px; margin-bottom: 6px; display: block;">Додати інгредієнт:</label>
              <div class="input-group">
                <input type="text" id="ing-name" placeholder="Назва" class="input-field" style="flex: 2;">
                <input type="number" id="ing-qty" placeholder="К-сть" class="input-field" style="flex: 1;">
                <select id="ing-unit" class="select-field" style="flex: 1;">
                  <option value="г">г</option>
                  <option value="кг">кг</option>
                  <option value="шт">шт</option>
                  <option value="мл">мл</option>
                  <option value="л">л</option>
                </select>
              </div>
              <button type="button" id="btn-add-ing-row" class="btn btn-secondary btn-sm" style="width: 100%; margin-top: 8px;">+ Додати інгредієнт</button>
              <div id="ing-list-preview" style="display: flex; flex-wrap: wrap; gap: 4px; margin-top: 8px;"></div>
            </div>

            <button id="btn-save-rec" class="btn btn-primary" style="margin-top: 8px;" type="button">Зберегти рецепт</button>
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
          `<span class="badge" style="background: var(--surface-hover);">${i.name} (${i.amount})</span>`
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