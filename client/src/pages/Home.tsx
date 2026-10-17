import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Check,
  ChevronDown,
  Clock3,
  Code2,
  Database,
  FileText,
  GitBranch,
  Globe2,
  History,
  KeyRound,
  Layers3,
  LoaderCircle,
  LockKeyhole,
  LogOut,
  Menu,
  MessageSquareText,
  Plus,
  RefreshCw,
  Search,
  Send,
  Settings2,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Trash2,
  Workflow,
  X,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { trpc } from "@/lib/trpc";
import {
  CliPanel,
  PluginsPanel,
  SandboxPanel,
  SkillsPanel,
} from "@/components/HarnessPanels";

type Section =
  | "agent"
  | "models"
  | "bridges"
  | "skills"
  | "plugins"
  | "cli"
  | "security"
  | "automations"
  | "runs"
  | "workspace"
  | "approvals"
  | "settings";
type ModelKind = "api" | "server" | "local";
type ModelDraft = {
  name: string;
  kind: ModelKind;
  baseUrl: string;
  modelId: string;
  apiKey: string;
};
type BridgeDraft = { name: string; endpoint: string; apiKey: string };

const sections: Array<{ id: Section; label: string; icon: LucideIcon }> = [
  { id: "agent", label: "Agent", icon: Sparkles },
  { id: "models", label: "Models", icon: Layers3 },
  { id: "bridges", label: "Agent bridges", icon: GitBranch },
  { id: "skills", label: "Skills", icon: BookOpen },
  { id: "plugins", label: "API plugins", icon: Zap },
  { id: "cli", label: "CLI", icon: Code2 },
  { id: "security", label: "Security & sandbox", icon: ShieldAlert },
  { id: "automations", label: "Automations", icon: Workflow },
  { id: "runs", label: "Run history", icon: History },
  { id: "workspace", label: "Memory & files", icon: Database },
  { id: "approvals", label: "Approvals", icon: ShieldCheck },
  { id: "settings", label: "Settings", icon: Settings2 },
];

const sectionCopy: Record<
  Section,
  { eyebrow: string; title: string; description: string }
> = {
  agent: {
    eyebrow: "APEX CORE",
    title: "Agent workspace",
    description:
      "Give APEX a goal. Its own tools, memory, and run trace stay visible.",
  },
  models: {
    eyebrow: "YOUR MODEL, YOUR CHOICE",
    title: "Model backends",
    description:
      "Connect an API, compatible server, or local model that APEX can actually reach.",
  },
  bridges: {
    eyebrow: "OPTIONAL DELEGATION",
    title: "Agent bridges",
    description:
      "APEX works alone. Add an external agent only when you choose to delegate.",
  },
  skills: {
    eyebrow: "USER-CONTROLLED CAPABILITIES",
    title: "Skills",
    description:
      "Give APEX reusable instructions without silently granting code or new permissions.",
  },
  plugins: {
    eyebrow: "BOUNDED EXTENSIONS",
    title: "Read-only API plugins",
    description:
      "Add tested GET-only data sources and approve their use one run at a time.",
  },
  cli: {
    eyebrow: "ONE RUNTIME, MANY SURFACES",
    title: "APEX CLI",
    description:
      "Use the same run history and policy from a terminal, or work locally with explicit limits.",
  },
  security: {
    eyebrow: "HONEST CAPABILITY BOUNDARIES",
    title: "Security & sandbox",
    description:
      "See what is enforced today, what is only a guardrail, and what still needs a real isolated runner.",
  },
  automations: {
    eyebrow: "PERSISTED WORKFLOWS",
    title: "Automations",
    description:
      "Save real workflow drafts. Triggers stay inactive until a durable worker is configured.",
  },
  runs: {
    eyebrow: "REAL EXECUTION RECORDS",
    title: "Run history",
    description:
      "Inspect actual APEX runs, step results, failures, and run limits.",
  },
  workspace: {
    eyebrow: "YOUR PRIVATE STATE",
    title: "Memory & workspace",
    description:
      "Manage real saved memories and versioned files owned by your account.",
  },
  approvals: {
    eyebrow: "HUMAN CONTROL",
    title: "Approvals",
    description:
      "Review persisted requests when an operation is configured to pause for your decision.",
  },
  settings: {
    eyebrow: "SECURITY & OPERATION",
    title: "Settings",
    description: "See which security controls are active on this instance.",
  },
};

