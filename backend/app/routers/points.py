from fastapi import APIRouter, HTTPException
from app.database import supabase
from pydantic import BaseModel
from datetime import datetime, timedelta, timezone

router = APIRouter(prefix="/points", tags=["Points & Duties"])

class DutyTaskCreate(BaseModel):
    title: str
    points: int
    icon: str | None = "sparkles"

class DutyTaskUpdate(BaseModel):
    title: str | None = None
    points: int | None = None
    icon: str | None = None

class DutyLogCreate(BaseModel):
    user_id: int
    task_id: int | None = None
    task_title: str
    points: int

@router.get("/summary")
def get_points_summary(current_user_id: int = 1):
    now = datetime.now(timezone.utc)
    week_start = (now - timedelta(days=now.weekday())).replace(hour=0, minute=0, second=0, microsecond=0).isoformat()
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0).isoformat()

    res = supabase.table("duty_logs").select("*").order("completed_at", desc=True).execute()
    logs = res.data or []

    def calc_stats(uid: int):
        user_logs = [l for l in logs if l.get("user_id") == uid]
        total = sum(l.get("points", 0) for l in user_logs)
        month = sum(l.get("points", 0) for l in user_logs if l.get("completed_at", "") >= month_start)
        week = sum(l.get("points", 0) for l in user_logs if l.get("completed_at", "") >= week_start)
        return {"total": total, "month": month, "week": week}

    stats_user1 = calc_stats(1)
    stats_user2 = calc_stats(2)

    return {
        "current_user_id": current_user_id,
        "user_stats": stats_user1 if current_user_id == 1 else stats_user2,
        "partner_stats": stats_user2 if current_user_id == 1 else stats_user1,
        "logs": logs
    }

@router.get("/tasks")
def get_duty_tasks():
    res = supabase.table("duty_tasks").select("*").order("id", desc=True).execute()
    return res.data or []

@router.post("/tasks")
def create_duty_task(task: DutyTaskCreate):
    res = supabase.table("duty_tasks").insert(task.model_dump()).select().execute()
    return {"message": "Справу успішно створено", "data": res.data}

@router.put("/tasks/{task_id}")
def update_duty_task(task_id: int, task: DutyTaskUpdate):
    update_data = {k: v for k, v in task.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="Немає даних для оновлення")
    
    res = supabase.table("duty_tasks").update(update_data).eq("id", task_id).select().execute()
    return {"message": "Справу оновлено", "data": res.data}

@router.delete("/tasks/{task_id}")
def delete_duty_task(task_id: int):
    supabase.table("duty_tasks").delete().eq("id", task_id).execute()
    return {"message": "Справу видалено"}

@router.post("/log")
def log_completed_task(log_data: DutyLogCreate):
    res = supabase.table("duty_logs").insert(log_data.model_dump()).select().execute()
    return {"message": "Поінти нараховано! 🎉", "data": res.data}

@router.delete("/log/{log_id}")
def delete_log(log_id: int):
    supabase.table("duty_logs").delete().eq("id", log_id).execute()
    return {"message": "Запис видалено"}

@router.delete("/reset")
def reset_all_points():
    supabase.table("duty_logs").delete().neq("id", 0).execute()
    return {"message": "Усі поінти успішно скинуто!"}