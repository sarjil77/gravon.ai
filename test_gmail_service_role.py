import requests

supabase_url = "https://grwmwvaksqjxpyzoavui.supabase.co"
# Use service role key which bypasses RLS
headers = {
    "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdyd213dmFrc3FqeHB5em9hdnVpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDY0OTg3OSwiZXhwIjoyMDg2MjI1ODc5fQ.OSuqFxxOYj4YxLRmNi-qROZGT4QWkBbXaMMakmni0Ew",
    "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdyd213dmFrc3FqeHB5em9hdnVpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDY0OTg3OSwiZXhwIjoyMDg2MjI1ODc5fQ.OSuqFxxOYj4YxLRmNi-qROZGT4QWkBbXaMMakmni0Ew"
}

r = requests.get(
    f"{supabase_url}/rest/v1/gmail_connections?select=id,email_address,user_id,is_active,created_at",
    headers=headers
)

print("Status:", r.status_code)
if r.status_code == 200:
    connections = r.json()
    print(f"\n✅ Found {len(connections)} Gmail connection(s) (via service role):\n")
    for conn in connections:
        print(f"  Email: {conn['email_address']}")
        print(f"  User ID: {conn['user_id']}")
        print(f"  Active: {conn['is_active']}")
        print(f"  Created: {conn['created_at']}")
        print()
else:
    print("Error:", r.text[:200])
