from fastapi import APIRouter
from app.database import supabase

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/summary/{user_id}")
def get_dashboard_summary(user_id: int):
    user_name = "Вероніко" if user_id == 1 else "Дашо"
    
    # 1. Фінанси
    veronika_spent = 0.0
    dasha_spent = 0.0
    try:
        exp_res = supabase.table("expenses").select("payer_id, amount").execute()
        for e in (exp_res.data or []):
            amt = float(e.get("amount") or 0)
            payer = e.get("payer_id")
            if payer == 1:
                veronika_spent += amt
            elif payer == 2:
                dasha_spent += amt
    except Exception as err:
        print("Помилка отримання витрат:", err)

    total_spent = veronika_spent + dasha_spent

    # 2. Список покупок
    shopping_data = []
    try:
        shop_res = supabase.table("shopping_list").select("*").order("created_at").execute()
        shopping_data = shop_res.data or []
    except Exception as err:
        print("Помилка отримання покупок:", err)

    # 3. Події
    events_data = []
    try:
        events_res = supabase.table("calendar_events").select("*").order("event_date").execute()
        events_data = events_res.data or []
        if not events_data:
            events_res_alt = supabase.table("events").select("*").order("event_date").execute()
            events_data = events_res_alt.data or []
    except Exception as err:
        print("Помилка отримання подій:", err)

    return {
        "greeting": f"Вітаю, {user_name}!",
        "events": events_data,
        "today_shopping_list": shopping_data,
        "finance": {
            "veronika_spent": veronika_spent,
            "dasha_spent": dasha_spent,
            "total_spent": total_spent,
            "total_limit": 11000,
            "remaining": max(0.0, 11000.0 - total_spent)
        }
    }