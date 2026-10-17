# Product-reference research for optional bridges

**Checked:** 2026-10-13. APEX is its own agent. This research informs optional bridge adapters; it is not a claim that any agent is connected or bundled. APEX must work independently with the user's chosen model backend, and may delegate only when an owner configures and live-tests an adapter.

## APEX core and model backend

APEX owns its orchestration loop, permissions, tool registry, memory, file workspace, approvals, workflows, and run history. The model provider supplies inference, not the APEX product. Users may bring an API key, connect an OpenAI-compatible server, or use a local model reachable from the APEX server. Keep model providers separate from agent bridges. Do not select xAI's hosted Grok API by default.

## Candidate bridges

- **Grok Build:** The user's named target `xai-org/grok-build` is an open-source coding-agent harness/CLI (Apache-2.0), distinct from the hosted xAI model API. It has headless and Agent Client Protocol surfaces. Any APEX connection needs an explicitly secured local Agent Runner; do not execute arbitrary prompts against APEX's source tree.
- **Cue by Manus:** A hosted agent; programmatic interaction is via Manus API v2 and authenticated account capabilities. It is an optional bridge, not an APEX dependency.
- **OpenClaw:** Self-hosted agent Gateway with an authenticated WebSocket control protocol. Device identity and scopes are security-sensitive; a cloud Preview cannot reach the user's desktop `localhost`.
- **Hermes Agent:** Self-hosted REST/SSE API server, disabled by default and listening on loopback by default; exposes execution and separate Jobs API when enabled. Requires an explicitly reachable endpoint and configured auth key.
- **Meta Muse Assistant:** The personal consumer agent. No official public third-party control API was identified in Meta's official material checked on 2026-10-13. APEX must not imitate its interface or claim a connection. Muse Spark's model API is a separate product.
- **MCP:** An open protocol to discover/call tools; it is not an agent or scheduler. APEX may add configured MCP servers as a tool bridge only after verifying transport/auth/capabilities and applying policy.
- **n8n (optional workflow bridge):** Source-available/fair-code under the Sustainable Use License, not OSI-approved open source. It may be used as an external workflow service but must not be portrayed as part of APEX's open-source code.

These upstreams are optional extension points. APEX remains an independently functioning agent when none are connected. Every connection stays `not configured`/`not tested` until a real owner-authorized connection check succeeds.

### Primary sources

- [Grok Build repository](https://github.com/xai-org/grok-build), [official overview](https://docs.x.ai/build/overview), [xAI announcement](https://x.ai/news/grok-build-open-source)
- [Cue](https://cue.im/), [Manus API overview](https://open.manus.im/docs/v2/agents-overview), [authentication](https://open.manus.im/docs/v2/authentication)
- [OpenClaw repository](https://github.com/openclaw/openclaw), [Gateway protocol](https://docs.openclaw.ai/gateway/protocol)
- [Hermes repository](https://github.com/NousResearch/hermes-agent), [API server](https://hermes-agent.nousresearch.com/docs/user-guide/features/api-server)
- [Meta Muse Assistant announcement](https://about.fb.com/news/2026/09/introducing-muse-personal-ai-agent/)
- [MCP 2026-07-28 specification](https://modelcontextprotocol.io/specification/2026-07-28)
- [n8n API](https://docs.n8n.io/connect/n8n-api/), [license](https://github.com/n8n-io/n8n/blob/master/LICENSE.md)
