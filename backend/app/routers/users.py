from fastapi import APIRouter, HTTPException
from app.database import supabase

router = APIRouter(prefix="/users", tags=["Users & Dashboard"])

@router.get("/")
def get_users():
    res = supabase.table("users").select("*").execute()
    return res.data

@router.get("/dashboard/{user_id}")
def get_dashboard(user_id: int):
    # 1. Отримуємо користувача
    user_res = supabase.table("users").select("*").eq("id", user_id).execute()
    if not user_res.data:
        raise HTTPException(status_code=404, detail="Користувача не знайдено")
    
    user_name = user_res.data[0].get("name", "Користувач")
    
    # 2. Отримуємо налаштування бюджету
    budget_res = supabase.table("budget_settings").select("*").limit(1).execute()
    budget_info = budget_res.data[0] if budget_res.data else {}

    total_budget = float(budget_info.get("total_monthly_budget", 11000))
    veronika_share = float(budget_info.get("veronika_share", 5000))
    dasha_share = float(budget_info.get("dasha_share", 6000))

    # 3. Рахуємо витрати (безпечно до порожніх значень)
    expenses_res = supabase.table("expenses").select("amount").execute()
    expenses_list = expenses_res.data or []
    
    total_spent = sum(float(item.get("amount", 0) or 0) for item in expenses_list)

    return {
        "user_name": user_name,
        "greeting": f"Вітаю, {user_name}!",
        "budget": {
            "total_monthly_budget": total_budget,
            "veronika_share": veronika_share,
            "dasha_share": dasha_share,
            "total_spent": total_spent,
            "remaining": total_budget - total_spent
        }
    }