import type { NormalizedPlaybook, PlaybookRef } from "./types";

export const ONBOARDING_COMPLETED_KEY = "alinery.onboardingCompleted.v1";
export const ONBOARDING_STEP_KEY = "alinery.onboardingStep.v1";

export type OnboardingStepId = "workspace" | "playbooks" | "models" | "launch";

export const ONBOARDING_STEPS: { id: OnboardingStepId; number: string; label: string; title: string }[] = [
  { id: "workspace", number: "01", label: "Repository", title: "Connect a repository" },
  { id: "playbooks", number: "02", label: "Playbooks", title: "How playbooks coordinate agents" },
  { id: "models", number: "03", label: "Models", title: "Verify your agent & model provider" },
  { id: "launch", number: "04", label: "First task", title: "Launch your first playbook task" },
];

export function isOnboardingCompleted(): boolean {
  try {
    return localStorage.getItem(ONBOARDING_COMPLETED_KEY) === "1";
  } catch {
    return false;
  }
}

export function markOnboardingCompleted(): void {
  try {
    localStorage.setItem(ONBOARDING_COMPLETED_KEY, "1");
    localStorage.removeItem(ONBOARDING_STEP_KEY);
  } catch {
    // Ignore storage quota / privacy mode failures.
  }
}

export function readSavedOnboardingStep(hasActiveRepo: boolean): OnboardingStepId {
  if (!hasActiveRepo) return "workspace";
  try {
    const raw = localStorage.getItem(ONBOARDING_STEP_KEY);
    if (raw && ONBOARDING_STEPS.some((step) => step.id === raw)) {
      return raw as OnboardingStepId;
    }
  } catch {
    // Fall through to default.
  }
  return "playbooks";
}

export function writeSavedOnboardingStep(step: OnboardingStepId): void {
  try {
    localStorage.setItem(ONBOARDING_STEP_KEY, step);
  } catch {
    // Ignore storage errors.
  }
}

export type StarterTaskPreset = {
  name: string;
  description: string;
  evidence: string;
  ctaLabel: string;
};

export type CuratedPlaybookArchetype = {
  reference: PlaybookRef;
  badge: string;
  tagline: string;
  patternSummary: string;
  checkpointNote: string;
  fallbackDefinition: NormalizedPlaybook;
  starterPreset: StarterTaskPreset;
};

