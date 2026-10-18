import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  BookOpen,
  Check,
  CircleHelp,
  Code2,
  Cpu,
  Database,
  Film,
  FolderOpen,
  Gamepad2,
  Globe,
  History,
  KeyRound,
  LoaderCircle,
  LockKeyhole,
  Play,
  Puzzle,
  RefreshCw,
  Search,
  ShieldCheck,
  Terminal,
  X,
  Workflow,
  type LucideIcon,
} from "lucide-react";

type LocalModel = {
  provider: "ollama" | "openai-compatible";
  baseUrl: string;
  modelId: string;
  apiKeyConfigured: boolean;
};

type LocalStep = {
  id: string;
  kind: string;
  label: string;
  status: string;
  detail?: string;
  arguments?: string;
  createdAt: string;
};

type LocalApproval = {
  id: string;
  path: string;
  operation: string;
  bytes: number;
  safeContent: string;
};

type LocalRun = {
  id: string;
  status: string;
  task: string;
  root: string;
  model: { provider: string; modelId: string; baseUrl: string };
  steps: LocalStep[];
  message?: string;
  error?: string;
  pendingApproval?: LocalApproval | null;
  createdAt: string;
  finishedAt?: string | null;
};

type LocalStatus = {
  root: string;
  model: LocalModel | null;
  activeRunId: string | null;
  runs: LocalRun[];
  security: {
    listener: string;
    shellFromDashboard: boolean;
    osSandbox: boolean;
  };
};

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
  });
  const body = (await response.json().catch(() => null)) as {
    ok: boolean;
    data?: T;
    error?: string;
  } | null;
  if (!body?.ok || !response.ok)
    throw new Error(
      body?.error || "APEX's local runtime is not responding here."
    );
  return body.data as T;
}

