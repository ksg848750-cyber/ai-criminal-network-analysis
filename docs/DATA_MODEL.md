# DATA MODEL

## Canonical entity model

### Person

```text
person_id
name
normalized_name
aliases[]
confidence
source_records[]
```

### Case

```text
case_id
case_type
date
location_id
description
source_record_id
```

### Vehicle

```text
vehicle_id
registration
normalized_registration
confidence
```

### Phone

```text
phone_id
number_hash_or_synthetic_id
confidence
```

### Location

```text
location_id
name
latitude
longitude
```

## Relationship

```text
relationship_id
source_entity_id
target_entity_id
relationship_type
timestamp
confidence
source_record_id
```

## Lead

```text
lead_id
entity_a
entity_b
score
reasons[]
supporting_records[]
graph_paths[]
created_at
status
```

Allowed initial status:

```text
NEW
VERIFIED
REJECTED
```

## Review

```text
review_id
lead_id
decision
comment
reviewer
timestamp
```

## Provenance

Every extracted relationship should be traceable to the source record that produced it.

Do not create opaque relationships with no provenance.
