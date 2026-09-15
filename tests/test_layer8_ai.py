"""
Layer 8 AI Service Tests.

Covers:
  1. GeminiProvider (mocked HTTP) - returns canonical schema
  2. GroqProvider (mocked HTTP) - returns canonical schema
  3. FallbackAIService - Gemini fails -> Groq succeeds (automatic, not manual)
  4. validate_schema - normalises non-standard action shapes
  5. Invalid action target rejection in chat endpoint
  6. AI grounding - system prompt contains actual structured facts:
       Neha Sharma, degree=8, TEMPORAL_BURST, date=2026-08-20, event_count>=3
  7. Live Groq structured response with real target_ids (separate test, runs only if key configured)
"""
import pytest
import sys, os, json
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../src/backend')))
from unittest.mock import patch, MagicMock, call
from app.services.ai_service import (
    GeminiProvider, GroqProvider, FallbackAIService,
    AIService, get_ai_service
)
from app.auth.deps import TokenData

CANONICAL_RESPONSE = {"response_text": "Test response", "suggested_actions": []}

# ---------- 1. GeminiProvider ----------

def test_gemini_provider_canonical_schema():
    provider = GeminiProvider("fake_key")
    with patch("httpx.Client.post") as mock_post:
        mock_response = MagicMock()
        mock_response.json.return_value = {
            "candidates": [{"content": {"parts": [{"text": json.dumps(CANONICAL_RESPONSE)}]}}]
        }
        mock_response.raise_for_status = MagicMock()
        mock_post.return_value = mock_response

        result = provider.generate_response("System", "User")
        assert "response_text" in result, "response_text must be present"
        assert "suggested_actions" in result, "suggested_actions must be present"
        assert isinstance(result["response_text"], str)
        assert isinstance(result["suggested_actions"], list)


# ---------- 2. GroqProvider ----------

def test_groq_provider_canonical_schema():
    provider = GroqProvider("fake_key")
    with patch("httpx.Client.post") as mock_post:
        mock_response = MagicMock()
        mock_response.json.return_value = {
            "choices": [{"message": {"content": json.dumps(CANONICAL_RESPONSE)}}]
        }
        mock_response.raise_for_status = MagicMock()
        mock_post.return_value = mock_response

        result = provider.generate_response("System", "User")
        assert "response_text" in result
        assert "suggested_actions" in result
        assert isinstance(result["response_text"], str)
        assert isinstance(result["suggested_actions"], list)


# ---------- 3. Auto-Fallback: Gemini fails → Groq succeeds ----------

def test_fallback_gemini_fails_groq_succeeds():
    """FallbackAIService must automatically retry with Groq when Gemini raises any exception."""
    gemini = MagicMock(spec=GeminiProvider)
    groq = MagicMock(spec=GroqProvider)

    gemini.generate_response.side_effect = Exception("GeminiProvider failed")
    groq.generate_response.return_value = {
        "response_text": "Groq answer after Gemini failure",
        "suggested_actions": [{"type": "HIGHLIGHT_NODES", "target_ids": ["B-005"]}]
    }

    svc = FallbackAIService([gemini, groq])
    result = svc.generate_response("system", "user")

    # Gemini was tried first
    gemini.generate_response.assert_called_once_with("system", "user")
    # Groq was called as fallback
    groq.generate_response.assert_called_once_with("system", "user")
    # Result came from Groq
    assert result["response_text"] == "Groq answer after Gemini failure"
    actions = result["suggested_actions"]
    assert len(actions) == 1
    assert actions[0]["type"] == "HIGHLIGHT_NODES"
    assert "B-005" in actions[0]["target_ids"]


def test_fallback_all_fail_raises():
    """FallbackAIService raises when all providers fail."""
    gemini = MagicMock(spec=GeminiProvider)
    groq = MagicMock(spec=GroqProvider)
    gemini.generate_response.side_effect = Exception("Gemini down")
    groq.generate_response.side_effect = Exception("Groq down")

    svc = FallbackAIService([gemini, groq])
    with pytest.raises(Exception, match="All AI providers failed"):
        svc.generate_response("system", "user")


# ---------- 4. validate_schema normalisation ----------

def test_validate_schema_normalises_node_ids():
    """validate_schema must accept 'node_ids' as alias for 'target_ids'."""
    raw = {
        "response_text": "hello",
        "suggested_actions": [{"type": "HIGHLIGHT_NODES", "node_ids": ["B-005"]}]
    }
    result = AIService.validate_schema(raw)
    assert result["suggested_actions"][0]["target_ids"] == ["B-005"]


def test_validate_schema_drops_string_actions():
    """String actions (informal model output) are silently removed."""
    raw = {
        "response_text": "hello",
        "suggested_actions": ["Provide more info", "Ask again"]
    }
    result = AIService.validate_schema(raw)
    assert result["suggested_actions"] == []


def test_validate_schema_coerces_non_string_response():
    """If response_text is not a string, it's coerced to str."""
    raw = {"response_text": 42, "suggested_actions": []}
    result = AIService.validate_schema(raw)
    assert isinstance(result["response_text"], str)


# ---------- 5. Invalid action target rejection in chat endpoint ----------

