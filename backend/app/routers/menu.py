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
    """Атомарне оновлення страви в меню через upsert"""
    res = supabase.table("weekly_menu").upsert(
        item.model_dump(),
        on_conflict="day_of_week,meal_type"
    ).execute()
    return {"message": "Меню успішно оновлено", "data": res.data}

@router.delete("/clear")
def clear_weekly_menu():
    """Скинути все тижневе меню"""
    supabase.table("weekly_menu").delete().neq("id", 0).execute()
    return {"message": "Тижневе меню повністю очищено!"}