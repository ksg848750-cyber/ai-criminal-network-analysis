import pandas as pd
from typing import List, Dict, Any
import logging
from app.models.data import RawCrimeRecord

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def normalize_string(val: Any) -> str:
    """Normalizes string fields."""
    if pd.isna(val) or val is None:
        return ""
    return str(val).strip()

def normalize_date(val: Any) -> str:
    """Normalizes date fields to ISO string."""
    if pd.isna(val) or val is None:
        return ""
    try:
        return pd.to_datetime(val).isoformat()
    except Exception:
        return str(val).strip()

def load_and_normalize_records(filepath: str) -> List[RawCrimeRecord]:
    """
    Loads crime records from a CSV file, normalizes the fields,
    and returns a list of RawCrimeRecord objects.
    """
    logger.info(f"Loading data from {filepath}")
    try:
        df = pd.read_csv(filepath)
    except Exception as e:
        logger.error(f"Failed to read CSV at {filepath}: {e}")
        return []

    records = []
    for index, row in df.iterrows():
        try:
            # Normalize fields
            case_id = normalize_string(row.get('case_id'))
            person_id = normalize_string(row.get('person_id'))
            person_name = normalize_string(row.get('person_name'))
            phone = normalize_string(row.get('phone'))
            vehicle = normalize_string(row.get('vehicle'))
            location_id = normalize_string(row.get('location_id'))
            location_name = normalize_string(row.get('location_name'))
            event_date = normalize_string(row.get('event_date'))
            description = normalize_string(row.get('description'))
            organization = normalize_string(row.get('organization'))

            # Basic validation
            if not case_id or not person_id or not person_name:
                logger.warning(f"Row {index} missing required fields (case_id, person_id, or person_name). Skipping.")
                continue

            record = RawCrimeRecord(
                case_id=case_id,
                person_id=person_id,
                person_name=person_name,
                phone=phone if phone else None,
                vehicle=vehicle if vehicle else None,
                location_id=location_id,
                location_name=location_name,
                event_date=event_date,
                description=description,
                organization=organization if organization else None
            )
            records.append(record)
        except Exception as e:
            logger.warning(f"Failed to process row {index}: {e}")
            continue

    logger.info(f"Successfully loaded and normalized {len(records)} records.")
    return records
