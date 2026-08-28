let currentUser = { id: 1, name: "Вероніка" };

window.selectUser = function(id, name) {
  currentUser = { id, name };
  try {
    localStorage.setItem("household_user", JSON.stringify(currentUser));
  } catch (e) {}

  const modal = document.getElementById("user-modal");
  if (modal) modal.classList.add("hidden");

  updateUserUI();
  loadCurrentTab('dashboard');
};

window.openUserModal = function() {
  const modal = document.getElementById("user-modal");
  if (modal) modal.classList.remove("hidden");
};

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

function initTheme() {
  const savedTheme = localStorage.getItem('app-theme') || 'light';
  if (savedTheme === 'dark') {
    document.body.classList.add('dark-mode');
  }

  const updateIcons = () => {
    const isDark = document.body.classList.contains('dark-mode');
    document.querySelectorAll('.theme-icon').forEach(icon => {
      icon.setAttribute('data-lucide', isDark ? 'sun' : 'moon');
    });
    if (window.lucide) window.lucide.createIcons();
  };

  updateIcons();

  document.querySelectorAll('.theme-toggle-btn').forEach(btn => {
    btn.onclick = () => {
      document.body.classList.toggle('dark-mode');
      const isDark = document.body.classList.contains('dark-mode');
      localStorage.setItem('app-theme', isDark ? 'dark' : 'light');
      updateIcons();
    };
  });
}

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
    if (tab === 'dashboard') {
      const module = await import('./views/dashboard.js');
      await module.renderDashboard(container, currentUser);
    } else if (tab === 'calendar') {
      const module = await import('./views/calendar.js');
      await module.renderCalendar(container);
    } else if (tab === 'menu') {
      const module = await import('./views/menu.js');
      await module.renderMenu(container);
    } else if (tab === 'recipes') {
      const module = await import('./views/recipes.js');
      await module.renderRecipes(container);
    } else if (tab === 'fridge') {
      const module = await import('./views/fridge.js');
      await module.renderFridge(container);
    } else if (tab === 'shopping') {
      const module = await import('./views/shopping.js');
      await module.renderShopping(container);
    } else if (tab === 'finance') {
      const module = await import('./views/finance.js');
      await module.renderFinance(container, currentUser);
    }

    if (window.lucide) window.lucide.createIcons();

  } catch (err) {
    console.error(`Error loading tab ${tab}:`, err);
    container.innerHTML = `
      <div class="glass-card p-6 text-center rounded-3xl space-y-2 border-rose-200">
        <p class="text-sm font-bold text-rose-500">Помилка завантаження розділу "${tab}"</p>
      </div>
    `;
  }
}