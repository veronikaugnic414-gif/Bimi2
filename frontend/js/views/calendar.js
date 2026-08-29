import { api } from '../api.js';
import { showConfirm, showToast } from '../toast.js';

let currentYear = 2026;
let currentMonth = 7; // Серпень (0-indexed: 7 = серпень)
let selectedDay = 28;

const monthNames = [
  "Січень", "Лютий", "Березень", "Квітень", "Травень", "Червень",
  "Липень", "Серпень", "Вересень", "Жовтень", "Листопад", "Грудень"
];

const eventTypeLabels = {
  duty: "Чергування",
  general_cleaning: "Генеральне прибирання",
  exam: "Важлива подія",
  trip_home: "Від'їзд додому"
};

export async function renderCalendar(container) {
  let events = [];
  let checklist = [];

  async function loadDataAndRender() {
    try {
      const [evData, chkData] = await Promise.all([
        api.getEvents(),
        api.getCleaningChecklist()
      ]);
      events = evData || [];
      checklist = chkData || [];
      renderDOM();
    } catch (err) {
      console.error("Помилка завантаження календаря:", err);
      showToast('Не вдалося оновити дані', 'error');
    }
  }

  function renderDOM() {
    const formattedSelectedDate = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`;

    container.innerHTML = `
      <div class="space-y-6">
        <!-- Шапка Календаря -->
        <div class="flex justify-between items-center">
          <div>
            <h2 class="text-2xl font-black text-gray-900 tracking-tight">${monthNames[currentMonth]} ${currentYear}</h2>
            <p class="text-xs text-purple-600 font-bold">Графік прибирань та подій</p>
          </div>
          <div class="flex items-center gap-2">
            <button id="prev-month" class="w-10 h-10 bg-white/80 rounded-2xl shadow-xs font-bold text-gray-700 hover:bg-purple-100/50 flex items-center justify-center transition cursor-pointer">
              <i data-lucide="chevron-left" class="w-5 h-5"></i>
            </button>
            <button id="next-month" class="w-10 h-10 bg-white/80 rounded-2xl shadow-xs font-bold text-gray-700 hover:bg-purple-100/50 flex items-center justify-center transition cursor-pointer">
              <i data-lucide="chevron-right" class="w-5 h-5"></i>
            </button>
            <button id="btn-open-event-modal" class="bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-xs px-4 py-2.5 rounded-2xl shadow-md shadow-purple-200 hover:from-purple-700 hover:to-indigo-700 transition flex items-center gap-1.5 cursor-pointer">
              <i data-lucide="plus" class="w-4 h-4"></i> Подія
            </button>
          </div>
        </div>

        <!-- 1. СІТКА КАЛЕНДАРЯ -->
        <div class="glass-card p-6 rounded-3xl">
          <div class="grid grid-cols-7 text-center text-xs font-black text-purple-900/40 mb-3 tracking-wider">
            <span>ПН</span><span>ВТ</span><span>СР</span><span>ЧТ</span><span>ПТ</span><span>СБ</span><span>НД</span>
          </div>
          <div class="grid grid-cols-7 gap-1 text-center" id="calendar-grid">
            ${generateCalendarDays(currentYear, currentMonth, selectedDay, events)}
          </div>
        </div>

        <!-- 2. ПОДІЇ ВИБРАНОГО ДНЯ -->
        <div class="space-y-3">
          <h3 class="font-black text-sm text-gray-800 tracking-tight">Події на ${selectedDay} ${monthNames[currentMonth].toLowerCase()}:</h3>
          <div class="space-y-2">
            ${renderDayEvents(selectedDay, events)}
          </div>
        </div>

        <!-- 3. ШАБЛОНИ ШВИДКОГО ЗАПОВНЕННЯ -->
        <div class="glass-card p-6 space-y-4 rounded-3xl">
          <div class="flex justify-between items-center border-b border-purple-100/80 pb-3">
            <span class="text-xs font-black text-gray-800 flex items-center gap-2">
              <i data-lucide="zap" class="w-4 h-4 text-amber-500"></i> Швидке заповнення розкладу (Шаблони)
            </span>
            <button id="btn-clear-schedule" class="text-xs text-rose-500 hover:text-rose-700 font-bold bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-xl transition flex items-center gap-1 cursor-pointer">
              <i data-lucide="trash-2" class="w-3.5 h-3.5"></i> Очистити
            </button>
          </div>
          
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button id="btn-preset-alt" class="p-3.5 bg-white/80 hover:bg-purple-50/80 border border-purple-100/80 rounded-2xl text-left transition flex items-center gap-3 cursor-pointer shadow-2xs">
              <div class="w-3.5 h-3.5 rounded-full bg-amber-400 shrink-0"></div>
              <div>
                <p class="text-xs font-bold text-gray-900">Щодня по черзі</p>
                <p class="text-[10px] text-gray-500 font-medium">Чергування змінюється кожен день</p>
              </div>
            </button>

            <button id="btn-preset-3days" class="p-3.5 bg-white/80 hover:bg-purple-50/80 border border-purple-100/80 rounded-2xl text-left transition flex items-center gap-3 cursor-pointer shadow-2xs">
              <div class="w-3.5 h-3.5 rounded-full bg-amber-400 shrink-0"></div>
              <div>
                <p class="text-xs font-bold text-gray-900">Раз на 3 дні</p>
                <p class="text-[10px] text-gray-500 font-medium">Чергування кожні 3 дні</p>
              </div>
            </button>

            <button id="btn-preset-week" class="p-3.5 bg-white/80 hover:bg-purple-50/80 border border-purple-100/80 rounded-2xl text-left transition flex items-center gap-3 cursor-pointer shadow-2xs">
              <div class="w-3.5 h-3.5 rounded-full bg-amber-400 shrink-0"></div>
              <div>
                <p class="text-xs font-bold text-gray-900">Тиждень через тиждень</p>
                <p class="text-[10px] text-gray-500 font-medium">По черзі по 7 днів</p>
              </div>
            </button>

            <button id="btn-preset-sat" class="p-3.5 bg-white/80 hover:bg-rose-50/80 border border-rose-100/80 rounded-2xl text-left transition flex items-center gap-3 cursor-pointer shadow-2xs">
              <div class="w-3.5 h-3.5 rounded-full bg-rose-500 shrink-0"></div>
              <div>
                <p class="text-xs font-bold text-gray-900">Генеральне щосуботи</p>
                <p class="text-[10px] text-gray-500 font-medium">Кожної суботи місяця</p>
              </div>
            </button>
          </div>
        </div>

        <!-- 4. ЧЕК-ЛИСТ ПРИБИРАННЯ -->
        <div class="glass-card p-6 rounded-3xl space-y-3">
          <h3 class="font-black text-sm text-gray-800 flex items-center gap-2">
            <i data-lucide="check-square" class="w-4 h-4 text-purple-600"></i> Чек-лист генерального прибирання
          </h3>
          <div class="flex gap-2 mb-3">
            <input type="text" id="new-task-input" placeholder="Нове завдання..." class="bg-white/80 border border-purple-100 rounded-2xl px-4 py-2.5 text-xs w-full focus:outline-none focus:ring-2 focus:ring-purple-400 font-medium">
            <button id="btn-add-task" class="bg-purple-600 hover:bg-purple-700 text-white font-bold px-4 py-2.5 rounded-2xl text-xs shadow-md shadow-purple-200 cursor-pointer">+</button>
          </div>
          <div class="space-y-2">
            ${checklist.map(t => `
              <div class="p-3 bg-white/80 rounded-2xl flex justify-between items-center border border-purple-100/60 shadow-2xs">
                <div data-id="${t.id}" class="task-item flex-1 cursor-pointer flex justify-between items-center mr-2 ${t.is_completed ? 'line-through text-gray-400' : 'text-gray-800 font-bold'}">
                  <span class="text-xs">${t.task_name}</span>
                  <i data-lucide="${t.is_completed ? 'check-circle-2' : 'circle'}" class="w-4 h-4 ${t.is_completed ? 'text-purple-500' : 'text-gray-300'}"></i>
                </div>
                <button data-id="${t.id}" class="btn-delete-task text-rose-400 hover:text-rose-600 p-1 text-xs font-bold cursor-pointer">
                  <i data-lucide="x" class="w-3.5 h-3.5"></i>
                </button>
              </div>
            `).join('')}
          </div>
        </div>
      </div>

      <!-- МОДАЛЬНЕ ВІКНО СТВОРЕННЯ ПОДІЇ -->
      <div id="event-modal" class="hidden fixed inset-0 bg-purple-950/20 backdrop-blur-xl z-50 flex items-center justify-center p-4">
        <div class="glass-card p-6 w-full max-w-md space-y-3 rounded-3xl shadow-2xl">
          <h3 class="font-black text-lg text-gray-900 flex items-center gap-2">
            <i data-lucide="calendar-plus" class="w-5 h-5 text-purple-600"></i> Створити подію
          </h3>
          
          <input type="text" id="evt-title" placeholder="Назва події..." class="w-full bg-white/80 border border-purple-100 rounded-2xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-purple-400">
          <input type="date" id="evt-date" value="${formattedSelectedDate}" class="w-full bg-white/80 border border-purple-100 rounded-2xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-purple-400">
          
          <select id="evt-type" class="w-full bg-white/80 border border-purple-100 rounded-2xl px-4 py-2.5 text-xs font-bold text-purple-900 focus:outline-none focus:ring-2 focus:ring-purple-400">
            <option value="exam">Важлива подія / Іспит</option>
            <option value="trip_home">Від'їзд додому</option>
            <option value="duty">Чергування</option>
            <option value="general_cleaning">Генеральне прибирання</option>
          </select>

          <select id="evt-user" class="w-full bg-white/80 border border-purple-100 rounded-2xl px-4 py-2.5 text-xs font-bold text-purple-900 focus:outline-none focus:ring-2 focus:ring-purple-400">
            <option value="1">Відповідальна: Вероніка</option>
            <option value="2">Відповідальна: Даша</option>
          </select>

          <input type="text" id="evt-desc" placeholder="Примітка (необов'язково)..." class="w-full bg-white/80 border border-purple-100 rounded-2xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-purple-400">

          <div class="flex justify-end gap-2 pt-2">
            <button id="btn-close-evt" class="px-4 py-2 text-xs font-bold text-gray-500 cursor-pointer">Скасувати</button>
            <button id="btn-save-evt" class="bg-purple-600 hover:bg-purple-700 text-white font-bold px-5 py-2 text-xs rounded-2xl shadow-md cursor-pointer">Зберегти</button>
          </div>
        </div>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
    attachListeners();
  }

  function attachListeners() {
    // Навігація по місяцях
    document.getElementById('prev-month').onclick = () => {
      currentMonth--;
      if (currentMonth < 0) { currentMonth = 11; currentYear--; }
      renderDOM();
    };

    document.getElementById('next-month').onclick = () => {
      currentMonth++;
      if (currentMonth > 11) { currentMonth = 0; currentYear++; }
      renderDOM();
    };

    // Клік по днях
    container.querySelectorAll('#calendar-grid .cal-day').forEach(d => {
      if (!d.classList.contains('empty')) {
        d.onclick = () => {
          selectedDay = parseInt(d.dataset.day);
          renderDOM();
        };
      }
    });

    // Очищення розкладу
    document.getElementById('btn-clear-schedule').onclick = () => {
      showConfirm('Очистити розклад?', 'Це видалить усі чергування та генеральні прибирання.', async () => {
        await api.clearSchedule();
        showToast('Розклад очищено!', 'info');
        loadDataAndRender();
      });
    };

    // ШАБЛОНИ (паралельне швидке виконання)
    document.getElementById('btn-preset-alt').onclick = async () => {
      showToast('Заповнюємо графік...', 'info');
      const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
      const promises = [];
      for (let d = 1; d <= daysInMonth; d++) {
        const date = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        promises.push(api.createEvent({
          title: "Чергування",
          event_date: date,
          event_type: "duty",
          assigned_user_id: d % 2 === 1 ? 1 : 2
        }));
      }
      await Promise.all(promises);
      showToast('Застосовано: Щодня по черзі ✨', 'success');
      loadDataAndRender();
    };

    document.getElementById('btn-preset-3days').onclick = async () => {
      showToast('Заповнюємо графік...', 'info');
      const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
      const promises = [];
      for (let d = 1; d <= daysInMonth; d += 3) {
        const date = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        promises.push(api.createEvent({
          title: "Вологе прибирання",
          event_date: date,
          event_type: "duty",
          assigned_user_id: (Math.floor(d / 3) % 2 === 0) ? 1 : 2
        }));
      }
      await Promise.all(promises);
      showToast('Застосовано: Раз на 3 дні ✨', 'success');
      loadDataAndRender();
    };

    document.getElementById('btn-preset-week').onclick = async () => {
      showToast('Заповнюємо графік...', 'info');
      const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
      const promises = [];
      for (let d = 1; d <= daysInMonth; d++) {
        const date = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const userId = (Math.floor((d - 1) / 7) % 2 === 0) ? 1 : 2;
        promises.push(api.createEvent({
          title: "Чергування (тижневе)",
          event_date: date,
          event_type: "duty",
          assigned_user_id: userId
        }));
      }
      await Promise.all(promises);
      showToast('Застосовано: Тиждень через тиждень ✨', 'success');
      loadDataAndRender();
    };

    document.getElementById('btn-preset-sat').onclick = async () => {
      showToast('Заповнюємо графік...', 'info');
      const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
      const promises = [];
      for (let d = 1; d <= daysInMonth; d++) {
        if (new Date(currentYear, currentMonth, d).getDay() === 6) {
          const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
          promises.push(api.createEvent({
            title: "Генеральне прибирання",
            event_date: dateStr,
            event_type: "general_cleaning",
            assigned_user_id: 1
          }));
        }
      }
      await Promise.all(promises);
      showToast('Застосовано: Генеральне щосуботи ✨', 'success');
      loadDataAndRender();
    };

    // Видалення події
    container.querySelectorAll('.btn-delete-event').forEach(btn => {
      btn.onclick = (e) => {
        e.stopPropagation();
        showConfirm('Видалити подію?', 'Вона зникне з розкладу', async () => {
          await api.deleteEvent(btn.dataset.id);
          showToast('Подію видалено', 'info');
          loadDataAndRender();
        });
      };
    });

    // Модальне вікно
    const modal = document.getElementById('event-modal');
    document.getElementById('btn-open-event-modal').onclick = () => modal.classList.remove('hidden');
    document.getElementById('btn-close-evt').onclick = () => modal.classList.add('hidden');

    // Збереження події
    document.getElementById('btn-save-evt').onclick = async () => {
      const title = document.getElementById('evt-title').value.trim();
      const date = document.getElementById('evt-date').value;
      const type = document.getElementById('evt-type').value;
      const user = parseInt(document.getElementById('evt-user').value);
      const desc = document.getElementById('evt-desc').value.trim();

      if (!title || !date) {
        showToast('Вкажіть назву та дату події!', 'error');
        return;
      }

      try {
        if (type === 'exam' || type === 'trip_home') {
          const dayEvents = events.filter(e => e.event_date === date && (e.event_type === 'duty' || e.event_type === 'general_cleaning'));
          for (let ev of dayEvents) {
            await api.deleteEvent(ev.id);
          }
        }

        await api.createEvent({
          title,
          event_date: date,
          event_type: type,
          assigned_user_id: user,
          description: desc
        });

        const [y, m, d] = date.split('-').map(Number);
        currentYear = y;
        currentMonth = m - 1;
        selectedDay = d;

        modal.classList.add('hidden');
        showToast('Подію додано! 🎉', 'success');
        loadDataAndRender();
      } catch (err) {
        console.error("Помилка збереження події:", err);
        showToast('Помилка: ' + (err.message || 'Не вдалося зберегти'), 'error');
      }
    };

    // Чек-лист
    document.getElementById('btn-add-task').onclick = async () => {
      const input = document.getElementById('new-task-input');
      const val = input.value.trim();
      if (val) {
        await api.addCleaningTask(val);
        showToast('Завдання додано!', 'success');
        loadDataAndRender();
      }
    };

    container.querySelectorAll('.task-item').forEach(el => {
      el.onclick = async () => {
        await api.toggleChecklistTask(el.dataset.id);
        loadDataAndRender();
      };
    });

    container.querySelectorAll('.btn-delete-task').forEach(btn => {
      btn.onclick = async (e) => {
        e.stopPropagation();
        await api.deleteChecklistTask(btn.dataset.id);
        loadDataAndRender();
      };
    });
  }

  await loadDataAndRender();
}

