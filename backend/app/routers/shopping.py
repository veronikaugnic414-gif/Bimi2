from fastapi import APIRouter, HTTPException
from app.database import supabase
from pydantic import BaseModel

class ShoppingItemCreate(BaseModel):
    item_name: str
    amount: str | None = "1 шт"

router = APIRouter(prefix="/shopping", tags=["Shopping List"])

@router.get("/")
def get_shopping_list():
    res = supabase.table("shopping_list").select("*").order("id").execute()
    return res.data or []

@router.post("/")
def add_shopping_item(item: ShoppingItemCreate):
    res = supabase.table("shopping_list").insert({"item_name": item.item_name, "amount": item.amount, "is_crossed_out": False}).execute()
    return {"message": "Товар додано до списку", "data": res.data}

@router.patch("/{item_id}/toggle")
def toggle_shopping_item(item_id: int):
    curr = supabase.table("shopping_list").select("is_crossed_out").eq("id", item_id).execute()
    if not curr.data:
        raise HTTPException(status_code=404, detail="Товар не знайдено")
    
    new_status = not curr.data[0]["is_crossed_out"]
    supabase.table("shopping_list").update({"is_crossed_out": new_status}).eq("id", item_id).execute()
    return {"message": "Статус оновлено", "is_crossed_out": new_status}

@router.delete("/{item_id}")
def delete_shopping_item(item_id: int):
    supabase.table("shopping_list").delete().eq("id", item_id).execute()
    return {"message": "Товар видалено зі списку"}