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

@router.put("/{recipe_id}")
def update_recipe(recipe_id: int, recipe: RecipeCreate):
    """Оновлення існуючого рецепта"""
    update_data = recipe.model_dump()
    res = supabase.table("recipes").update(update_data).eq("id", recipe_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Рецепт не знайдено для оновлення")
    return {"message": "Рецепт успішно оновлено", "data": res.data}

@router.delete("/{recipe_id}")
def delete_recipe(recipe_id: int):
    supabase.table("recipes").delete().eq("id", recipe_id).execute()
    return {"message": "Рецепт видалено"}

@router.post("/generate-shopping-list")
def generate_shopping_list():
    """Генерація покупок з урахуванням кількості повторень рецептів та холодильника"""
    menu_res = supabase.table("weekly_menu").select("recipe_id").execute()
    recipe_ids = [m["recipe_id"] for m in (menu_res.data or []) if m.get("recipe_id")]
    
    if not recipe_ids:
        return {"message": "Тижневе меню порожнє!"}

    # Підраховуємо, скільки разів кожен рецепт зустрічається в меню
    recipe_counts = defaultdict(int)
    for r_id in recipe_ids:
        recipe_counts[r_id] += 1

    # Продукти в холодильнику: нормалізуємо (маленькі літери, без зайвих пробілів)
    fridge_res = supabase.table("fridge_items").select("item_name, amount").execute()
    fridge_names = {re.sub(r'\s+', ' ', f["item_name"]).strip().lower() for f in (fridge_res.data or [])}

    # Отримуємо рецепти з меню
    recipes_res = supabase.table("recipes").select("id, ingredients").in_("id", list(recipe_counts.keys())).execute()
    
    # Словник для підсумовування: (normalized_name, unit) -> float
    aggregated_ingredients = defaultdict(float)
    display_names = {}

    for r in (recipes_res.data or []):
        r_id = r["id"]
        multiplier = recipe_counts[r_id]
        ingredients = r.get("ingredients") or []

        for ing in ingredients:
            ing_name = ing.get("name") if isinstance(ing, dict) else str(ing)
            raw_amount = ing.get("amount", "1 шт") if isinstance(ing, dict) else "1 шт"
            
            # Очищуємо та нормалізуємо назву
            norm_name = re.sub(r'\s+', ' ', str(ing_name)).strip().lower()
            if not norm_name:
                continue

            # Якщо продукт уже є в холодильнику — пропускаємо
            if norm_name in fridge_names:
                continue

            # Красива назва для показу з великої літери
            if norm_name not in display_names:
                display_names[norm_name] = norm_name.capitalize()

            # Парсимо число і одиницю виміру (напр. "200 г", "1.5 ст. л.", "3")
            match = re.match(r"([\d\.,]+)\s*(.*)", str(raw_amount).strip())
            if match:
                try:
                    val_str = match.group(1).replace(',', '.')
                    num = float(val_str) * multiplier
                except ValueError:
                    num = 1.0 * multiplier
                unit = match.group(2).strip() or "шт"
            else:
                num = 1.0 * multiplier
                unit = "шт"

            aggregated_ingredients[(norm_name, unit)] += num

    added_count = 0
    for (norm_name, unit), total_qty in aggregated_ingredients.items():
        name = display_names.get(norm_name, norm_name.capitalize())
        qty_str = f"{int(total_qty) if total_qty.is_integer() else round(total_qty, 2)} {unit}"
        
        supabase.table("shopping_list").insert({
            "item_name": name,
            "amount": qty_str,
            "is_crossed_out": False
        }).execute()
        added_count += 1

    if added_count == 0:
        return {"message": "Усі інгредієнти вже є в холодильнику або рецепти не мають інгредієнтів!"}

    return {"message": f"Список покупок згенеровано! Додано/сумовано {added_count} продуктів."}