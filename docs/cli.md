# APEX CLI

The CLI is a client of the APEX agent, not a separate chat simulation. **Local mode** runs APEX on the computer where the CLI is invoked, can use Ollama without an API key or hosted APEX server, and can operate on an explicitly chosen project directory. **Remote mode** calls the authenticated APEX server and shares its actual provider, policy, Skills, memory, workflow records, and run history.

## From a source checkout

Requirements: Node.js 22 and pnpm 10.18. Local model execution also needs the Ollama desktop/runtime; remote mode additionally needs a configured APEX server and token.

```bash
pnpm install --frozen-lockfile
pnpm cli help
pnpm cli setup
```

`pnpm cli setup` checks for Ollama on this computer. If Ollama is missing, it prints the official download page and tells you to install and open Ollama; it does not install software itself. If a compatible model is already installed it uses that model; otherwise it recommends `qwen3.5:4b`, explains the approximate 3.3–4.0 GB download, and asks before running `ollama pull`. Local setup needs no APEX server, provider account, or API key. This project has a CLI entry point but does not yet publish a versioned npm package or native desktop installer.

### Remote server mode

1. Sign into the APEX dashboard and open **CLI**.
2. Create a personal token. It is displayed once; copy it to a trusted terminal.
3. Run:

```bash
pnpm cli login --server=https://YOUR-APEX-SERVER
# Paste the token at the hidden prompt.
pnpm cli status
pnpm cli run "Summarize this project plan"
pnpm cli chat
pnpm cli history
pnpm cli skills
pnpm cli plugins
pnpm cli logout
```

- Tokens use the `apx_live_...` format. APEX stores only a SHA-256 hash, limits each owner to ten active tokens, records last-used time, and supports revocation from the dashboard.
- The token is entered interactively and is never accepted as a command-line argument. The CLI writes it into the current user's XDG config directory with `0700` directory and `0600` file permissions.
- Remote token requests use HTTPS. Loopback HTTP is accepted for local development. The CLI uses bearer-token authentication and the API applies a per-token in-memory rate limit.
- `apex run` runs a real task and returns its actual status/trace ID. It never fabricates provider outputs. `--delegate` and `--allow-plugins` are opt-in per command and authorize sending relevant task data outside APEX.
- The hosted preview currently needs a real tested model profile before remote tasks can complete. Without one, APEX reports that execution is blocked rather than substituting canned answers.

### Local project mode

Run the guided local setup, then ask APEX to work inside a project folder:

```bash
pnpm cli setup
pnpm cli local --cwd ./my-project "Explain how authentication works"
pnpm cli doctor
pnpm cli skills starter interview-practice-coach
pnpm cli skills list
```

Local Ollama settings are stored in the user's APEX config directory with owner-only file permissions. For another compatible local endpoint, set `APEX_MODEL_BASE_URL` and `APEX_MODEL_ID`; `APEX_MODEL_API_KEY` is optional and only for a backend that requires it. Never put secrets in project files to pass them to a local run.

Local mode provides real file listing, reading, literal search, and file writes scoped to `--cwd` (defaults to the current working directory). It excludes common secret paths and files, dependencies/build output, `.env`, and Git internals; it rejects symlink traversal. Review the exclusions in `bin/apex.mjs` before pointing it at a sensitive repository.

The built-in **Interview Practice Coach** is an optional Markdown Skill. Install it with `pnpm cli skills starter interview-practice-coach`; it is stored in the user's APEX config directory and is included as untrusted guidance in local runs. It supports mock interviews and truthful feedback based on the user's own experience. It does not provide covert live answers, impersonate a candidate, or invent qualifications. `pnpm cli skills remove "Interview Practice Coach"` removes it after a confirmation prompt.

- Before asking for confirmation, APEX prints the complete proposed file contents; terminal control and bidirectional text controls are escaped to make the displayed payload harder to spoof. Writes require confirmation unless the operator passes `--auto-write`.
- Shell is disabled by default. `--allow-shell` makes a shell tool available, but **each exact command still requires an interactive user confirmation**. When allowed, a command runs with the current OS user's permissions and inherited environment.
- These checks are not an OS sandbox. There is no isolated container, VM, seccomp profile, or separate low-privilege worker in this release. Do not process untrusted repositories or hostile model instructions with shell enabled. Do not place API keys/secrets in the selected project's environment.
- The selected model server must be reachable from the CLI machine; a hosted APEX Preview cannot reach the user's desktop `localhost`.

## API routes used by remote mode

The CLI uses the same personal-token-protected REST API as other terminal tools:

- `GET /api/v1/status`
- `GET /api/v1/runs`
- `GET /api/v1/skills`
- `GET /api/v1/plugins`
- `POST /api/v1/runs`

API requests are not a general administrative token. The current token is owner-scoped and can submit APEX tasks, read its own run list, and list its Skills/Plugins. Revoke it promptly if lost.

## Current limits

Remote execution depends on an operator-configured compatible provider; there is no default hosted model. Current local mode is a command-line client, not a full-screen TUI or published desktop application. General browser/mouse/keyboard control, streaming, interrupt propagation through every model/tool side effect, durable scheduled jobs, OS-level sandboxing, self-host authentication independent of Manus OAuth, and signed extension bundles remain roadmap items.