function formatDate(value?: Date | string | null) {
  if (!value) return "—";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function relativeDate(value?: Date | string | null) {
  if (!value) return "Not checked";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "Not checked";
  const seconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
  if (seconds < 60) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86_400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86_400)}d ago`;
}

function StatusPill({ status }: { status: string }) {
  const normalized = status.toLowerCase().replace(/[^a-z0-9_-]/g, "-");
  return (
    <span className={`status-pill status-${normalized}`}>
      <i />
      {status.replaceAll("_", " ")}
    </span>
  );
}

function PageHeading({
  section,
  right,
}: {
  section: Section;
  right?: ReactNode;
}) {
  const copy = sectionCopy[section];
  return (
    <div className="page-heading">
      <div>
        <div className="eyebrow">{copy.eyebrow}</div>
        <h1>{copy.title}</h1>
        <p>{copy.description}</p>
      </div>
      {right}
    </div>
  );
}

function LoadingCard({
  label = "Loading saved workspace data…",
}: {
  label?: string;
}) {
  return (
    <div className="empty-card">
      <LoaderCircle className="spin" size={18} />
      <span>{label}</span>
    </div>
  );
}

function ErrorCard({
  message,
  retry,
}: {
  message: string;
  retry?: () => void;
}) {
  return (
    <div className="inline-error">
      <ShieldAlert size={16} />
      <span>{message}</span>
      {retry && (
        <button className="text-button" onClick={retry}>
          Retry
        </button>
      )}
    </div>
  );
}

export default function Home() {
  const { loading, user, logout } = useAuth();
  const authMode = trpc.auth.mode.useQuery(undefined, { retry: false });
  const trpcUtils = trpc.useUtils();
  const localLogin = trpc.auth.localLogin.useMutation();
  const [localUsername, setLocalUsername] = useState("");
  const [localPassword, setLocalPassword] = useState("");
  const [localLoginError, setLocalLoginError] = useState<string | null>(null);

  const submitLocalLogin = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLocalLoginError(null);
    localLogin.mutate(
      { username: localUsername, password: localPassword },
      {
        onSuccess: async () => {
          setLocalPassword("");
          await trpcUtils.auth.me.invalidate();
        },
        onError: error => setLocalLoginError(error.message),
      }
    );
  };

  if (loading)
    return (
      <div className="auth-screen">
        <div className="auth-mark">A</div>
        <LoaderCircle className="spin" size={19} />
        <span>Checking your workspace…</span>
      </div>
    );
  if (authMode.isLoading)
    return (
      <div className="auth-screen">
        <div className="auth-mark">A</div>
        <LoaderCircle className="spin" size={19} />
        <span>Checking sign-in mode…</span>
      </div>
    );
  if (authMode.isError)
    return (
      <div className="auth-screen">
        <div className="auth-card">
          <div className="eyebrow">WORKSPACE SIGN-IN</div>
          <h1>Sign-in unavailable</h1>
          <p>
            The instance could not confirm its configured login mode. No
            workspace data was loaded.
          </p>
          <a className="button button-secondary" href="/preview">
            View the public interface preview
          </a>
        </div>
      </div>
    );
  if (!user)
    return (
      <div className="auth-screen">
        <div className="auth-card">
          <div className="apex-glyph">
            <i />
            <i />
            <i />
          </div>
          <div className="eyebrow">OPEN-SOURCE AGENT CORE</div>
          <h1>APEX</h1>
          <p>
            One independent agent. A model you choose. Optional bridges when you
            want them.
          </p>
          {authMode.data?.mode === "local" ? (
            <form className="auth-form" onSubmit={submitLocalLogin}>
              <label>
                Owner username
                <input
                  autoComplete="username"
                  required
                  value={localUsername}
                  onChange={event => setLocalUsername(event.target.value)}
                />
              </label>
              <label>
                Password
                <input
                  autoComplete="current-password"
                  type="password"
                  required
                  value={localPassword}
                  onChange={event => setLocalPassword(event.target.value)}
                />
              </label>
              {localLoginError && (
                <div className="inline-error" role="alert">
                  {localLoginError}
                </div>
              )}
              <button
                className="button button-primary button-large"
                type="submit"
                disabled={localLogin.isPending}
              >
                {localLogin.isPending
                  ? "Signing in…"
                  : "Sign in to this instance"}
                <ArrowRight size={16} />
              </button>
            </form>
          ) : (
            <button
              className="button button-primary button-large"
              onClick={() => startLogin()}
            >
              Sign in to your workspace <ArrowRight size={16} />
            </button>
          )}
          <div className="auth-foot">
            <LockKeyhole size={13} /> Sign-in protects saved runs, files, and
            provider keys.
          </div>
          <a className="auth-preview-link" href="/preview">
            View the public, read-only interface preview
          </a>
        </div>
      </div>
    );
  return <AgentApp user={user} logout={logout} />;
}

function AgentApp({
  user,
  logout,
}: {
  user: { name?: string | null; email?: string | null };
  logout: () => Promise<void>;
}) {
  const [section, setSection] = useState<Section>("agent");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sessionId, setSessionId] = useState<string | undefined>();
  const [task, setTask] = useState("");
  const [allowBridges, setAllowBridges] = useState(false);
  const [allowPlugins, setAllowPlugins] = useState(false);
  const [selectedRunId, setSelectedRunId] = useState<string | undefined>();
  const [selectedFileId, setSelectedFileId] = useState<string | undefined>();
  const [workspaceTab, setWorkspaceTab] = useState<"memories" | "files">(
    "memories"
  );
  const [modelDraft, setModelDraft] = useState<ModelDraft>({
    name: "",
    kind: "api",
    baseUrl: "",
    modelId: "",
    apiKey: "",
  });
  const [bridgeDraft, setBridgeDraft] = useState<BridgeDraft>({
    name: "",
    endpoint: "",
    apiKey: "",
  });
  const [automationDraft, setAutomationDraft] = useState({
    name: "",
    description: "",
    triggerType: "manual" as "manual" | "schedule" | "webhook",
    taskPrompt: "",
  });
  const [memoryDraft, setMemoryDraft] = useState({ label: "", content: "" });
  const [search, setSearch] = useState("");
  const [showNewModel, setShowNewModel] = useState(false);
  const [showNewBridge, setShowNewBridge] = useState(false);
  const [showNewAutomation, setShowNewAutomation] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const utils = trpc.useUtils();

  const overview = trpc.apex.overview.useQuery(undefined, {
    refetchInterval: 10_000,
  });
  const models = trpc.apex.models.list.useQuery(undefined, {
    refetchInterval: 15_000,
  });
  const modelSetup = trpc.apex.models.setupStatus.useQuery();
  const bridges = trpc.apex.bridges.list.useQuery(undefined, {
    refetchInterval: 10_000,
  });
  const plugins = trpc.apex.plugins.list.useQuery(undefined, {
    refetchInterval: 15_000,
  });
  const sessions = trpc.apex.agent.sessions.useQuery();
  const runs = trpc.apex.agent.runs.useQuery(undefined, {
    refetchInterval: 3_000,
  });
  const workflows = trpc.apex.automations.list.useQuery();
  const memories = trpc.apex.memory.list.useQuery();
  const files = trpc.apex.workspace.list.useQuery();
  const approvals = trpc.apex.approvals.list.useQuery();

  const sessionMessages = trpc.apex.agent.messages.useQuery(
    { sessionId: sessionId ?? "00000000-0000-0000-0000-000000000000" },
    { enabled: Boolean(sessionId), refetchInterval: 2_000 }
  );
  const currentSession = sessions.data?.find(item => item.id === sessionId);
  const activeRun = useMemo(() => {
    const records = runs.data ?? [];
    if (selectedRunId)
      return records.find(item => item.id === selectedRunId) ?? records[0];
    return records.find(item => item.sessionId === sessionId) ?? records[0];
  }, [runs.data, selectedRunId, sessionId]);
  const runSteps = trpc.apex.agent.runSteps.useQuery(
    { runId: activeRun?.id ?? "00000000-0000-0000-0000-000000000000" },
    {
      enabled: Boolean(activeRun?.id),
      refetchInterval: activeRun?.status === "running" ? 1_500 : false,
    }
  );
  const selectedFile = files.data?.find(item => item.id === selectedFileId);
  const fileContent = trpc.apex.workspace.read.useQuery(
    { id: selectedFileId ?? "00000000-0000-0000-0000-000000000000" },
    { enabled: Boolean(selectedFileId) }
  );

  const refreshAll = async () => {
    await Promise.all([
      utils.apex.overview.invalidate(),
      utils.apex.models.list.invalidate(),
      utils.apex.bridges.list.invalidate(),
      utils.apex.plugins.list.invalidate(),
      utils.apex.agent.sessions.invalidate(),
      utils.apex.agent.runs.invalidate(),
      utils.apex.automations.list.invalidate(),
      utils.apex.memory.list.invalidate(),
      utils.apex.workspace.list.invalidate(),
      utils.apex.approvals.list.invalidate(),
    ]);
  };

  const createSession = trpc.apex.agent.createSession.useMutation({
    onSuccess: async record => {
      if (record) setSessionId(record.id);
      await utils.apex.agent.sessions.invalidate();
      setSection("agent");
      setMobileNav(false);
    },
    onError: error => toast.error(error.message),
  });

  const submitTask = trpc.apex.agent.submitTask.useMutation({
    onSuccess: async result => {
      setTask("");
      setAllowBridges(false);
      setAllowPlugins(false);
      setSelectedRunId(result.runId);
      await Promise.all([
        utils.apex.agent.messages.invalidate(),
        utils.apex.agent.runs.invalidate(),
        utils.apex.overview.invalidate(),
      ]);
      if (result.status === "blocked")
        toast.error(
          "Task saved, but APEX is blocked until a tested model is selected."
        );
      else if (result.status === "failed")
        toast.error("The run failed; inspect the saved trace for the error.");
      else toast.success("APEX run finished. Its real trace is saved.");
    },
    onError: error => toast.error(error.message),
  });

  const saveModel = trpc.apex.models.save.useMutation();
  const testModel = trpc.apex.models.test.useMutation();
  const setDefaultModel = trpc.apex.models.setDefault.useMutation();
  const deleteModel = trpc.apex.models.delete.useMutation();
  const saveBridge = trpc.apex.bridges.save.useMutation();
  const testBridge = trpc.apex.bridges.test.useMutation();
  const deleteBridge = trpc.apex.bridges.delete.useMutation();
  const createWorkflow = trpc.apex.automations.createDraft.useMutation();
  const runWorkflow = trpc.apex.automations.runNow.useMutation();
  const createMemory = trpc.apex.memory.create.useMutation();
  const deleteMemory = trpc.apex.memory.delete.useMutation();

  useEffect(() => {
    if (!sessionId && sessions.data?.length) setSessionId(sessions.data[0].id);
  }, [sessionId, sessions.data]);
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [sessionMessages.data?.length, submitTask.isPending]);
  useEffect(() => {
    if (runs.data?.[0]?.status === "running") setSelectedRunId(runs.data[0].id);
  }, [runs.data]);

  const defaultProvider = overview.data?.defaultProvider;
  const connectedBridgeCount =
    bridges.data?.filter(item => item.status === "connected").length ?? 0;
  const enabledPluginCount =
    plugins.data?.filter(
      item => item.enabled && item.testStatus === "connected"
    ).length ?? 0;
  const isBusy = submitTask.isPending;

  async function handleTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!sessionId) {
      const newSession = await createSession.mutateAsync({
        title: task.trim().slice(0, 80) || "New task",
      });
      if (!newSession) return;
      setSessionId(newSession.id);
      const result = await submitTask.mutateAsync({
        sessionId: newSession.id,
        task,
        allowBridges,
        allowPlugins,
      });
      setSelectedRunId(result.runId);
      return;
    }
    await submitTask.mutateAsync({
      sessionId,
      task,
      allowBridges,
      allowPlugins,
    });
  }

  async function handleModelSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const saved = await saveModel.mutateAsync({ ...modelDraft });
      setModelDraft({
        name: "",
        kind: "api",
        baseUrl: "",
        modelId: "",
        apiKey: "",
      });
      setShowNewModel(false);
      const checked = await testModel.mutateAsync({ id: saved.id });
      if (!overview.data?.defaultProvider)
        await setDefaultModel.mutateAsync({ id: saved.id });
      await refreshAll();
      toast.success(
        `Live model check passed for ${checked?.modelId ?? saved.modelId}.`
      );
    } catch (error) {
      await refreshAll();
      toast.error(
        error instanceof Error
          ? error.message
          : "Model connection could not be saved and checked."
      );
    }
  }

  async function handleBridgeSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const saved = await saveBridge.mutateAsync(bridgeDraft);
      setBridgeDraft({ name: "", endpoint: "", apiKey: "" });
      setShowNewBridge(false);
      const checked = await testBridge.mutateAsync({ id: saved.id });
      await refreshAll();
      toast.success(
        `Verified live APEX Bridge v1 endpoint: ${checked?.name ?? saved.name}.`
      );
    } catch (error) {
      await refreshAll();
      toast.error(
        error instanceof Error
          ? error.message
          : "Bridge connection could not be saved or tested."
      );
    }
  }

  async function handleAutomationSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      await createWorkflow.mutateAsync(automationDraft);
      setAutomationDraft({
        name: "",
        description: "",
        triggerType: "manual",
        taskPrompt: "",
      });
      setShowNewAutomation(false);
      await refreshAll();
      toast.success(
        "Saved as an inactive workflow draft. No trigger has been activated."
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Workflow draft could not be saved."
      );
    }
  }

  async function handleWorkflowRun(workflowId: string) {
    try {
      const result = await runWorkflow.mutateAsync({ workflowId });
      setSection("runs");
      setSessionId(result.sessionId);
      setSelectedRunId(result.runId);
      await refreshAll();
      if (result.status === "blocked")
        toast.error(
          "One-off workflow run was saved but is blocked on model setup."
        );
      else if (result.status === "failed")
        toast.error("The workflow run failed; inspect its saved trace.");
      else
        toast.success("One-off workflow run finished and its trace is saved.");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "The workflow could not be run."
      );
    }
  }

  async function handleMemorySave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      await createMemory.mutateAsync(memoryDraft);
      setMemoryDraft({ label: "", content: "" });
      await Promise.all([
        utils.apex.memory.list.invalidate(),
        utils.apex.overview.invalidate(),
      ]);
      toast.success("Memory saved to your account.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Memory could not be saved."
      );
    }
  }

  async function handleMemoryDelete(id: string, label: string) {
    if (!window.confirm(`Delete saved memory “${label}”?`)) return;
    try {
      await deleteMemory.mutateAsync({ id });
      await Promise.all([
        utils.apex.memory.list.invalidate(),
        utils.apex.overview.invalidate(),
      ]);
      toast.success("Memory deleted.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Memory could not be deleted."
      );
    }
  }

  async function handleModelDelete(id: string) {
    if (
      !window.confirm(
        "Remove this model profile and its encrypted API key? Existing run history will remain."
      )
    )
      return;
    try {
      await deleteModel.mutateAsync({ id });
      await refreshAll();
      toast.success("Model profile removed.");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Model profile could not be removed."
      );
    }
  }

  async function handleBridgeDelete(id: string, name: string) {
    if (
      !window.confirm(
        `Remove the bridge “${name}” and its encrypted credential?`
      )
    )
      return;
    try {
      await deleteBridge.mutateAsync({ id });
      await refreshAll();
      toast.success("Agent bridge removed.");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Agent bridge could not be removed."
      );
    }
  }

  const filteredRuns = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return (runs.data ?? []).filter(
      run =>
        !needle || `${run.task} ${run.status}`.toLowerCase().includes(needle)
    );
  }, [runs.data, search]);

  function renderAgent() {
    return (
      <>
        <PageHeading
          section="agent"
          right={
            <button
              className="button button-secondary"
              onClick={() => createSession.mutate({ title: "New task" })}
              disabled={createSession.isPending}
            >
              <Plus size={15} /> New session
            </button>
          }
        />
        <div className="agent-layout">
          <aside className="panel session-panel">
            <div className="panel-title">
              <div>
                <div className="eyebrow">YOUR SESSIONS</div>
                <h2>Task history</h2>
              </div>
              <button
                className="icon-button"
                title="New session"
                onClick={() => createSession.mutate({ title: "New task" })}
              >
                <Plus size={16} />
              </button>
            </div>
            <label className="search-field">
              <Search size={14} />
              <input
                value={search}
                onChange={event => setSearch(event.target.value)}
                placeholder="Search runs"
              />
            </label>
            <div className="session-list">
              {(sessions.data ?? [])
                .filter(
                  item =>
                    !search.trim() ||
                    item.title
                      .toLowerCase()
                      .includes(search.trim().toLowerCase())
                )
                .map(item => (
                  <button
                    className={`session-item ${sessionId === item.id ? "selected" : ""}`}
                    key={item.id}
                    onClick={() => {
                      setSessionId(item.id);
                      setSelectedRunId(undefined);
                    }}
                  >
                    <MessageSquareText size={15} />
                    <span>
                      <b>{item.title}</b>
                      <small>{relativeDate(item.updatedAt)}</small>
                    </span>
                  </button>
                ))}
              {!sessions.isLoading && sessions.data?.length === 0 && (
                <div className="micro-empty">
                  Your saved sessions will appear here.
                </div>
              )}
              {sessions.isLoading && (
                <div className="micro-empty">Loading saved sessions…</div>
              )}
            </div>
            <div className="session-footer">
              <span
                className={
                  defaultProvider?.testStatus === "connected"
                    ? "dot-green"
                    : "dot-muted"
                }
              />
              <span>
                {defaultProvider?.testStatus === "connected"
                  ? defaultProvider.modelId
                  : "No tested model"}
              </span>
              <button
                className="text-button"
                onClick={() => setSection("models")}
              >
                Configure
              </button>
            </div>
          </aside>

          <section className="panel chat-panel">
            <div className="chat-head">
              <div className="chat-title">
                <span className="apex-mini-mark">
                  <i />
                  <i />
                  <i />
                </span>
                <div>
                  <b>APEX</b>
                  <small>
                    {defaultProvider
                      ? `${defaultProvider.name} · ${defaultProvider.modelId}`
                      : "Connect a model to begin"}
                  </small>
                </div>
              </div>
              <div className="chat-head-right">
                {activeRun && <StatusPill status={activeRun.status} />}
                <span className="privacy-chip">
                  <LockKeyhole size={12} /> Private session
                </span>
              </div>
            </div>
            <div className="chat-messages">
              {!sessionId && (
                <div className="chat-empty">
                  <span className="hero-orbit">
                    <span className="apex-glyph">
                      <i />
                      <i />
                      <i />
                    </span>
                  </span>
                  <div className="eyebrow">YOUR OWN AGENT CORE</div>
                  <h2>What should APEX do?</h2>
                  <p>
                    APEX brings its own planning, memory, workspace tools, and
                    run trace. Choose the model that powers its reasoning.
                  </p>
                  <button
                    className="button button-soft"
                    onClick={() => createSession.mutate({ title: "New task" })}
                  >
                    <Plus size={14} /> Start a task session
                  </button>
                  {!defaultProvider && (
                    <button
                      className="text-link"
                      onClick={() => setSection("models")}
                    >
                      Connect a model first <ArrowRight size={13} />
                    </button>
                  )}
                </div>
              )}
              {sessionId && sessionMessages.isLoading && (
                <LoadingCard label="Loading this session…" />
              )}
              {sessionId && sessionMessages.isError && (
                <ErrorCard
                  message={sessionMessages.error.message}
                  retry={() => sessionMessages.refetch()}
                />
              )}
              {sessionId && sessionMessages.data?.length === 0 && (
                <div className="chat-empty compact">
                  <span className="apex-glyph small">
                    <i />
                    <i />
                    <i />
                  </span>
                  <div className="eyebrow">READY WHEN YOU ARE</div>
                  <h2>Start with an outcome.</h2>
                  <p>
                    APEX will only report actions that it actually performs. Its
                    tool use and errors will be saved in the run trace.
                  </p>
                  {!defaultProvider && (
                    <button
                      className="button button-secondary"
                      onClick={() => setSection("models")}
                    >
                      Set up a model backend <ArrowRight size={14} />
                    </button>
                  )}
                </div>
              )}
              {sessionMessages.data?.map(message => (
                <article
                  className={`chat-message ${message.role === "user" ? "from-user" : "from-apex"}`}
                  key={message.id}
                >
                  <span
                    className={`message-mark ${message.role === "user" ? "user-mark" : "apex-mark"}`}
                  >
                    {message.role === "user" ? (
                      user.name?.slice(0, 1).toUpperCase() || "U"
                    ) : (
                      <span className="apex-mini-mark tiny">
                        <i />
                        <i />
                        <i />
                      </span>
                    )}
                  </span>
                  <div className="message-body">
                    <div className="message-meta">
                      <b>{message.role === "user" ? "You" : "APEX"}</b>
                      <time>{formatDate(message.createdAt)}</time>
                    </div>
                    <div className="message-content">{message.content}</div>
                  </div>
                </article>
              ))}
              {isBusy && (
                <div className="thinking-row">
                  <span className="apex-mini-mark tiny">
                    <i />
                    <i />
                    <i />
                  </span>
                  <span>
                    APEX is working through the task. Run steps are being
                    recorded.
                  </span>
                  <LoaderCircle className="spin" size={14} />
                </div>
              )}
              <div ref={chatBottomRef} />
            </div>
            <form className="composer" onSubmit={handleTask}>
              {connectedBridgeCount > 0 && (
                <label className="bridge-consent">
                  <input
                    type="checkbox"
                    checked={allowBridges}
                    onChange={event => setAllowBridges(event.target.checked)}
                  />
                  <span>
                    Allow APEX to delegate this task to a connected agent
                  </span>
                  <small>
                    {allowBridges
                      ? "Recent conversation context will be shared with the selected bridge."
                      : "Off by default. No task context leaves APEX."}
                  </small>
                </label>
              )}
              {enabledPluginCount > 0 && (
                <label className="bridge-consent plugin-consent">
                  <input
                    type="checkbox"
                    checked={allowPlugins}
                    onChange={event => setAllowPlugins(event.target.checked)}
                  />
                  <span>Allow read-only API Plugins for this run</span>
                  <small>
                    {allowPlugins
                      ? "Only tool-supplied query values go to a tested endpoint."
                      : "Off by default. No API Plugin receives data."}
                  </small>
                </label>
              )}
              <textarea
                value={task}
                onChange={event => setTask(event.target.value)}
                maxLength={12_000}
                placeholder={
                  defaultProvider
                    ? "Describe the outcome you want…"
                    : "Connect a tested model backend before asking APEX to run a task…"
                }
                disabled={isBusy}
                onKeyDown={event => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    event.currentTarget.form?.requestSubmit();
                  }
                }}
              />
              <div className="composer-foot">
                <span>
                  <kbd>Enter</kbd> send · <kbd>Shift + Enter</kbd> new line
                </span>
                <span className="composer-actions">
                  <span>{task.length.toLocaleString()}/12,000</span>
                  <button
                    className="send-button"
                    aria-label="Send task to APEX"
                    disabled={
                      !task.trim() ||
                      isBusy ||
                      (!sessionId && createSession.isPending)
                    }
                  >
                    {isBusy ? (
                      <LoaderCircle className="spin" size={16} />
                    ) : (
                      <Send size={16} />
                    )}
                  </button>
                </span>
              </div>
            </form>
            <div className="chat-disclosure">
              <ShieldCheck size={13} /> Tool calls are validated server-side.
              API keys never enter model prompts.
            </div>
          </section>

          <aside className="right-rail">
            <section className="panel trace-panel">
              <div className="panel-title">
                <div>
                  <div className="eyebrow">RUN TRACE</div>
                  <h2>
                    {activeRun
                      ? `Run ${activeRun.id.slice(0, 8)}`
                      : "No run selected"}
                  </h2>
                </div>
                {activeRun && <StatusPill status={activeRun.status} />}
              </div>
              {activeRun ? (
                <>
                  <p className="trace-task">{activeRun.task}</p>
                  {activeRun.error && (
                    <div className="trace-error">
                      <ShieldAlert size={14} />
                      {activeRun.error}
                    </div>
                  )}
                  <div className="trace-steps">
                    {runSteps.data?.map((step, index) => (
                      <div className="trace-step" key={step.id}>
                        <span className={`trace-node ${step.status}`}>
                          <i />
                        </span>
                        <div className="trace-step-content">
                          <b>{step.label}</b>
                          <small>
                            {step.kind.replaceAll("_", " ")} · {step.status}
                          </small>
                          {step.detail && <p>{step.detail}</p>}
                        </div>
                        {index < (runSteps.data?.length ?? 0) - 1 && (
                          <span className="trace-link" />
                        )}
                      </div>
                    ))}
                    {runSteps.isLoading && (
                      <div className="micro-empty">Loading saved steps…</div>
                    )}
                    {runSteps.data?.length === 0 && (
                      <div className="micro-empty">
                        No trace steps were recorded.
                      </div>
                    )}
                  </div>
                  {activeRun.result && (
                    <div className="trace-result">
                      <div className="eyebrow">ACTUAL RESULT</div>
                      <p>{activeRun.result}</p>
                    </div>
                  )}
                  <div className="trace-footer">
                    <Clock3 size={13} /> Started{" "}
                    {formatDate(activeRun.startedAt)}
                    {activeRun.finishedAt && (
                      <> · finished {formatDate(activeRun.finishedAt)}</>
                    )}
                  </div>
                </>
              ) : (
                <div className="micro-empty">
                  When APEX runs a task, its actual model and tool steps will
                  appear here.
                </div>
              )}
            </section>
            <section className="panel runtime-panel">
              <div className="eyebrow">INSTANCE STATUS</div>
              <div className="runtime-item">
                <span
                  className={
                    defaultProvider?.testStatus === "connected"
                      ? "dot-green"
                      : "dot-amber"
                  }
                />
                <span>Model backend</span>
                <b>
                  {defaultProvider?.testStatus === "connected"
                    ? "Tested"
                    : "Needs setup"}
                </b>
              </div>
              <div className="runtime-item">
                <span
                  className={connectedBridgeCount ? "dot-green" : "dot-muted"}
                />
                <span>Optional bridges</span>
                <b>{connectedBridgeCount} live</b>
              </div>
              <div className="runtime-item">
                <span className="dot-muted" />
                <span>Scheduled worker</span>
                <b>Not configured</b>
              </div>
              <button
                className="text-button"
                onClick={() => setSection("settings")}
              >
                Security & instance settings <ArrowRight size={12} />
              </button>
            </section>
          </aside>
        </div>
      </>
    );
  }

  function renderModels() {
    const setup = modelSetup.data;
    const defaultId = overview.data?.defaultProvider?.id;
    return (
      <>
        <PageHeading
          section="models"
          right={
            <button
              className="button button-primary"
              onClick={() => setShowNewModel(value => !value)}
            >
              <Plus size={15} /> Add model backend
            </button>
          }
        />
        <div className="notice notice-neutral">
          <KeyRound size={17} />
          <div>
            <b>Bring your own backend.</b>
            <span>
              APEX only sends prompts to the endpoint you configure. This form
              supports OpenAI-compatible <code>/v1/models</code> and{" "}
              <code>/v1/chat/completions</code>.
            </span>
          </div>
        </div>
        {setup && !setup.encryptedCredentialStorageReady && (
          <div className="notice notice-warn">
            <ShieldAlert size={17} />
            <div>
              <b>Encrypted API-key storage is not enabled.</b>
              <span>
                The instance operator must set <code>APEX_ENCRYPTION_KEY</code>{" "}
                before API keys can be stored. Local/server profiles without
                keys can still be tested if their endpoint allows it.
              </span>
            </div>
            <button
              className="text-button"
              onClick={() => setSection("settings")}
            >
              Setup guidance
            </button>
          </div>
        )}
        {showNewModel && (
          <form className="panel form-panel" onSubmit={handleModelSave}>
            <div className="panel-title">
              <div>
                <div className="eyebrow">MODEL PROFILE</div>
                <h2>Connect a model APEX can use</h2>
              </div>
              <button
                type="button"
                className="icon-button"
                aria-label="Close model form"
                onClick={() => setShowNewModel(false)}
              >
                <X size={17} />
              </button>
            </div>
            <div className="form-grid two-col">
              <label>
                Connection name
                <input
                  required
                  value={modelDraft.name}
                  onChange={event =>
                    setModelDraft({ ...modelDraft, name: event.target.value })
                  }
                  placeholder="My local model"
                  maxLength={120}
                />
              </label>
              <label>
                Backend type
                <select
                  value={modelDraft.kind}
                  onChange={event =>
                    setModelDraft({
                      ...modelDraft,
                      kind: event.target.value as ModelKind,
                    })
                  }
                >
                  <option value="api">Provider API</option>
                  <option value="server">Compatible server</option>
                  <option value="local">Local model server</option>
                </select>
              </label>
              <label className="span-two">
                OpenAI-compatible base URL
                <input
                  required
                  type="url"
                  value={modelDraft.baseUrl}
                  onChange={event =>
                    setModelDraft({
                      ...modelDraft,
                      baseUrl: event.target.value,
                    })
                  }
                  placeholder={
                    modelDraft.kind === "local"
                      ? "http://localhost:11434/v1"
                      : "https://api.example.com/v1"
                  }
                  maxLength={2048}
                />
                <small>
                  {modelDraft.kind === "local"
                    ? "The APEX server must be on the same machine/network. Hosted Preview cannot access your desktop's localhost."
                    : "Enter a base URL, not a URL with credentials or a query string."}
                </small>
              </label>
              <label>
                Model identifier
                <input
                  required
                  value={modelDraft.modelId}
                  onChange={event =>
                    setModelDraft({
                      ...modelDraft,
                      modelId: event.target.value,
                    })
                  }
                  placeholder="model-name"
                  maxLength={200}
                />
              </label>
              <label>
                API key{modelDraft.kind === "local" ? " (optional)" : ""}
                <input
                  type="password"
                  autoComplete="new-password"
                  value={modelDraft.apiKey}
                  onChange={event =>
                    setModelDraft({ ...modelDraft, apiKey: event.target.value })
                  }
                  placeholder={
                    modelDraft.apiKey
                      ? "Key entered"
                      : modelDraft.kind === "api"
                        ? "Required for provider APIs"
                        : "Optional"
                  }
                  maxLength={16_000}
                />
                <small>
                  Not shown again. Sent to APEX over HTTPS, encrypted before
                  database storage.
                </small>
              </label>
            </div>
            <div className="form-note">
              <ShieldCheck size={14} />
              <span>
                Saving does not yet make it the active model. APEX runs a real,
                non-generative <code>/models</code> check first; then you can
                select it.
              </span>
            </div>
            <div className="form-actions">
              <button
                type="button"
                className="button button-secondary"
                onClick={() => setShowNewModel(false)}
              >
                Cancel
              </button>
              <button
                className="button button-primary"
                disabled={saveModel.isPending || testModel.isPending}
              >
                {saveModel.isPending || testModel.isPending ? (
                  <LoaderCircle className="spin" size={15} />
                ) : (
                  <Check size={15} />
                )}{" "}
                Save & test
              </button>
            </div>
          </form>
        )}
        {models.isLoading ? (
          <LoadingCard />
        ) : models.isError ? (
          <ErrorCard
            message={models.error.message}
            retry={() => models.refetch()}
          />
        ) : (
          <div className="record-list">
            {(models.data ?? []).map(model => (
              <article className="panel record-card" key={model.id}>
                <div className="record-icon">
                  <Layers3 size={17} />
                </div>
                <div className="record-main">
                  <div className="record-title-row">
                    <h3>{model.name}</h3>
                    <StatusPill status={model.testStatus} />
                    {model.id === defaultId && (
                      <span className="default-chip">
                        <Check size={11} /> APEX default
                      </span>
                    )}
                  </div>
                  <p className="record-subtitle">
                    {model.modelId} <span>·</span>{" "}
                    {model.kind.replaceAll("_", " ")}
                  </p>
                  <code className="endpoint-label">{model.baseUrl}</code>
                  <div className="record-meta">
                    <span>
                      {model.hasApiKey ? (
                        <>
                          <LockKeyhole size={12} /> Encrypted key stored
                        </>
                      ) : (
                        <>
                          <Globe2 size={12} /> No API key
                        </>
                      )}
                    </span>
                    <span>Checked {relativeDate(model.testedAt)}</span>
                    {model.testDetail && <span>{model.testDetail}</span>}
                  </div>
                </div>
                <div className="record-actions">
                  <button
                    className="button button-soft"
                    disabled={testModel.isPending}
                    onClick={async () => {
                      try {
                        await testModel.mutateAsync({ id: model.id });
                        await refreshAll();
                        toast.success("Model endpoint check passed.");
                      } catch (error) {
                        await refreshAll();
                        toast.error(
                          error instanceof Error
                            ? error.message
                            : "Model check failed."
                        );
                      }
                    }}
                  >
                    <RefreshCw size={13} /> Test
                  </button>
                  {model.testStatus === "connected" &&
                    model.id !== defaultId && (
                      <button
                        className="button button-secondary"
                        onClick={async () => {
                          try {
                            await setDefaultModel.mutateAsync({ id: model.id });
                            await refreshAll();
                            toast.success("Default APEX model updated.");
                          } catch (error) {
                            toast.error(
                              error instanceof Error
                                ? error.message
                                : "Could not select model."
                            );
                          }
                        }}
                      >
                        Use for APEX
                      </button>
                    )}
                  <button
                    className="icon-button danger-button"
                    aria-label={`Remove ${model.name}`}
                    onClick={() => handleModelDelete(model.id)}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </article>
            ))}
            {models.data?.length === 0 && (
              <div className="empty-card">
                <Layers3 size={18} />
                <div>
                  <b>No model backends configured.</b>
                  <span>
                    Connect an API, compatible server, or reachable local model
                    to power APEX.
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
        <div className="info-strip">
          <LockKeyhole size={15} />
          <span>
            API credentials are encrypted with AES-256-GCM before storage. They
            are never returned to the browser or inserted into the model prompt.
          </span>
        </div>
      </>
    );
  }

  function renderBridges() {
    return (
      <>
        <PageHeading
          section="bridges"
          right={
            <button
              className="button button-primary"
              onClick={() => setShowNewBridge(value => !value)}
            >
              <Plus size={15} /> Add APEX Bridge
            </button>
          }
        />
        <div className="notice notice-neutral">
          <GitBranch size={17} />
          <div>
            <b>APEX remains the primary agent.</b>
            <span>
              Bridges are optional tools—not dependencies. Delegation is off by
              default, and task context is sent only when you enable it for a
              run.
            </span>
          </div>
        </div>
        {showNewBridge && (
          <form className="panel form-panel" onSubmit={handleBridgeSave}>
            <div className="panel-title">
              <div>
                <div className="eyebrow">APEX BRIDGE V1</div>
                <h2>Connect an agent endpoint</h2>
              </div>
              <button
                type="button"
                className="icon-button"
                aria-label="Close bridge form"
                onClick={() => setShowNewBridge(false)}
              >
                <X size={17} />
              </button>
            </div>
            <div className="form-grid">
              <label>
                Display name
                <input
                  required
                  value={bridgeDraft.name}
                  onChange={event =>
                    setBridgeDraft({ ...bridgeDraft, name: event.target.value })
                  }
                  placeholder="Research agent"
                  maxLength={120}
                />
              </label>
              <label>
                Bridge base URL
                <input
                  required
                  type="url"
                  value={bridgeDraft.endpoint}
                  onChange={event =>
                    setBridgeDraft({
                      ...bridgeDraft,
                      endpoint: event.target.value,
                    })
                  }
                  placeholder="https://your-agent.example/api/apex"
                  maxLength={2048}
                />
                <small>
                  Must implement <code>GET /health</code> and{" "}
                  <code>POST /run</code> as documented in{" "}
                  <a
                    href="/docs/apex-bridge-v1.md"
                    target="_blank"
                    rel="noreferrer"
                  >
                    APEX Bridge v1
                  </a>
                  .
                </small>
              </label>
              <label>
                Bearer credential (optional)
                <input
                  type="password"
                  autoComplete="new-password"
                  value={bridgeDraft.apiKey}
                  onChange={event =>
                    setBridgeDraft({
                      ...bridgeDraft,
                      apiKey: event.target.value,
                    })
                  }
                  placeholder="Stored encrypted; never shown again"
                  maxLength={16_000}
                />
              </label>
            </div>
            <div className="form-note">
              <ShieldAlert size={14} />
              <span>
                Only connect an endpoint you trust. APEX checks its declared
                protocol live; declarations are not security permissions.
              </span>
            </div>
            <div className="form-actions">
              <button
                type="button"
                className="button button-secondary"
                onClick={() => setShowNewBridge(false)}
              >
                Cancel
              </button>
              <button
                className="button button-primary"
                disabled={saveBridge.isPending || testBridge.isPending}
              >
                {saveBridge.isPending || testBridge.isPending ? (
                  <LoaderCircle className="spin" size={15} />
                ) : (
                  <Check size={15} />
                )}{" "}
                Save & verify
              </button>
            </div>
          </form>
        )}
        {bridges.isLoading ? (
          <LoadingCard />
        ) : bridges.isError ? (
          <ErrorCard
            message={bridges.error.message}
            retry={() => bridges.refetch()}
          />
        ) : (
          <div className="record-list">
            {(bridges.data ?? []).map(bridge => (
              <article className="panel record-card" key={bridge.id}>
                <div className="record-icon bridge-icon">
                  <GitBranch size={17} />
                </div>
                <div className="record-main">
                  <div className="record-title-row">
                    <h3>{bridge.name}</h3>
                    <StatusPill status={bridge.status} />
                  </div>
                  <p className="record-subtitle">
                    Optional bridge <span>·</span> APEX Bridge v1
                  </p>
                  <code className="endpoint-label">{bridge.endpoint}</code>
                  <div className="record-meta">
                    <span>
                      {bridge.hasApiKey ? (
                        <>
                          <LockKeyhole size={12} /> Encrypted bearer credential
                        </>
                      ) : (
                        "No bearer credential"
                      )}
                    </span>
                    <span>Checked {relativeDate(bridge.testedAt)}</span>
                    {bridge.statusDetail && <span>{bridge.statusDetail}</span>}
                  </div>
                </div>
                <div className="record-actions">
                  <button
                    className="button button-soft"
                    disabled={testBridge.isPending}
                    onClick={async () => {
                      try {
                        await testBridge.mutateAsync({ id: bridge.id });
                        await refreshAll();
                        toast.success("Live bridge protocol check passed.");
                      } catch (error) {
                        await refreshAll();
                        toast.error(
                          error instanceof Error
                            ? error.message
                            : "Bridge check failed."
                        );
                      }
                    }}
                  >
                    <RefreshCw size={13} /> Test
                  </button>
                  <button
                    className="icon-button danger-button"
                    aria-label={`Remove ${bridge.name}`}
                    onClick={() => handleBridgeDelete(bridge.id, bridge.name)}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </article>
            ))}
            {bridges.data?.length === 0 && (
              <div className="empty-card">
                <GitBranch size={18} />
                <div>
                  <b>No external-agent bridges.</b>
                  <span>
                    APEX can run its own tools without any bridge. Add an
                    endpoint only when you intend to delegate.
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
        <section className="panel protocol-card">
          <div className="protocol-icon">
            <Code2 size={17} />
          </div>
          <div>
            <div className="eyebrow">OPEN EXTENSION CONTRACT</div>
            <h3>APEX Bridge Protocol v1</h3>
            <p>
              One small health/run protocol lets the community write bridges for
              independently operated agents. Native adapters are separate
              drivers; APEX will never claim a product is connected because it
              merely appears in a catalog.
            </p>
            <a
              className="text-link"
              href="/docs/apex-bridge-v1.md"
              target="_blank"
              rel="noreferrer"
            >
              Read the protocol <ArrowUpRight size={13} />
            </a>
          </div>
        </section>
        <div className="unsupported-note">
          <span className="dot-amber" />
          <span>
            Meta's Muse Assistant has no verified public control API in current
            research; this build does not offer a fake connector.
          </span>
        </div>
      </>
    );
  }

  function renderAutomations() {
    return (
      <>
        <PageHeading
          section="automations"
          right={
            <button
              className="button button-primary"
              onClick={() => setShowNewAutomation(value => !value)}
            >
              <Plus size={15} /> New workflow draft
            </button>
          }
        />
        <div className="notice notice-warn">
          <Clock3 size={16} />
          <div>
            <b>Schedule worker not configured.</b>
            <span>
              APEX saves real drafts. Scheduled and webhook triggers remain
              inactive until a durable worker/callback is configured and
              authenticated.
            </span>
          </div>
        </div>
        {showNewAutomation && (
          <form className="panel form-panel" onSubmit={handleAutomationSave}>
            <div className="panel-title">
              <div>
                <div className="eyebrow">INACTIVE DRAFT</div>
                <h2>Define an APEX workflow</h2>
              </div>
              <button
                type="button"
                className="icon-button"
                aria-label="Close workflow form"
                onClick={() => setShowNewAutomation(false)}
              >
                <X size={17} />
              </button>
            </div>
            <div className="form-grid two-col">
              <label>
                Name
                <input
                  required
                  value={automationDraft.name}
                  onChange={event =>
                    setAutomationDraft({
                      ...automationDraft,
                      name: event.target.value,
                    })
                  }
                  maxLength={160}
                  placeholder="Weekly project summary"
                />
              </label>
              <label>
                Intended trigger
                <select
                  value={automationDraft.triggerType}
                  onChange={event =>
                    setAutomationDraft({
                      ...automationDraft,
                      triggerType: event.target
                        .value as typeof automationDraft.triggerType,
                    })
                  }
                >
                  <option value="manual">Manual</option>
                  <option value="schedule">Schedule (draft only)</option>
                  <option value="webhook">Webhook (draft only)</option>
                </select>
              </label>
              <label className="span-two">
                Description
                <input
                  required
                  value={automationDraft.description}
                  onChange={event =>
                    setAutomationDraft({
                      ...automationDraft,
                      description: event.target.value,
                    })
                  }
                  maxLength={2000}
                  placeholder="What should this workflow accomplish?"
                />
              </label>
              <label className="span-two">
                Task prompt
                <textarea
                  required
                  value={automationDraft.taskPrompt}
                  onChange={event =>
                    setAutomationDraft({
                      ...automationDraft,
                      taskPrompt: event.target.value,
                    })
                  }
                  maxLength={8000}
                  placeholder="The task APEX should perform when a real trigger is configured…"
                />
              </label>
            </div>
            <div className="form-actions">
              <button
                type="button"
                className="button button-secondary"
                onClick={() => setShowNewAutomation(false)}
              >
                Cancel
              </button>
              <button
                className="button button-primary"
                disabled={createWorkflow.isPending}
              >
                <Check size={15} /> Save inactive draft
              </button>
            </div>
          </form>
        )}
        {workflows.isLoading ? (
          <LoadingCard />
        ) : workflows.isError ? (
          <ErrorCard
            message={workflows.error.message}
            retry={() => workflows.refetch()}
          />
        ) : (
          <div className="record-list">
            {(workflows.data ?? []).map(workflow => (
              <article className="panel workflow-card" key={workflow.id}>
                <div className="record-icon workflow-icon">
                  <Workflow size={17} />
                </div>
                <div className="record-main">
                  <div className="record-title-row">
                    <h3>{workflow.name}</h3>
                    <StatusPill status={workflow.status} />
                  </div>
                  <p className="workflow-description">{workflow.description}</p>
                  <div className="record-meta">
                    <span>
                      <Zap size={12} /> {workflow.triggerType} trigger
                    </span>
                    <span>Version {workflow.version}</span>
                    <span>Updated {relativeDate(workflow.updatedAt)}</span>
                  </div>
                </div>
                <div className="workflow-actions">
                  <button
                    type="button"
                    className="button button-secondary button-compact"
                    disabled={runWorkflow.isPending}
                    onClick={() => void handleWorkflowRun(workflow.id)}
                  >
                    <ArrowRight size={14} /> Run once
                  </button>
                  <div className="draft-label">TRIGGER INACTIVE</div>
                </div>
              </article>
            ))}
            {workflows.data?.length === 0 && (
              <div className="empty-card">
                <Workflow size={18} />
                <div>
                  <b>No saved workflows.</b>
                  <span>
                    Create an inactive draft. There are no sample automations or
                    fabricated run counts.
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </>
    );
  }

  function renderRuns() {
    return (
      <>
        <PageHeading
          section="runs"
          right={
            <button
              className="button button-secondary"
              onClick={() => {
                void utils.apex.agent.runs.invalidate();
              }}
            >
              <RefreshCw size={14} /> Refresh
            </button>
          }
        />
        <label className="search-field wide-search">
          <Search size={14} />
          <input
            value={search}
            onChange={event => setSearch(event.target.value)}
            placeholder="Filter actual runs by task or status"
          />
        </label>
        {runs.isLoading ? (
          <LoadingCard />
        ) : runs.isError ? (
          <ErrorCard
            message={runs.error.message}
            retry={() => runs.refetch()}
          />
        ) : (
          <div className="run-list">
            {filteredRuns.map(run => (
              <button
                className={`panel run-row ${selectedRunId === run.id ? "selected" : ""}`}
                key={run.id}
                onClick={() => setSelectedRunId(run.id)}
              >
                <span className="run-row-icon">
                  <Activity size={16} />
                </span>
                <span className="run-row-main">
                  <b>{run.task}</b>
                  <small>
                    {run.id.slice(0, 8)} · {formatDate(run.startedAt)}
                  </small>
                </span>
                <StatusPill status={run.status} />
                <span className="run-row-model">
                  {run.providerId
                    ? `Model ${run.providerId.slice(0, 8)}`
                    : "No model"}
                </span>
                <ArrowRight size={14} />
              </button>
            ))}
            {filteredRuns.length === 0 && (
              <div className="empty-card">
                <History size={18} />
                <div>
                  <b>No actual runs yet.</b>
                  <span>
                    Every task sent to APEX is recorded here. No sample activity
                    is shown.
                  </span>
                </div>
                <button
                  className="text-button"
                  onClick={() => setSection("agent")}
                >
                  Open agent
                </button>
              </div>
            )}
          </div>
        )}
        {activeRun && (
          <section className="panel selected-run-details">
            <div className="panel-title">
              <div>
                <div className="eyebrow">SELECTED RUN</div>
                <h2>{activeRun.task}</h2>
              </div>
              <StatusPill status={activeRun.status} />
            </div>
            {activeRun.error && <ErrorCard message={activeRun.error} />}
            {runSteps.data?.map(step => (
              <div className="detail-step" key={step.id}>
                <span className={`trace-node ${step.status}`}>
                  <i />
                </span>
                <div>
                  <b>{step.label}</b>
                  <small>
                    {step.kind} · {step.status} · {formatDate(step.startedAt)}
                  </small>
                  {step.detail && <p>{step.detail}</p>}
                </div>
              </div>
            ))}
            {activeRun.result && (
              <div className="run-result">
                <div className="eyebrow">SAVED RESULT</div>
                <p>{activeRun.result}</p>
              </div>
            )}
          </section>
        )}
      </>
    );
  }

  function renderWorkspace() {
    const memoryRows = memories.data ?? [];
    return (
      <>
        <PageHeading section="workspace" />
        <div className="workspace-tabs">
          <button
            className={workspaceTab === "memories" ? "active" : ""}
            onClick={() => setWorkspaceTab("memories")}
          >
            <BookOpen size={14} /> Memories{" "}
            <span>{overview.data?.counts.memories ?? 0}</span>
          </button>
          <button
            className={workspaceTab === "files" ? "active" : ""}
            onClick={() => setWorkspaceTab("files")}
          >
            <FileText size={14} /> Files{" "}
            <span>{overview.data?.counts.files ?? 0}</span>
          </button>
        </div>
        {workspaceTab === "memories" ? (
          <div className="workspace-grid">
            <form
              className="panel form-panel compact-form"
              onSubmit={handleMemorySave}
            >
              <div className="eyebrow">DURABLE, OWNER-SCOPED</div>
              <h2>Save a memory</h2>
              <p>
                APEX may read saved memories while helping you. Add only
                information you want it to retain.
              </p>
              <label>
                Label
                <input
                  required
                  value={memoryDraft.label}
                  onChange={event =>
                    setMemoryDraft({
                      ...memoryDraft,
                      label: event.target.value,
                    })
                  }
                  maxLength={160}
                  placeholder="Writing preference"
                />
              </label>
              <label>
                Memory
                <textarea
                  required
                  value={memoryDraft.content}
                  onChange={event =>
                    setMemoryDraft({
                      ...memoryDraft,
                      content: event.target.value,
                    })
                  }
                  maxLength={12_000}
                  placeholder="What should APEX remember?"
                />
              </label>
              <button
                className="button button-primary"
                disabled={createMemory.isPending}
              >
                <Plus size={14} /> Save memory
              </button>
            </form>
            <div className="memory-list">
              {memories.isLoading ? (
                <LoadingCard />
              ) : memories.isError ? (
                <ErrorCard
                  message={memories.error.message}
                  retry={() => memories.refetch()}
                />
              ) : (
                memoryRows.map(memory => (
                  <article className="panel memory-card" key={memory.id}>
                    <div className="memory-head">
                      <div>
                        <div className="eyebrow">SAVED MEMORY</div>
                        <h3>{memory.label}</h3>
                      </div>
                      <button
                        className="icon-button danger-button"
                        aria-label={`Delete ${memory.label}`}
                        onClick={() =>
                          handleMemoryDelete(memory.id, memory.label)
                        }
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                    <p>{memory.content}</p>
                    <small>Updated {relativeDate(memory.updatedAt)}</small>
                  </article>
                ))
              )}
              {!memories.isLoading && memoryRows.length === 0 && (
                <div className="empty-card">
                  <BookOpen size={18} />
                  <div>
                    <b>No memories saved.</b>
                    <span>
                      APEX will not invent personal history or claim a memory
                      exists when it has not been saved.
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="workspace-grid file-grid">
            <div className="panel files-panel">
              <div className="panel-title">
                <div>
                  <div className="eyebrow">VERSIONED WORKSPACE</div>
                  <h2>Files</h2>
                </div>
                <span className="subtle-text">
                  Older versions are retained.
                </span>
              </div>
              {files.isLoading ? (
                <LoadingCard />
              ) : files.isError ? (
                <ErrorCard
                  message={files.error.message}
                  retry={() => files.refetch()}
                />
              ) : (
                <div className="file-list">
                  {(files.data ?? []).map(file => (
                    <button
                      key={file.id}
                      className={`file-item ${selectedFileId === file.id ? "selected" : ""}`}
                      onClick={() => setSelectedFileId(file.id)}
                    >
                      <FileText size={15} />
                      <span>
                        <b>{file.path}</b>
                        <small>
                          Version {file.version} ·{" "}
                          {relativeDate(file.updatedAt)}
                        </small>
                      </span>
                      <ArrowRight size={13} />
                    </button>
                  ))}
                  {files.data?.length === 0 && (
                    <div className="micro-empty">
                      No workspace files yet. APEX may create versioned files
                      during a task.
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="panel file-preview">
              <div className="panel-title">
                <div>
                  <div className="eyebrow">FILE PREVIEW</div>
                  <h2>{selectedFile?.path ?? "Select a file"}</h2>
                </div>
                {selectedFile && (
                  <span className="version-chip">v{selectedFile.version}</span>
                )}
              </div>
              {fileContent.isLoading && <LoadingCard label="Reading file…" />}
              {fileContent.isError && (
                <ErrorCard message={fileContent.error.message} />
              )}
              {fileContent.data && <pre>{fileContent.data.content}</pre>}
              {!selectedFile && (
                <div className="micro-empty">
                  Files are stored inside your account's APEX workspace, not on
                  the host filesystem.
                </div>
              )}
            </div>
          </div>
        )}
      </>
    );
  }

  function renderApprovals() {
    return (
      <>
        <PageHeading section="approvals" />
        <div className="notice notice-neutral">
          <ShieldCheck size={17} />
          <div>
            <b>Approval records are persisted.</b>
            <span>
              This build currently exposes reversible APEX memory/workspace
              operations and disabled-by-default bridge delegation. No external
              publish/write action is represented as pending unless a real
              approval row exists.
            </span>
          </div>
        </div>
        {approvals.isLoading ? (
          <LoadingCard />
        ) : approvals.isError ? (
          <ErrorCard
            message={approvals.error.message}
            retry={() => approvals.refetch()}
          />
        ) : approvals.data?.length ? (
          <div className="record-list">
            {approvals.data.map(approval => (
              <article className="panel approval-row" key={approval.id}>
                <ShieldCheck size={17} />
                <div>
                  <b>{approval.action}</b>
                  <p>{approval.details}</p>
                  <StatusPill status={approval.status} />
                </div>
                <time>{formatDate(approval.createdAt)}</time>
              </article>
            ))}
          </div>
        ) : (
          <div className="empty-card">
            <Check size={18} />
            <div>
              <b>No pending approval requests.</b>
              <span>
                The inbox reflects the actual database; it contains no
                illustrative approval cards.
              </span>
            </div>
          </div>
        )}
      </>
    );
  }

  function renderSettings() {
    const setup = modelSetup.data;
    return (
      <>
        <PageHeading section="settings" />
        <div className="settings-grid">
          <section className="panel settings-card">
            <div className="settings-icon">
              <LockKeyhole size={17} />
            </div>
            <div className="eyebrow">CREDENTIAL STORAGE</div>
            <h2>API key encryption</h2>
            <p>
              Provider and bridge API keys use AES-256-GCM at rest. APEX does
              not return stored plaintext keys to the browser or put them into
              model messages.
            </p>
            <StatusPill
              status={
                setup?.encryptedCredentialStorageReady ? "ready" : "needs_setup"
              }
            />
            {!setup?.encryptedCredentialStorageReady && (
              <div className="command-note">
                <b>For a self-hosted instance</b>
                <code>openssl rand -hex 32</code>
                <span>
                  Set the resulting 64-character value as{" "}
                  <code>APEX_ENCRYPTION_KEY</code> in the server environment.
                  Never commit it.
                </span>
              </div>
            )}
          </section>
          <section className="panel settings-card">
            <div className="settings-icon">
              <Globe2 size={17} />
            </div>
            <div className="eyebrow">OUTBOUND NETWORK POLICY</div>
            <h2>Private endpoints</h2>
            <p>
              Local/private IP addresses are blocked by default to reduce
              server-side request forgery risk. Only an operator can enable
              private model/agent endpoints for a self-hosted instance.
            </p>
            <StatusPill
              status={
                setup?.privateEndpointsAllowed
                  ? "enabled"
                  : "blocked_by_default"
              }
            />
            {!setup?.privateEndpointsAllowed && (
              <div className="command-note">
                <b>For local-model users</b>
                <code>APEX_ALLOW_PRIVATE_ENDPOINTS=true</code>
                <span>
                  Set only on a self-hosted instance you control. Hosted Preview
                  cannot reach your desktop's localhost.
                </span>
              </div>
            )}
          </section>
          <section className="panel settings-card">
            <div className="settings-icon">
              <GitBranch size={17} />
            </div>
            <div className="eyebrow">EXTERNAL AGENT BRIDGES</div>
            <h2>Delegation stays opt-in</h2>
            <p>
              APEX can run without external agents. For a run with delegation
              enabled, APEX sends the task and up to eight recent messages to
              the connected bridge.
            </p>
            <StatusPill status="off_by_default" />
            <button
              className="text-button"
              onClick={() => setSection("bridges")}
            >
              Manage bridges <ArrowRight size={13} />
            </button>
          </section>
          <section className="panel settings-card">
            <div className="settings-icon">
              <Clock3 size={17} />
            </div>
            <div className="eyebrow">AUTOMATION RUNTIME</div>
            <h2>Schedulers and callbacks</h2>
            <p>
              Workflow drafts are durable but inactive. This instance has no
              configured scheduled worker or authenticated webhook callback.
            </p>
            <StatusPill status="not_configured" />
            <button
              className="text-button"
              onClick={() => setSection("automations")}
            >
              View workflow drafts <ArrowRight size={13} />
            </button>
          </section>
        </div>
      </>
    );
  }

  const pageContent =
    section === "agent" ? (
      renderAgent()
    ) : section === "models" ? (
      renderModels()
    ) : section === "bridges" ? (
      renderBridges()
    ) : section === "skills" ? (
      <>
        <PageHeading section="skills" />
        <SkillsPanel />
      </>
    ) : section === "plugins" ? (
      <>
        <PageHeading section="plugins" />
        <PluginsPanel />
      </>
    ) : section === "cli" ? (
      <>
        <PageHeading section="cli" />
        <CliPanel />
      </>
    ) : section === "security" ? (
      <>
        <PageHeading section="security" />
        <SandboxPanel />
      </>
    ) : section === "automations" ? (
      renderAutomations()
    ) : section === "runs" ? (
      renderRuns()
    ) : section === "workspace" ? (
      renderWorkspace()
    ) : section === "approvals" ? (
      renderApprovals()
    ) : (
      renderSettings()
    );

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileNav ? "open" : ""}`}>
        <div className="brand-lockup">
          <span className="apex-glyph">
            <i />
            <i />
            <i />
          </span>
          <span>
            <b>APEX</b>
            <small>OPEN AGENT CORE</small>
          </span>
          <button
            className="icon-button mobile-close"
            aria-label="Close menu"
            onClick={() => setMobileNav(false)}
          >
            <X size={17} />
          </button>
        </div>
        <div className="workspace-pill">
          <span className="workspace-avatar">
            {user.name?.slice(0, 1).toUpperCase() || "A"}
          </span>
          <span>
            <b>My workspace</b>
            <small>{user.email || "Private account"}</small>
          </span>
          <ChevronDown size={14} />
        </div>
        <div className="side-section-label">YOUR WORKSPACE</div>
        <nav className="side-nav" aria-label="Main navigation">
          {sections.map(item => {
            const Icon = item.icon;
            const count =
              item.id === "approvals"
                ? overview.data?.counts.pendingApprovals
                : item.id === "bridges"
                  ? overview.data?.counts.connectedBridges
                  : undefined;
            return (
              <button
                className={`nav-item ${section === item.id ? "active" : ""}`}
                key={item.id}
                onClick={() => {
                  setSection(item.id);
                  setMobileNav(false);
                  setSearch("");
                }}
              >
                <Icon size={16} />
                <span>{item.label}</span>
                {typeof count === "number" && count > 0 && (
                  <i className="nav-badge">{count}</i>
                )}
              </button>
            );
          })}
        </nav>
        <div className="sidebar-bottom">
          <div className="open-source-mark">
            <span className="open-dot" />
            Independent core <span>v0.1</span>
          </div>
          <div className="user-profile">
            <span className="user-avatar">
              {user.name?.slice(0, 1).toUpperCase() || "A"}
            </span>
            <span>
              <b>{user.name || "Workspace owner"}</b>
              <small>{user.email || "Signed in"}</small>
            </span>
            <button
              className="icon-button"
              aria-label="Sign out"
              onClick={() => void useLogout()}
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>
      {mobileNav && (
        <button
          className="mobile-scrim"
          aria-label="Close navigation"
          onClick={() => setMobileNav(false)}
        />
      )}
      <main className="main-shell">
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="mobile-menu"
              aria-label="Open navigation"
              onClick={() => setMobileNav(true)}
            >
              <Menu size={18} />
            </button>
            <span className="breadcrumb">
              APEX <ArrowRight size={12} /> <b>{sectionCopy[section].title}</b>
            </span>
          </div>
          <div className="topbar-right">
            <span
              className={`instance-chip ${defaultProvider?.testStatus === "connected" ? "ready" : "needs-setup"}`}
            >
              <i />
              {defaultProvider?.testStatus === "connected"
                ? "Agent backend ready"
                : "Model setup needed"}
            </span>
            <button
              className="icon-button refresh-icon"
              aria-label="Refresh workspace data"
              onClick={() => void refreshAll()}
            >
              <RefreshCw size={15} />
            </button>
            <span className="top-user">
              {user.name?.slice(0, 1).toUpperCase() || "A"}
            </span>
          </div>
        </header>
        <div className="content-wrap">
          {(overview.isError || sessions.isError || runs.isError) && (
            <div className="page-error">
              <ErrorCard
                message={
                  overview.error?.message ||
                  sessions.error?.message ||
                  runs.error?.message ||
                  "Some workspace data could not be loaded."
                }
                retry={() => void refreshAll()}
              />
            </div>
          )}
          {pageContent}
        </div>
        <footer className="page-footer">
          <span>APEX · independent agent core</span>
          <span>
            <span className="footer-dot" /> State is loaded from your account
          </span>
        </footer>
      </main>
    </div>
  );

  async function useLogout() {
    try {
      await logout();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Sign-out failed.");
    }
  }
}
