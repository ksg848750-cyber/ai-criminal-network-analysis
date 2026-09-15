from pydantic import BaseModel, Field
from typing import Optional

class RawCrimeRecord(BaseModel):
    """
    Represents a single row from the synthetic crime records dataset.
    """
    case_id: str
    person_id: str
    person_name: str
    phone: Optional[str] = None
    vehicle: Optional[str] = None
    location_id: str
    location_name: str
    event_date: str
    description: str
    organization: Optional[str] = None
