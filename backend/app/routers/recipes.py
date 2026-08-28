import re
from collections import defaultdict
from fastapi import APIRouter, HTTPException
from app.database import supabase
from app.schemas.models import RecipeCreate
import random

router = APIRouter(prefix="/recipes", tags=["Recipes"])

@router.get("")
@router.get("/")
def get_recipes():
    res = supabase.table("recipes").select("*").order("id", desc=True).execute()
    return res.data or []

@router.get("/random")
def get_random_recipe():
    res = supabase.table("recipes").select("*").execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Рецепти відсутні у базі")
    return random.choice(res.data)

@router.post("")
@router.post("/")
def create_recipe(recipe: RecipeCreate):
    res = supabase.table("recipes").insert(recipe.model_dump()).execute()
    return {"message": "Рецепт успішно створено", "data": res.data}

@router.delete("/{recipe_id}")
def delete_recipe(recipe_id: int):
    supabase.table("recipes").delete().eq("id", recipe_id).execute()
    return {"message": "Рецепт видалено"}

@router.post("/generate-shopping-list")
def generate_shopping_list():
    """Генерація покупок з урахуванням кількості повторень рецептів у меню"""
    menu_res = supabase.table("weekly_menu").select("recipe_id").execute()
    recipe_ids = [m["recipe_id"] for m in (menu_res.data or []) if m.get("recipe_id")]
    
    if not recipe_ids:
        return {"message": "Тижневе меню порожнє!"}

    # Підраховуємо, скільки разів кожен рецепт зустрічається в меню
    recipe_counts = defaultdict(int)
    for r_id in recipe_ids:
        recipe_counts[r_id] += 1

    # Продукти в холодильнику
    fridge_res = supabase.table("fridge_items").select("item_name").execute()
    fridge_names = {f["item_name"].lower().strip() for f in (fridge_res.data or [])}

    # Отримуємо рецепти
    recipes_res = supabase.table("recipes").select("id, ingredients").in_("id", list(recipe_counts.keys())).execute()
    
    # Словник для підсумовування: name -> {"total_qty": float, "unit": str}
    aggregated_ingredients = defaultdict(lambda: {"qty": 0.0, "unit": "шт"})

    for r in (recipes_res.data or []):
        r_id = r["id"]
        multiplier = recipe_counts[r_id]
        ingredients = r.get("ingredients") or []

        for ing in ingredients:
            ing_name = ing.get("name") if isinstance(ing, dict) else str(ing)
            raw_amount = ing.get("amount", "1 шт") if isinstance(ing, dict) else "1 шт"
            
            clean_name = ing_name.strip().capitalize()
            if clean_name.lower() in fridge_names:
                continue

            # Парсимо число і одиницю виміру (напр. "200 г" -> 200, "г")
            match = re.match(r"([\d\.]+)\s*(.*)", str(raw_amount).strip())
            if match:
                num = float(match.group(1)) * multiplier
                unit = match.group(2) or "шт"
            else:
                num = 1.0 * multiplier
                unit = "шт"

            aggregated_ingredients[clean_name]["qty"] += num
            aggregated_ingredients[clean_name]["unit"] = unit

    added_count = 0
    for name, data in aggregated_ingredients.items():
        qty_str = f"{int(data['qty']) if data['qty'].is_integer() else data['qty']} {data['unit']}"
        supabase.table("shopping_list").insert({
            "item_name": name,
            "amount": qty_str,
            "is_crossed_out": False
        }).execute()
        added_count += 1

    return {"message": f"Список покупок згенеровано! Додано/сумовано {added_count} продуктів."}