const SUPERDEVELOP_FALLBACK: NormalizedPlaybook = {
  version: 2,
  key: "superdevelop",
  title: "SuperDevelop",
  description: "Develop a change through Clarify, Investigate, Decide, Plan, Define Tests, Build, and Prepare Review.",
  default_model: "",
  default_harness: "omp",
  preamble: "# SuperDevelop\n\nDevelop a change through Clarify, Investigate, Decide, Plan, Define Tests, Build, and Prepare Review.",
  section_order: ["research-questions", "research", "design", "structure", "tdd", "implementation", "pr"],
  step: [
    {
      key: "research-questions",
      title: "Clarify",
      short: "research-questions",
      inputs: [{ path: "ticket.md", mode: "single" }],
      outputs: [{ path: "clarify.md" }],
      model: "",
      harness: "",
      is_coding_step: false,
      auto_advance_default: true,
      prompt:
        "Clarify what must be learned before choosing a solution. Produce a focused investigation agenda in clarify.md that lets the next Session gather evidence efficiently.",
    },
    {
      key: "research",
      title: "Investigate",
      short: "research",
      inputs: [
        { path: "ticket.md", mode: "single" },
        { path: "clarify.md", mode: "single" },
      ],
      outputs: [{ path: "investigate.md" }],
      model: "",
      harness: "",
      is_coding_step: false,
      auto_advance_default: true,
      prompt: "Gather repository facts, code paths, and constraints to answer the investigation agenda in clarify.md and record findings in investigate.md.",
    },
    {
      key: "design",
      title: "Decide",
      short: "design",
      inputs: [
        { path: "ticket.md", mode: "single" },
        { path: "clarify.md", mode: "single" },
        { path: "investigate.md", mode: "single" },
      ],
      outputs: [{ path: "decide.md" }],
      model: "",
      harness: "",
      is_coding_step: false,
      auto_advance_default: false,
      prompt: "Compare viable designs, surface tradeoffs for human review, and record the chosen architecture and invariants in decide.md before implementation begins.",
    },
    {
      key: "structure",
      title: "Plan",
      short: "structure",
      inputs: [
        { path: "ticket.md", mode: "single" },
        { path: "clarify.md", mode: "single" },
        { path: "investigate.md", mode: "single" },
        { path: "decide.md", mode: "single" },
      ],
      outputs: [{ path: "plan.md" }],
      model: "",
      harness: "",
      is_coding_step: false,
      auto_advance_default: true,
      prompt: "Translate the approved design in decide.md into an ordered, file-level implementation plan in plan.md.",
    },
    {
      key: "tdd",
      title: "Define Tests",
      short: "tdd",
      inputs: [
        { path: "ticket.md", mode: "single" },
        { path: "clarify.md", mode: "single" },
        { path: "investigate.md", mode: "single" },
        { path: "decide.md", mode: "single" },
        { path: "plan.md", mode: "single" },
      ],
      outputs: [{ path: "test-contract.md" }],
      model: "",
      harness: "",
      is_coding_step: true,
      auto_advance_default: true,
      prompt: "Establish the behavioral test contract and failing-before verification targets in test-contract.md.",
    },
    {
      key: "implementation",
      title: "Build",
      short: "implementation",
      inputs: [
        { path: "ticket.md", mode: "single" },
        { path: "clarify.md", mode: "single" },
        { path: "investigate.md", mode: "single" },
        { path: "decide.md", mode: "single" },
        { path: "plan.md", mode: "single" },
        { path: "test-contract.md", mode: "single" },
      ],
      outputs: [{ path: "build-report.md" }],
      model: "",
      harness: "",
      is_coding_step: true,
      auto_advance_default: true,
      prompt: "Implement the planned change in the task worktree, run tests and checks, and record verification evidence in build-report.md.",
    },
    {
      key: "pr",
      title: "Prepare Review",
      short: "pr",
      inputs: [
        { path: "ticket.md", mode: "single" },
        { path: "clarify.md", mode: "single" },
        { path: "investigate.md", mode: "single" },
        { path: "decide.md", mode: "single" },
        { path: "plan.md", mode: "single" },
        { path: "test-contract.md", mode: "single" },
        { path: "build-report.md", mode: "single" },
      ],
      outputs: [{ path: "review-package.md" }],
      model: "",
      harness: "",
      is_coding_step: true,
      auto_advance_default: false,
      prompt: "Assemble a concise review package in review-package.md summarizing the change, verification output, and residual risks for human sign-off.",
    },
  ],
};

