from fastapi import APIRouter, HTTPException
from app.database import supabase
from app.schemas.models import ExpenseCreate

router = APIRouter(prefix="/finance", tags=["Finance"])

@router.get("/summary")
def get_finance_summary():
    """Отримати всі витрати та готову статистику по кожній дівчині"""
    res = supabase.table("expenses").select("*").order("created_at", desc=True).execute()
    expenses = res.data or []
    
    veronika_spent = sum(float(e.get("amount", 0)) for e in expenses if int(e.get("payer_id", 0)) == 1)
    dasha_spent = sum(float(e.get("amount", 0)) for e in expenses if int(e.get("payer_id", 0)) == 2)
    total_spent = veronika_spent + dasha_spent

    return {
        "total_spent": total_spent,
        "veronika_spent": veronika_spent,
        "dasha_spent": dasha_spent,
        "remaining": max(0, 11000 - total_spent),
        "expenses": expenses
    }

@router.post("/expenses")
def add_expense(expense: ExpenseCreate):
    """Додати нову витрату в базу"""
    res = supabase.table("expenses").insert(expense.model_dump()).execute()
    return {"message": "Витрату успішно додано", "data": res.data}

@router.delete("/reset")
def reset_expenses():
    """Скинути всі витрати"""
    supabase.table("expenses").delete().neq("id", 0).execute()
    return {"message": "Фінанси успішно скинуто!"}