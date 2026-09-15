# SAMPLE DATA

This dataset is synthetic.

It exists only to demonstrate:

- cross-case connections
- repeated vehicle
- repeated location
- temporal proximity
- alias-like entity resolution
- false similarity

No real person or sensitive record should be used in the MVP.

Expected notable relationships:

- A-001 and C-006 should be strong candidates for the same person because they share P-101, V-014 and L-003 and have similar names.
- A-001 and B-002 share V-014 across nearby dates.
- B-002 and C-003 share L-005 across nearby dates.
- A-004 should not be merged with A-001 merely because of the name similarity.