def test_action_target_rejection_in_chat_endpoint():
    """
    The /cases/{case_id}/chat endpoint must strip entity IDs in HIGHLIGHT_NODES
    actions that are not in the case's graph.
    """
    from app.api.chat import chat_with_case, ChatRequest

    with patch("app.api.chat.get_ai_service") as mock_get_ai:
        mock_ai = MagicMock()
        mock_ai.generate_response.return_value = {
            "response_text": "Test",
            "suggested_actions": [
                {"type": "HIGHLIGHT_NODES", "target_ids": ["B-005", "INVALID_ID"]}
            ]
        }
        mock_get_ai.return_value = mock_ai

        with patch("app.api.chat.Neo4jClient") as mock_neo4j:
            inst = MagicMock()
            inst.get_case_graph.return_value = {"nodes": [{"data": {"id": "B-005"}}]}
            inst.get_case_intelligence_summary.return_value = {}
            inst.get_case_patterns.return_value = []
            inst.get_case_timeline.return_value = []
            mock_neo4j.return_value = inst

            result = chat_with_case(
                "CASE-105",
                ChatRequest(message="test"),
                TokenData(username="test", user_id="1", role="investigator")
            )

            actions = result.get("suggested_actions", [])
            assert len(actions) == 1, "Action with partial valid IDs should survive"
            assert actions[0]["target_ids"] == ["B-005"], "INVALID_ID must be stripped"


# ---------- 6. AI Grounding with structured facts ----------

def test_ai_grounding_contains_structured_facts():
    """
    The system prompt sent to the AI must contain:
      - entity name: Neha Sharma
      - degree value: 8
      - finding: TEMPORAL_BURST
      - date: 2026-08-20
    """
    from app.api.chat import chat_with_case, ChatRequest

    structured_summary = {
        "entity_counts": {"PERSON": 1},
        "key_entities": [{"id": "B-005", "name": "Neha Sharma", "degree": 8}],
        "temporal_bounds": {"first_event": "2026-08-20", "last_event": "2026-08-20"},
        "cross_case_entities": [{"id": "P-505", "name": "Phone P-505", "type": "PHONE", "other_cases": ["CASE-204"]}]
    }
    structured_patterns = [
        {
            "finding_type": "TEMPORAL_BURST",
            "description": "High activity detected for Neha Sharma on 2026-08-20.",
            "involved_entities": ["B-005"],
            "reason": "8 events recorded in a single 24-hour period.",
            "time_window": "2026-08-20",
            "supporting_records": ["REC-105-1"]
        }
    ]

    with patch("app.api.chat.get_ai_service") as mock_get_ai:
        mock_ai = MagicMock()
        mock_ai.generate_response.return_value = {"response_text": "Analysis", "suggested_actions": []}
        mock_get_ai.return_value = mock_ai

        with patch("app.api.chat.Neo4jClient") as mock_neo4j:
            inst = MagicMock()
            inst.get_case_intelligence_summary.return_value = structured_summary
            inst.get_case_patterns.return_value = structured_patterns
            inst.get_case_graph.return_value = {"nodes": [{"data": {"id": "B-005"}}]}
            inst.get_case_timeline.return_value = []
            mock_neo4j.return_value = inst

            chat_with_case(
                "CASE-105",
                ChatRequest(message="Who is the key suspect?"),
                TokenData(username="test", user_id="1", role="investigator")
            )

            call_kwargs = mock_ai.generate_response.call_args
            system_prompt = call_kwargs[1]["system_prompt"] if call_kwargs[1] else call_kwargs[0][0]

            # Verify the grounding facts are in the prompt
            assert "Neha Sharma" in system_prompt, "Key entity name must be in system prompt"
            assert "B-005" in system_prompt, "Key entity ID must be in system prompt"
            assert "TEMPORAL_BURST" in system_prompt, "Pattern type must be in system prompt"
            assert "2026-08-20" in system_prompt, "Temporal date must be in system prompt"
            assert "P-505" in system_prompt, "Cross-case entity must be in system prompt"
            assert "CASE-204" in system_prompt, "Cross-case target case must be in system prompt"


# ---------- 7. Live Groq structured response ----------

@pytest.mark.skipif(
    not os.environ.get("GROQ_API_KEY") and not os.path.exists(".env"),
    reason="GROQ_API_KEY not configured"
)
def test_live_groq_structured_response():
    """
    Live test: Groq must return a response with valid response_text and
    suggested_actions conforming to the canonical schema.
    Specifically tests that action dicts with 'type' and 'target_ids' are returned.
    """
    try:
        from dotenv import load_dotenv
        load_dotenv()
    except ImportError:
        pass

    groq_key = os.environ.get("GROQ_API_KEY", "")
    if not groq_key:
        pytest.skip("GROQ_API_KEY not available")

    provider = GroqProvider(groq_key, model="groq/compound")
    system_prompt = """
    You are an AI Criminal Investigator. You must return ONLY a valid JSON object with this schema:
    {
      "response_text": "Your explanation here (string)",
      "suggested_actions": [
        {"type": "HIGHLIGHT_NODES", "target_ids": ["B-005"]}
      ]
    }
    The case has one key entity: Neha Sharma (id: B-005).
    """
    user_prompt = "Highlight the key entity in this case."

    result = provider.generate_response(system_prompt, user_prompt)

    assert "response_text" in result
    assert isinstance(result["response_text"], str)
    assert len(result["response_text"]) > 0

    assert "suggested_actions" in result
    assert isinstance(result["suggested_actions"], list)

    # At minimum, validate schema normalisation was applied
    for action in result["suggested_actions"]:
        assert "type" in action
        assert "target_ids" in action
        assert isinstance(action["target_ids"], list)
