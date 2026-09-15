# ACCEPTANCE TESTS

## AT-01 Ingestion

Given the sample dataset, the system loads all records without manual database editing.

## AT-02 Extraction

The system identifies the expected people, cases, vehicles and locations.

## AT-03 Provenance

Each extracted relationship can be traced to a source record.

## AT-04 Resolution

The intentional alias/similar-name test is resolved according to the expected outcome.

## AT-05 Graph

The planted graph path exists in Neo4j.

## AT-06 Analysis

The system produces at least one candidate relationship from the planted scenario.

## AT-07 Explanation

The candidate includes readable reasons.

## AT-08 Evidence

The candidate links to supporting cases.

## AT-09 Timeline

The relevant dates are visible.

## AT-10 Verification

Clicking Verify changes lead status and creates an audit/review record.

## AT-11 Integrity

An evidence bundle produces a reproducible SHA-256 hash.

## AT-12 False positive control

The false-similarity example does not become a confirmed match merely because names are similar.

## AT-13 Fresh setup

A new developer can follow the README and run the application without undocumented manual database edits.
