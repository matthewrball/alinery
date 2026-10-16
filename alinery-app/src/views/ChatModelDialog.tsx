import { Star, X } from "lucide-react";
import { type ReactNode, useEffect, useMemo, useState } from "react";
import { costBand } from "../chat/costBand";
import { BUILTIN_MODEL_ROLES, type ModelRolesMap } from "../chat/modelRoles";
import { type AdvancedProviderRow, HOSTED_PROVIDER, hostedPrice, type LoginProvider, mergeHostedModels, partitionProviders } from "../chat/providers";
import type { ProvidersDialogTab } from "../chat/slash";
import type { ChatModelOption } from "../chatTranscript";
import { Dialog } from "../shared";
import type { HostedCatalogView } from "../types";

export type ChatProvidersDialogProps = {
  tab: ProvidersDialogTab;
  setup?: boolean;
  models: ChatModelOption[];
  current?: string;
  preselect?: string;
  loginProviders: LoginProvider[];
  livePromotedIds?: string[];
  modelRoles: ModelRolesMap;
  hosted?: HostedCatalogView | null;
  error?: string | null;
  loginBusy?: string | null;
  children?: ReactNode;
  defaultAdvancedOpen?: boolean;
  /** Starred models, newest store wins. Empty when the host has not loaded them yet. */
  favorites?: string[];
  /** Default ready so in-session ChatModelDialog is unchanged. */
  catalogueStatus?: "connecting" | "ready" | "failed";
  /** Omitted by hosts that do not persist favourites; the star is then not rendered at all. */
  onToggleFavorite?: (model: string, favorite: boolean) => void;
  onTabChange: (tab: ProvidersDialogTab) => void;
  onApplyModel: (provider: string, modelId: string) => void;
  onLogin: (providerId: string) => void;
  onHatchTerminalLogin: (providerId?: string) => void;
  onAssignRole: (role: string, model: string | null) => void;
  onSignIn?: () => void;
  onSubscribe?: () => void;
  onBuyCredits?: () => void;
  onClose: () => void;
};

function advancedHint(row: AdvancedProviderRow): string {
  if (row.reason === "env") return row.readyViaEnv ? "ready via env" : "set env or Terminal";
  if (row.reason === "live-promote") return "needs Terminal";
  return "Terminal /login";
}

function CostBand({ price }: { price: number }) {
  return (
    <span className="chat-work-meta chat-cost-band" aria-label={`cost ${price} of 5`}>
      <span className={price > 0 ? "on" : undefined} aria-hidden="true" />
      <span className={price > 1 ? "on" : undefined} aria-hidden="true" />
      <span className={price > 2 ? "on" : undefined} aria-hidden="true" />
      <span className={price > 3 ? "on" : undefined} aria-hidden="true" />
      <span className={price > 4 ? "on" : undefined} aria-hidden="true" />
    </span>
  );
}

