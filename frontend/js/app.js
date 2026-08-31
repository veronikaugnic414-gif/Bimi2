import { renderDashboard } from './views/dashboard.js';
import { renderCalendar } from './views/calendar.js';
import { renderMenu } from './views/menu.js';
import { renderRecipes } from './views/recipes.js';
import { renderFridge } from './views/fridge.js';
import { renderShopping } from './views/shopping.js';
import { renderFinance } from './views/finance.js';
import { renderPoints } from './views/points.js';

let currentUser = { id: 1, name: "Вероніка" };
let currentActiveTab = 'dashboard';

window.selectUser = function(id, name) {
  currentUser = { id, name };
  try {
    localStorage.setItem("household_user", JSON.stringify(currentUser));
  } catch (e) {}

  const modal = document.getElementById("user-modal");
  if (modal) modal.classList.add("hidden");

  updateUserUI();
  loadCurrentTab(currentActiveTab);
};

window.openUserModal = function() {
  const modal = document.getElementById("user-modal");
  if (modal) modal.classList.remove("hidden");
};

function initTheme() {
  const savedTheme = localStorage.getItem("household_theme") || "light";
  if (savedTheme === "dark") {
    document.body.classList.add("dark-mode");
  }

  const updateIcons = () => {
    const isDark = document.body.classList.contains("dark-mode");
    const deskIcon = document.getElementById("theme-icon-desktop");
    const mobIcon = document.getElementById("theme-icon-mobile");

    if (deskIcon) deskIcon.setAttribute("data-lucide", isDark ? "sun" : "moon");
    if (mobIcon) mobIcon.setAttribute("data-lucide", isDark ? "sun" : "moon");

    if (window.lucide) window.lucide.createIcons();
  };

  const toggle = () => {
    document.body.classList.toggle("dark-mode");
    const isDark = document.body.classList.contains("dark-mode");
    localStorage.setItem("household_theme", isDark ? "dark" : "light");
    updateIcons();
    loadCurrentTab(currentActiveTab);
  };

  const deskBtn = document.getElementById("btn-theme-desktop");
  const mobBtn = document.getElementById("btn-theme-mobile");
  if (deskBtn) deskBtn.onclick = toggle;
  if (mobBtn) mobBtn.onclick = toggle;

  updateIcons();
}

document.addEventListener("DOMContentLoaded", () => {
  initTheme();

  const savedUser = localStorage.getItem("household_user");
  if (savedUser) {
    try {
      currentUser = JSON.parse(savedUser);
      const modal = document.getElementById("user-modal");
      if (modal) modal.classList.add("hidden");
    } catch (e) {}
  }

  const btnV = document.getElementById("btn-veronika");
  const btnD = document.getElementById("btn-dasha");
  const btnDesk = document.getElementById("btn-change-user-desktop");
  const btnMob = document.getElementById("btn-change-user-mobile");

  if (btnV) btnV.onclick = () => window.selectUser(1, "Вероніка");
  if (btnD) btnD.onclick = () => window.selectUser(2, "Даша");
  if (btnDesk) btnDesk.onclick = () => window.openUserModal();
  if (btnMob) btnMob.onclick = () => window.openUserModal();

  updateUserUI();
  setupNavigation();
  loadCurrentTab('dashboard');
});

function updateUserUI() {
  const mob = document.getElementById("user-display");
  const desk = document.getElementById("user-display-desktop");

  if (mob) mob.innerText = `Вітаю, ${currentUser.name}!`;
  if (desk) desk.innerText = `${currentUser.name}`;
}

function setupNavigation() {
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.onclick = (e) => {
      e.preventDefault();
      const tab = btn.dataset.tab;
      currentActiveTab = tab;
      
      document.querySelectorAll('.nav-btn').forEach(b => {
        b.classList.remove('active', 'text-purple-600', 'bg-purple-100/50');
        b.classList.add('text-gray-400');
      });

      btn.classList.add('active', 'text-purple-600');
      btn.classList.remove('text-gray-400');
      loadCurrentTab(tab);
    };
  });
}

async function loadCurrentTab(tab) {
  currentActiveTab = tab;
  const container = document.getElementById('app-content');
  if (!container) return;

  container.innerHTML = `
    <div class="p-12 text-center text-purple-600 font-bold flex flex-col items-center justify-center gap-3">
      <i data-lucide="loader-2" class="w-8 h-8 animate-spin text-purple-600"></i>
      <span class="text-xs text-gray-400 font-medium">Завантаження...</span>
    </div>
  `;
  if (window.lucide) window.lucide.createIcons();

  try {
    switch (tab) {
      case 'dashboard':
        await renderDashboard(container, currentUser);
        break;
      case 'calendar':
        await renderCalendar(container);
        break;
      case 'menu':
        await renderMenu(container);
        break;
      case 'recipes':
        await renderRecipes(container);
        break;
      case 'fridge':
        await renderFridge(container);
        break;
      case 'shopping':
        await renderShopping(container);
        break;
      case 'finance':
        await renderFinance(container, currentUser);
        break;
      case 'points':
        await renderPoints(container, currentUser);
        break;
      default:
        await renderDashboard(container, currentUser);
    }

    if (window.lucide) window.lucide.createIcons();

  } catch (err) {
    console.error(`Error rendering tab ${tab}:`, err);
    container.innerHTML = `
      <div class="glass-card p-6 text-center rounded-3xl space-y-2 border-rose-200">
        <p class="text-sm font-bold text-rose-500">Помилка завантаження розділу "${tab}"</p>
      </div>
    `;
  }
}