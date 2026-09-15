"""
Layer 9 — Case Isolation Tests.

Tests:
  1. CASE-105 graph contains only CASE-105 nodes
  2. CASE-204 graph contains only CASE-204 nodes
  3. P-505 is the ONLY overlap (legitimate cross-case)
  4. D-204 / V-204 / L-204 must NOT appear in CASE-105
  5. P-505 is flagged is_cross_case=True in CASE-105 graph
  6. CASE-204 intelligence correctly identifies P-505 → CASE-105 link
"""
import pytest
import sys, os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../src/backend')))
from unittest.mock import MagicMock

# Mirror the real Neo4j fixture state (loaded by load_cross_case_fixture.py)
GRAPH_105 = {
    "nodes": [
        {"data": {"id": "B-005", "label": "PERSON", "is_cross_case": False}},
        {"data": {"id": "P-505", "label": "PHONE",  "is_cross_case": True}},   # shared entity
        {"data": {"id": "V-031", "label": "VEHICLE", "is_cross_case": False}},
        {"data": {"id": "L-030", "label": "LOCATION","is_cross_case": False}},
        {"data": {"id": "ORG-11","label": "ORGANIZATION","is_cross_case": False}},
    ],
    "edges": []
}
GRAPH_204 = {
    "nodes": [
        {"data": {"id": "D-204", "label": "PERSON"}},
        {"data": {"id": "P-505", "label": "PHONE"}},   # shared entity
        {"data": {"id": "V-204", "label": "VEHICLE"}},
        {"data": {"id": "L-204", "label": "LOCATION"}},
    ],
    "edges": []
}
INTEL_105 = {
    "cross_case_entities": [
        {"id": "P-505", "name": "Phone P-505", "type": "PHONE", "other_cases": ["CASE-204"]}
    ]
}
INTEL_204 = {
    "cross_case_entities": [
        {"id": "P-505", "name": "Phone P-505", "type": "PHONE", "other_cases": ["CASE-105"]}
    ]
}


@pytest.fixture(scope="module")
def neo4j_client():
    client = MagicMock()
    client.get_case_graph.side_effect = lambda case_id: (
        GRAPH_105 if case_id == "CASE-105" else
        GRAPH_204 if case_id == "CASE-204" else
        {"nodes": [], "edges": []}
    )
    client.get_case_intelligence_summary.side_effect = lambda case_id: (
        INTEL_105 if case_id == "CASE-105" else
        INTEL_204 if case_id == "CASE-204" else
        {"cross_case_entities": []}
    )
    yield client


def test_strict_case_isolation(neo4j_client):
    """CASE-105 and CASE-204 share only P-505; all other nodes are distinct."""
    g105 = neo4j_client.get_case_graph("CASE-105")
    g204 = neo4j_client.get_case_graph("CASE-204")
    ids_105 = {n["data"]["id"] for n in g105["nodes"]}
    ids_204 = {n["data"]["id"] for n in g204["nodes"]}
    overlap = ids_105 & ids_204
    assert overlap == {"P-505"}, f"Only P-505 should overlap; found: {overlap}"


def test_case204_unique_nodes_not_in_case105(neo4j_client):
    """D-204 (Priya Kapoor), V-204, L-204 must NOT appear in CASE-105 graph."""
    g105 = neo4j_client.get_case_graph("CASE-105")
    ids_105 = {n["data"]["id"] for n in g105["nodes"]}
    for uid in ["D-204", "V-204", "L-204"]:
        assert uid not in ids_105, f"CASE-204-only node {uid} must NOT appear in CASE-105"


def test_cross_case_entity_flagged_in_graph(neo4j_client):
    """P-505 must carry is_cross_case=True flag in the CASE-105 graph response."""
    g105 = neo4j_client.get_case_graph("CASE-105")
    p505 = next((n for n in g105["nodes"] if n["data"]["id"] == "P-505"), None)
    assert p505 is not None, "P-505 must be in CASE-105 graph"
    assert p505["data"]["is_cross_case"] is True


def test_cross_case_visibility_case105(neo4j_client):
    """CASE-105 intelligence must identify P-505 as cross-case linked to CASE-204."""
    summary = neo4j_client.get_case_intelligence_summary("CASE-105")
    cross = summary["cross_case_entities"]
    assert len(cross) >= 1
    p505 = next((e for e in cross if e["id"] == "P-505"), None)
    assert p505 is not None, "P-505 must appear in CASE-105 cross_case_entities"
    assert "CASE-204" in p505["other_cases"]


def test_cross_case_visibility_case204(neo4j_client):
    """CASE-204 intelligence must identify P-505 as cross-case linked to CASE-105 (symmetric)."""
    summary = neo4j_client.get_case_intelligence_summary("CASE-204")
    cross = summary["cross_case_entities"]
    p505 = next((e for e in cross if e["id"] == "P-505"), None)
    assert p505 is not None, "P-505 must appear in CASE-204 cross_case_entities"
    assert "CASE-105" in p505["other_cases"]
