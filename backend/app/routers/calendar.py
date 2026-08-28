from fastapi import APIRouter, HTTPException
from app.database import supabase
from app.schemas.models import EventCreate, SwapRequestCreate

router = APIRouter(prefix="/calendar", tags=["Calendar & Cleaning"])

# ==========================================
# 📅 ПОДІЇ ТА КАЛЕНДАР
# ==========================================

@router.get("/events")
def get_events():
    """Отримати всі події календаря"""
    res = supabase.table("calendar_events").select("*").order("event_date").execute()
    return res.data or []

@router.post("/events")
def create_event(event: EventCreate):
    """Створити нову подію (чергування, іспит, поїздка додому)"""
    event_data = event.model_dump()
    
    # Автоматичне встановлення кольорів для подій
    if event.event_type == "trip_home":
        event_data["color_code"] = "#E0E0E0"
    elif event.event_type == "general_cleaning":
        event_data["color_code"] = "#FF6B6B"
    elif event.event_type == "duty":
        event_data["color_code"] = "#FFC107"
    elif event.event_type == "exam":
        event_data["color_code"] = "#C084FC"

    res = supabase.table("calendar_events").insert(event_data).execute()
    if not res.data:
        raise HTTPException(status_code=400, detail="Не вдалося створити подію")
    return {"message": "Подію успішно додано", "data": res.data}

@router.delete("/events/{event_id}")
def delete_event(event_id: int):
    """Видалити конкретну подію за ID"""
    supabase.table("calendar_events").delete().eq("id", event_id).execute()
    return {"message": "Подію видалено"}

@router.delete("/clear-schedule")
def clear_schedule():
    """Очистити розклад чергувань та генеральних прибирань (не видаляє іспити та поїздки)"""
    supabase.table("calendar_events").delete().in_("event_type", ["duty", "general_cleaning"]).execute()
    return {"message": "Розклад чергувань та прибирань успішно очищено"}


# ==========================================
# 🔄 ОБМІН ЧЕРГУВАННЯМИ (SWAP REQUESTS)
# ==========================================

@router.post("/swap-request")
def create_swap_request(swap: SwapRequestCreate):
    """Створити запит на обмін чергуваннями з перевіркою існування подій"""
    orig = supabase.table("calendar_events").select("id").eq("id", swap.original_event_id).execute()
    prop = supabase.table("calendar_events").select("id").eq("id", swap.proposed_event_id).execute()

    if not orig.data or not prop.data:
        raise HTTPException(status_code=404, detail="Одну або обидві події не знайдено в календарі")

    res = supabase.table("swap_requests").insert(swap.model_dump()).execute()
    if not res.data:
        raise HTTPException(status_code=400, detail="Не вдалося створити запит")
    return {"message": "Запит на обмін надіслано!", "data": res.data}

@router.get("/swap-requests")
def get_swap_requests():
    """Отримати список усіх активних запитів на обмін"""
    res = supabase.table("swap_requests").select("*").eq("status", "pending").execute()
    return res.data or []

@router.post("/swap-request/{request_id}/approve")
def approve_swap_request(request_id: int):
    """Підтвердити обмін чергуваннями (автоматично міняє місцями відповідальних)"""
    swap_res = supabase.table("swap_requests").select("*").eq("id", request_id).execute()
    if not swap_res.data:
        raise HTTPException(status_code=404, detail="Запит не знайдено")
    
    swap_data = swap_res.data[0]
    orig_event_id = swap_data["original_event_id"]
    prop_event_id = swap_data["proposed_event_id"]

    orig_res = supabase.table("calendar_events").select("*").eq("id", orig_event_id).execute()
    prop_res = supabase.table("calendar_events").select("*").eq("id", prop_event_id).execute()

    if not orig_res.data or not prop_res.data:
        raise HTTPException(status_code=404, detail="Одна з подій для обміну не знайдена в календарі")

    orig_event = orig_res.data[0]
    prop_event = prop_res.data[0]

    # Міняємо місцями assigned_user_id
    supabase.table("calendar_events").update({"assigned_user_id": prop_event["assigned_user_id"]}).eq("id", orig_event_id).execute()
    supabase.table("calendar_events").update({"assigned_user_id": orig_event["assigned_user_id"]}).eq("id", prop_event_id).execute()

    # Оновлюємо статус запиту
    supabase.table("swap_requests").update({"status": "accepted"}).eq("id", request_id).execute()

    return {"message": "Успішно! Чергування поміняно місцями."}


# ==========================================
# 🧹 ЧЕК-ЛИСТ ГЕНЕРАЛЬНОГО ПРИБИРАННЯ
# ==========================================

@router.get("/checklist")
def get_cleaning_checklist():
    """Отримати чек-лист генерального прибирання"""
    res = supabase.table("cleaning_checklist").select("*").execute()
    return res.data or []

@router.post("/checklist")
def add_checklist_task(task_name: str):
    """Додати новий пункт у чек-лист прибирання"""
    res = supabase.table("cleaning_checklist").insert({"task_name": task_name, "is_completed": False}).execute()
    return {"message": "Завдання додано", "data": res.data}

@router.patch("/checklist/{task_id}/toggle")
def toggle_checklist_task(task_id: int):
    """Позначити пункт виконаним / невиконаним"""
    curr = supabase.table("cleaning_checklist").select("is_completed").eq("id", task_id).execute()
    if not curr.data:
        raise HTTPException(status_code=404, detail="Завдання не знайдено")
    
    new_status = not curr.data[0]["is_completed"]
    supabase.table("cleaning_checklist").update({"is_completed": new_status}).eq("id", task_id).execute()
    return {"message": "Статус завдання оновлено", "is_completed": new_status}

@router.delete("/checklist/{task_id}")
def delete_checklist_task(task_id: int):
    """Видалити пункт із чек-листа прибирання"""
    supabase.table("cleaning_checklist").delete().eq("id", task_id).execute()
    return {"message": "Завдання видалено з чек-листа"}