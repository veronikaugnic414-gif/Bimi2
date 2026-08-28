from pydantic import BaseModel, Field
from typing import List, Optional, Any

# --- Користувачі ---
class UserResponse(BaseModel):
    id: int
    name: str

# --- Фінанси ---
class ExpenseCreate(BaseModel):
    payer_id: int = Field(..., description="ID користувача (1 - Вероніка, 2 - Даша)")
    amount: float = Field(..., gt=0, description="Сума витрати в UAH")
    description: str = Field(..., min_length=1, description="Опис покупки")

# --- Календар & Прибирання ---
class EventCreate(BaseModel):
    title: str
    description: Optional[str] = None  # 👈 Додано поле опису/причини
    event_type: str  # 'duty', 'general_cleaning', 'trip_home', 'exam'
    assigned_user_id: Optional[int] = 1
    event_date: str  # YYYY-MM-DD
    color_code: Optional[str] = "#FFD166"

class SwapRequestCreate(BaseModel):
    requester_id: int
    target_user_id: int
    original_event_id: int
    proposed_event_id: int

# --- Покупки ---
class ShoppingItemCreate(BaseModel):
    item_name: str
    amount: Optional[str] = "1 шт"
    added_by: Optional[int] = None

# --- Холодильник ---
class FridgeItemCreate(BaseModel):
    item_name: str
    quantity: Optional[str] = None
    brought_from_khmelnytskyi: bool = False

# --- Інгредієнти (Універсальна модель) ---
class IngredientCreate(BaseModel):
    name: Optional[str] = None  # 👈 Підтримка обох варіантів назви
    ingredient_name: Optional[str] = None
    amount: Optional[str] = "1 шт"

    def model_post_init(self, __context: Any) -> None:
        # Автоматична синхронізація назв
        if not self.name and self.ingredient_name:
            self.name = self.ingredient_name
        elif not self.ingredient_name and self.name:
            self.ingredient_name = self.name

class IngredientResponse(IngredientCreate):
    id: Optional[int] = None
    recipe_id: Optional[int] = None

# --- Рецепти ---
class RecipeCreate(BaseModel):
    title: str
    instructions: Optional[str] = ""
    cooking_time: Optional[int] = 20
    photo_url: Optional[str] = ""
    ingredients: Optional[List[Any]] = []  # Гнучкий список для інгредієнтів

class RecipeUpdate(BaseModel):
    title: Optional[str] = None
    instructions: Optional[str] = None
    cooking_time: Optional[int] = None
    photo_url: Optional[str] = None
    ingredients: Optional[List[Any]] = None

class RecipeResponse(BaseModel):
    id: int
    title: str
    instructions: Optional[str] = ""
    cooking_time: Optional[int] = 20
    photo_url: Optional[str] = ""
    ingredients: Optional[List[Any]] = []

# --- Тижневе меню ---
class MenuCreate(BaseModel):
    day_of_week: str  # "Понеділок", "Вівторок" і т.д.
    meal_type: str    # "Сніданок", "Обід", "Вечеря"
    description: Optional[str] = None
    recipe_id: Optional[int] = None