from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.scheduler import start_scheduler
from app.routers import (
    users,
    finance,
    shopping,
    calendar,
    menu,
    recipes,
    fridge,
    dashboard
)

app = FastAPI(
    title="Household App API",
    description="Backend API для спільного господарства Вероніки та Даші",
    version="1.0.0"
)

# Налаштування CORS (для підключення PWA фронтенду)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Підключаємо всі роутери
app.include_router(users.router)
app.include_router(finance.router)
app.include_router(shopping.router)
app.include_router(calendar.router)
app.include_router(menu.router)
app.include_router(recipes.router)
app.include_router(fridge.router)
app.include_router(dashboard.router)

@app.on_event("startup")
def startup_event():
    start_scheduler()

@app.get("/")
def root():
    return {"status": "ok", "message": "Household API працює бездоганно!"}