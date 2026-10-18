import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Check,
  Code2,
  Database,
  Film,
  Gamepad2,
  GitBranch,
  Globe,
  History,
  LockKeyhole,
  Search,
  ShieldCheck,
  Sparkles,
  Workflow,
} from "lucide-react";

const capabilities = [
  {
    icon: Sparkles,
    title: "APEX is its own agent",
    detail:
      "Local CLI and desktop runs use APEX's local task loop. The hosted dashboard and remote API are a separate deployment.",
    state: "AVAILABLE",
  },
  {
    icon: Database,
    title: "Your model choice",
    detail:
      "Use Ollama without a provider key, or configure a compatible cloud model API directly with your own credentials.",
    state: "AVAILABLE",
  },
  {
    icon: Code2,
    title: "Project work",
    detail:
      "Local text-file tools stay inside the selected project. Proposed file writes show their complete content for approval.",
    state: "LIMITED",
  },
  {
    icon: Gamepad2,
    title: "Create Game",
    detail:
      "A dedicated game-building area is planned. This preview does not generate game code, assets, or a live game.",
    state: "PLANNED",
  },
  {
    icon: Film,
    title: "Create Video",
    detail:
      "A video studio is planned. Video generation, editing, and rendering are not implemented in this build.",
    state: "PLANNED",
  },
  {
    icon: Globe,
    title: "Browser & Research",
    detail:
      "General browser/computer control and live sourced research remain roadmap work; no websites are operated from this tour.",
    state: "PLANNED",
  },
  {
    icon: History,
    title: "Run traces",
    detail:
      "The local dashboard stores recent run events and exposes actual statuses, tool steps, and file approvals.",
    state: "AVAILABLE",
  },
  {
    icon: BookOpen,
    title: "Skills and integrations",
    detail:
      "Markdown Skills are supported in the CLI; hosted API Plugins and optional bridges are separate from the local desktop.",
    state: "LIMITED",
  },
  {
    icon: Workflow,
    title: "Automations",
    detail:
      "Local scheduled jobs and restart-safe triggers are planned. The local desktop does not run unattended schedules.",
    state: "PLANNED",
  },
];

