import pandas as pd
from typing import List, Dict, Any, Tuple
import os

def validate_csv(filepath: str) -> Tuple[bool, List[str]]:
    """
    Validates a CSV file for the ingestion pipeline.
    Returns (is_valid, errors)
    """
    errors = []
    
    if not os.path.exists(filepath):
        return False, ["File not found."]
        
    try:
        df = pd.read_csv(filepath)
    except Exception as e:
        return False, [f"Failed to parse CSV: {str(e)}"]

    if df.empty:
        return False, ["File is empty."]

    required_columns = ["case_id", "person_id", "person_name", "event_date"]
    missing_cols = [c for c in required_columns if c not in df.columns]
    if missing_cols:
        errors.append(f"Missing required columns: {', '.join(missing_cols)}")
        return False, errors
        
    # Check for empty critical fields
    for index, row in df.iterrows():
        row_num = index + 2  # 1-indexed plus header
        if pd.isna(row.get('case_id')) or str(row.get('case_id')).strip() == "":
            errors.append(f"Row {row_num}: Missing 'case_id'")
        if pd.isna(row.get('person_id')) or str(row.get('person_id')).strip() == "":
            errors.append(f"Row {row_num}: Missing 'person_id'")
        if pd.isna(row.get('person_name')) or str(row.get('person_name')).strip() == "":
            errors.append(f"Row {row_num}: Missing 'person_name'")
            
    # Check for duplicates within file
    duplicates = df[df.duplicated(subset=['case_id', 'person_id'], keep=False)]
    if not duplicates.empty:
        dup_rows = duplicates.index + 2
        errors.append(f"Duplicate records found within file at rows: {list(dup_rows)}")

    # In MVP we assume if there are no errors so far, it is valid
    if errors:
        return False, errors
        
    return True, []
