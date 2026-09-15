from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from enum import Enum

class EntityType(str, Enum):
    PERSON = "PERSON"
    PHONE = "PHONE"
    VEHICLE = "VEHICLE"
    LOCATION = "LOCATION"
    CASE = "CASE"
    ORGANIZATION = "ORGANIZATION"
    ACCOUNT = "ACCOUNT"

class Entity(BaseModel):
    id: str
    type: EntityType
    name: Optional[str] = None
    properties: Dict[str, Any] = {}
    source_record_id: Optional[str] = None
    confidence: float = 1.0

class Person(Entity):
    type: EntityType = EntityType.PERSON

class Phone(Entity):
    type: EntityType = EntityType.PHONE

class Vehicle(Entity):
    type: EntityType = EntityType.VEHICLE

class Location(Entity):
    type: EntityType = EntityType.LOCATION

class Case(Entity):
    type: EntityType = EntityType.CASE
    date: Optional[str] = None
    description: Optional[str] = None

class Organization(Entity):
    type: EntityType = EntityType.ORGANIZATION
