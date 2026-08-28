from supabase import create_client, Client
from app.config import settings

settings.validate()

supabase: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)