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


def test_explicit_provider_skips_auto_order_and_uses_one_call(monkeypatch):
    gemini = FakeProvider("gemini", error=AssertionError("Explicit Groq must skip Gemini"))
    groq = FakeProvider("groq", reply='{"reply":"आप कितना निवेश कर सकते हैं?", "profile_updates":{}}')
    monkeypatch.setattr(agent, "providers", [gemini, groq])
    state = agent.VyaparState(user_profile={"language": "Hindi", "city": "Pune"})

    response = asyncio.run(agent.process_chat_message(state, "Tea", [], "groq"))

    assert response["provider"] == "groq"
    assert response["updated_state"].business_context.business_name == "Chai and snacks cart"
    assert response["updated_state"].user_profile.language == "Hindi"
    assert (gemini.calls, groq.calls) == (0, 1)


def test_explicit_provider_failure_does_not_switch_models(monkeypatch):
    import pytest

    gemini = FakeProvider("gemini", error=RuntimeError("Unavailable"))
    groq = FakeProvider("groq", reply="Must not be used")
    monkeypatch.setattr(agent, "providers", [gemini, groq])

    with pytest.raises(agent.ProviderUnavailable) as failure:
        asyncio.run(agent.process_chat_message(agent.VyaparState(), "Hello", [], "gemini"))

    assert failure.value.status == 503
    assert (gemini.calls, groq.calls) == (1, 0)


def test_auto_translation_tries_other_provider_after_invalid_json(monkeypatch):
    gemini = FakeProvider("gemini", reply='{"translations":[]}')
    groq = FakeProvider("groq", reply='{"translations":["चहा ₹50"]}')
    monkeypatch.setattr(agent, "providers", [gemini, groq])
    history = [{"role": "user", "text": "Tea ₹50", "time": "10:03"}]

    assert asyncio.run(agent.translate_chat_history(history, "Marathi")) == [
        {"role": "user", "text": "चहा ₹50", "time": "10:03"},
    ]
    assert (gemini.calls, groq.calls) == (1, 1)


def test_provider_http_requests_use_distinct_endpoints_and_keys(monkeypatch):
    import json

    import httpx

    original_client = httpx.AsyncClient
    requests = []

    def respond(request):
        requests.append(request)
        content = '{"reply":"Hello", "profile_updates":{}}'
        if request.url.host == "generativelanguage.googleapis.com":
            return httpx.Response(200, json={"candidates": [{"content": {"parts": [{"text": content}]}}]})
        return httpx.Response(200, json={"choices": [{"message": {"content": content}}]})

    def mock_client(**options):
        return original_client(transport=httpx.MockTransport(respond), **options)

    monkeypatch.setattr(agent.httpx, "AsyncClient", mock_client)
    monkeypatch.setattr(agent, "providers", [
        agent.Provider("gemini", "gemini-3.5-flash-lite", "gemini-test"),
        agent.Provider("groq", "openai/gpt-oss-20b", "groq-test"),
    ])
    for name in ("gemini", "groq"):
        result = asyncio.run(agent.process_chat_message(agent.VyaparState(), "Hello", [], name))
        assert result["provider"] == name and result["response_text"] == "Hello"

    gemini, groq = requests
    gemini_config = json.loads(gemini.content)["generationConfig"]
    groq_body = json.loads(groq.content)
    assert gemini.url.path.endswith("gemini-3.5-flash-lite:generateContent")
    assert gemini.headers["x-goog-api-key"] == "gemini-test"
    assert gemini_config["responseMimeType"] == "application/json"
    assert groq.url.path == "/openai/v1/chat/completions"
    assert groq.headers["Authorization"] == "Bearer groq-test"
    assert groq_body["model"] == "openai/gpt-oss-20b"
    assert groq_body["response_format"] == {"type": "json_object"}
