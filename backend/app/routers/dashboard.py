from fastapi import APIRouter
from app.database import supabase

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/summary/{user_id}")
def get_dashboard_summary(user_id: int):
    user_name = "Вероніко" if user_id == 1 else "Дашо"
    
    # 1. Фінанси
    exp_res = supabase.table("expenses").select("*").execute()
    total_spent = sum(e["amount"] for e in (exp_res.data or []))
    
    # 2. Список покупок (Тепер забираємо УСІ товари, щоб закреслені залишалися на екрані!)
    shop_res = supabase.table("shopping_list").select("*").order("created_at").execute()
    
    # 3. Найближчі події
    events_res = supabase.table("events").select("*").order("event_date").limit(3).execute()
    
    return {
        "greeting": f"Вітаю, {user_name}!",
        "duty_status": "Твоє чергування через 2 дні. Генеральне прибирання через 10 днів!",
        "finance_widget": {
            "total_limit": 11000,
            "total_spent": total_spent,
            "remaining": 11000 - total_spent
        },
        "today_shopping_list": shop_res.data or [],
        "upcoming_events": events_res.data or []
    }