export default function Preview() {
  return (
    <main className="public-preview">
      <header className="public-preview-header">
        <a className="preview-brand" href="/" aria-label="APEX sign in">
          <span className="apex-glyph" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          <span>
            <b>APEX</b>
            <small>LOCAL AGENT WORKSTATION</small>
          </span>
        </a>
        <a
          className="preview-signin"
          href="/"
          aria-label="Open hosted APEX workspace"
        >
          Hosted workspace <ArrowUpRight size={15} />
        </a>
      </header>

      <section className="preview-hero">
        <div className="preview-hero-copy">
          <div className="preview-eyebrow">
            <span /> OPEN-SOURCE · LOCAL-FIRST · MIT
          </div>
          <h1>
            Your agent.
            <br />
            <em>Your machine.</em>
          </h1>
          <p>
            APEX is a standalone agent workstation—not just a chatbot or a list
            of integrations. Run it locally, choose Ollama or a cloud model API,
            and see what is actually implemented before you grant more access.
          </p>
          <div className="preview-hero-actions">
            <a className="preview-primary-cta" href="#work-areas">
              Explore work areas <ArrowRight size={16} />
            </a>
            <a className="preview-secondary-cta" href="/">
              Open hosted dashboard
            </a>
          </div>
          <div className="preview-hero-note">
            <LockKeyhole size={14} /> This public tour is read-only; it does not
            load account data, run a task, or contact a model provider.
          </div>
        </div>

        <div className="preview-device-wrap">
          <div
            className="preview-surface"
            aria-label="Read-only preview of the APEX desktop work areas"
          >
            <div className="preview-surface-bar">
              <span className="apex-mini-mark" aria-hidden="true">
                <i />
                <i />
                <i />
              </span>
              <span>APEX / LOCAL WORKSPACE</span>
              <span className="preview-readonly">
                <ShieldCheck size={12} /> READ-ONLY
              </span>
            </div>
            <div className="preview-surface-body">
              <aside className="preview-rail" aria-label="APEX work areas">
                <div className="preview-rail-label">WORK AREAS</div>
                <span className="preview-rail-active">
                  <Sparkles size={13} /> <b>Agent</b>
                  <small>READY</small>
                </span>
                <span>
                  <Code2 size={13} /> <b>Code & Files</b>
                  <small>LIMITED</small>
                </span>
                <span>
                  <Gamepad2 size={13} /> <b>Create Game</b>
                  <small>PLANNED</small>
                </span>
                <span>
                  <Film size={13} /> <b>Create Video</b>
                  <small>PLANNED</small>
                </span>
                <span>
                  <Globe size={13} /> <b>Browser & Computer</b>
                  <small>PLANNED</small>
                </span>
                <span>
                  <Search size={13} /> <b>Research</b>
                  <small>PLANNED</small>
                </span>
                <div className="preview-rail-label preview-rail-spaced">
                  SYSTEM
                </div>
                <span>
                  <BookOpen size={13} /> <b>Skills</b>
                  <small>CLI ONLY</small>
                </span>
                <span>
                  <Workflow size={13} /> <b>Automations</b>
                  <small>PLANNED</small>
                </span>
                <span>
                  <History size={13} /> <b>Run History</b>
                  <small>READY</small>
                </span>
              </aside>

              <div className="preview-workspace">
                <div className="preview-workspace-top">
                  <span className="preview-workspace-kicker">LOCAL AGENT</span>
                  <span className="preview-live-status">
                    <i /> READY FOR SETUP
                  </span>
                </div>
                <h2>What should APEX work on?</h2>
                <p>
                  Choose a model, select a project folder, then give APEX a
                  specific task.
                </p>
                <div className="preview-model-row">
                  <span className="preview-model-icon">
                    <Database size={13} />
                  </span>
                  <span>
                    <b>Model backend</b>
                    <small>Ollama or a user-configured API</small>
                  </span>
                  <span className="preview-not-set">NOT SET</span>
                </div>
                <div className="preview-empty-composer">
                  <span>Set up a model to start a local task…</span>
                  <span className="preview-send" aria-hidden="true">
                    <ArrowRight size={15} />
                  </span>
                </div>
                <div className="preview-state-row">
                  <span>
                    <i /> No example runs
                  </span>
                  <span>
                    <i /> No account data
                  </span>
                </div>
                <div className="preview-live-boundary">
                  <Check size={14} />
                  <span>
                    <b>Visible boundaries.</b> Planned areas stay labeled until
                    their real tools exist.
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="preview-device-caption">
            <span>01 / LOCAL WORKSTATION</span>
            <span>REAL UI · NO SAMPLE RUNS</span>
          </div>
        </div>
      </section>

      <section className="preview-capabilities" id="work-areas">
        <div className="preview-section-heading">
          <div className="preview-eyebrow">
            <span /> THE WORKSTATION MAP
          </div>
          <h2>Many work areas. One honest status for each.</h2>
          <p>
            Create Game and Create Video are visible as planned sections—not
            pretend generators. APEX adds their real capabilities as they are
            built and verified.
          </p>
        </div>
        <div className="preview-capability-list">
          {capabilities.map(({ icon: Icon, title, detail, state }) => (
            <article className="preview-capability" key={title}>
              <span className="preview-capability-icon">
                <Icon size={17} />
              </span>
              <div className="preview-capability-copy">
                <div className="preview-capability-title">
                  <h3>{title}</h3>
                  <span
                    className={`preview-state-pill state-${state.toLowerCase()}`}
                  >
                    {state}
                  </span>
                </div>
                <p>{detail}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <footer className="public-preview-footer">
        <span>APEX · MIT-licensed agent workstation</span>
        <a href="/">
          Open the workspace <ArrowRight size={14} />
        </a>
      </footer>
    </main>
  );
}
