from fastapi import APIRouter, HTTPException
from app.database import supabase
from app.schemas.models import MenuCreate

router = APIRouter(prefix="/menu", tags=["Weekly Menu"])

@router.get("")
@router.get("/")
def get_menu():
    """Отримати поточне тижневе меню"""
    res = supabase.table("weekly_menu").select("*").execute()
    return res.data or []

@router.post("")
@router.post("/")
def add_or_update_menu_item(item: MenuCreate):
    """Додати або оновити страву в меню (спочатку видаляє стару за наявності)"""
    # 1. Видаляємо старий запис для цього дня та прийому їжі
    supabase.table("weekly_menu") \
        .delete() \
        .eq("day_of_week", item.day_of_week) \
        .eq("meal_type", item.meal_type) \
        .execute()

    # 2. Вставляємо нову страву
    res = supabase.table("weekly_menu").insert(item.model_dump()).execute()
    return {"message": "Меню успішно оновлено", "data": res.data}

@router.delete("/clear")
def clear_weekly_menu():
    """Скинути все тижневе меню"""
    supabase.table("weekly_menu").delete().neq("id", 0).execute()
    return {"message": "Тижневе меню повністю очищено!"}