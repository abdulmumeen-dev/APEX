# Cloud model provider compatibility review

**Purpose:** Record which published cloud-model API contracts appear to match APEX's current OpenAI-compatible provider adapter. This is not an end-to-end provider certification: APEX's automated tests use mocked endpoints, not live accounts for every vendor. The provider compatibility surface should be verified with credentialed tests before being advertised as fully supported.

## APEX adapter contract

The current adapter uses bearer API-key authentication, an OpenAI-style `GET /models` endpoint, and `POST /chat/completions` with messages and function tools. Model IDs need to be accepted by the provider. A provider name alone does not guarantee that every model supports tool calls. The dashboard's current “test” checks connectivity/model discovery; it does not prove that the selected model will invoke tools correctly. Tool-capability and live conformance checks remain roadmap work.

## Providers with documented matching endpoints

These endpoints appear compatible at the API-contract level when the selected model supports function/tool calling. This is based on official documentation, not live APEX credentials:

| Provider | Base URL | Compatibility notes |
| --- | --- | --- |
| OpenAI | `https://api.openai.com/v1` | Model listing and Chat Completions with tools are documented. |
| xAI | `https://api.x.ai/v1` | `/v1/models` returns a `data` list and Chat Completions is documented as OpenAI-compatible. xAI describes Chat Completions as the predecessor to Responses and recommends Responses for new integrations; APEX has not yet implemented Responses. |
| Groq | `https://api.groq.com/openai/v1` | OpenAI-compatible endpoint and tool-use APIs are documented; verify model-specific tool support. |
| DeepSeek | `https://api.deepseek.com` | Model listing and tool calls are documented; use a tool-capable model. |
| OpenRouter | `https://openrouter.ai/api/v1` | Catalog/model listing and tool-calling support are documented; compatibility depends on the selected routed model/provider. |

## Not yet confirmed against APEX's exact discovery contract

- **Together AI:** its official OpenAPI model-list schema appears to expose a top-level array rather than the `data` envelope currently expected by APEX; adapter support may require response normalization.
- **Mistral AI:** published models-endpoint material appears internally inconsistent about whether the model list is top-level or inside a `data` property. Do not claim compatibility until a live response and adapter behavior are checked.
- **Fireworks AI and Google Gemini:** provider-compatible chat interfaces are not sufficient by themselves to certify the exact APEX discovery, authentication, and tool-call response contract. They remain candidates for a conformance matrix, not confirmed providers in this review.

## Follow-up engineering

Implement a capability-aware provider contract test covering `/models` response variants, authentication, ordinary completion, tool-call request acceptance, tool-call response parsing, and errors. Do not treat a successful `/models` request as proof that a particular model can call tools. Add provider-specific response normalization only where official docs or live conformance tests justify it.

## Official sources

1. OpenAI — [List models](https://developers.openai.com/api/reference/resources/models/methods/list/) and [Create chat completion](https://developers.openai.com/api/reference/resources/chat/subresources/completions/methods/create/).
2. xAI — [Models API](https://docs.x.ai/developers/rest-api-reference/inference/models) and [Chat Completions](https://docs.x.ai/developers/rest-api-reference/inference/chat-completions).
3. Groq — [API Reference](https://console.groq.com/docs/api-reference).
4. DeepSeek — [Lists Models](https://api-docs.deepseek.com/api/list-models/) and [Tool Calls](https://api-docs.deepseek.com/guides/tool_calls).
5. OpenRouter — [List models](https://openrouter.ai/docs/api/api-reference/models/list-all-models-and-their-properties) and [Tool calling](https://openrouter.ai/docs/guides/features/tool-calling).
6. Together AI — [OpenAPI specification](https://docs.together.ai/openapi.yaml).
7. Mistral AI — [Models endpoint](https://docs.mistral.ai/api/endpoint/models).
8. Fireworks AI — [API reference](https://docs.fireworks.ai/api-reference/introduction).
9. Google — [OpenAI compatibility](https://ai.google.dev/gemini-api/docs/openai).