const BUG_HUNTING_FALLBACK: NormalizedPlaybook = {
  version: 2,
  key: "bug-hunting",
  title: "Bug Hunting",
  description: "Prove a root cause, let the human choose a correction, approve its design, implement and verify it, then prepare a PR note.",
  default_model: "",
  default_harness: "omp",
  preamble: "# Bug Hunting\n\nProve a root cause, let the human choose a correction, approve its design, implement and verify it, then prepare a PR note.",
  section_order: ["rca", "solutions", "design", "implementation", "pr"],
  step: [
    {
      key: "rca",
      title: "Root Cause Analysis",
      short: "rca",
      inputs: [{ path: "ticket.md", mode: "single" }],
      outputs: [{ path: "root-cause-analysis.md" }],
      model: "",
      harness: "",
      is_coding_step: true,
      auto_advance_default: true,
      prompt:
        "Reproduce the symptom, trace the causal chain through concrete files and symbols, and record the proven root cause in root-cause-analysis.md without modifying production code.",
    },
    {
      key: "solutions",
      title: "Evaluate Resolutions",
      short: "solutions",
      inputs: [
        { path: "ticket.md", mode: "single" },
        { path: "root-cause-analysis.md", mode: "single" },
      ],
      outputs: [{ path: "resolution-options.md" }, { path: "selected-fix.md" }],
      model: "",
      harness: "",
      is_coding_step: false,
      auto_advance_default: false,
      prompt: "Compare candidate corrections against blast radius and maintainability in resolution-options.md, then pause for the human to select the fix in selected-fix.md.",
    },
    {
      key: "design",
      title: "Design the Fix",
      short: "design",
      inputs: [
        { path: "ticket.md", mode: "single" },
        { path: "root-cause-analysis.md", mode: "single" },
        { path: "resolution-options.md", mode: "single" },
        { path: "selected-fix.md", mode: "single" },
      ],
      outputs: [{ path: "fix-design.md" }],
      model: "",
      harness: "",
      is_coding_step: false,
      auto_advance_default: false,
      prompt: "Detail the exact invariants, affected call sites, and regression test plan in fix-design.md for human approval.",
    },
    {
      key: "implementation",
      title: "Implement and Verify",
      short: "implementation",
      inputs: [
        { path: "ticket.md", mode: "single" },
        { path: "root-cause-analysis.md", mode: "single" },
        { path: "resolution-options.md", mode: "single" },
        { path: "selected-fix.md", mode: "single" },
        { path: "fix-design.md", mode: "single" },
      ],
      outputs: [{ path: "bug-fix-report.md" }],
      model: "",
      harness: "",
      is_coding_step: true,
      auto_advance_default: false,
      prompt: "Apply the approved fix, prove the regression test fails before and passes after, and record the verification in bug-fix-report.md.",
    },
    {
      key: "pr",
      title: "Prepare PR Note",
      short: "pr",
      inputs: [
        { path: "ticket.md", mode: "single" },
        { path: "root-cause-analysis.md", mode: "single" },
        { path: "fix-design.md", mode: "single" },
        { path: "bug-fix-report.md", mode: "single" },
      ],
      outputs: [{ path: "pr-note.md" }],
      model: "",
      harness: "",
      is_coding_step: false,
      auto_advance_default: false,
      prompt: "Draft a clear pull-request summary in pr-note.md linking the root cause, fix design, and verification results.",
    },
  ],
};

const REVIEW_FALLBACK: NormalizedPlaybook = {
  version: 2,
  key: "review",
  title: "Evidence-Backed Code Review",
  description: "Bind an exact review target, collect safe verification evidence, inspect findings with the human, and prepare a paste-ready response.",
  default_model: "",
  default_harness: "omp",
  preamble:
    "# Evidence-Backed Code Review\n\nBind an exact review target, collect safe verification evidence, inspect findings with the human, and prepare a paste-ready response.",
  section_order: ["review-context", "review-checks", "review-findings", "review-response"],
  step: [
    {
      key: "review-context",
      title: "Confirm Review Scope",
      short: "review-context",
      inputs: [{ path: "ticket.md", mode: "single" }],
      outputs: [{ path: "review-context.md" }],
      model: "",
      harness: "",
      is_coding_step: false,
      auto_advance_default: true,
      prompt: "Resolve the review target to an exact commit range or patch snapshot and document the verification strategy in review-context.md.",
    },
    {
      key: "review-checks",
      title: "Run Review Checks",
      short: "review-checks",
      inputs: [
        { path: "ticket.md", mode: "single" },
        { path: "review-context.md", mode: "single" },
      ],
      outputs: [{ path: "review-checks.md" }],
      model: "",
      harness: "",
      is_coding_step: true,
      auto_advance_default: true,
      prompt: "Execute targeted tests, typechecks, and verification commands for the diff and record outputs in review-checks.md.",
    },
    {
      key: "review-findings",
      title: "Inspect the Change",
      short: "review-findings",
      inputs: [
        { path: "ticket.md", mode: "single" },
        { path: "review-context.md", mode: "single" },
        { path: "review-checks.md", mode: "single" },
      ],
      outputs: [{ path: "review-findings.md" }],
      model: "",
      harness: "",
      is_coding_step: false,
      auto_advance_default: false,
      prompt: "Evaluate correctness, invariants, and edge cases in review-findings.md and pause for human review of the findings.",
    },
    {
      key: "review-response",
      title: "Prepare Review Response",
      short: "review-response",
      inputs: [
        { path: "ticket.md", mode: "single" },
        { path: "review-context.md", mode: "single" },
        { path: "review-checks.md", mode: "single" },
        { path: "review-findings.md", mode: "single" },
      ],
      outputs: [{ path: "review-response.md" }],
      model: "",
      harness: "",
      is_coding_step: false,
      auto_advance_default: false,
      prompt: "Format the human-approved findings into a paste-ready review response in review-response.md.",
    },
  ],
};

