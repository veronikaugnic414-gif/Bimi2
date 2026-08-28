from apscheduler.schedulers.background import BackgroundScheduler
from app.database import supabase

def clear_weekly_menu():
    print("🧹 Автоочищення тижневого меню...")
    supabase.table("weekly_menu").delete().neq("id", 0).execute()

def start_scheduler():
    scheduler = BackgroundScheduler()
    # Запуск щоп'ятниці о 19:00
    scheduler.add_job(clear_weekly_menu, 'cron', day_of_week='fri', hour=19, minute=0)
    scheduler.start()