import { api } from '../api.js';
import { showConfirm, showToast } from '../toast.js';

let currentYear = 2026;
let currentMonth = 7; // Серпень
let selectedDay = 11;

const monthNames = ["Січень", "Лютий", "Березень", "Квітень", "Травень", "Червень", "Липень", "Серпень", "Вересень", "Жовтень", "Листопад", "Грудень"];

const eventTypeLabels = {
  duty: "Чергування",
  general_cleaning: "Генеральне прибирання",
  exam: "Важлива подія",
  trip_home: "Від'їзд додому"
};

export async function renderCalendar(container) {
  const events = await api.getEvents();
  const checklist = await api.getCleaningChecklist();

  function renderView() {
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

        <!-- 1. СІТКА КАЛЕНДАРЯ (Зверху) -->
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

        <!-- 3. ШАБЛОНИ ШВИДКОГО ЗАПОВНЕННЯ (Внизу під Календарем) -->
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

    document.getElementById('btn-clear-schedule').onclick = () => {
      showConfirm('Очистити розклад?', 'Це видалить лише чергування та генеральні прибирання.', async () => {
        await api.clearSchedule();
        showToast('Чергування очищено!', 'info');
        renderCalendar(container);
      });
    };

    // Обробники шаблонів
    document.getElementById('btn-preset-alt').onclick = async () => {
      for (let d = 1; d <= 28; d++) {
        const date = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        await api.createEvent({ title: "Чергування по кухні", event_date: date, event_type: "duty", assigned_user_id: d % 2 === 1 ? 1 : 2 });
      }
      showToast('Застосовано: Щодня по черзі', 'success');
      renderCalendar(container);
    };

    document.getElementById('btn-preset-3days').onclick = async () => {
      for (let d = 1; d <= 28; d += 3) {
        const date = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        await api.createEvent({ title: "Вологе прибирання", event_date: date, event_type: "duty", assigned_user_id: (Math.floor(d / 3) % 2 === 0) ? 1 : 2 });
      }
      showToast('Застосовано: Раз на 3 дні', 'success');
      renderCalendar(container);
    };

    document.getElementById('btn-preset-week').onclick = async () => {
      for (let d = 1; d <= 28; d++) {
        const date = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const userId = (Math.floor((d - 1) / 7) % 2 === 0) ? 1 : 2;
        await api.createEvent({ title: "Чергування (тижневе)", event_date: date, event_type: "duty", assigned_user_id: userId });
      }
      showToast('Застосовано: Тиждень через тиждень', 'success');
      renderCalendar(container);
    };

    document.getElementById('btn-preset-sat').onclick = async () => {
      const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
      for (let d = 1; d <= daysInMonth; d++) {
        if (new Date(currentYear, currentMonth, d).getDay() === 6) {
          const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
          await api.createEvent({ title: "Генеральне прибирання", event_date: dateStr, event_type: "general_cleaning", assigned_user_id: 1 });
        }
      }
      showToast('Застосовано: Генеральне щосуботи', 'success');
      renderCalendar(container);
    };

    document.getElementById('prev-month').onclick = () => { currentMonth--; if (currentMonth < 0) { currentMonth = 11; currentYear--; } renderView(); };
    document.getElementById('next-month').onclick = () => { currentMonth++; if (currentMonth > 11) { currentMonth = 0; currentYear++; } renderView(); };

    container.querySelectorAll('#calendar-grid .cal-day').forEach(d => {
      if (!d.classList.contains('empty')) {
        d.onclick = () => { selectedDay = parseInt(d.dataset.day); renderView(); };
      }
    });

    container.querySelectorAll('.btn-delete-event').forEach(btn => {
      btn.onclick = (e) => {
        e.stopPropagation();
        showConfirm('Видалити подію?', 'Вона зникне з розкладу', async () => {
          await api.deleteEvent(btn.dataset.id);
          showToast('Подію видалено', 'info');
          renderCalendar(container);
        });
      };
    });

    const modal = document.getElementById('event-modal');
    document.getElementById('btn-open-event-modal').onclick = () => modal.classList.remove('hidden');
    document.getElementById('btn-close-evt').onclick = () => modal.classList.add('hidden');

    // Розумне створення події із заміною чергувань
    document.getElementById('btn-save-evt').onclick = async () => {
      const title = document.getElementById('evt-title').value.trim();
      const date = document.getElementById('evt-date').value;
      const type = document.getElementById('evt-type').value;
      const user = parseInt(document.getElementById('evt-user').value);
      const desc = document.getElementById('evt-desc').value.trim();

      if (title && date) {
        // Якщо створюємо важливу подію або від'їзд, видаляємо чергування/прибирання на цей день
        if (type === 'exam' || type === 'trip_home') {
          const dayEvents = events.filter(e => e.event_date === date && (e.event_type === 'duty' || e.event_type === 'general_cleaning'));
          for (let ev of dayEvents) {
            await api.deleteEvent(ev.id);
          }
        }

        await api.createEvent({ title, description: desc, event_date: date, event_type: type, assigned_user_id: user });
        modal.classList.add('hidden');
        showToast('Подію додано!', 'success');
        renderCalendar(container);
      }
    };

    const handleAddTask = async () => {
      const input = document.getElementById('new-task-input');
      const val = input.value.trim();
      if (val) {
        await fetch(`http://127.0.0.1:8000/calendar/checklist?task_name=${encodeURIComponent(val)}`, { method: 'POST' });
        renderCalendar(container);
      }
    };

    document.getElementById('btn-add-task').onclick = handleAddTask;

    container.querySelectorAll('.task-item').forEach(el => {
      el.onclick = async () => { await api.toggleChecklistTask(el.dataset.id); renderCalendar(container); };
    });

    container.querySelectorAll('.btn-delete-task').forEach(btn => {
      btn.onclick = async (e) => {
        e.stopPropagation();
        await fetch(`http://127.0.0.1:8000/calendar/checklist/${btn.dataset.id}`, { method: 'DELETE' });
        renderCalendar(container);
      };
    });
  }

  renderView();
}

// Генерація точкових індикаторів календаря (до 3 крапок)
function generateCalendarDays(year, month, selectedDay, events) {
  let html = '';
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  let firstDay = new Date(year, month, 1).getDay();
  firstDay = (firstDay === 0) ? 6 : firstDay - 1;

  for (let i = 0; i < firstDay; i++) {
    html += `<div class="cal-day empty"></div>`;
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const dayEvts = events.filter(e => e.event_date === dateStr);

    const isToday = (d === 11 && month === 7 && year === 2026);
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