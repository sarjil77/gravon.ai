from supabase import create_client, Client

from app.config import settings

# Public client — uses anon key, respects Row Level Security (RLS)
# Use this for user-facing operations (sign up, login, fetch own data)
supabase: Client = create_client(settings.supabase_url, settings.supabase_anon_key)

# Admin client — uses service_role key, bypasses RLS
# Use this ONLY for server-side operations (admin queries, webhooks, background jobs)
supabase_admin: Client = create_client(settings.supabase_url, settings.supabase_service_role_key)
