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
    
    # 1. Отримуємо некуплені продукти зі списку покупок
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
        raise HTTPException(status_code=500, detail="Telegram змінні середовища не налаштовані на сервері")

    url = f"https://api.telegram.org/bot{BOT_TOKEN}/sendMessage"
    payload = {
        "chat_id": CHAT_ID,
        "text": message,
        "parse_mode": "HTML"
    }

    try:
        tg_res = requests.post(url, json=payload, timeout=5)
        
        # Якщо Telegram вимагає префікс -100 для супергруп
        if tg_res.status_code != 200 and not str(CHAT_ID).startswith("-100"):
            payload["chat_id"] = f"-100{str(CHAT_ID).lstrip('-')}"
            tg_res = requests.post(url, json=payload, timeout=5)

        if tg_res.status_code != 200:
            err_details = tg_res.json()
            print("Telegram API Error:", err_details)
            raise HTTPException(status_code=400, detail=err_details.get("description", "Помилка Telegram API"))

        return {"status": "ok", "message": "Сповіщення надіслано в Telegram"}
    except Exception as err:
        print("Network error Telegram:", err)
        raise HTTPException(status_code=500, detail=str(err))