function formatCreditUsd(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function AlineryAccountRow({
  hosted,
  onSignIn,
  onSubscribe,
  onBuyCredits,
}: {
  hosted: HostedCatalogView;
  onSignIn?: () => void;
  onSubscribe?: () => void;
  onBuyCredits?: () => void;
}) {
  if (hosted.ready) {
    const meta = hosted.balanceCents != null ? formatCreditUsd(hosted.balanceCents) : "ready";
    return (
      <li>
        <button type="button" className="chat-model-item" disabled>
          <span>Alinery</span>
          <span className="chat-work-meta">{meta}</span>
        </button>
      </li>
    );
  }
  if (hosted.upsell === "subscribe") {
    return (
      <li>
        <button type="button" className="chat-model-item" onClick={onSubscribe}>
          <span>Alinery</span>
          <span className="chat-work-meta">Subscribe</span>
        </button>
      </li>
    );
  }
  if (hosted.upsell === "buy-credits") {
    return (
      <li>
        <button type="button" className="chat-model-item" onClick={onBuyCredits}>
          <span>Alinery</span>
          <span className="chat-work-meta">Buy credits</span>
        </button>
      </li>
    );
  }
  return (
    <li>
      <button type="button" className="chat-model-item" onClick={onSignIn}>
        <span>Alinery</span>
        <span className="chat-work-meta">Sign in</span>
      </button>
    </li>
  );
}

export function ChatModelDialog({
  tab,
  setup = false,
  models,
  current,
  preselect,
  loginProviders,
  livePromotedIds = [],
  modelRoles,
  hosted,
  error,
  loginBusy,
  children,
  defaultAdvancedOpen = false,
  favorites,
  catalogueStatus = "ready",
  onToggleFavorite,
  onTabChange,
  onApplyModel,
  onLogin,
  onHatchTerminalLogin,
  onAssignRole,
  onSignIn,
  onSubscribe,
  onBuyCredits,
  onClose,
}: ChatProvidersDialogProps) {
  const [query, setQuery] = useState(preselect ?? "");
  const [advancedOpen, setAdvancedOpen] = useState(defaultAdvancedOpen);

  useEffect(() => {
    setQuery(preselect ?? "");
  }, [preselect]);

  const listed = useMemo(() => mergeHostedModels(models, hosted), [models, hosted]);
  const { chatLogin, advanced } = useMemo(() => partitionProviders({ loginProviders, models: listed, livePromotedIds }), [loginProviders, listed, livePromotedIds]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matched = q ? listed.filter((m) => `${m.provider}/${m.id}`.toLowerCase().includes(q) || m.id.toLowerCase().includes(q)) : listed;
    // Starred first, order otherwise preserved -- same contract as `deriveModelRows`, which this
    // list replaces for every model-picking surface.
    const starred = new Set(favorites ?? []);
    if (starred.size === 0) return matched;
    return [...matched.filter((m) => starred.has(`${m.provider}/${m.id}`)), ...matched.filter((m) => !starred.has(`${m.provider}/${m.id}`))];
  }, [listed, query, favorites]);
  const roleModels = useMemo(() => listed.filter((model) => model.provider !== HOSTED_PROVIDER || hosted?.ready), [listed, hosted?.ready]);
  const selected = filtered.find((m) => `${m.provider}/${m.id}` === query.trim()) ?? filtered[0];
  // A `provider/id` nobody lists is still a valid ask (preview models, private deployments).
  const customRef = (() => {
    const q = query.trim();
    const slash = q.indexOf("/");
    if (slash <= 0 || slash === q.length - 1 || listed.some((m) => `${m.provider}/${m.id}` === q)) return null;
    return { provider: q.slice(0, slash), id: q.slice(slash + 1) };
  })();
  const title = setup ? "Set up your providers" : tab === "accounts" ? "Providers" : "Models";

  const applyOrUpsell = (provider: string, modelId: string) => {
    if (provider === HOSTED_PROVIDER && !hosted?.ready) {
      if (hosted?.upsell === "sign-in") onSignIn?.();
      else onTabChange("accounts");
      return;
    }
    onApplyModel(provider, modelId);
  };

  return (
    <Dialog onClose={onClose} ariaLabel={title} className="chat-model-dialog">
      <div className="mh">
        <span className="mt">{title}</span>
        <button type="button" className="x" aria-label="Cancel" title="Cancel" onClick={onClose}>
          <X size={14} strokeWidth={1.5} aria-hidden="true" />
        </button>
      </div>
      <div className="mb">
        <div className="chat-hatch chat-providers-tabs" data-tab={tab} role="tablist" aria-label="Providers dialog">
          <button type="button" role="tab" aria-selected={tab === "accounts"} className={tab === "accounts" ? "active" : ""} onClick={() => onTabChange("accounts")}>
            Accounts
          </button>
          <button type="button" role="tab" aria-selected={tab === "models"} className={tab === "models" ? "active" : ""} onClick={() => onTabChange("models")}>
            Models
          </button>
        </div>
        {error && (
          <div className="chat-provider-error">
            <p role="alert">
              {error.includes("project ownership unavailable")
                ? "This repository is in use by another Alinery instance. Close it there or resolve access from the repository warning, then reopen this picker."
                : "The provider request failed. Review the diagnostic below, then retry the action."}
            </p>
            <details>
              <summary>Technical details</summary>
              <pre>{error}</pre>
            </details>
          </div>
        )}

        <div key={tab} className="chat-provider-panel">
        {tab === "accounts" ? (
          <>
            <p className="dim">Sign in with browser OAuth or paste-code. Chat never collects API keys.</p>
            {children}
            <ul className="chat-model-list">
              {hosted ? <AlineryAccountRow hosted={hosted} onSignIn={onSignIn} onSubscribe={onSubscribe} onBuyCredits={onBuyCredits} /> : null}
              {catalogueStatus === "connecting" ? <li className="dim">Connecting…</li> : null}
              {catalogueStatus === "ready" && chatLogin.length === 0 && !hosted ? <li className="dim">No Chat-capable providers yet.</li> : null}
              {chatLogin.map((p) => {
                const busy = loginBusy === p.id;
                return (
                  <li key={p.id}>
                    <button type="button" className="chat-model-item" disabled={!!loginBusy || p.authenticated} onClick={() => onLogin(p.id)}>
                      <span>{p.name}</span>
                      <span className="chat-work-meta">{p.authenticated ? "signed in" : busy ? "signing in…" : "sign in"}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
            {advanced.length > 0 ? (
              <details className="chat-model-roles" open={advancedOpen} onToggle={(event) => setAdvancedOpen(event.currentTarget.open)}>
                <summary>Advanced</summary>
                {advancedOpen ? (
                  <>
                    <p className="dim">These need Terminal /login or an environment variable on the Alinery process. Chat will not collect keys.</p>
                    <ul className="chat-model-list">
                      {advanced.map((row) => (
                        <li key={row.id}>
                          <button type="button" className="chat-model-item" onClick={() => onHatchTerminalLogin(row.id)}>
                            <span>{row.name}</span>
                            <span className="chat-work-meta">{advancedHint(row)}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </>
                ) : null}
              </details>
            ) : null}
          </>
        ) : (
          <>
            <p className="dim">{current ? `Current session ${current}. Apply switches this chat only.` : "Choose a model for this session."}</p>
            <input
              className="field-input"
              data-autofocus=""
              aria-label="Filter models"
              placeholder="provider/id"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key !== "Enter") return;
                if (selected) applyOrUpsell(selected.provider, selected.id);
                else if (customRef) onApplyModel(customRef.provider, customRef.id);
              }}
            />
            <ul className="chat-model-list">
              {catalogueStatus === "connecting" ? <li className="dim">Connecting…</li> : null}
              {catalogueStatus === "ready" && filtered.length === 0 && !customRef ? <li className="dim">No models match.</li> : null}
              {customRef ? (
                <li className="chat-model-row">
                  <button type="button" className="chat-model-item" onClick={() => onApplyModel(customRef.provider, customRef.id)}>
                    <span>
                      Use {customRef.provider}/{customRef.id}
                    </span>
                    <span className="chat-work-meta">custom id</span>
                  </button>
                </li>
              ) : null}

              {filtered.map((m) => {
                const label = `${m.provider}/${m.id}`;
                const active = selected ? `${selected.provider}/${selected.id}` === label : false;
                const isCurrent = current === label;
                const starred = (favorites ?? []).includes(label);
                const band = costBand(hostedPrice(hosted, m.provider, m.id));
                return (
                  <li key={label} className="chat-model-row">
                    <button type="button" className={`chat-model-item${active ? " active" : ""}`} onClick={() => applyOrUpsell(m.provider, m.id)}>
                      <span>{label}</span>
                      <span className="chat-model-item-side">
                        {band !== null ? <CostBand price={band} /> : null}
                        {isCurrent ? <span className="chat-work-meta">current</span> : null}
                      </span>
                    </button>
                    {onToggleFavorite ? (
                      <button
                        type="button"
                        className="btn ghost small chat-model-star"
                        aria-pressed={starred}
                        aria-label={starred ? `Unstar ${label}` : `Star ${label}`}
                        title={starred ? "Remove from favourites" : "Add to favourites"}
                        onClick={() => onToggleFavorite(label, !starred)}
                      >
                        <Star size={14} strokeWidth={1.5} fill={starred ? "currentColor" : "none"} aria-hidden="true" />
                      </button>
                    ) : null}
                  </li>
                );
              })}
            </ul>

            <details className="chat-model-roles">
              <summary>Role defaults</summary>
              <p className="dim">Choose models for new OMP processes. These assignments do not change the current session.</p>
              <div className="chat-role-list">
                {BUILTIN_MODEL_ROLES.map((role) => {
                  const assigned = modelRoles[role] || "";
                  const unavailable = assigned && !roleModels.some((model) => `${model.provider}/${model.id}` === assigned);
                  return (
                    <label className="chat-role-row" key={role}>
                      <code>{role}</code>
                      <select
                        aria-label={`Model for ${role}`}
                        className="field-input"
                        value={assigned}
                        onChange={(event) => onAssignRole(role, event.target.value || null)}
                      >
                        <option value="">Not assigned</option>
                        {unavailable && <option value={assigned} disabled>{assigned} (unavailable)</option>}
                        {roleModels.map((model) => {
                          const value = `${model.provider}/${model.id}`;
                          return <option key={value} value={value}>{value}</option>;
                        })}
                      </select>
                    </label>
                  );
                })}
              </div>
            </details>
          </>
        )}
        </div>
      </div>
      <div className="mfoot">
        {tab === "models" ? (
          <button type="button" className="btn small" disabled={!selected} onClick={() => selected && applyOrUpsell(selected.provider, selected.id)}>
            Apply
          </button>
        ) : (
          <span />
        )}
        <button type="button" className="btn ghost small" onClick={onClose}>
          {setup ? "Done" : "Cancel"}
        </button>
      </div>
    </Dialog>
  );
}