const ACADEMIC_SURVEY_FALLBACK: NormalizedPlaybook = {
  version: 2,
  key: "academic-survey",
  title: "Academic Survey",
  description:
    "Frame the question, search in parallel, give every source its own reading session, and follow relevant citations through successive evidence waves. Keep a cumulative, source-traceable survey draft.",
  default_model: "",
  default_harness: "omp",
  preamble:
    "# Academic Survey\n\nFrame once, then repeat: plan a wave → parallel discovery → deduplicate → one reading session per source → consolidate → update the survey → continue or conclude with the human.",
  section_order: ["frame-review", "plan-search", "gather-evidence", "prepare-readings", "evaluate-source", "consolidate-evidence", "draft-survey", "continue-review"],
  step: [
    {
      key: "frame-review",
      title: "Frame the Review",
      short: "frame-review",
      inputs: [],
      outputs: [{ path: "review-brief.md" }],
      model: "",
      harness: "",
      is_coding_step: false,
      auto_advance_default: true,
      prompt: "Establish the research question, inclusion criteria, and rigor standard in review-brief.md.",
    },
    {
      key: "plan-search",
      title: "Plan the Evidence Wave",
      short: "plan-search",
      inputs: [
        { path: "review-brief.md", mode: "single" },
        { path: "ticket.md", mode: "single" },
      ],
      outputs: [{ path: "search-plan.md" }, { path: "search-request-*.md" }],
      model: "",
      harness: "",
      is_coding_step: false,
      auto_advance_default: true,
      prompt: "Divide discovery into complementary search lanes in search-plan.md and emit one search-request-*.md file per parallel search worker.",
    },
    {
      key: "gather-evidence",
      title: "Gather Candidate Sources",
      short: "gather-evidence",
      inputs: [{ path: "search-request-*.md", mode: "each" }],
      outputs: [{ path: "search-result.md" }],
      model: "",
      harness: "",
      is_coding_step: false,
      auto_advance_default: true,
      prompt: "Process one assigned search-request-*.md in an isolated worker session (mode = 'each') and write candidate sources to search-result.md.",
    },
    {
      key: "prepare-readings",
      title: "Deduplicate and Dispatch Sources",
      short: "prepare-readings",
      inputs: [
        { path: "review-brief.md", mode: "single" },
        { path: "search-plan.md", mode: "single" },
        { path: "search-result*.md", mode: "complete" },
      ],
      outputs: [{ path: "reading-wave.md" }, { path: "source-request-*.md" }],
      model: "",
      harness: "",
      is_coding_step: false,
      auto_advance_default: true,
      prompt: "Wait for all search-result*.md workers to complete (mode = 'complete'), deduplicate sources in reading-wave.md, and emit source-request-*.md per source.",
    },
    {
      key: "evaluate-source",
      title: "Read and Evaluate One Source",
      short: "evaluate-source",
      inputs: [
        { path: "review-brief.md", mode: "single" },
        { path: "source-request-*.md", mode: "each" },
      ],
      outputs: [{ path: "source-assessment.md" }],
      model: "",
      harness: "",
      is_coding_step: false,
      auto_advance_default: true,
      prompt: "Give each source-request-*.md its own dedicated reading session (mode = 'each') and produce source-assessment.md.",
    },
    {
      key: "consolidate-evidence",
      title: "Consolidate Evidence and New Citations",
      short: "consolidate-evidence",
      inputs: [
        { path: "review-brief.md", mode: "single" },
        { path: "reading-wave.md", mode: "single" },
        { path: "source-assessment*.md", mode: "complete" },
      ],
      outputs: [{ path: "survey-evidence.md" }],
      model: "",
      harness: "",
      is_coding_step: false,
      auto_advance_default: true,
      prompt: "Join all source-assessment*.md outputs (mode = 'complete') into a cumulative evidence ledger in survey-evidence.md.",
    },
    {
      key: "draft-survey",
      title: "Synthesize and Draft the Survey",
      short: "draft-survey",
      inputs: [
        { path: "review-brief.md", mode: "single" },
        { path: "survey-evidence.md", mode: "single" },
      ],
      outputs: [{ path: "survey-draft.md" }],
      model: "",
      harness: "",
      is_coding_step: false,
      auto_advance_default: true,
      prompt: "Update the cumulative, source-traceable synthesis in survey-draft.md from survey-evidence.md.",
    },
    {
      key: "continue-review",
      title: "Continue Discovery or Review with the Human",
      short: "continue-review",
      inputs: [
        { path: "review-brief.md", mode: "single" },
        { path: "survey-evidence.md", mode: "single" },
        { path: "survey-draft.md", mode: "single" },
      ],
      outputs: [{ path: "ticket.md" }, { path: "review-stopping-report.md" }],
      model: "",
      harness: "",
      is_coding_step: false,
      auto_advance_default: true,
      prompt: "Check stopping criteria with the human: either emit a new ticket.md to trigger the next citation wave or conclude with review-stopping-report.md.",
    },
  ],
};

