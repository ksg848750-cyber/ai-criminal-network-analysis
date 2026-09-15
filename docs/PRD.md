# PRODUCT REQUIREMENTS DOCUMENT

## Product

AI-Powered Criminal Network Analysis System — MVP

## User

Primary user:
- police investigator
- crime branch investigator
- intelligence analyst

The MVP is a prototype for investigative decision support.

## Problem

Crime/intelligence information is distributed across records and sources. Important relationships may only become visible when information from multiple records is connected.

Manual cross-referencing is time-consuming and difficult to scale.

## Product goal

Convert fragmented records into a connected representation and surface potentially meaningful relationships with supporting evidence.

## Core user story

> As an investigator, I want to search and visualize connected entities across crime records so that I can quickly identify potential relationships worth investigating and inspect the evidence behind each lead.

## Functional requirements

### FR-01 Data ingestion
Load synthetic CSV/JSON records.

### FR-02 Data normalization
Normalize names, IDs, dates, locations and categorical values.

### FR-03 Entity extraction
Identify supported entities.

### FR-04 Relationship extraction
Create relationships from structured fields and/or text.

### FR-05 Entity resolution
Detect probable duplicate/same entities across records.

### FR-06 Knowledge Graph
Store entities and relationships in Neo4j.

### FR-07 Graph analysis
Find central nodes, communities, paths and candidate relationships.

### FR-08 Temporal analysis
Use timestamps to identify relationships/events that occur within meaningful time windows.

### FR-09 Explainable lead generation
For each lead provide score, reasons and source records.

### FR-10 Dashboard
Provide graph, cases, entities, leads, evidence and timeline.

### FR-11 Investigator review
Allow Verify / Reject and record review status.

### FR-12 Evidence integrity
Generate SHA-256 hashes for evidence bundles/findings and keep an audit trail.

## Non-functional requirements

- understandable code
- reproducible local setup
- no real sensitive data
- graceful errors
- clear provenance
- confidence/uncertainty retained
- basic automated tests
- demo-ready UI

## MVP success criteria

A complete demo can move from input records to a visible lead and investigator verification without manual database editing.

## Out of scope

See `PROJECT_CONTEXT.md`.

## Product language

Use:
- potential connection
- candidate relationship
- investigative lead
- analytical score
- supporting evidence
- requires verification

Avoid:
- confirmed criminal
- guilty
- criminal prediction
- automatic accusation
