import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
    SUPABASE_KEY: str = os.getenv("SUPABASE_KEY", "")

    def validate(self):
        if not self.SUPABASE_URL or not self.SUPABASE_KEY:
            raise ValueError("❌ Помилка: SUPABASE_URL або SUPABASE_KEY відсутні в .env файлі!")

settings = Settings()