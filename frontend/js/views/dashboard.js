import { api } from '../api.js';
import { showToast } from '../toast.js';

let financeChart = null;

function getDaysPlural(n) {
  const absN = Math.abs(n) % 100;
  const lastDigit = absN % 10;

  if (absN > 10 && absN < 20) return 'днів';
  if (lastDigit > 1 && lastDigit < 5) return 'дні';
  if (lastDigit === 1) return 'день';
  return 'днів';
}

export async function renderDashboard(container, currentUser) {
  try {
    const summaryData = await api.getDashboardSummary(currentUser?.id || 1);

    const events = summaryData.events || [];
    const shoppingList = summaryData.today_shopping_list || [];
    const veronikaSpent = Number(summaryData.finance?.veronika_spent || 0);
    const dashaSpent = Number(summaryData.finance?.dasha_spent || 0);

    const totalSpent = veronikaSpent + dashaSpent;
    const totalBudget = 11000;
    const remaining = Math.max(0, totalBudget - totalSpent);

    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const todayDate = new Date(todayStr);

    // Чергування
    const futureDuties = events
      .filter(e => e.event_type === 'duty' && e.event_date >= todayStr)
      .sort((a, b) => a.event_date.localeCompare(b.event_date));

    let dutyText = "Чергувань не заплановано";
    if (futureDuties.length > 0) {
      const nextDuty = futureDuties[0];
      const diffDays = Math.ceil((new Date(nextDuty.event_date) - todayDate) / (1000 * 60 * 60 * 24));
      const personName = Number(nextDuty.assigned_user_id) === (currentUser?.id || 1)
        ? "ти" 
        : (Number(nextDuty.assigned_user_id) === 1 ? "Вероніка" : "Даша");

      if (diffDays === 0) dutyText = `Чергування <b>сьогодні</b>: відповідальна <b>${personName}</b>!`;
      else if (diffDays === 1) dutyText = `Чергування <b>завтра</b>: відповідальна <b>${personName}</b>!`;
      else dutyText = `Чергування <b>через ${diffDays} ${getDaysPlural(diffDays)}</b>: відповідальна <b>${personName}</b>!`;
    }

    // Генеральне прибирання
    const futureGeneral = events
      .filter(e => e.event_type === 'general_cleaning' && e.event_date >= todayStr)
      .sort((a, b) => a.event_date.localeCompare(b.event_date));

    let generalText = "Генерального прибирання не заплановано";
    if (futureGeneral.length > 0) {
      const nextGeneral = futureGeneral[0];
      const diffDaysG = Math.ceil((new Date(nextGeneral.event_date) - todayDate) / (1000 * 60 * 60 * 24));

      if (diffDaysG === 0) generalText = `Генеральне прибирання <b>сьогодні</b>!`;
      else if (diffDaysG === 1) generalText = `Генеральне прибирання <b>завтра</b>!`;
      else generalText = `Генеральне прибирання <b>через ${diffDaysG} ${getDaysPlural(diffDaysG)}</b>!`;
    }

    container.innerHTML = `
      <div class="space-y-6">
        <!-- Інформаційний Банер -->
        <div class="glass-card p-6 space-y-2 rounded-3xl border-purple-200/80 bg-purple-100/50">
          <div class="flex items-center space-x-2">
            <i data-lucide="sparkles" class="w-5 h-5 text-purple-700"></i>
            <h3 class="font-semibold text-base text-purple-950 tracking-tight">Чергування & Прибирання</h3>
          </div>
          <p class="text-purple-900 text-xs font-semibold leading-relaxed">${dutyText}</p>
          <p class="text-purple-700/80 text-[11px] border-t border-purple-200/60 pt-2 font-medium">${generalText}</p>
        </div>

        <!-- Спільний Бюджет -->
        <div class="glass-card p-6 rounded-3xl space-y-4">
          <div class="flex justify-between items-center">
            <h3 class="font-semibold text-gray-900 text-sm tracking-tight flex items-center gap-2">
              <i data-lucide="wallet" class="w-4 h-4 text-purple-600"></i> Спільний бюджет (11 000 грн)
            </h3>
            <button id="btn-go-to-finance" class="bg-purple-100 hover:bg-purple-200 text-purple-900 text-xs px-3 py-1.5 rounded-xl font-semibold transition cursor-pointer flex items-center gap-1.5">
              <span>Витрати</span>
              <i data-lucide="arrow-right" class="w-3.5 h-3.5"></i>
            </button>
          </div>

          <div class="w-44 h-44 mx-auto relative my-2">
            <canvas id="financeChartCanvas"></canvas>
          </div>

          <div class="grid grid-cols-3 gap-2.5 text-center pt-3 border-t border-purple-100/60">
            <div id="card-veronika-spent" class="p-3 rounded-2xl bg-purple-50/80 cursor-pointer hover:bg-purple-100/80 transition">
              <p class="text-[11px] font-semibold text-purple-950">Вероніка</p>
              <p class="text-xs font-bold text-purple-700 mt-0.5">${veronikaSpent} грн</p>
            </div>

            <div id="card-dasha-spent" class="p-3 rounded-2xl bg-pink-50/80 cursor-pointer hover:bg-pink-100/80 transition">
              <p class="text-[11px] font-semibold text-pink-950">Даша</p>
              <p class="text-xs font-bold text-pink-600 mt-0.5">${dashaSpent} грн</p>
            </div>

            <div id="card-remaining-spent" class="p-3 rounded-2xl bg-gray-50/80 cursor-pointer hover:bg-gray-100/80 transition">
              <p class="text-[11px] font-semibold text-gray-700">Залишок</p>
              <p class="text-xs font-bold text-gray-900 mt-0.5">${remaining} грн</p>
            </div>
          </div>
        </div>

        <!-- Покупки на сьогодні -->
        <div class="glass-card p-6 rounded-3xl space-y-4">
          <div class="flex justify-between items-center">
            <h3 class="font-semibold text-gray-900 text-sm tracking-tight flex items-center gap-2">
              <i data-lucide="shopping-bag" class="w-4 h-4 text-purple-600"></i> Покупки на сьогодні
            </h3>
            <button id="btn-sos" class="bg-rose-500 hover:bg-rose-600 text-white text-[11px] px-3.5 py-1.5 rounded-xl font-semibold shadow-md shadow-rose-200 cursor-pointer flex items-center gap-1.5 transition">
              <i data-lucide="shopping-cart" class="w-3.5 h-3.5"></i> Я в магазині
            </button>
          </div>

          <div class="space-y-2">
            <input type="text" id="dash-shop-name" placeholder="Назва продукту (натисни Enter)..." class="bg-white/80 border border-purple-100 rounded-2xl px-4 py-2.5 text-xs w-full font-semibold focus:outline-none focus:ring-2 focus:ring-purple-400">
            <div class="flex gap-2">
              <input type="number" id="dash-shop-amount" value="1" placeholder="Кількість" class="bg-white/80 border border-purple-100 rounded-2xl px-3 py-2 text-xs w-1/2 font-semibold">
              <select id="dash-shop-unit" class="bg-white/80 border border-purple-100 rounded-2xl px-3 py-2 text-xs font-bold text-purple-900 w-1/2">
                <option value="шт">шт</option>
                <option value="г">г</option>
                <option value="кг">кг</option>
                <option value="мл">мл</option>
                <option value="л">л</option>
                <option value="упаковка">уп</option>
              </select>
              <button id="btn-dash-add-shop" class="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 text-xs font-bold rounded-2xl shadow-md cursor-pointer transition">+</button>
            </div>
          </div>

          <div class="space-y-2 pt-2">
            ${shoppingList.length ? shoppingList.map(i => `
              <div data-id="${i.id}" class="dash-shop-item p-3.5 bg-white/80 hover:bg-purple-50/50 rounded-2xl flex justify-between items-center border border-purple-100/60 shadow-2xs transition cursor-pointer ${i.is_crossed_out ? 'opacity-50' : ''}">
                <div class="flex items-center gap-2.5 pointer-events-none">
                  <i data-lucide="${i.is_crossed_out ? 'check-circle-2' : 'circle'}" class="w-4 h-4 ${i.is_crossed_out ? 'text-purple-600' : 'text-gray-300'}"></i>
                  <span class="text-xs font-bold ${i.is_crossed_out ? 'line-through text-gray-400' : 'text-gray-900'}">${i.item_name}</span>
                  <span class="text-[10px] bg-purple-100/80 text-purple-900 px-2.5 py-0.5 rounded-xl font-bold">${i.amount || '1 шт'}</span>
                </div>
                <button data-id="${i.id}" class="dash-shop-delete text-rose-400 hover:text-rose-600 p-1.5 text-xs font-bold cursor-pointer">
                  <i data-lucide="x" class="w-3.5 h-3.5"></i>
                </button>
              </div>
            `).join('') : '<p class="text-gray-400 text-center py-4 text-xs font-medium">Усе куплено!</p>'}
          </div>
        </div>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();

    const openFinance = () => {
      const financeBtn = document.querySelector('.nav-btn[data-tab="finance"]');
      if (financeBtn) financeBtn.click();
    };

    document.getElementById('btn-go-to-finance').onclick = openFinance;
    document.getElementById('card-veronika-spent').onclick = openFinance;
    document.getElementById('card-dasha-spent').onclick = openFinance;
    document.getElementById('card-remaining-spent').onclick = openFinance;

    document.getElementById('btn-sos').onclick = () => showToast('Сповіщення надіслано!', 'info');

    const addShoppingHandler = async () => {
      const nameInput = document.getElementById('dash-shop-name');
      const name = nameInput ? nameInput.value.trim() : '';
      const amount = document.getElementById('dash-shop-amount').value || '1';
      const unit = document.getElementById('dash-shop-unit').value || 'шт';

      if (name) {
        await api.addShoppingItem({ item_name: name, amount: `${amount} ${unit}` });
        showToast('Продукт додано!', 'success');
        renderDashboard(container, currentUser);
      }
    };

    document.getElementById('btn-dash-add-shop').onclick = addShoppingHandler;

    const shopInput = document.getElementById('dash-shop-name');
    if (shopInput) {
      shopInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          addShoppingHandler();
        }
      });
    }

    container.querySelectorAll('.dash-shop-item').forEach(el => {
      el.onclick = async (e) => {
        if (!e.target.closest('.dash-shop-delete')) {
          const itemId = el.dataset.id;
          await api.toggleShoppingItem(itemId);
          renderDashboard(container, currentUser);
        }
      };
    });

    container.querySelectorAll('.dash-shop-delete').forEach(btn => {
      btn.onclick = async (e) => {
        e.stopPropagation();
        const itemId = btn.dataset.id;
        await api.deleteShoppingItem(itemId);
        renderDashboard(container, currentUser);
      };
    });

    const canvas = document.getElementById("financeChartCanvas");
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (financeChart) financeChart.destroy();

      financeChart = new Chart(ctx, {
        type: "doughnut",
        data: {
          labels: ["Вероніка", "Даша", "Залишок"],
          datasets: [{
            data: [
              veronikaSpent || (totalSpent === 0 ? 0 : 0.01), 
              dashaSpent || (totalSpent === 0 ? 0 : 0.01), 
              remaining
            ],
            backgroundColor: ["#9333EA", "#EC4899", "#E9D5FF"],
            borderWidth: 2,
            borderColor: "#ffffff"
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          cutout: '75%'
        }
      });
    }

  } catch (err) {
    console.error("Dashboard error:", err);
  }
}