const BUILD_PLAYBOOK_FALLBACK: NormalizedPlaybook = {
  version: 2,
  key: "build-playbook",
  title: "Build a New Playbook",
  description: "Define a useful playbook, draft its prompts with the human, then independently verify the process before saving it globally or in the user's repository.",
  default_model: "",
  default_harness: "omp",
  preamble: "# Build a New Playbook\n\nDefine → Draft & Refine → Verify & Save.",
  section_order: ["define", "draft-refine", "verify-save"],
  step: [
    {
      key: "define",
      title: "Define",
      short: "define",
      inputs: [{ path: "ticket.md", mode: "single" }],
      outputs: [{ path: "playbook-spec.md" }],
      model: "",
      harness: "",
      is_coding_step: false,
      auto_advance_default: false,
      prompt: "Collaborate with the human to define agent responsibilities, artifact handoffs, and human checkpoints in playbook-spec.md.",
    },
    {
      key: "draft-refine",
      title: "Draft & Refine",
      short: "draft-refine",
      inputs: [
        { path: "ticket.md", mode: "single" },
        { path: "playbook-spec.md", mode: "single" },
      ],
      outputs: [{ path: "candidate-playbook.md" }, { path: "draft-handoff.md" }],
      model: "",
      harness: "",
      is_coding_step: false,
      auto_advance_default: false,
      prompt: "Write the complete v2 TOML + Markdown playbook in candidate-playbook.md and refine step prompts with the human.",
    },
    {
      key: "verify-save",
      title: "Verify & Save",
      short: "verify-save",
      inputs: [
        { path: "ticket.md", mode: "single" },
        { path: "playbook-spec.md", mode: "single" },
        { path: "candidate-playbook.md", mode: "single" },
        { path: "draft-handoff.md", mode: "single" },
      ],
      outputs: [{ path: "verified-playbook.md" }, { path: "save-handoff.md" }],
      model: "",
      harness: "",
      is_coding_step: true,
      auto_advance_default: false,
      prompt: "Independently validate candidate-playbook.md against the specification, save it to the repository or global library, and write verified-playbook.md.",
    },
  ],
};

