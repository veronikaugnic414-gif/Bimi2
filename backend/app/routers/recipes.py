import re
from collections import defaultdict
from fastapi import APIRouter, HTTPException
from app.database import supabase
from app.schemas.models import RecipeCreate
import random

router = APIRouter(prefix="/recipes", tags=["Recipes"])

# Словник синонімів та варіацій назв продуктів
SYNONYMS = {
    # Птиця та м'ясо
    "філе": "куряче філе",
    "філе куряче": "куряче філе",
    "курка": "куряче філе",
    "куряча грудка": "куряче філе",
    "грудка куряча": "куряче філе",
    "куряче стегно": "курячі стегна",
    "стегна курячі": "курячі стегна",
    "філе індички": "індиче філе",
    "індичка": "індиче філе",
    "свинячий фарш": "фарш свинячий",
    "яловичий фарш": "фарш яловичий",
    "курячий фарш": "фарш курячий",
    "фарш асорті": "фарш",
    "м'ясний фарш": "фарш",

    # Молочні продукти та яйця
    "яйце": "яйця",
    "курячі яйця": "яйця",
    "куряче яйце": "яйця",
    "вершки 10%": "вершки",
    "вершки 15%": "вершки",
    "вершки 20%": "вершки",
    "вершки 33%": "вершки",
    "сир твердий": "твердий сир",
    "сир голландський": "твердий сир",
    "сир російський": "твердий сир",
    "сир кисломолочний": "кисломолочний сир",
    "творог": "кисломолочний сир",
    "сир творожний": "крем-сир",
    "творожний сир": "крем-сир",
    "вершковий сир": "крем-сир",
    "масло": "вершкове масло",
    "масло вершкове": "вершкове масло",

    # Овочі, зелень та гриби
    "цибуля ріпчаста": "цибуля",
    "ріпчаста цибуля": "цибуля",
    "цибулина": "цибуля",
    "зелена цибуля": "цибуля зелена",
    "печериці свіжі": "печериці",
    "гриби": "печериці",
    "гриби печериці": "печериці",
    "шампіньйони": "печериці",
    "томати": "помідори",
    "томат": "помідори",
    "помідор": "помідори",
    "помідори чері": "чері",
    "томати чері": "чері",
    "болгарський перець": "солодкий перець",
    "перець болгарський": "солодкий перець",
    "перець солодкий": "солодкий перець",
    "картоплина": "картопля",
    "морквина": "морква",
    "зубчик часнику": "часник",
    "зубчики часнику": "часник",
    "часничок": "часник",

    # Бакалія, олії та спеції
    "олія": "рослинна олія",
    "соняшникова олія": "рослинна олія",
    "олія соняшникова": "рослинна олія",
    "оливкова олія": "оливкова олія",
    "олія оливкова": "оливкова олія",
    "цукор білий": "цукор",
    "цукор-пісок": "цукор",
    "сіль кухонна": "сіль",
    "сіль кам'яна": "сіль",
    "чорний перець": "перець чорний мелений",
    "перець чорний": "перець чорний мелений",
    "чорний мелений перець": "перець чорний мелений",
    "пшеничне борошно": "борошно",
    "борошно пшеничне": "борошно",
    "спагеті": "макарони",
    "паста": "макарони",
    "макаронні вироби": "макарони",

    # Соуси та заправки
    "соєвий соус": "соєвий соус",
    "соус соєвий": "соєвий соус",
    "томатна паста": "томатна паста",
    "паста томатна": "томатна паста",
}

def normalize_ingredient_name(raw_name: str) -> str:
    cleaned = re.sub(r'\s+', ' ', str(raw_name or "")).strip().lower()
    return SYNONYMS.get(cleaned, cleaned)

def parse_amount(raw_str: str):
    cleaned = str(raw_str or "").strip().replace(',', '.')
    match = re.match(r"^([\d\.\/]+)?\s*(.*)$", cleaned)
    if not match:
        return 1.0, "шт"
    
    qty_part, unit_part = match.groups()
    unit = (unit_part or "").strip() or "шт"
    
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
    try:
        menu_res = supabase.table("weekly_menu").select("recipe_id").execute()
        
        recipe_ids = []
        for m in (menu_res.data or []):
            r_id = m.get("recipe_id")
            if r_id is not None and str(r_id).strip() != "" and str(r_id).isdigit():
                recipe_ids.append(int(r_id))
        
        if not recipe_ids:
            return {"status": "warning", "message": "Оберіть хоча б одну страву в меню!"}

        recipe_counts = defaultdict(int)
        for r_id in recipe_ids:
            recipe_counts[r_id] += 1

        # 1. Зчитування запасів холодильника із застосуванням синонімів
        fridge_res = supabase.table("fridge_items").select("*").execute()
        fridge_stock = defaultdict(float)

        for f in (fridge_res.data or []):
            raw_name = f.get("item_name", "")
            f_norm = normalize_ingredient_name(raw_name)
            if not f_norm:
                continue
            raw_val = f.get("amount") or f.get("quantity") or "1 шт"
            qty, unit = parse_amount(raw_val)
            fridge_stock[(f_norm, unit)] += qty

        # 2. Зчитування вже наявних покупок із застосуванням синонімів
        shop_res = supabase.table("shopping_list").select("*").eq("is_crossed_out", False).execute()
        existing_shop = defaultdict(float)
        for s in (shop_res.data or []):
            raw_name = s.get("item_name", "")
            s_norm = normalize_ingredient_name(raw_name)
            raw_val = s.get("amount") or s.get("quantity") or "1 шт"
            qty, unit = parse_amount(raw_val)
            existing_shop[(s_norm, unit)] += qty

        # 3. Зчитування інгредієнтів рецептів
        unique_ids = list(recipe_counts.keys())
        recipes_res = supabase.table("recipes").select("id, ingredients").in_("id", unique_ids).execute()
        
        required_ingredients = defaultdict(float)
        display_names = {}

        for r in (recipes_res.data or []):
            r_id = r.get("id")
            multiplier = recipe_counts.get(r_id, 1)
            ingredients = r.get("ingredients") or []

            if not isinstance(ingredients, list):
                continue

            for ing in ingredients:
                if isinstance(ing, dict):
                    ing_name = ing.get("name", "")
                    raw_amount = ing.get("amount", "1 шт")
                else:
                    ing_name = str(ing)
                    raw_amount = "1 шт"
                
                norm_name = normalize_ingredient_name(ing_name)
                if not norm_name:
                    continue

                if norm_name not in display_names:
                    display_names[norm_name] = norm_name.capitalize()

                qty, unit = parse_amount(raw_amount)
                required_ingredients[(norm_name, unit)] += (qty * multiplier)

        # 4. Формування кінцевого списку з урахуванням дефіциту
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

        supabase.table("shopping_list").insert(items_to_insert).execute()

        return {"status": "success", "message": f"До списку покупок додано {len(items_to_insert)} позицій!"}

    except Exception as e:
        print("Помилка генерації покупок:", e)
        raise HTTPException(status_code=500, detail=str(e))