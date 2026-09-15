import json
import os
import httpx
from abc import ABC, abstractmethod
from typing import Dict, Any, List
import logging
from app.config import settings

logger = logging.getLogger(__name__)

# Canonical response schema returned by every provider.
# Both GeminiProvider and GroqProvider must return a dict matching this shape.
RESPONSE_SCHEMA = {
    "response_text": str,       # Human-readable investigative answer
    "suggested_actions": list,  # List of {"type": str, "target_ids": List[str]}
}


class AIService(ABC):
    @abstractmethod
    def generate_response(self, system_prompt: str, user_prompt: str) -> Dict[str, Any]:
        """
        Returns structured JSON dict conforming to RESPONSE_SCHEMA:
        {
          "response_text": str,
          "suggested_actions": [{"type": str, "target_ids": List[str]}]
        }
        """
        pass

    @staticmethod
    def validate_schema(result: Dict[str, Any]) -> Dict[str, Any]:
        """
        Normalises provider output to the canonical schema.
        Ensures response_text is a str and suggested_actions is a list of action dicts.
        Handles both formal {"type":..., "target_ids":[...]} and informal string actions.
        """
        if not isinstance(result, dict):
            raise ValueError(f"Provider returned non-dict: {type(result)}")

        response_text = result.get("response_text", "")
        if not isinstance(response_text, str):
            response_text = str(response_text)

        raw_actions = result.get("suggested_actions", [])
        validated_actions = []
        if isinstance(raw_actions, list):
            for action in raw_actions:
                if isinstance(action, dict) and "type" in action:
                    # Support both "target_ids" (standard) and "node_ids" (some providers)
                    target_ids = action.get("target_ids", action.get("node_ids", []))
                    if not isinstance(target_ids, list):
                        target_ids = [str(target_ids)]
                    validated_actions.append({
                        "type": action["type"],
                        "target_ids": target_ids,
                    })
                # String actions (informal model output) are silently dropped
        return {
            "response_text": response_text,
            "suggested_actions": validated_actions,
        }


class GeminiProvider(AIService):
    def __init__(self, api_key: str, model: str = "gemini-2.0-flash"):
        self.api_key = api_key
        self.model = model
        self.url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model}:generateContent?key={self.api_key}"

    def generate_response(self, system_prompt: str, user_prompt: str) -> Dict[str, Any]:
        payload = {
            "contents": [
                {
                    "role": "user",
                    "parts": [
                        {"text": system_prompt + "\n\n" + user_prompt}
                    ]
                }
            ],
            "generationConfig": {
                "responseMimeType": "application/json"
            }
        }
        try:
            with httpx.Client(timeout=30.0) as client:
                response = client.post(self.url, json=payload)
                response.raise_for_status()
                data = response.json()
                text = data["candidates"][0]["content"]["parts"][0]["text"]
                start = text.find('{')
                end = text.rfind('}')
                if start != -1 and end != -1:
                    raw = json.loads(text[start:end+1])
                else:
                    raw = json.loads(text)
                return self.validate_schema(raw)
        except Exception as e:
            logger.error(f"Gemini API error: {e}")
            raise Exception("GeminiProvider failed") from e


class GroqProvider(AIService):
    def __init__(self, api_key: str, model: str = "groq/compound"):
        self.api_key = api_key
        self.model = model
        self.url = "https://api.groq.com/openai/v1/chat/completions"

    def generate_response(self, system_prompt: str, user_prompt: str) -> Dict[str, Any]:
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            "response_format": {"type": "json_object"}
        }
        try:
            with httpx.Client(timeout=30.0) as client:
                response = client.post(self.url, headers=headers, json=payload)
                response.raise_for_status()
                data = response.json()
                text = data["choices"][0]["message"]["content"]
                start = text.find('{')
                end = text.rfind('}')
                if start != -1 and end != -1:
                    raw = json.loads(text[start:end+1])
                else:
                    raw = json.loads(text)
                return self.validate_schema(raw)
        except Exception as e:
            logger.error(f"Groq API error: {e}")
            raise Exception("GroqProvider failed") from e


class FallbackAIService(AIService):
    """
    Chains providers in order. If the primary provider fails (any exception:
    timeout, HTTP error, rate-limit, parse error), the next provider is tried.
    Both providers return the canonical RESPONSE_SCHEMA so callers are
    completely provider-agnostic.
    """
    def __init__(self, providers: List[AIService]):
        if not providers:
            raise ValueError("FallbackAIService requires at least one provider")
        self.providers = providers

    def generate_response(self, system_prompt: str, user_prompt: str) -> Dict[str, Any]:
        last_exc = None
        for i, provider in enumerate(self.providers):
            try:
                result = provider.generate_response(system_prompt, user_prompt)
                if i > 0:
                    logger.info(f"Fell back to provider {type(provider).__name__} after primary failure.")
                return result
            except Exception as e:
                logger.warning(f"Provider {type(provider).__name__} failed: {e}. Trying next provider...")
                last_exc = e
        raise Exception(f"All AI providers failed. Last error: {last_exc}") from last_exc


def get_ai_service() -> AIService:
    """
    Returns a FallbackAIService chaining providers.

    AI_PROVIDER=gemini  =>  Gemini (primary) -> Groq (automatic fallback)
    AI_PROVIDER=groq    =>  Groq (primary)   -> Gemini (automatic fallback)

    The provider order is transparent to all callers. The frontend never knows
    which provider answered. Switching AI_PROVIDER only changes the priority order.
    """
    provider_name = settings.AI_PROVIDER.lower()
    gemini_key = settings.GEMINI_API_KEY
    groq_key = settings.GROQ_API_KEY
    model = settings.AI_MODEL

    gemini_model = model or "gemini-2.0-flash"
    groq_model = model or "groq/compound"

    providers: List[AIService] = []

    if provider_name == "gemini":
        if gemini_key:
            providers.append(GeminiProvider(gemini_key, gemini_model))
        if groq_key:
            providers.append(GroqProvider(groq_key, groq_model))
    elif provider_name == "groq":
        if groq_key:
            providers.append(GroqProvider(groq_key, groq_model))
        if gemini_key:
            providers.append(GeminiProvider(gemini_key, gemini_model))
    else:
        raise ValueError(f"Unknown AI_PROVIDER: {provider_name}")

    if not providers:
        raise ValueError("No AI provider could be configured. Check GEMINI_API_KEY and GROQ_API_KEY in .env")

    return FallbackAIService(providers)
