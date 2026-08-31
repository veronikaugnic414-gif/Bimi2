const API_BASE_URL = 'https://bimi-backend.onrender.com';

export const api = {
    // --- 👤 КОРИСТУВАЧІ ---
    getUsers: () => 
        fetch(`${API_BASE_URL}/users/`).then(res => res.json()),

    // --- 🏠 DASHBOARD ---
    getDashboardSummary: (userId) => 
        fetch(`${API_BASE_URL}/dashboard/summary/${userId}`).then(res => res.json()),

    // --- 🔔 СПОВІЩЕННЯ ---
    sendStoreAlert: (userId) => 
        fetch(`${API_BASE_URL}/notifications/store-alert/${userId}`, { method: 'POST' }).then(res => res.json()),

    // --- 📅 КАЛЕНДАР & ПРИБИРАННЯ ---
    getEvents: () => 
        fetch(`${API_BASE_URL}/calendar/events`).then(res => res.json()),
    
    createEvent: async (data) => {
        const res = await fetch(`${API_BASE_URL}/calendar/events`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.detail || 'Помилка створення події');
        }
        return await res.json();
    },

    deleteEvent: (eventId) => 
        fetch(`${API_BASE_URL}/calendar/events/${eventId}`, { method: 'DELETE' }).then(res => res.json()),

    clearSchedule: () => 
        fetch(`${API_BASE_URL}/calendar/clear-schedule`, { method: 'DELETE' }).then(res => res.json()),

    createSwapRequest: (data) => 
        fetch(`${API_BASE_URL}/calendar/swap-request`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        }).then(res => res.json()),

    getCleaningChecklist: () => 
        fetch(`${API_BASE_URL}/calendar/checklist`).then(res => res.json()),

    addCleaningTask: (taskName) => 
        fetch(`${API_BASE_URL}/calendar/checklist?task_name=${encodeURIComponent(taskName)}`, { method: 'POST' }).then(res => res.json()),

    toggleChecklistTask: (taskId) => 
        fetch(`${API_BASE_URL}/calendar/checklist/${taskId}/toggle`, { method: 'PATCH' }).then(res => res.json()),

    deleteChecklistTask: (taskId) => 
        fetch(`${API_BASE_URL}/calendar/checklist/${taskId}`, { method: 'DELETE' }).then(res => res.json()),

    // --- 🥗 МЕНЮ ---
    getMenu: () => 
        fetch(`${API_BASE_URL}/menu/`).then(res => res.json()),

    addMenuItem: (data) => 
        fetch(`${API_BASE_URL}/menu/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        }).then(res => res.json()),

    clearMenu: () => 
        fetch(`${API_BASE_URL}/menu/clear`, { method: 'DELETE' }).then(res => res.json()),

    // --- 📖 РЕЦЕПТИ ---
    getRecipes: () => 
        fetch(`${API_BASE_URL}/recipes/`).then(res => res.json()),

    getRandomRecipe: () => 
        fetch(`${API_BASE_URL}/recipes/random`).then(res => res.json()),

    createRecipe: (data) => 
        fetch(`${API_BASE_URL}/recipes/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        }).then(res => res.json()),

    updateRecipe: (id, data) => 
        fetch(`${API_BASE_URL}/recipes/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        }).then(res => res.json()),

    deleteRecipe: (id) => 
        fetch(`${API_BASE_URL}/recipes/${id}`, { method: 'DELETE' }).then(res => res.json()),

    generateShoppingFromMenu: () => 
        fetch(`${API_BASE_URL}/recipes/generate-shopping-list`, { method: 'POST' }).then(res => res.json()),

    // --- 🧊 ХОЛОДИЛЬНИК (FRIDGE) ---
    getFridgeItems: () => 
        fetch(`${API_BASE_URL}/fridge/`).then(res => res.json()),

    addFridgeItem: (data) => 
        fetch(`${API_BASE_URL}/fridge/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        }).then(res => res.json()),

    deleteFridgeItem: (itemId) => 
        fetch(`${API_BASE_URL}/fridge/${itemId}`, { method: 'DELETE' }).then(res => res.json()),

    // --- 🛒 СПИСОК ПОКУПОК ---
    getShoppingList: () => 
        fetch(`${API_BASE_URL}/shopping/`).then(res => res.json()),

    addShoppingItem: (data) => 
        fetch(`${API_BASE_URL}/shopping/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        }).then(res => res.json()),

    clearShoppingList: () => 
        fetch(`${API_BASE_URL}/shopping/clear`, { method: 'DELETE' }).then(res => res.json()),

    toggleShoppingItem: (itemId) => 
        fetch(`${API_BASE_URL}/shopping/${itemId}/toggle`, { method: 'PATCH' }).then(res => res.json()),

    deleteShoppingItem: (itemId) => 
        fetch(`${API_BASE_URL}/shopping/${itemId}`, { method: 'DELETE' }).then(res => res.json()),

    // --- 💰 ФІНАНСИ ---
    getFinanceSummary: () => 
        fetch(`${API_BASE_URL}/finance/summary`).then(res => res.json()),

    addExpense: (data) => 
        fetch(`${API_BASE_URL}/finance/expenses`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        }).then(res => res.json()),

    resetExpenses: () => 
        fetch(`${API_BASE_URL}/finance/reset`, { method: 'DELETE' }).then(res => res.json()),

    // --- 🏆 ПОІНТИ ТА ОБОВ'ЯЗКИ ---
    getPointsSummary: (userId) => 
        fetch(`${API_BASE_URL}/points/summary?current_user_id=${userId}`).then(res => res.json()),

    getDutyTasks: () => 
        fetch(`${API_BASE_URL}/points/tasks`).then(res => res.json()),

    createDutyTask: (data) => 
        fetch(`${API_BASE_URL}/points/tasks`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        }).then(res => res.json()),

    deleteDutyTask: (taskId) => 
        fetch(`${API_BASE_URL}/points/tasks/${taskId}`, { method: 'DELETE' }).then(res => res.json()),

    logDutyTask: (data) => 
        fetch(`${API_BASE_URL}/points/log`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        }).then(res => res.json()),

    deleteDutyLog: (logId) => 
        fetch(`${API_BASE_URL}/points/log/${logId}`, { method: 'DELETE' }).then(res => res.json())
};