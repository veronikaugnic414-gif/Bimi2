from fastapi import APIRouter, HTTPException
from typing import Optional
from pydantic import BaseModel
from app.database import supabase

router = APIRouter(prefix="/calendar", tags=["Calendar & Cleaning"])

class EventInput(BaseModel):
    title: str
    event_type: str
    event_date: str
    assigned_user_id: Optional[int] = 1
    description: Optional[str] = ""
    color_code: Optional[str] = None

class SwapRequestInput(BaseModel):
    requester_id: int
    target_user_id: int
    original_event_id: int
    proposed_event_id: int

# ==========================================
# 📅 ПОДІЇ ТА КАЛЕНДАР
# ==========================================

@router.get("/events")
def get_events():
    try:
        res = supabase.table("calendar_events").select("*").order("event_date").execute()
        return res.data or []
    except Exception as e:
        print("Помилка завантаження подій:", e)
        return []

@router.post("/events")
def create_event(event: EventInput):
    event_data = {
        "title": event.title,
        "event_type": event.event_type,
        "event_date": event.event_date,
        "assigned_user_id": event.assigned_user_id or 1,
        "description": event.description or ""
    }
    
    if event.event_type == "trip_home":
        event_data["color_code"] = "#E0E0E0"
    elif event.event_type == "general_cleaning":
        event_data["color_code"] = "#FF6B6B"
    elif event.event_type == "duty":
        event_data["color_code"] = "#FFC107"
    elif event.event_type == "exam":
        event_data["color_code"] = "#C084FC"
    else:
        event_data["color_code"] = event.color_code or "#A855F7"

    try:
        res = supabase.table("calendar_events").insert(event_data).execute()
        return {"message": "Подію успішно додано", "data": res.data or []}
    except Exception as err:
        print("Помилка Supabase при додаванні події:", err)
        raise HTTPException(status_code=400, detail=str(err))

@router.delete("/events/{event_id}")
def delete_event(event_id: int):
    try:
        supabase.table("calendar_events").delete().eq("id", event_id).execute()
        return {"message": "Подію видалено"}
    except Exception as err:
        raise HTTPException(status_code=400, detail=str(err))

@router.delete("/clear-schedule")
def clear_schedule():
    try:
        supabase.table("calendar_events").delete().in_("event_type", ["duty", "general_cleaning"]).execute()
        return {"message": "Розклад чергувань та прибирань успішно очищено"}
    except Exception as err:
        raise HTTPException(status_code=400, detail=str(err))


# ==========================================
# 🔄 ОБМІН ЧЕРГУВАННЯМИ (SWAP REQUESTS)
# ==========================================

@router.post("/swap-request")
def create_swap_request(swap: SwapRequestInput):
    try:
        orig = supabase.table("calendar_events").select("id").eq("id", swap.original_event_id).execute()
        prop = supabase.table("calendar_events").select("id").eq("id", swap.proposed_event_id).execute()

        if not orig.data or not prop.data:
            raise HTTPException(status_code=404, detail="Одну або обидві події не знайдено в календарі")

        res = supabase.table("swap_requests").insert(swap.model_dump()).execute()
        return {"message": "Запит на обмін надіслано!", "data": res.data or []}
    except Exception as err:
        raise HTTPException(status_code=400, detail=str(err))

@router.get("/swap-requests")
def get_swap_requests():
    try:
        res = supabase.table("swap_requests").select("*").eq("status", "pending").execute()
        return res.data or []
    except Exception:
        return []

@router.post("/swap-request/{request_id}/approve")
def approve_swap_request(request_id: int):
    try:
        swap_res = supabase.table("swap_requests").select("*").eq("id", request_id).execute()
        if not swap_res.data:
            raise HTTPException(status_code=404, detail="Запит не знайдено")
        
        swap_data = swap_res.data[0]
        orig_event_id = swap_data["original_event_id"]
        prop_event_id = swap_data["proposed_event_id"]

        orig_res = supabase.table("calendar_events").select("*").eq("id", orig_event_id).execute()
        prop_res = supabase.table("calendar_events").select("*").eq("id", prop_event_id).execute()

        if not orig_res.data or not prop_res.data:
            raise HTTPException(status_code=404, detail="Одна з подій не знайдена")

        orig_event = orig_res.data[0]
        prop_event = prop_res.data[0]

        supabase.table("calendar_events").update({"assigned_user_id": prop_event["assigned_user_id"]}).eq("id", orig_event_id).execute()
        supabase.table("calendar_events").update({"assigned_user_id": orig_event["assigned_user_id"]}).eq("id", prop_event_id).execute()
        supabase.table("swap_requests").update({"status": "accepted"}).eq("id", request_id).execute()

        return {"message": "Успішно! Чергування поміняно місцями."}
    except Exception as err:
        raise HTTPException(status_code=400, detail=str(err))


# ==========================================
# 🧹 ЧЕК-ЛИСТ ГЕНЕРАЛЬНОГО ПРИБИРАННЯ
# ==========================================

@router.get("/checklist")
def get_cleaning_checklist():
    try:
        res = supabase.table("cleaning_checklist").select("*").order("id").execute()
        return res.data or []
    except Exception:
        return []

@router.post("/checklist")
def add_checklist_task(task_name: str):
    try:
        res = supabase.table("cleaning_checklist").insert({"task_name": task_name, "is_completed": False}).execute()
        return {"message": "Завдання додано", "data": res.data or []}
    except Exception as err:
        raise HTTPException(status_code=400, detail=str(err))

@router.patch("/checklist/{task_id}/toggle")
def toggle_checklist_task(task_id: int):
    try:
        curr = supabase.table("cleaning_checklist").select("is_completed").eq("id", task_id).execute()
        if not curr.data:
            raise HTTPException(status_code=404, detail="Завдання не знайдено")
        
        new_status = not curr.data[0]["is_completed"]
        supabase.table("cleaning_checklist").update({"is_completed": new_status}).eq("id", task_id).execute()
        return {"message": "Статус завдання оновлено", "is_completed": new_status}
    except Exception as err:
        raise HTTPException(status_code=400, detail=str(err))

@router.delete("/checklist/{task_id}")
def delete_checklist_task(task_id: int):
    try:
        supabase.table("cleaning_checklist").delete().eq("id", task_id).execute()
        return {"message": "Завдання видалено з чек-листа"}
    except Exception as err:
        raise HTTPException(status_code=400, detail=str(err))