export const CURATED_PLAYBOOK_ARCHETYPES: CuratedPlaybookArchetype[] = [
  {
    reference: { scope: "bundled", key: "superdevelop" },
    badge: "Feature workflow",
    tagline: "Clarify → Investigate → Decide → Plan → Define Tests → Build → Prepare Review",
    patternSummary:
      "7-stage engineering pipeline. Agents clarify and investigate automatically, then pause at Decide so you approve the design artifact before any code is written.",
    checkpointNote: "Pauses at Decide (decide.md) before any code is written, and again at Prepare Review (review-package.md).",
    fallbackDefinition: SUPERDEVELOP_FALLBACK,
    starterPreset: {
      name: "Map architecture and improvement opportunities",
      description:
        "Investigate this repository's core modules, entrypoints, and test coverage, then propose one high-leverage architectural or UX improvement for review before touching any code.",
      evidence: "Starter onboarding task — stop at the Decide checkpoint so the human can inspect clarify.md and investigate.md.",
      ctaLabel: "Run SuperDevelop starter task",
    },
  },
  {
    reference: { scope: "bundled", key: "bug-hunting" },
    badge: "Root cause & fix",
    tagline: "Root Cause Analysis → Evaluate Resolutions → Design the Fix → Implement → PR",
    patternSummary: "Separates root-cause proof from fix implementation. Proves the bug first, proposes resolution options, and waits for you to choose the fix.",
    checkpointNote: "Pauses at Evaluate Resolutions (selected-fix.md) and every step after it, including Design the Fix.",
    fallbackDefinition: BUG_HUNTING_FALLBACK,
    starterPreset: {
      name: "Audit error handling and edge-case failure modes",
      description:
        "Scan recent error paths and boundary conditions in this repository, document reproducible failure modes in root-cause-analysis.md, and propose candidate resolutions without modifying source files until approved.",
      evidence: "Starter onboarding bug-hunt — pause at Evaluate Resolutions for human selection.",
      ctaLabel: "Run Bug Hunting starter task",
    },
  },
  {
    reference: { scope: "bundled", key: "review" },
    badge: "Code review",
    tagline: "Confirm Scope → Run Review Checks → Inspect the Change → Prepare Response",
    patternSummary: "Evidence-backed code review on the latest commit or branch diff. Collects verification evidence first, then surfaces findings for human sign-off.",
    checkpointNote: "Pauses at Inspect the Change (review-findings.md) before drafting the review response.",
    fallbackDefinition: REVIEW_FALLBACK,
    starterPreset: {
      name: "Review latest commit and repository health",
      description: "Bind the latest commit on the current branch, run read-only verification checks, and produce an evidence-backed review report in review-findings.md.",
      evidence: "Starter onboarding review task — inspect HEAD commit.",
      ctaLabel: "Run Code Review on latest commit",
    },
  },
  {
    reference: { scope: "bundled", key: "academic-survey" },
    badge: "Parallel swarm (each → complete)",
    tagline: "Frame Review → Plan Wave → Gather Sources (×N) → Assess Each Source (×N) → Consolidate",
    patternSummary:
      "Demonstrates dynamic swarm generation: Plan Wave emits search-request-*.md files, spawning one parallel agent session per request (mode = 'each') and waiting for all of them to finish (mode = 'complete') before consolidating.",
    checkpointNote: "Spawns parallel worker waves automatically; the final step checks stopping criteria with you before another wave.",
    fallbackDefinition: ACADEMIC_SURVEY_FALLBACK,
    starterPreset: {
      name: "Survey codebase domain concepts and prior art",
      description: "Frame a technical survey of the core domain problems solved by this repository, fan out parallel source-gathering lanes, and consolidate a traceable summary.",
      evidence: "Starter onboarding swarm task.",
      ctaLabel: "Run Parallel Survey starter task",
    },
  },
  {
    reference: { scope: "bundled", key: "build-playbook" },
    badge: "Meta-playbook",
    tagline: "Define → Draft & Refine → Verify & Save",
    patternSummary:
      "A playbook that builds new playbooks. Collaborates with you to define steps, artifact contracts, and human gates, then validates and saves the new playbook to your repository or global library.",
    checkpointNote: "Every stage is human-steered so you can shape the prompts before saving.",
    fallbackDefinition: BUILD_PLAYBOOK_FALLBACK,
    starterPreset: {
      name: "Design a custom playbook for this repository",
      description: "Inspect this repository's workflow conventions and help me draft a reusable custom playbook tailored to our team's recurring tasks.",
      evidence: "Starter meta-playbook task.",
      ctaLabel: "Build a custom playbook",
    },
  },
];
