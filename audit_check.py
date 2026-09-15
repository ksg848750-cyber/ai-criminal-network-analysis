import sys, os, json
sys.path.insert(0, 'src/backend')
from dotenv import load_dotenv
load_dotenv()

import httpx

base = "http://localhost:8000"
with httpx.Client(timeout=30.0) as client:
    r = client.post(f"{base}/login", data={"username": "admin", "password": "admin123"})
    token = r.json()["access_token"]
    H = {"Authorization": f"Bearer {token}"}

    # CASE-105 intelligence — should now show P-505 as cross-case
    r = client.get(f"{base}/cases/CASE-105/intelligence", headers=H)
    int105 = r.json()
    print("=== CASE-105 INTELLIGENCE ===")
    print(json.dumps(int105["summary"], indent=2))
    print("Patterns:", len(int105["patterns"]))
    for p in int105["patterns"]:
        print(f"  [{p['finding_type']}] {p.get('description','')} reason={p.get('reason','')}")

    # CASE-204 graph — should now have Priya Kapoor
    r = client.get(f"{base}/cases/CASE-204/graph", headers=H)
    g204 = r.json()
    nodes_204 = {n["data"]["id"]: n["data"]["label"] for n in g204["nodes"]}
    print("\n=== CASE-204 GRAPH ===")
    for nid, label in nodes_204.items():
        print(f"  {nid}: {label}")

    # CASE-104 intelligence — should now show P-505 as cross-case
    r = client.get(f"{base}/cases/CASE-204/intelligence", headers=H)
    int204 = r.json()
    print("\n=== CASE-204 INTELLIGENCE ===")
    print(json.dumps(int204["summary"], indent=2))

    # Isolation check
    r = client.get(f"{base}/cases/CASE-105/graph", headers=H)
    g105 = r.json()
    nodes_105 = {n["data"]["id"]: n["data"] for n in g105["nodes"]}
    print("\n=== CASE-105 NODES (check is_cross_case flag) ===")
    for nid, data in nodes_105.items():
        print(f"  {nid}: is_cross_case={data.get('is_cross_case', False)}")

    # Verify CASE-204 specific entity (D-204) is NOT in CASE-105 graph
    ids_105 = set(nodes_105.keys())
    ids_204 = set(nodes_204.keys())
    unique_to_204 = ids_204 - ids_105
    print(f"\n=== ISOLATION CHECK ===")
    print(f"Nodes unique to CASE-204 (should not be in CASE-105): {unique_to_204}")
    print(f"Overlap: {ids_105 & ids_204}  <- only P-505 should appear here as cross-case")