function timeLabel(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? ""
    : date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function statusLabel(status: string) {
  return status.replaceAll("_", " ");
}

type WorkspaceSectionId =
  | "agent"
  | "code"
  | "game"
  | "video"
  | "browser"
  | "research"
  | "automations"
  | "skills"
  | "integrations"
  | "models"
  | "activity"
  | "memory"
  | "assets";

type WorkspaceSection = {
  id: WorkspaceSectionId;
  title: string;
  state: "AVAILABLE" | "LIMITED" | "CLI ONLY" | "HOSTED ONLY" | "PLANNED";
  icon: LucideIcon;
  description: string;
  current: string;
  next: string;
};

const workspaceSections: WorkspaceSection[] = [
  {
    id: "agent",
    title: "Agent",
    state: "AVAILABLE",
    icon: Activity,
    description:
      "Run a task against the selected workspace and inspect the actual execution trace.",
    current:
      "The local agent reads and searches text files, returns bounded results, and can propose a file write for your exact approval. Dashboard shell execution is off.",
    next: "Broader tool coverage, streaming, cancellation, resumable sessions, and consistent local/hosted policy contracts.",
  },
  {
    id: "code",
    title: "Code & Files",
    state: "LIMITED",
    icon: Code2,
    description:
      "Use APEX on the project folder chosen for this desktop session.",
    current:
      "The local file tools are text-oriented and scoped to the selected folder. Writes require approval. The optional CLI shell is separate, runs with OS-user permissions, and is not a sandbox.",
    next: "Reviewable diffs, richer project navigation, a safe process runner, edit/undo flows, and an integrated coding surface.",
  },
  {
    id: "game",
    title: "Create Game",
    state: "PLANNED",
    icon: Gamepad2,
    description:
      "A dedicated workspace for planning, building, previewing, and packaging small games.",
    current:
      "Game creation is not implemented in this APEX build. There is no game generator, project preview, asset pipeline, or export action here.",
    next: "A permissioned game-building workflow with starter projects, code and asset editing, live preview, and reproducible export.",
  },
  {
    id: "video",
    title: "Create Video",
    state: "PLANNED",
    icon: Film,
    description:
      "A future studio for scripts, storyboards, media assets, edits, and rendered video.",
    current:
      "Video generation and editing are not available in the local desktop runtime; this section does not submit work to a video service.",
    next: "A clearly sourced media pipeline with clip/voice/image inputs, an editable timeline, render status, and user-controlled export.",
  },
  {
    id: "browser",
    title: "Browser & Computer",
    state: "PLANNED",
    icon: Globe,
    description:
      "A future place to manage browser tabs and visible computer-use tasks.",
    current:
      "APEX has no local browser tabs, screenshots, mouse/keyboard controls, or general-purpose website automation in this release.",
    next: "Visible browser sessions, per-site permissions, step-by-step action traces, interruption, and approval for consequential effects.",
  },
  {
    id: "research",
    title: "Research",
    state: "PLANNED",
    icon: Search,
    description:
      "Gather web evidence and turn it into a source-linked answer or report.",
    current:
      "Live web search, page browsing, and citation capture are not wired into the standalone local tool loop.",
    next: "Search and fetch tools, citations, saved research artifacts, source provenance, and protection against instructions embedded in webpages.",
  },
  {
    id: "automations",
    title: "Automations",
    state: "PLANNED",
    icon: Workflow,
    description:
      "Build repeatable tasks that can wait for an event or run on a schedule.",
    current:
      "The local app has no persistent scheduler, webhook receiver, or background worker. Hosted workflow functionality is separate and is not running locally.",
    next: "A restart-safe local queue, schedules, triggers, retries, pause/resume, cancellation, and approval waits.",
  },
  {
    id: "skills",
    title: "Skills",
    state: "CLI ONLY",
    icon: BookOpen,
    description:
      "Add reviewable Markdown instruction packs to shape APEX's task behavior.",
    current:
      "The CLI supports local Skill management, including the truthful Interview Practice Coach starter. This desktop page does not yet browse, install, or edit Skills.",
    next: "A local Skill library with preview, version history, update review, and clear per-Skill permission boundaries.",
  },
  {
    id: "integrations",
    title: "Integrations",
    state: "HOSTED ONLY",
    icon: Puzzle,
    description:
      "Connect services and data sources under explicit, revocable permissions.",
    current:
      "The hosted APEX project has limited API Plugins and an optional bridge. Those are not exposed by this standalone local runtime; no general MCP or app catalog is included here.",
    next: "Local connectors and MCP with documented APIs, per-connection scopes, encrypted credentials, per-run consent, and revocation.",
  },
  {
    id: "models",
    title: "Models",
    state: "AVAILABLE",
    icon: Cpu,
    description:
      "Choose whether task inference stays local or goes to your selected compatible API.",
    current:
      "Configure Ollama without a provider API key, or connect an OpenAI-compatible cloud endpoint. A saved cloud key is encrypted locally. The endpoint check lists models; it does not prove tool-calling compatibility.",
    next: "Provider-specific adapters, stronger tool-call checks, model capabilities, streaming, and clearer usage/resource estimates.",
  },
  {
    id: "activity",
    title: "Run History",
    state: "AVAILABLE",
    icon: History,
    description:
      "Inspect saved local runs, model calls, tool steps, and approval decisions.",
    current:
      "Recent run traces are stored on this computer and shown below. There is no export, cross-device sync, or semantic search in this build.",
    next: "Filtering, export and deletion controls, stronger effect verification, and portable run/session formats.",
  },
  {
    id: "memory",
    title: "Memory & Knowledge",
    state: "PLANNED",
    icon: Database,
    description:
      "An editable, inspectable place for useful project context and saved knowledge.",
    current:
      "The local desktop keeps run history but does not currently share editable long-term memory or a knowledge base with the CLI.",
    next: "User/project-scoped memory with provenance, expiry, search, selective deletion, and explicit export/import.",
  },
  {
    id: "assets",
    title: "Assets & Files",
    state: "LIMITED",
    icon: FolderOpen,
    description: "Work with artifacts in the selected local project folder.",
    current:
      "Text-file tools are available inside the current workspace. There is no general asset library, generated-media gallery, or document import pipeline here.",
    next: "A file/artifact browser, previews, image/audio/video handling, generated asset provenance, and safe export.",
  },
];

function LocalModulePage({ section }: { section: WorkspaceSection }) {
  const SectionIcon = section.icon;
  return (
    <section className="local-panel local-module-page">
      <header className="local-module-heading">
        <span className="local-module-icon">
          <SectionIcon size={20} />
        </span>
        <div>
          <span className="local-eyebrow">APEX WORKSPACE</span>
          <h1>{section.title}</h1>
          <p>{section.description}</p>
        </div>
        <span
          className={`local-module-status state-${section.state.toLowerCase().replaceAll(" ", "-")}`}
        >
          {section.state}
        </span>
      </header>
      <div className="local-module-grid">
        <article>
          <span className="local-eyebrow">WHAT WORKS IN THIS BUILD</span>
          <p>{section.current}</p>
        </article>
        <article>
          <span className="local-eyebrow">WHAT APEX STILL NEEDS</span>
          <p>{section.next}</p>
        </article>
      </div>
      <div className="local-module-note">
        <CircleHelp size={15} />
        <span>
          {section.state === "PLANNED"
            ? "This is a roadmap section only—no hidden run, external request, or unfinished action is triggered from it."
            : section.state === "HOSTED ONLY"
              ? "This local desktop does not inherit the hosted dashboard's server-side connectors or credentials."
              : "The Model, Run History, and Agent work areas remain available in this local app."}
        </span>
      </div>
      {section.id === "skills" && (
        <div className="local-command-box">
          <code>apex skills list</code>
          <span>current CLI surface</span>
        </div>
      )}
      {section.id === "models" && (
        <div className="local-module-note">
          <Cpu size={15} />
          <span>
            Configure or test a model in the Model connection panel to the
            right.
          </span>
        </div>
      )}
    </section>
  );
}

export default function LocalWorkstation() {
  const [status, setStatus] = useState<LocalStatus | null>(null);
  const [connectionError, setConnectionError] = useState(
    "Connecting to APEX local runtime…"
  );
  const [provider, setProvider] = useState<"ollama" | "openai-compatible">(
    "ollama"
  );
  const [baseUrl, setBaseUrl] = useState("http://127.0.0.1:11434/v1");
  const [modelId, setModelId] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [modelDirty, setModelDirty] = useState(false);
  const [task, setTask] = useState("");
  const [activeSection, setActiveSection] =
    useState<WorkspaceSectionId>("agent");
  const [selectedRunId, setSelectedRunId] = useState("");
  const [busyAction, setBusyAction] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [testResult, setTestResult] = useState("");

  const refresh = useCallback(async () => {
    try {
      const next = await request<LocalStatus>("/api/local/status");
      setStatus(next);
      setConnectionError("");
      setError("");
      if (!modelDirty && next.model) {
        setProvider(next.model.provider);
        setBaseUrl(next.model.baseUrl);
        setModelId(next.model.modelId);
      }
      setSelectedRunId(current => current || next.runs[0]?.id || "");
    } catch (cause) {
      setConnectionError(
        cause instanceof Error
          ? cause.message
          : "APEX's local runtime is not available in this window."
      );
    }
  }, [modelDirty]);

  useEffect(() => {
    void refresh();
    const timer = window.setInterval(() => void refresh(), 1_800);
    return () => window.clearInterval(timer);
  }, [refresh]);

  const selectedRun = useMemo(
    () =>
      status?.runs.find(run => run.id === selectedRunId) ||
      status?.runs[0] ||
      null,
    [status?.runs, selectedRunId]
  );
  const selectedWorkspace =
    workspaceSections.find(section => section.id === activeSection) ||
    workspaceSections[0];

  async function saveModel() {
    setBusyAction("save-model");
    setError("");
    setNotice("");
    try {
      await request<LocalModel>("/api/local/models", {
        method: "PUT",
        body: JSON.stringify({ provider, baseUrl, modelId, apiKey }),
      });
      setApiKey("");
      setModelDirty(false);
      setNotice(
        "Model settings saved locally. The API key is encrypted on this computer and is not returned to this page."
      );
      await refresh();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Could not save model settings."
      );
    } finally {
      setBusyAction("");
    }
  }

  async function testModel() {
    setBusyAction("test-model");
    setError("");
    setTestResult("");
    try {
      const result = await request<{
        reachable: boolean;
        modelFound: boolean;
        modelId: string;
        availableModels: number;
        note: string;
      }>("/api/local/models/test", {
        method: "POST",
        body: JSON.stringify({ provider, baseUrl, modelId, apiKey }),
      });
      setTestResult(
        result.modelFound
          ? `Endpoint reachable; “${result.modelId}” appears in the model list. ${result.note}`
          : `Endpoint reachable, but “${result.modelId}” was not in the model list. ${result.note}`
      );
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Model endpoint check failed."
      );
    } finally {
      setBusyAction("");
    }
  }

  async function startRun(event: React.FormEvent) {
    event.preventDefault();
    setBusyAction("run");
    setError("");
    setNotice("");
    try {
      const run = await request<LocalRun>("/api/local/runs", {
        method: "POST",
        body: JSON.stringify({ task }),
      });
      setTask("");
      setSelectedRunId(run.id);
      setNotice("Run started on this computer.");
      await refresh();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Could not start the local run."
      );
    } finally {
      setBusyAction("");
    }
  }

  async function decideApproval(
    run: LocalRun,
    approval: LocalApproval,
    approved: boolean
  ) {
    setBusyAction(`approval-${approval.id}`);
    setError("");
    try {
      await request(`/api/local/runs/${run.id}/approvals/${approval.id}`, {
        method: "POST",
        body: JSON.stringify({ approved }),
      });
      setNotice(
        approved
          ? "Exact file write approved."
          : "File write rejected; no change was applied."
      );
      await refresh();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Could not record the approval decision."
      );
    } finally {
      setBusyAction("");
    }
  }

  function changeModel(
    field: "provider" | "baseUrl" | "modelId" | "apiKey",
    value: string
  ) {
    setModelDirty(true);
    setTestResult("");
    if (field === "provider") {
      const next = value === "ollama" ? "ollama" : "openai-compatible";
      setProvider(next);
      if (next === "ollama") setApiKey("");
      if (next === "ollama" && baseUrl === "")
        setBaseUrl("http://127.0.0.1:11434/v1");
    } else if (field === "baseUrl") setBaseUrl(value);
    else if (field === "modelId") setModelId(value);
    else setApiKey(value);
  }

  if (!status) {
    return (
      <main className="local-offline-page">
        <section className="local-offline-card">
          <div className="local-brand">
            <span className="local-brand-mark">A</span>
            <span>
              APEX <small>DESKTOP</small>
            </span>
          </div>
          <div className="local-offline-icon">
            <AlertTriangle size={22} />
          </div>
          <h1>Local runtime not connected</h1>
          <p>{connectionError}</p>
          <div className="local-command-box">
            <code>apex dashboard</code>
            <span>or launch the APEX Desktop app</span>
          </div>
          <p className="local-muted">
            This route needs the local daemon on this computer. A hosted Preview
            cannot reach your computer's localhost.
          </p>
          <button
            className="local-button local-button-secondary"
            onClick={() => void refresh()}
          >
            <RefreshCw size={14} /> Try again
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="local-workstation">
      <header className="local-topbar">
        <div className="local-brand">
          <span className="local-brand-mark">A</span>
          <span>
            APEX <small>LOCAL WORKSTATION</small>
          </span>
        </div>
        <div className="local-topbar-right">
          <span className="local-connection">
            <span /> LOCAL ENGINE ONLINE
          </span>
          <button
            className="local-icon-button"
            onClick={() => void refresh()}
            aria-label="Refresh status"
            title="Refresh status"
          >
            <RefreshCw size={15} />
          </button>
        </div>
      </header>

      <div className="local-workspace-banner">
        <div className="local-folder-icon">
          <FolderOpen size={17} />
        </div>
        <div className="local-workspace-name">
          <span>ACTIVE WORKSPACE</span>
          <strong title={status.root}>{status.root}</strong>
        </div>
        <div className="local-boundary">
          <LockKeyhole size={14} /> LOOPBACK ONLY
        </div>
      </div>

      <div className="local-disclosure">
        <ShieldCheck size={15} />
        <span>
          APEX runs on this computer. Shell access is off in this dashboard.
          File writes pause for your review. This is not an OS sandbox. A cloud
          model receives task context at the provider you select; local Ollama
          requests stay on this device.
        </span>
      </div>
      {(error || notice) && (
        <div
          className={`local-flash ${error ? "is-error" : "is-success"}`}
          role="status"
        >
          {error ? <AlertTriangle size={15} /> : <Check size={15} />}
          {error || notice}
        </div>
      )}

      <div className="local-layout">
        <nav className="local-nav-rail" aria-label="APEX work areas">
          <span className="local-nav-heading">WORK AREAS</span>
          {workspaceSections.map(section => {
            const SectionIcon = section.icon;
            return (
              <button
                key={section.id}
                type="button"
                className={`local-nav-item ${activeSection === section.id ? "is-active" : ""}`}
                onClick={() => setActiveSection(section.id)}
                aria-current={activeSection === section.id ? "page" : undefined}
              >
                <SectionIcon size={15} />
                <span className="local-nav-copy">
                  <strong>{section.title}</strong>
                  <small>{section.state}</small>
                </span>
              </button>
            );
          })}
          <p className="local-nav-footnote">
            Planned areas are labeled; they do not start unfinished actions.
          </p>
        </nav>
        <section className="local-main-column">
          {activeSection === "agent" && (
            <section className="local-panel local-agent-panel">
              <div className="local-panel-heading">
                <div>
                  <span className="local-eyebrow">AGENT CONSOLE</span>
                  <h1>What should APEX take care of?</h1>
                  <p>
                    Work inside the selected folder. Each tool action is
                    recorded below.
                  </p>
                </div>
                <div className="local-agent-mark">
                  <Activity size={20} />
                </div>
              </div>
              <form onSubmit={startRun}>
                <label className="local-sr-only" htmlFor="local-task">
                  Task for APEX
                </label>
                <textarea
                  id="local-task"
                  value={task}
                  onChange={event => setTask(event.target.value)}
                  maxLength={12_000}
                  placeholder="Ask APEX to inspect a project, explain code, or propose a file change…"
                />
                <div className="local-compose-footer">
                  <span>{task.length.toLocaleString()} / 12,000</span>
                  <button
                    className="local-button local-button-primary"
                    disabled={
                      !status.model ||
                      !!status.activeRunId ||
                      busyAction === "run" ||
                      !task.trim()
                    }
                    type="submit"
                  >
                    {busyAction === "run" ? (
                      <LoaderCircle size={15} className="local-spin" />
                    ) : (
                      <Play size={14} fill="currentColor" />
                    )}
                    {status.activeRunId ? "Run in progress" : "Run locally"}
                  </button>
                </div>
              </form>
              {!status.model && (
                <div className="local-inline-hint">
                  <CircleHelp size={14} /> Save a model below before submitting
                  a task.
                </div>
              )}
            </section>
          )}

          {activeSection !== "agent" && activeSection !== "activity" && (
            <LocalModulePage section={selectedWorkspace} />
          )}

          <section className="local-panel local-trace-panel">
            <div className="local-panel-title">
              <div>
                <span className="local-eyebrow">EXECUTION TRACE</span>
                <h2>Run activity</h2>
              </div>
              <span className="local-count">{status.runs.length} recent</span>
            </div>
            {status.runs.length === 0 ? (
              <div className="local-empty">
                <Terminal size={19} />
                <strong>No local runs yet</strong>
                <span>
                  Start a task to see real model and tool activity here.
                </span>
              </div>
            ) : (
              <div className="local-run-split">
                <div className="local-run-list" aria-label="Recent local runs">
                  {status.runs.map(run => (
                    <button
                      key={run.id}
                      className={`local-run-item ${selectedRun?.id === run.id ? "is-selected" : ""}`}
                      onClick={() => setSelectedRunId(run.id)}
                    >
                      <span className={`local-run-dot status-${run.status}`} />
                      <span className="local-run-summary">
                        <strong>{run.task}</strong>
                        <small>
                          {run.model?.modelId || "Model unknown"} ·{" "}
                          {timeLabel(run.createdAt)}
                        </small>
                      </span>
                      <span className={`local-status-tag status-${run.status}`}>
                        {statusLabel(run.status)}
                      </span>
                    </button>
                  ))}
                </div>
                {selectedRun && (
                  <div className="local-run-detail">
                    <div className="local-run-detail-head">
                      <div>
                        <span className="local-eyebrow">
                          RUN {selectedRun.id.slice(0, 8)}
                        </span>
                        <h3>{selectedRun.task}</h3>
                      </div>
                      <span
                        className={`local-status-tag status-${selectedRun.status}`}
                      >
                        {statusLabel(selectedRun.status)}
                      </span>
                    </div>
                    <div className="local-run-meta">
                      <span>
                        <Cpu size={12} />{" "}
                        {selectedRun.model?.modelId || "model"}
                      </span>
                      <span>
                        <FolderOpen size={12} /> {selectedRun.root}
                      </span>
                    </div>
                    {selectedRun.pendingApproval && (
                      <div className="local-approval-card">
                        <div className="local-approval-heading">
                          <span className="local-approval-icon">
                            <AlertTriangle size={15} />
                          </span>
                          <div>
                            <strong>Review proposed file write</strong>
                            <small>
                              {selectedRun.pendingApproval.operation ===
                              "update"
                                ? "Update"
                                : "Create"}{" "}
                              {selectedRun.pendingApproval.path} ·{" "}
                              {selectedRun.pendingApproval.bytes.toLocaleString()}{" "}
                              bytes
                            </small>
                          </div>
                        </div>
                        <p>
                          Read the complete proposed content before deciding.
                          Rejecting makes no file change.
                        </p>
                        <pre
                          className="local-approval-content"
                          aria-label="Complete proposed file content"
                        >
                          {selectedRun.pendingApproval.safeContent}
                        </pre>
                        <div className="local-approval-actions">
                          <button
                            className="local-button local-button-danger"
                            disabled={
                              busyAction ===
                              `approval-${selectedRun.pendingApproval.id}`
                            }
                            onClick={() =>
                              void decideApproval(
                                selectedRun,
                                selectedRun.pendingApproval!,
                                false
                              )
                            }
                          >
                            <X size={14} /> Reject write
                          </button>
                          <button
                            className="local-button local-button-primary"
                            disabled={
                              busyAction ===
                              `approval-${selectedRun.pendingApproval.id}`
                            }
                            onClick={() =>
                              void decideApproval(
                                selectedRun,
                                selectedRun.pendingApproval!,
                                true
                              )
                            }
                          >
                            <Check size={14} /> Approve exact write
                          </button>
                        </div>
                      </div>
                    )}
                    {selectedRun.steps.length > 0 && (
                      <div className="local-step-list">
                        {selectedRun.steps.map(step => (
                          <article className="local-step" key={step.id}>
                            <div
                              className={`local-step-icon kind-${step.kind}`}
                            >
                              {step.kind === "model" ? (
                                <Cpu size={13} />
                              ) : step.kind === "approval" ? (
                                <ShieldCheck size={13} />
                              ) : (
                                <Terminal size={13} />
                              )}
                            </div>
                            <div className="local-step-body">
                              <div className="local-step-line">
                                <strong>{step.label}</strong>
                                <span
                                  className={`local-step-status status-${step.status}`}
                                >
                                  {statusLabel(step.status)}
                                </span>
                                <time>{timeLabel(step.createdAt)}</time>
                              </div>
                              {step.arguments && (
                                <details>
                                  <summary>Tool arguments</summary>
                                  <pre>{step.arguments}</pre>
                                </details>
                              )}
                              {step.detail && (
                                <details>
                                  <summary>Result details</summary>
                                  <pre>{step.detail}</pre>
                                </details>
                              )}
                            </div>
                          </article>
                        ))}
                      </div>
                    )}
                    {selectedRun.message && (
                      <div className="local-final-answer">
                        <span className="local-eyebrow">AGENT RESPONSE</span>
                        <p>{selectedRun.message}</p>
                      </div>
                    )}
                    {selectedRun.error && (
                      <div className="local-run-error">
                        <AlertTriangle size={14} />
                        {selectedRun.error}
                      </div>
                    )}
                    {selectedRun.steps.length === 0 &&
                      !selectedRun.pendingApproval &&
                      selectedRun.status === "running" && (
                        <div className="local-waiting">
                          <LoaderCircle size={14} className="local-spin" />{" "}
                          Waiting for the model…
                        </div>
                      )}
                  </div>
                )}
              </div>
            )}
          </section>
        </section>

        <aside className="local-side-column">
          <section className="local-panel local-model-panel">
            <div className="local-panel-title">
              <div>
                <span className="local-eyebrow">USER-CONTROLLED BACKEND</span>
                <h2>Model connection</h2>
              </div>
              <Cpu size={18} />
            </div>
            <p className="local-panel-intro">
              Choose where inference happens. APEX does not silently select a
              hosted provider.
            </p>
            <label className="local-field">
              <span>Provider type</span>
              <select
                value={provider}
                onChange={event => changeModel("provider", event.target.value)}
              >
                <option value="ollama">Ollama · local</option>
                <option value="openai-compatible">OpenAI-compatible API</option>
              </select>
            </label>
            <label className="local-field">
              <span>Base URL</span>
              <input
                value={baseUrl}
                onChange={event => changeModel("baseUrl", event.target.value)}
                placeholder="http://127.0.0.1:11434/v1"
                autoComplete="url"
              />
            </label>
            <label className="local-field">
              <span>Model ID</span>
              <input
                value={modelId}
                onChange={event => changeModel("modelId", event.target.value)}
                placeholder={
                  provider === "ollama" ? "qwen3.5:4b" : "provider/model-id"
                }
                autoComplete="off"
              />
            </label>
            {provider === "openai-compatible" && (
              <label className="local-field">
                <span>
                  Provider API key{" "}
                  <small>
                    {status.model?.apiKeyConfigured
                      ? "saved on this computer"
                      : "optional if endpoint needs no key"}
                  </small>
                </span>
                <div className="local-key-input">
                  <KeyRound size={14} />
                  <input
                    type="password"
                    value={apiKey}
                    onChange={event =>
                      changeModel("apiKey", event.target.value)
                    }
                    placeholder={
                      status.model?.apiKeyConfigured
                        ? "Leave blank to keep saved key"
                        : "Paste key; stored encrypted locally"
                    }
                    autoComplete="new-password"
                  />
                </div>
              </label>
            )}
            {provider === "ollama" && (
              <div className="local-provider-note">
                <LockKeyhole size={14} />
                <span>
                  Local Ollama needs no provider API key. APEX sends inference
                  requests to the configured endpoint.
                </span>
              </div>
            )}
            <div className="local-model-actions">
              <button
                className="local-button local-button-secondary"
                onClick={() => void testModel()}
                disabled={busyAction === "test-model" || !baseUrl || !modelId}
              >
                {busyAction === "test-model" ? (
                  <LoaderCircle size={14} className="local-spin" />
                ) : (
                  <RefreshCw size={14} />
                )}{" "}
                Test endpoint
              </button>
              <button
                className="local-button local-button-primary"
                onClick={() => void saveModel()}
                disabled={busyAction === "save-model" || !baseUrl || !modelId}
              >
                {busyAction === "save-model" ? (
                  <LoaderCircle size={14} className="local-spin" />
                ) : (
                  <Check size={14} />
                )}{" "}
                Save locally
              </button>
            </div>
            {testResult && (
              <div className="local-test-result">
                <Check size={13} />
                {testResult}
              </div>
            )}
            {status.model && (
              <div className="local-current-model">
                <span className="local-current-dot" />
                <div>
                  <small>ACTIVE MODEL</small>
                  <strong>{status.model.modelId}</strong>
                  <span>
                    {status.model.provider === "ollama"
                      ? "Ollama / local"
                      : status.model.baseUrl}
                  </span>
                </div>
                <ArrowUpRight size={13} />
              </div>
            )}
            <div className="local-model-caveat">
              <AlertTriangle size={13} />
              <span>
                The endpoint test checks model listing only. It does not verify
                tool-calling support; APEX may still fail with a model that
                cannot call tools.
              </span>
            </div>
          </section>

          <section className="local-panel local-security-panel">
            <div className="local-panel-title">
              <div>
                <span className="local-eyebrow">EXECUTION BOUNDARY</span>
                <h2>Local by default</h2>
              </div>
              <ShieldCheck size={18} />
            </div>
            <div className="local-security-item">
              <Check size={14} />
              <span>
                HTTP listener bound to <code>127.0.0.1</code>
              </span>
            </div>
            <div className="local-security-item">
              <Check size={14} />
              <span>
                Project file tools restricted to the selected workspace
              </span>
            </div>
            <div className="local-security-item">
              <Check size={14} />
              <span>Browser-driven shell is disabled</span>
            </div>
            <div className="local-security-item caution">
              <AlertTriangle size={14} />
              <span>
                Loopback is not an OS sandbox. Do not run APEX on untrusted
                workspaces with sensitive host access.
              </span>
            </div>
          </section>

          <section className="local-install-card">
            <div className="local-install-icon">
              <Terminal size={17} />
            </div>
            <div>
              <strong>Built for your machine</strong>
              <span>
                CLI and desktop use the local runtime. Cloud model calls go
                directly to your selected provider.
              </span>
            </div>
          </section>
          <a className="local-back-link" href="/preview">
            View project overview <ArrowUpRight size={13} />
          </a>
        </aside>
      </div>
      <footer className="local-footer">
        <span>APEX LOCAL · YOUR MODEL · YOUR WORKSPACE</span>
        <span>Run data is stored in your local APEX config directory.</span>
      </footer>
    </main>
  );
}
