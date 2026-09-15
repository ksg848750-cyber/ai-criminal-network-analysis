from typing import List, Dict, Set, Tuple
import logging
from app.models.entities import Entity, Person, EntityType
from app.models.relationships import Relationship

logger = logging.getLogger(__name__)

class Resolver:
    """
    Entity Resolution module.
    candidate generation -> normalized comparison -> multiple supporting signals -> confidence -> MATCH / SEPARATE
    """
    def __init__(self):
        pass

    def get_entity_context(self, entity_id: str, relationships: List[Relationship]) -> Dict[str, Set[str]]:
        """Extracts context (phones, vehicles, locations) for an entity to aid in matching."""
        context = {
            "phones": set(),
            "vehicles": set(),
            "locations": set(),
            "organizations": set()
        }
        for rel in relationships:
            if rel.source_entity_id == entity_id:
                # Based on our simple model, target_entity_id contains the ID directly 
                # (e.g. phone number, vehicle registration)
                if rel.type == "USES":
                    context["phones"].add(rel.target_entity_id)
                elif rel.type == "DRIVES":
                    context["vehicles"].add(rel.target_entity_id)
                elif rel.type == "VISITS":
                    context["locations"].add(rel.target_entity_id)
                elif rel.type == "WORKS_FOR":
                    context["organizations"].add(rel.target_entity_id)
        return context

    def resolve(self, entities: List[Entity], relationships: List[Relationship]) -> Tuple[List[Entity], List[Relationship]]:
        """
        Resolves duplicate entities. For MVP, we primarily focus on Person resolution.
        """
        logger.info("Starting entity resolution...")
        
        persons = [e for e in entities if e.type == EntityType.PERSON]
        other_entities = [e for e in entities if e.type != EntityType.PERSON]
        
        # Merge mapping: maps old entity_id to new canonical entity_id
        merge_map: Dict[str, str] = {}
        
        # Simple candidate generation: compare every person against every other person
        # In a real system, we'd use blocking (e.g. by first letter of name)
        resolved_persons = []
        skip_ids = set()

        for i, p1 in enumerate(persons):
            if p1.id in skip_ids:
                continue
                
            canonical_person = p1
            ctx1 = self.get_entity_context(p1.id, relationships)
            
            for j in range(i + 1, len(persons)):
                p2 = persons[j]
                if p2.id in skip_ids:
                    continue
                
                # Normalize names for comparison
                name1 = str(p1.name).lower().replace(".", "").replace(" ", "")
                name2 = str(p2.name).lower().replace(".", "").replace(" ", "")
                
                # Candidate matching: check if names are somewhat similar 
                # (e.g., one is a substring of the other or exact match)
                if name1 in name2 or name2 in name1:
                    # Normalized comparison and multiple supporting signals
                    ctx2 = self.get_entity_context(p2.id, relationships)
                    
                    shared_phones = ctx1["phones"].intersection(ctx2["phones"])
                    shared_vehicles = ctx1["vehicles"].intersection(ctx2["vehicles"])
                    shared_locations = ctx1["locations"].intersection(ctx2["locations"])
                    shared_orgs = ctx1["organizations"].intersection(ctx2["organizations"])
                    
                    total_shared_signals = len(shared_phones) + len(shared_vehicles) + len(shared_locations) + len(shared_orgs)
                    
                    # Do not automatically merge based on just one shared attribute.
                    # We want at least 2 shared context attributes to confidently merge.
                    if total_shared_signals >= 2:
                        logger.info(f"MATCH: Resolving {p1.name} ({p1.id}) and {p2.name} ({p2.id}) -> shared {total_shared_signals} signals")
                        merge_map[p2.id] = canonical_person.id
                        skip_ids.add(p2.id)
                    else:
                        logger.info(f"SEPARATE: {p1.name} and {p2.name} have similar names but insufficient shared context.")
                        
            resolved_persons.append(canonical_person)

        # Update relationships with merged entity IDs
        updated_relationships = []
        for rel in relationships:
            new_source = merge_map.get(rel.source_entity_id, rel.source_entity_id)
            new_target = merge_map.get(rel.target_entity_id, rel.target_entity_id)
            
            # Avoid self-loops
            if new_source != new_target:
                rel.source_entity_id = new_source
                rel.target_entity_id = new_target
                updated_relationships.append(rel)

        # Final entities list
        # Note: Entities that are just values (Phone, Vehicle) are naturally deduplicated in graph
        # by their IDs, but let's deduplicate them in the list as well based on ID to be clean.
        final_entities = []
        seen_ids = set()
        
        all_resolved = resolved_persons + other_entities
        for ent in all_resolved:
            # For non-person entities, just use their ID as canonical.
            canonical_id = merge_map.get(ent.id, ent.id)
            if canonical_id not in seen_ids:
                seen_ids.add(canonical_id)
                final_entities.append(ent)
                
        # Also remove duplicate relationships (same source, target, type)
        final_relationships = []
        seen_rels = set()
        for rel in updated_relationships:
            rel_key = (rel.source_entity_id, rel.target_entity_id, rel.type)
            if rel_key not in seen_rels:
                seen_rels.add(rel_key)
                final_relationships.append(rel)

        logger.info(f"Resolution complete. {len(final_entities)} unique entities, {len(final_relationships)} unique relationships.")
        return final_entities, final_relationships
