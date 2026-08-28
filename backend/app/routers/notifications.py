import os
import requests
from fastapi import APIRouter, HTTPException
from app.database import supabase

router = APIRouter(prefix="/notifications", tags=["Notifications"])

BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
CHAT_ID = os.getenv("TELEGRAM_CHAT_ID")

@router.post("/store-alert/{user_id}")
def notify_in_store(user_id: int):
    sender = "Вероніка" if user_id == 1 else "Даша"
    
    # 1. Отримуємо некуплені продукти зі списку
    unbought_items = []
    try:
        res = supabase.table("shopping_list").select("item_name, amount").eq("is_crossed_out", False).execute()
        unbought_items = res.data or []
    except Exception as e:
        print("Помилка завантаження списку покупок:", e)

    if unbought_items:
        items_list = "\n".join([f"  ▫️ <b>{i.get('item_name')}</b> ({i.get('amount') or '1 шт'})" for i in unbought_items])
    else:
        items_list = "  <i>(Список порожній, все куплено!)</i>"

    message = (
        f"🛒 <b>Увага! {sender} вже в магазині!</b>\n\n"
        f"📋 <b>Актуальний список покупок:</b>\n{items_list}\n\n"
        f"💬 <i>Якщо треба щось додати — пиши терміново сюди або додавай у додаток!</i>"
    )

    if not BOT_TOKEN or not CHAT_ID:
        raise HTTPException(status_code=500, detail="Telegram змінні середовища не налаштовані на Render")

    url = f"https://api.telegram.org/bot{BOT_TOKEN}/sendMessage"
    payload = {
        "chat_id": str(CHAT_ID).strip(),
        "text": message,
        "parse_mode": "HTML"
    }

    try:
        tg_res = requests.post(url, json=payload, timeout=10)
        res_data = tg_res.json()

        if not res_data.get("ok"):
            print("Telegram API Error:", res_data)
            raise HTTPException(status_code=400, detail=res_data.get("description", "Помилка Telegram API"))

        return {"status": "ok", "message": "Сповіщення успішно надіслано в Telegram"}
    except Exception as err:
        print("Network error Telegram:", err)
        raise HTTPException(status_code=500, detail=str(err))