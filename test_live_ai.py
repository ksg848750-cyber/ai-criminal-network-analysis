import httpx, json

base = "http://localhost:8000"

with httpx.Client(timeout=30.0) as client:
    # Login
    r = client.post(f"{base}/login", data={"username": "admin", "password": "admin123"})
    token = r.json()["access_token"]
    H = {"Authorization": f"Bearer {token}"}
    
    print("=== LIVE AI PROVIDER TEST (Groq llama-3.3-70b-versatile) ===")
    r = client.post(
        f"{base}/cases/CASE-105/chat",
        headers=H,
        json={"message": "Who are the key entities in this case and why are they important?"},
        timeout=25.0
    )
    print("Chat status:", r.status_code)
    if r.status_code == 200:
        resp = r.json()
        print("response_text present:", "response_text" in resp)
        print("suggested_actions present:", "suggested_actions" in resp)
        print("response_text:", resp.get("response_text", "")[:400])
        print("suggested_actions:", resp.get("suggested_actions", []))
    else:
        print("ERROR:", r.text[:500])
