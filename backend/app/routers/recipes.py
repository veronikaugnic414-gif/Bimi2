import re
from collections import defaultdict
from fastapi import APIRouter, HTTPException
from app.database import supabase
from app.schemas.models import RecipeCreate
import random

router = APIRouter(prefix="/recipes", tags=["Recipes"])

def parse_amount(raw_str: str):
    """
    Парсить значення типу: '200 г', '200г', '1,5 кг', '2 ст. л.', '1/2 ч.л.'
    Повертає кортеж (кількість: float, одиниця: str)
    """
    cleaned = str(raw_str).strip().replace(',', '.')
    # Шукаємо числа (в т.ч. дроби на кшталт 1/2) та текст після них
    match = re.match(r"^([\d\.\/]+)?\s*(.*)$", cleaned)
    if not match:
        return 1.0, "шт"
    
    qty_part, unit_part = match.groups()
    unit = unit_part.strip() or "шт"
    
    # Нормалізація поширених скорочень одиниць
    unit_map = {
        "ст.л.": "ст. л.",
        "ч.л.": "ч. л.",
        "уп": "упаковка",
        "уп.": "упаковка"
    }
    unit = unit_map.get(unit, unit)

    if not qty_part:
        return 1.0, unit

    try:
        if '/' in qty_part:
            num, denom = qty_part.split('/', 1)
            qty = float(num) / float(denom)
        else:
            qty = float(qty_part)
    except (ValueError, ZeroDivisionError):
        qty = 1.0

    return qty, unit


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
    """Генерація покупок з оптимізованим парсингом, дедуплікацією та батч-інсертом"""
    menu_res = supabase.table("weekly_menu").select("recipe_id").execute()
    recipe_ids = [
        int(m["recipe_id"]) 
        for m in (menu_res.data or []) 
        if m.get("recipe_id") and str(m.get("recipe_id")).isdigit()
    ]
    
    if not recipe_ids:
        return {"status": "warning", "message": "Оберіть хоча б одну страву в меню!"}

    recipe_counts = defaultdict(int)
    for r_id in recipe_ids:
        recipe_counts[r_id] += 1

    # 1. Зчитуємо запаси холодильника
    fridge_res = supabase.table("fridge_items").select("item_name, amount").execute()
    fridge_stock = defaultdict(float)

    for f in (fridge_res.data or []):
        f_name = re.sub(r'\s+', ' ', str(f.get("item_name", ""))).strip().lower()
        if not f_name:
            continue
        qty, unit = parse_amount(f.get("amount", "1 шт"))
        fridge_stock[(f_name, unit)] += qty

    # 2. Зчитуємо вже наявні незакреслені позиції в покупках
    shop_res = supabase.table("shopping_list").select("item_name, amount, is_crossed_out").eq("is_crossed_out", False).execute()
    existing_shop = defaultdict(float)
    for s in (shop_res.data or []):
        s_name = re.sub(r'\s+', ' ', str(s.get("item_name", ""))).strip().lower()
        qty, unit = parse_amount(s.get("amount", "1 шт"))
        existing_shop[(s_name, unit)] += qty

    # 3. Зчитуємо інгредієнти рецептів із меню
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

            qty, unit = parse_amount(raw_amount)
            required_ingredients[(norm_name, unit)] += (qty * multiplier)

    # 4. Рахуємо дефіцит та формуємо список для одного батч-інсерту
    items_to_insert = []
    for (norm_name, unit), total_required in required_ingredients.items():
        available_fridge = fridge_stock.get((norm_name, unit), 0.0)
        already_in_shop = existing_shop.get((norm_name, unit), 0.0)
        
        needed = total_required - (available_fridge + already_in_shop)

        if needed > 0:
            name = display_names.get(norm_name, norm_name.capitalize())
            qty_str = f"{int(needed) if needed.is_integer() else round(needed, 2)} {unit}"
            items_to_insert.append({
                "item_name": name,
                "amount": qty_str,
                "is_crossed_out": False
            })

    if not items_to_insert:
        return {"status": "info", "message": "Усі необхідні інгредієнти вже є в холодильнику або в списку покупок!"}

    # Батч-інсерт за один запит
    supabase.table("shopping_list").insert(items_to_insert).execute()

    return {"status": "success", "message": f"До списку покупок додано {len(items_to_insert)} позицій!"}