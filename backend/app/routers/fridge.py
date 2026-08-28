from fastapi import APIRouter, HTTPException
from app.database import supabase
from app.schemas.models import FridgeItemCreate

router = APIRouter(prefix="/fridge", tags=["Fridge"])

@router.get("/")
def get_fridge_items():
    res = supabase.table("fridge_items").select("*").execute()
    return res.data or []

@router.post("/")
def add_fridge_item(item: FridgeItemCreate):
    res = supabase.table("fridge_items").insert(item.model_dump()).execute()
    if not res.data:
        raise HTTPException(status_code=400, detail="Не вдалося додати продукт")
    return {"message": "Продукт додано в холодильник", "data": res.data}

@router.delete("/{item_id}")
def delete_fridge_item(item_id: int):
    res = supabase.table("fridge_items").delete().eq("id", item_id).execute()
    return {"message": "Продукт видалено з холодильника"}