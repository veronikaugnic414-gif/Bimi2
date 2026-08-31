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
    """Генерація покупок із точним відніманням наявної кількості в холодильнику"""
    menu_res = supabase.table("weekly_menu").select("recipe_id").execute()
    recipe_ids = [m["recipe_id"] for m in (menu_res.data or []) if m.get("recipe_id")]
    
    if not recipe_ids:
        return {"message": "Тижневе меню порожнє!"}

    # Підраховуємо кількість повторень кожного рецепта в меню
    recipe_counts = defaultdict(int)
    for r_id in recipe_ids:
        recipe_counts[r_id] += 1

    # 1. Зчитуємо запаси холодильника: (normalized_name, unit) -> total_available_qty
    fridge_res = supabase.table("fridge_items").select("item_name, amount").execute()
    fridge_stock = defaultdict(float)

    for f in (fridge_res.data or []):
        f_name = re.sub(r'\s+', ' ', str(f.get("item_name", ""))).strip().lower()
        if not f_name:
            continue
            
        f_amount = str(f.get("amount", "1 шт")).strip()
        match = re.match(r"([\d\.,]+)\s*(.*)", f_amount)
        if match:
            try:
                val = float(match.group(1).replace(',', '.'))
            except ValueError:
                val = 1.0
            unit = match.group(2).strip() or "шт"
        else:
            val = 1.0
            unit = "шт"
            
        fridge_stock[(f_name, unit)] += val

    # 2. Зчитуємо рецепти з меню та сумуємо потрібні інгредієнти
    recipes_res = supabase.table("recipes").select("id, ingredients").in_("id", list(recipe_counts.keys())).execute()
    required_ingredients = defaultdict(float)
    display_names = {}

    for r in (recipes_res.data or []):
        r_id = r["id"]
        multiplier = recipe_counts[r_id]
        ingredients = r.get("ingredients") or []

        for ing in ingredients:
            ing_name = ing.get("name") if isinstance(ing, dict) else str(ing)
            raw_amount = ing.get("amount", "1 шт") if isinstance(ing, dict) else "1 шт"
            
            norm_name = re.sub(r'\s+', ' ', str(ing_name)).strip().lower()
            if not norm_name:
                continue

            if norm_name not in display_names:
                display_names[norm_name] = str(ing_name).strip().capitalize()

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

            required_ingredients[(norm_name, unit)] += num

    # 3. Вираховуємо дефіцит: Потрібно мінус Наявне в холодильнику
    added_count = 0
    for (norm_name, unit), total_required in required_ingredients.items():
        available = fridge_stock.get((norm_name, unit), 0.0)
        needed = total_required - available

        if needed > 0:
            name = display_names.get(norm_name, norm_name.capitalize())
            qty_str = f"{int(needed) if needed.is_integer() else round(needed, 2)} {unit}"
            
            supabase.table("shopping_list").insert({
                "item_name": name,
                "amount": qty_str,
                "is_crossed_out": False
            }).execute()
            added_count += 1

    if added_count == 0:
        return {"message": "Усі інгредієнти є в холодильнику у достатній кількості!"}

    return {"message": f"Список покупок згенеровано! Додано {added_count} позицій з урахуванням запасів."}