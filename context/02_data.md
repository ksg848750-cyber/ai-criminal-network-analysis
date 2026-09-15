# PART 2 — DATA

Start with CSV.

Recommended fields:

```text
case_id
person_name
phone
vehicle
location_id
location_name
event_date
description
organization
```

Create enough rows to demonstrate:

- repeated vehicle
- repeated location
- alias/similar names
- unrelated similar names
- multiple cases
- temporal ordering

Keep IDs synthetic.

Do not include real PII.

The loader should produce normalized internal objects.
