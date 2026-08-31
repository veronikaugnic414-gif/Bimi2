import { api } from '../api.js';
import { showToast, showConfirm } from '../toast.js';

export async function renderPoints(container, currentUser) {
  try {
    const currentUid = Number(currentUser?.id || 1);
    const partnerName = currentUid === 1 ? "Даша" : "Вероніка";
    const myName = currentUid === 1 ? "Вероніка" : "Даша";

    // Безпечне завантаження: якщо бекенд повертає помилку, інтерфейс не зависає
    let summary = { user_stats: { total: 0, month: 0, week: 0 }, partner_stats: { total: 0, month: 0, week: 0 }, logs: [] };
    let tasks = [];

    try {
      const [sumRes, tasksRes] = await Promise.all([
        api.getPointsSummary(currentUid).catch(err => {
          console.warn("Points summary fetch warning:", err);
          return null;
        }),
        api.getDutyTasks().catch(err => {
          console.warn("Duty tasks fetch warning:", err);
          return [];
        })
      ]);

      if (sumRes && typeof sumRes === 'object') summary = sumRes;
      if (Array.isArray(tasksRes)) tasks = tasksRes;
    } catch (fetchErr) {
      console.warn("Network fallback activated:", fetchErr);
    }

    const myStats = summary?.user_stats || { total: 0, month: 0, week: 0 };
    const partnerStats = summary?.partner_stats || { total: 0, month: 0, week: 0 };
    const logs = Array.isArray(summary?.logs) ? summary.logs : [];

    container.innerHTML = `
      <div class="space-y-6 pb-8">
        <!-- Шапка -->
        <div class="flex justify-between items-center">
          <div>
            <h2 class="text-2xl font-black text-gray-900 tracking-tight">Баланс поінтів</h2>
            <p class="text-xs text-purple-600 font-bold">Гейміфікація домашніх обов'язків</p>
          </div>
          <button id="btn-toggle-history" class="bg-purple-100/80 hover:bg-purple-200/80 border border-purple-200 text-purple-900 text-xs px-4 py-2 rounded-2xl font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs">
            <i data-lucide="history" class="w-4 h-4 text-purple-600"></i> Історія
          </button>
        </div>

        <!-- Головна картка поінтів -->
        <div class="glass-card p-6 rounded-[2rem] space-y-6 text-center border border-purple-100/80 bg-gradient-to-b from-white/90 to-purple-50/40 shadow-sm">
          <div>
            <span class="text-xs font-bold uppercase tracking-wider text-purple-600">Твої поінти (${myName})</span>
            <div class="text-6xl font-black text-purple-900 tracking-tight mt-1 flex items-center justify-center gap-2">
              <span>${myStats.total || 0}</span>
              <span class="text-2xl text-purple-500 font-bold">pts</span>
            </div>
          </div>

          <!-- Деталізація періодів -->
          <div class="grid grid-cols-2 gap-3 pt-2 border-t border-purple-100/60">
            <div class="bg-purple-50/60 p-3 rounded-2xl">
              <p class="text-[10px] font-bold text-gray-500 uppercase">За цей тиждень</p>
              <p class="text-sm font-black text-purple-800 mt-0.5">+${myStats.week || 0} pts</p>
            </div>
            <div class="bg-purple-50/60 p-3 rounded-2xl">
              <p class="text-[10px] font-bold text-gray-500 uppercase">За цей місяць</p>
              <p class="text-sm font-black text-purple-800 mt-0.5">+${myStats.month || 0} pts</p>
            </div>
          </div>

          <!-- Рахунок сусідки -->
          <div class="bg-pink-50/70 p-4 rounded-2xl flex justify-between items-center border border-pink-100/60">
            <div class="text-left">
              <p class="text-xs font-bold text-pink-950">${partnerName}</p>
              <p class="text-[10px] text-pink-500 font-semibold">Тиждень: +${partnerStats.week || 0} | Місяць: +${partnerStats.month || 0}</p>
            </div>
            <div class="text-right">
              <span class="text-lg font-black text-pink-600">${partnerStats.total || 0}</span>
              <span class="text-xs font-bold text-pink-400 ml-0.5">pts</span>
            </div>
          </div>
        </div>

        <!-- Секція нарахування справ -->
        <div class="space-y-3">
          <div class="flex justify-between items-center">
            <h3 class="font-extrabold text-sm text-gray-900 tracking-tight flex items-center gap-2">
              <i data-lucide="check-circle-2" class="w-4 h-4 text-purple-600"></i> Виконала справу? Нарахуй поінти:
            </h3>
            <button id="btn-open-task-modal" class="text-xs font-bold text-purple-600 hover:text-purple-800 cursor-pointer flex items-center gap-1">
              <i data-lucide="plus" class="w-3.5 h-3.5"></i> Новий обов'язок
            </button>
          </div>

          <!-- Поле живого пошуку -->
          <div class="relative">
            <i data-lucide="search" class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400"></i>
            <input type="text" id="task-search-input" placeholder="Пошук справи (напр. посуд, прання, ванна)..." class="w-full bg-white/90 border border-purple-100/80 rounded-2xl pl-11 pr-4 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-purple-400 shadow-2xs">
          </div>

          <!-- Сітка обов'язків -->
          <div id="tasks-grid-container" class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          </div>
        </div>
      </div>

      <!-- Модальне вікно створення нової справи -->
      <div id="modal-create-task" class="hidden fixed inset-0 bg-purple-950/30 backdrop-blur-md z-50 flex items-center justify-center p-4">
        <div class="glass-card p-6 w-full max-w-sm space-y-4 rounded-3xl shadow-2xl bg-white">
          <h3 class="font-black text-base text-gray-900 text-center">Створити обов'язок</h3>
          <input type="text" id="new-task-title" placeholder="Назва справи (наприклад, Пропилососити)..." class="w-full bg-purple-50/40 border border-purple-100 rounded-2xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-purple-400">
          <input type="number" id="new-task-points" placeholder="Кількість поінтів (напр. 25)" value="20" class="w-full bg-purple-50/40 border border-purple-100 rounded-2xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-purple-400">
          
          <div class="flex gap-2 pt-2">
            <button id="btn-cancel-task" class="w-1/2 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-2xl transition cursor-pointer">Скасувати</button>
            <button id="btn-save-task" class="w-1/2 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-2xl shadow-md transition cursor-pointer">Створити</button>
          </div>
        </div>
      </div>

      <!-- Модальне вікно історії нарахувань -->
      <div id="modal-history" class="hidden fixed inset-0 bg-purple-950/30 backdrop-blur-md z-50 flex items-center justify-center p-4">
        <div class="glass-card p-6 w-full max-w-md space-y-4 rounded-3xl shadow-2xl max-h-[80vh] flex flex-col bg-white">
          <div class="flex justify-between items-center border-b border-purple-100 pb-3">
            <h3 class="font-black text-base text-gray-900">Історія виконання</h3>
            <button id="btn-close-history" class="text-gray-400 hover:text-gray-600 cursor-pointer p-1">
              <i data-lucide="x" class="w-5 h-5"></i>
            </button>
          </div>
          <div class="space-y-2 overflow-y-auto pr-1 flex-1">
            ${logs.length ? logs.map(l => `
              <div class="p-3 bg-purple-50/50 rounded-2xl flex justify-between items-center border border-purple-100/50">
                <div>
                  <div class="flex items-center gap-1.5">
                    <span class="text-xs font-extrabold ${Number(l.user_id) === 1 ? 'text-purple-700' : 'text-pink-600'}">${Number(l.user_id) === 1 ? 'Вероніка' : 'Даша'}</span>
                    <span class="text-xs text-gray-900 font-semibold">• ${l.task_title}</span>
                  </div>
                  <p class="text-[10px] text-gray-400 mt-0.5">${new Date(l.completed_at).toLocaleString('uk-UA', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                </div>
                <div class="flex items-center gap-2">
                  <span class="text-xs font-black text-purple-900 bg-white px-2 py-1 rounded-xl shadow-2xs">+${l.points} pts</span>
                  <button data-id="${l.id}" class="btn-delete-log text-gray-300 hover:text-rose-500 p-1 cursor-pointer">
                    <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                  </button>
                </div>
              </div>
            `).join('') : '<p class="text-xs text-gray-400 text-center py-6">Історія нарахувань порожня</p>'}
          </div>
        </div>
      </div>
    `;

    function renderTasksGrid(taskList) {
      const grid = document.getElementById('tasks-grid-container');
      if (!grid) return;

      if (!taskList.length) {
        grid.innerHTML = '<div class="col-span-full py-8 text-center text-xs text-gray-400 font-medium">Обов’язків ще немає або нічого не знайдено</div>';
        return;
      }

      grid.innerHTML = taskList.map(t => `
        <div class="glass-card p-3.5 rounded-2xl border border-purple-100/60 flex justify-between items-center hover:bg-purple-50/50 transition">
          <div class="flex items-center gap-3 min-w-0 pr-2">
            <div class="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
              <i data-lucide="${t.icon || 'sparkles'}" class="w-4 h-4"></i>
            </div>
            <div class="truncate">
              <p class="font-bold text-xs text-gray-900 truncate">${t.title}</p>
              <p class="text-[10px] font-black text-purple-600">+${t.points} pts</p>
            </div>
          </div>
          <div class="flex items-center gap-1 shrink-0">
            <button data-id="${t.id}" data-title="${t.title}" data-points="${t.points}" class="btn-claim-task bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-xs transition cursor-pointer">
              + Зарахувати
            </button>
            <button data-id="${t.id}" class="btn-delete-task text-gray-300 hover:text-rose-500 p-1.5 cursor-pointer transition">
              <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
            </button>
          </div>
        </div>
      `).join('');

      if (window.lucide) window.lucide.createIcons();

      grid.querySelectorAll('.btn-claim-task').forEach(btn => {
        btn.onclick = async () => {
          const title = btn.dataset.title;
          const points = parseInt(btn.dataset.points);
          const taskId = parseInt(btn.dataset.id);

          try {
            await api.logDutyTask({
              user_id: currentUid,
              task_id: taskId,
              task_title: title,
              points: points
            });
            showToast(`+${points} pts зараховано за "${title}"! 🌟`, 'success');
          } catch (e) {
            showToast('Помилка збереження на сервері', 'error');
          }
          renderPoints(container, currentUser);
        };
      });

      grid.querySelectorAll('.btn-delete-task').forEach(btn => {
        btn.onclick = (e) => {
          e.stopPropagation();
          showConfirm('Видалити цей обов’язок зі списку?', '', async () => {
            try {
              await api.deleteDutyTask(btn.dataset.id);
              showToast('Обов’язок видалено', 'info');
            } catch (e) {
              showToast('Помилка видалення', 'error');
            }
            renderPoints(container, currentUser);
          });
        };
      });
    }

    renderTasksGrid(tasks);

    if (window.lucide) window.lucide.createIcons();

    const searchInput = document.getElementById('task-search-input');
    if (searchInput) {
      searchInput.oninput = (e) => {
        const query = e.target.value.toLowerCase().trim();
        const filtered = tasks.filter(t => (t.title || '').toLowerCase().includes(query));
        renderTasksGrid(filtered);
      };
    }

    container.querySelectorAll('.btn-delete-log').forEach(btn => {
      btn.onclick = async (e) => {
        e.stopPropagation();
        try {
          await api.deleteDutyLog(btn.dataset.id);
        } catch (err) {}
        renderPoints(container, currentUser);
      };
    });

    const taskModal = document.getElementById('modal-create-task');
    document.getElementById('btn-open-task-modal').onclick = () => taskModal.classList.remove('hidden');
    document.getElementById('btn-cancel-task').onclick = () => taskModal.classList.add('hidden');

    document.getElementById('btn-save-task').onclick = async () => {
      const title = document.getElementById('new-task-title').value.trim();
      const points = parseInt(document.getElementById('new-task-points').value) || 10;
      if (title) {
        try {
          await api.createDutyTask({ title, points, icon: 'sparkles' });
          showToast(`Справу "${title}" створено!`, 'success');
        } catch (e) {
          showToast('Помилка додавання', 'error');
        }
        taskModal.classList.add('hidden');
        renderPoints(container, currentUser);
      }
    };

    const historyModal = document.getElementById('modal-history');
    document.getElementById('btn-toggle-history').onclick = () => historyModal.classList.remove('hidden');
    document.getElementById('btn-close-history').onclick = () => historyModal.classList.add('hidden');

  } catch (err) {
    console.error("Points fatal render error:", err);
    container.innerHTML = `
      <div class="glass-card p-6 text-center rounded-3xl space-y-2 border border-rose-200">
        <p class="text-sm font-bold text-rose-500">Помилка завантаження розділу</p>
        <p class="text-xs text-gray-500">Перевірте підключення до сервера</p>
      </div>
    `;
  }
}