function generateCalendarDays(year, month, selectedDay, events) {
  let html = '';
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  let firstDay = new Date(year, month, 1).getDay();
  firstDay = (firstDay === 0) ? 6 : firstDay - 1;

  for (let i = 0; i < firstDay; i++) {
    html += `<div class="cal-day empty"></div>`;
  }

  const now = new Date();
  const currentRealYear = now.getFullYear();
  const currentRealMonth = now.getMonth();
  const currentRealDay = now.getDate();

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const dayEvts = events.filter(e => e.event_date === dateStr);

    const isToday = (d === currentRealDay && month === currentRealMonth && year === currentRealYear);
    const isSelected = (d === selectedDay && month === currentMonth && year === currentYear);

    let classes = "cal-day text-gray-800 font-bold";
    if (isSelected) {
      classes = "cal-day active";
    } else if (isToday) {
      classes = "cal-day bg-purple-100 text-purple-900 border border-purple-300 font-black relative";
    }

    const dotsHtml = dayEvts.length ? `
      <div class="dots-container">
        ${dayEvts.slice(0, 3).map(e => `
          <span class="cal-dot" style="background:${e.color_code || (e.event_type === 'duty' ? '#F59E0B' : e.event_type === 'general_cleaning' ? '#EF4444' : '#8B5CF6')}"></span>
        `).join('')}
      </div>
    ` : '';

    html += `
      <div data-day="${d}" class="${classes}">
        ${d}
        ${dotsHtml}
      </div>
    `;
  }
  return html;
}

