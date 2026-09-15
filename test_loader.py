import sys
import os
sys.path.insert(0, os.path.abspath('src/backend'))
from app.ingestion.loader import load_and_normalize_records

records = load_and_normalize_records('data/sample/crime_records.csv')
for r in records:
    print(r.case_id, r.person_name, r.event_date)
print(f"Loaded {len(records)} records")
