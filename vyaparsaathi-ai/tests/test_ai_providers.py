import asyncio
from types import SimpleNamespace

from app.core import agent


class FakeProvider:
    def __init__(self, name, reply=None, error=None):
        self.name = name
        self.reply = reply
        self.error = error
        self.calls = 0

    async def invoke(self, role, template, variables):
        self.calls += 1
        if self.error:
            raise self.error
        return SimpleNamespace(content=self.reply)


def run(providers):
    original = agent.providers
    agent.providers = providers
    try:
        return asyncio.run(agent.invoke_with_fallback("speak", "{x}", {"x": "hi"}))
    finally:
        agent.providers = original


def test_falls_back_to_groq_when_gemini_fails():
    gemini = FakeProvider("gemini", error=RuntimeError("Gemini daily safety limit reached"))
    groq = FakeProvider("groq", reply="Namaste from Groq")
    assert run([gemini, groq]) == ("Namaste from Groq", "groq")
    assert gemini.calls == 1 and groq.calls == 1


def test_uses_first_provider_when_it_works():
    gemini = FakeProvider("gemini", reply="Namaste from Gemini")
    groq = FakeProvider("groq", reply="unused")
    assert run([gemini, groq]) == ("Namaste from Gemini", "gemini")
    assert groq.calls == 0


def test_empty_reply_moves_to_next_provider():
    assert run([FakeProvider("gemini", reply="  "), FakeProvider("groq", reply="ok")]) == ("ok", "groq")


def test_no_providers_returns_none():
    assert run([]) == (None, None)


def test_chat_still_answers_without_any_key():
    original = agent.providers
    agent.providers = []
    try:
        state = agent.VyaparState(
            user_profile={"language": "English", "city": "Pune", "skills": [], "assets": []},
            business_context={"candidate_zones": [], "additional_details": {}},
            financial_evaluation={},
        )
        result = asyncio.run(agent.process_chat_message(state, "I have 50000 rupees", []))
        assert result["response_text"]
    finally:
        agent.providers = original


def test_translation_uses_ai_and_keeps_order():
    import json as _json

    class Translator(FakeProvider):
        async def invoke(self, role, template, variables):
            self.calls += 1
            items = _json.loads(variables["items"])
            return SimpleNamespace(content="```json\n" + _json.dumps([f"HI:{item}" for item in items]) + "\n```")

    original = agent.providers
    agent.providers = [Translator("groq")]
    try:
        history = [{"role": "ai", "text": "Hello", "time": ""}, {"role": "user", "text": "50000 rupees", "time": "1"}]
        result = asyncio.run(agent.translate_chat_history(history, "Hindi"))
        assert [item["text"] for item in result] == ["HI:Hello", "HI:50000 rupees"]
        assert result[1]["time"] == "1"
    finally:
        agent.providers = original


def test_translation_rejects_wrong_length():
    import pytest
    with pytest.raises(ValueError):
        agent._parse_translation('["only one"]', 2)
