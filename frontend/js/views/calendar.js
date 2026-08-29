import { api } from '../api.js';
import { showConfirm, showToast } from '../toast.js';

let currentYear = 2026;
let currentMonth = 7; // Серпень
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
      <!-- Шапка календаря -->
      <section class="card">
        <div class="card-header">
          <div>
            <h2 class="text-card-title">${monthNames[currentMonth]} ${currentYear}</h2>
            <p class="text-secondary">Графік прибирань та подій</p>
          </div>
          <div style="display: flex; gap: 6px;">
            <button id="prev-month" class="btn-icon" style="width: 36px; height: 36px;" type="button" aria-label="Попередній місяць">
              <i data-lucide="chevron-left" class="icon-sm"></i>
            </button>
            <button id="next-month" class="btn-icon" style="width: 36px; height: 36px;" type="button" aria-label="Наступний місяць">
              <i data-lucide="chevron-right" class="icon-sm"></i>
            </button>
            <button id="btn-open-event-modal" class="btn btn-primary btn-sm" type="button">
              <i data-lucide="plus" class="icon-sm"></i>
              <span>Подія</span>
            </button>
          </div>
        </div>

        <!-- Сітка календаря -->
        <div class="cal-grid" style="margin-bottom: 8px;">
          <div class="cal-day-header">ПН</div>
          <div class="cal-day-header">ВТ</div>
          <div class="cal-day-header">СР</div>
          <div class="cal-day-header">ЧТ</div>
          <div class="cal-day-header">ПТ</div>
          <div class="cal-day-header">СБ</div>
          <div class="cal-day-header">НД</div>
        </div>
        <div class="cal-grid" id="calendar-grid">
          ${generateCalendarDays(currentYear, currentMonth, selectedDay, events)}
        </div>
      </section>

      <!-- Події вибраного дня -->
      <section class="card">
        <h3 class="text-card-title" style="font-size: 15px; margin-bottom: 10px;">Події на ${selectedDay} ${monthNames[currentMonth].toLowerCase()}:</h3>
        <div style="display: flex; flex-direction: column; gap: 8px;">
          ${renderDayEvents(selectedDay, events)}
        </div>
      </section>

      <!-- Шаблони заповнення -->
      <section class="card">
        <div class="card-header">
          <div class="card-title-group">
            <i data-lucide="zap" class="icon-md" style="color: #F59E0B;"></i>
            <h3 class="text-card-title" style="font-size: 15px;">Швидкі шаблони розкладу</h3>
          </div>
          <button id="btn-clear-schedule" class="btn btn-danger-ghost btn-sm" type="button">
            <i data-lucide="trash-2" class="icon-sm"></i>
            <span>Очистити</span>
          </button>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
          <button id="btn-preset-alt" class="stat-pill" style="text-align: left; padding: 12px 14px;" type="button">
            <div style="display: flex; align-items: center; gap: 8px;">
              <div style="width: 8px; height: 8px; border-radius: var(--radius-pill); background: #F59E0B;"></div>
              <div class="text-body" style="font-size: 13px; font-weight: 600;">Щодня по черзі</div>
            </div>
            <div class="text-secondary" style="font-size: 11px; margin-top: 4px;">Зміна чергування щодня</div>
          </button>

          <button id="btn-preset-3days" class="stat-pill" style="text-align: left; padding: 12px 14px;" type="button">
            <div style="display: flex; align-items: center; gap: 8px;">
              <div style="width: 8px; height: 8px; border-radius: var(--radius-pill); background: #F59E0B;"></div>
              <div class="text-body" style="font-size: 13px; font-weight: 600;">Раз на 3 дні</div>
            </div>
            <div class="text-secondary" style="font-size: 11px; margin-top: 4px;">Чергування кожні 3 дні</div>
          </button>

          <button id="btn-preset-week" class="stat-pill" style="text-align: left; padding: 12px 14px;" type="button">
            <div style="display: flex; align-items: center; gap: 8px;">
              <div style="width: 8px; height: 8px; border-radius: var(--radius-pill); background: #F59E0B;"></div>
              <div class="text-body" style="font-size: 13px; font-weight: 600;">Тиждень / тиждень</div>
            </div>
            <div class="text-secondary" style="font-size: 11px; margin-top: 4px;">По черзі по 7 днів</div>
          </button>

          <button id="btn-preset-sat" class="stat-pill" style="text-align: left; padding: 12px 14px;" type="button">
            <div style="display: flex; align-items: center; gap: 8px;">
              <div style="width: 8px; height: 8px; border-radius: var(--radius-pill); background: var(--danger);"></div>
              <div class="text-body" style="font-size: 13px; font-weight: 600;">Генеральне щосуботи</div>
            </div>
            <div class="text-secondary" style="font-size: 11px; margin-top: 4px;">Кожної суботи місяця</div>
          </button>
        </div>
      </section>

      <!-- Чек-лист прибирання -->
      <section class="card">
        <div class="card-header">
          <div class="card-title-group">
            <i data-lucide="check-square" class="icon-md" style="color: var(--primary);"></i>
            <h3 class="text-card-title" style="font-size: 15px;">Чек-лист генерального прибирання</h3>
          </div>
        </div>

        <div class="input-group" style="margin-bottom: 12px;">
          <input type="text" id="new-task-input" placeholder="Нове завдання..." class="input-field">
          <button id="btn-add-task" class="btn btn-primary" style="padding: 0 16px;" type="button" aria-label="Додати">
            <i data-lucide="plus" class="icon-md"></i>
          </button>
        </div>

        <div style="display: flex; flex-direction: column; gap: 8px;">
          ${checklist.map(t => `
            <div class="item-row">
              <div data-id="${t.id}" class="item-left task-item">
                <i data-lucide="${t.is_completed ? 'check-circle-2' : 'circle'}" class="icon-md" style="color: ${t.is_completed ? 'var(--primary)' : 'var(--text-muted)'};"></i>
                <span class="item-name ${t.is_completed ? 'crossed' : ''}">${t.task_name}</span>
              </div>
              <button data-id="${t.id}" class="btn-ghost btn-sm btn-delete-task" style="padding: 4px;" type="button" aria-label="Видалити">
                <i data-lucide="x" class="icon-sm"></i>
              </button>
            </div>
          `).join('')}
        </div>
      </section>

      <!-- Mobile Bottom Sheet створення події -->
      <div id="event-modal" class="modal-backdrop hidden" role="dialog">
        <div class="bottom-sheet">
          <div class="sheet-indicator"></div>
          <div class="card-header">
            <h3 class="text-card-title">Створити подію</h3>
            <button id="btn-close-evt" class="btn-ghost btn-sm" type="button">Закрити</button>
          </div>

          <div style="display: flex; flex-direction: column; gap: 10px;">
            <input type="text" id="evt-title" placeholder="Назва події..." class="input-field">
            <input type="date" id="evt-date" value="${formattedSelectedDate}" class="input-field">
            
            <select id="evt-type" class="select-field">
              <option value="exam">Важлива подія / Іспит</option>
              <option value="trip_home">Від'їзд додому</option>
              <option value="duty">Чергування</option>
              <option value="general_cleaning">Генеральне прибирання</option>
            </select>

            <select id="evt-user" class="select-field">
              <option value="1">Відповідальна: Вероніка</option>
              <option value="2">Відповідальна: Даша</option>
            </select>

            <input type="text" id="evt-desc" placeholder="Примітка (необов'язково)..." class="input-field">

            <button id="btn-save-evt" class="btn btn-primary" style="margin-top: 10px;" type="button">Зберегти подію</button>
          </div>
        </div>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
    attachListeners();
  }

  function attachListeners() {
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

    container.querySelectorAll('#calendar-grid .cal-cell').forEach(d => {
      if (!d.classList.contains('empty')) {
        d.onclick = () => {
          selectedDay = parseInt(d.dataset.day);
          renderDOM();
        };
      }
    });

    document.getElementById('btn-clear-schedule').onclick = () => {
      showConfirm('Очистити розклад?', 'Це видалить усі чергування та генеральні прибирання.', async () => {
        await api.clearSchedule();
        showToast('Розклад очищено!', 'info');
        loadDataAndRender();
      });
    };

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

    const modal = document.getElementById('event-modal');
    document.getElementById('btn-open-event-modal').onclick = () => modal.classList.remove('hidden');
    document.getElementById('btn-close-evt').onclick = () => modal.classList.add('hidden');

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
    html += `<div class="cal-cell empty"></div>`;
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

    let classes = "cal-cell";
    if (isSelected) classes += " active";
    else if (isToday) classes += " today";

    const dotsHtml = dayEvts.length ? `
      <div class="cal-dots">
        ${dayEvts.slice(0, 3).map(e => `
          <span class="cal-dot" style="background:${e.color_code || (e.event_type === 'duty' ? '#F59E0B' : e.event_type === 'general_cleaning' ? 'var(--danger)' : 'var(--primary)')}"></span>
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
    return '<p class="empty-state" style="padding: 12px 0;">На цей день подій немає</p>';
  }

  return dayEvts.map(e => {
    let respText = "Вероніка";
    if (e.assigned_user_id === 2) respText = "Даша";
    if (e.event_type === 'general_cleaning') respText = "Обидві";

    return `
      <div class="item-row" style="border-left: 3px solid ${e.color_code || 'var(--primary)'};">
        <div>
          <div class="text-body" style="font-size: 13px; font-weight: 600;">${e.title}</div>
          ${e.description ? `<div class="text-secondary" style="font-size: 11px; margin-top: 2px;">${e.description}</div>` : ''}
          <div class="text-muted" style="font-size: 11px; margin-top: 2px;">Відповідальні: <span style="color: var(--text-accent-purple);">${respText}</span></div>
        </div>
        <div style="display: flex; align-items: center; gap: 6px;">
          <span class="badge" style="font-size: 10px;">
            ${eventTypeLabels[e.event_type] || e.event_type}
          </span>
          <button data-id="${e.id}" class="btn-ghost btn-sm btn-delete-event" style="padding: 4px;" type="button" aria-label="Видалити">
            <i data-lucide="trash-2" class="icon-sm" style="color: var(--danger);"></i>
          </button>
        </div>
      </div>
    `;
  }).join('');
}