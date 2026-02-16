import requests
import json

# Query Supabase to verify Gmail connection was stored
supabase_url = "https://grwmwvaksqjxpyzoavui.supabase.co"
headers = {
    "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdyd213dmFrc3FqeHB5em9hdnVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2NDk4NzksImV4cCI6MjA4NjIyNTg3OX0.Q-epipU5R7faKrMeRKQ3Ch4JyFB6xCGQQKc2G_tISxw"
}

r = requests.get(
    f"{supabase_url}/rest/v1/gmail_connections?select=id,email_address,user_id,is_active,created_at",
    headers=headers
)

print("Status:", r.status_code)
if r.status_code == 200:
    connections = r.json()
    print(f"\n✅ Found {len(connections)} Gmail connection(s):\n")
    for conn in connections:
        print(f"  Email: {conn['email_address']}")
        print(f"  User ID: {conn['user_id']}")
        print(f"  Active: {conn['is_active']}")
        print(f"  Created: {conn['created_at']}")
        print()
else:
    print("Error:", r.text)
