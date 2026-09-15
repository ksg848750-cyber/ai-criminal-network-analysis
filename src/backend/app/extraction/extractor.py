from typing import List, Dict, Tuple
import logging
from app.models.data import RawCrimeRecord
from app.models.entities import Person, Phone, Vehicle, Location, Case, Organization, Entity
from app.models.relationships import Relationship, RelationshipType

logger = logging.getLogger(__name__)

class Extractor:
    def __init__(self):
        # We will use structured extraction primarily since the fields are structured in the CSV
        pass

    def extract(self, raw_records: List[RawCrimeRecord]) -> Tuple[List[Entity], List[Relationship]]:
        entities = []
        relationships = []

        for record in raw_records:
            source_id = record.case_id
            
            # 1. Case Entity
            case_entity = Case(
                id=record.case_id,
                name=record.case_id,
                date=record.event_date,
                description=record.description,
                source_record_id=source_id
            )
            entities.append(case_entity)

            # 2. Person Entity
            person_entity = Person(
                id=record.person_id,
                name=record.person_name,
                source_record_id=source_id
            )
            entities.append(person_entity)
            
            # Relationship: Person -> INVOLVED_IN -> Case
            relationships.append(Relationship(
                source_entity_id=person_entity.id,
                target_entity_id=case_entity.id,
                type=RelationshipType.INVOLVED_IN,
                source_record_id=source_id,
                timestamp=record.event_date
            ))

            # 3. Phone Entity
            if record.phone:
                phone_entity = Phone(
                    id=record.phone,
                    name=record.phone,
                    source_record_id=source_id
                )
                entities.append(phone_entity)
                
                # Relationship: Person -> USES -> Phone
                relationships.append(Relationship(
                    source_entity_id=person_entity.id,
                    target_entity_id=phone_entity.id,
                    type=RelationshipType.USES,
                    source_record_id=source_id,
                    timestamp=record.event_date
                ))

            # 4. Vehicle Entity
            if record.vehicle:
                vehicle_entity = Vehicle(
                    id=record.vehicle,
                    name=record.vehicle,
                    source_record_id=source_id
                )
                entities.append(vehicle_entity)
                
                # Relationship: Person -> DRIVES -> Vehicle
                relationships.append(Relationship(
                    source_entity_id=person_entity.id,
                    target_entity_id=vehicle_entity.id,
                    type=RelationshipType.DRIVES,
                    source_record_id=source_id,
                    timestamp=record.event_date
                ))

            # 5. Location Entity
            if record.location_id:
                loc_entity = Location(
                    id=record.location_id,
                    name=record.location_name,
                    source_record_id=source_id
                )
                entities.append(loc_entity)
                
                # Relationship: Person -> VISITS -> Location
                relationships.append(Relationship(
                    source_entity_id=person_entity.id,
                    target_entity_id=loc_entity.id,
                    type=RelationshipType.VISITS,
                    source_record_id=source_id,
                    timestamp=record.event_date
                ))
            
            # 6. Organization Entity
            if record.organization:
                org_entity = Organization(
                    id=record.organization,
                    name=record.organization,
                    source_record_id=source_id
                )
                entities.append(org_entity)
                
                # Relationship: Person -> WORKS_FOR -> Organization
                relationships.append(Relationship(
                    source_entity_id=person_entity.id,
                    target_entity_id=org_entity.id,
                    type=RelationshipType.WORKS_FOR,
                    source_record_id=source_id,
                    timestamp=record.event_date
                ))

        logger.info(f"Extracted {len(entities)} entities and {len(relationships)} relationships.")
        return entities, relationships