function renderDayEvents(day, events) {
  const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  const dayEvts = events.filter(e => e.event_date === dateStr);

  if (!dayEvts.length) {
    return '<p class="text-xs text-gray-400 font-medium italic py-2">На цей день подій немає</p>';
  }

  return dayEvts.map(e => {
    let respText = "Вероніка";
    if (e.assigned_user_id === 2) respText = "Даша";
    if (e.event_type === 'general_cleaning') respText = "Обидві";

    return `
      <div class="glass-card p-4 flex justify-between items-center rounded-2xl" style="border-left: 5px solid ${e.color_code || '#A855F7'}">
        <div>
          <p class="font-bold text-xs text-gray-900">${e.title}</p>
          ${e.description ? `<p class="text-[10px] text-gray-500 mt-0.5">${e.description}</p>` : ''}
          <p class="text-[10px] font-bold text-purple-600 mt-1">Відповідальні: ${respText}</p>
        </div>
        <div class="flex items-center gap-2">
          <span class="text-[10px] font-bold px-2.5 py-1 rounded-full bg-purple-100/80 text-purple-800">
            ${eventTypeLabels[e.event_type] || e.event_type}
          </span>
          <button data-id="${e.id}" class="btn-delete-event text-rose-400 hover:text-rose-600 p-1 text-xs font-bold cursor-pointer">
            <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
          </button>
        </div>
      </div>
    `;
  }).join('');
}