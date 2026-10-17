# Local-first model setup research

**Checked 2026-10-14.** The supported default for APEX's local CLI should not ask a new user to supply an API key or run a separate remote server. A local model can power the agent loop, but the model runtime and weights still need a one-time local installation/download.

## Findings

- Ollama's official Quickstart offers desktop downloads for macOS, Windows, and Linux. It explicitly distinguishes local model requests (no API key) from hosted/cloud model requests (API key). It documents the local endpoint at `http://localhost:11434` and OpenAI Chat Completions compatibility at `/v1/chat/completions`. The local model runtime is on the same computer; this is not an APEX server the user must deploy.[1]
- Ollama's official tool-calling guide demonstrates a multi-turn agent loop: provide tool schemas, receive tool calls, execute them in the application, return tool results, and ask the model again. Therefore APEX can keep its own tool executor and use local inference rather than connecting to a pre-existing agent product.[2]
- The official Ollama Qwen3.5 library lists a `qwen3.5:4b` variant at approximately 3.3–4.0 GB and flags tool capability. This is a reasonable first-run option to test; it is not a guarantee of good latency or sufficient memory on every computer.[3]
- Ollama's Quickstart documents a separate `gemma4:e2b` local example around 7.2 GB and recommends 8 GB of available VRAM (or unified memory on a Mac); it says system RAM can work more slowly when VRAM is insufficient.[1]
- The installer should detect whether Ollama is installed and responding, show the model and download size, ask before downloading, then save only the selected model name and loopback endpoint. APEX must not silently install software or download multiple gigabytes.

## Product decision

Make **Local model (recommended)** the default first-run path. APEX CLI should detect Ollama on loopback; if absent, provide the official download link and plain instructions. If installed, it should offer a compact tool-capable model with an explicit download confirmation. Hosted provider APIs and user-operated compatible endpoints remain optional advanced paths. The ordinary user should not have to understand endpoint URLs or enter an API key to try APEX.

## References

[1] [Ollama Quickstart](https://docs.ollama.com/quickstart): desktop install options, local versus cloud model setup, API-key distinction, local API endpoint, sample local model and memory guidance.

[2] [Ollama Tool Calling](https://docs.ollama.com/capabilities/tool-calling): tool-schema requests and multi-turn agent-loop examples.

[3] [Ollama Qwen3.5 model library](https://ollama.com/library/qwen3.5): current variants, size ranges, and tool-capability marker.
