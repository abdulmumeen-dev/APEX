# APEX Bridge Protocol v1

APEX can work without any external agent. A bridge is optional and is only called when the owner connects and live-tests it, then explicitly allows delegation for a task. The agent receives the delegated task plus up to eight recent conversation messages. Treat that context as disclosure to the connected service; do not enable delegation for sensitive conversations.

A bridge endpoint is an operator-configured HTTPS base URL. The optional API key is sent as `Authorization: Bearer <key>` and is stored encrypted by APEX. APEX blocks private/internal network targets and redirects by default. A self-host operator may explicitly enable private endpoints for agents on the same host/network.

## Health check

`GET {baseUrl}/health` returns JSON:

```json
{
  "protocol": "apex-bridge/v1",
  "name": "My Agent",
  "capabilities": ["research", "summarize"]
}
```

The capabilities are descriptive only and are not trusted as executable permissions. APEX records `connected` only after it receives this protocol response from the configured endpoint.

## Task delegation

`POST {baseUrl}/run` receives JSON:

```json
{
  "protocol": "apex-bridge/v1",
  "requestId": "uuid",
  "task": "Research these three pages and return a comparison.",
  "context": [
    {"role": "user", "content": "The recent message"},
    {"role": "assistant", "content": "The recent response"}
  ]
}
```

A successful response is JSON:

```json
{
  "protocol": "apex-bridge/v1",
  "status": "completed",
  "runId": "external-agent-run-id",
  "output": "The agent's actual result.",
  "steps": ["Fetched three pages", "Compared findings"]
}
```

The `output` field is required. Responses and steps are size-limited. Failed, malformed, redirected, timed-out, or unverified responses are recorded as failures; APEX does not report them as successful. This protocol is an APEX extension contract. Specific first-party adapters for Grok Build, Cue, OpenClaw, Hermes, MCP, and other agents require separate reviewed drivers; Muse Assistant has no verified public developer control API in current research.
