import { useMemo, useState } from "react";
import { AlertCircle, Building2, Compass, Plus, Play, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { CompanyForm } from "../components/CompanyForm";
import { Layout } from "../components/Layout";
import { Modal } from "../components/Modal";
import { useAppContext } from "../context/AppContext";
import { getDesktopApi } from "../services/api";
import { canRunSourceType, getSourceProfile } from "../types";

const SUPPORT_BADGE_CLASSES: Record<string, string> = {
  supported: "soft-badge-success",
  detected: "soft-badge-info",
  "browser-required": "soft-badge-warning",
  "manual-review": "soft-badge-danger",
};

export function Companies() {
  const { companies, addCompany, deleteCompany, runScraper, refreshing } = useAppContext();
  const [modalOpen, setModalOpen] = useState(false);
  const [runningId, setRunningId] = useState<string | null>(null);

  const runnableCount = useMemo(
    () => companies.filter((company) => canRunSourceType(company.sourceType)).length,
    [companies],
  );
  const browserRequiredCount = useMemo(
    () => companies.filter((company) => company.sourceType === "browser-required").length,
    [companies],
  );

  const handleRun = async (companyId: string) => {
    setRunningId(companyId);
    try {
      await runScraper(companyId);
    } finally {
      setRunningId(null);
    }
  };

  return (
    <Layout>
      <section className="panel panel-strong px-6 py-7 sm:px-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <span className="alpha-pill">
              <Compass className="h-3.5 w-3.5" />
              Source setup
            </span>
            <h1 className="page-title mt-4">Bring in real career pages, then let Job Ranger adapt its extraction strategy.</h1>
            <p className="page-copy">
              Job Ranger now detects broader source families and will try structured or generic extraction where it can. When a portal still needs browser automation or a dedicated adapter, it stays explicit about that.
            </p>
          </div>
          <button type="button" className="primary-button" onClick={() => setModalOpen(true)}>
            <Plus className="h-4 w-4" />
            Add source
          </button>
        </div>
      </section>

      <section className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <article className="metric-card">
          <p className="metric-label">Total sources</p>
          <p className="metric-value">{companies.length}</p>
          <p className="metric-detail">All tracked company boards</p>
        </article>
        <article className="metric-card">
          <p className="metric-label">Runnable now</p>
          <p className="metric-value">{runnableCount}</p>
          <p className="metric-detail">API and generic HTML extraction</p>
        </article>
        <article className="metric-card">
          <p className="metric-label">Needs browser</p>
          <p className="metric-value">{browserRequiredCount}</p>
          <p className="metric-detail">Detected but not yet automated</p>
        </article>
      </section>

      <div className="table-shell mt-8">
        <table className="min-w-full">
          <thead>
            <tr>
              <th className="px-6 py-4 text-left">Source</th>
              <th className="px-6 py-4 text-left">Detection</th>
              <th className="px-6 py-4 text-left">Cadence</th>
              <th className="px-6 py-4 text-left">Last run</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {companies.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-sm text-[var(--color-text-secondary)]">
                  No sources yet. Add a careers page or ATS board URL to start the new adaptation pipeline.
                </td>
              </tr>
            )}
            {companies.map((company) => {
              const profile = getSourceProfile(company.sourceType);
              const canRun = canRunSourceType(company.sourceType);
              const badgeClass = SUPPORT_BADGE_CLASSES[profile.supportLevel] ?? "soft-badge-danger";

              return (
                <tr key={company.id}>
                  <td className="px-6 py-5 align-top">
                    <div className="flex items-start gap-3">
                      <div className="brand-mark flex h-11 w-11 items-center justify-center rounded-2xl">
                        <Building2 className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-semibold text-[var(--color-text-primary)]">{company.name}</p>
                        <button
                          type="button"
                          onClick={() => void getDesktopApi().openExternal(company.url)}
                          className="surface-link surface-link-button mt-1 block max-w-xs truncate text-left text-sm"
                        >
                          {company.url}
                        </button>
                        <p className="mt-2 max-w-md text-sm text-[var(--color-text-secondary)]">{profile.summary}</p>
                        {company.lastErrorMessage && (
                          <p className="mt-2 max-w-md text-sm text-[var(--color-danger)]">{company.lastErrorMessage}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5 align-top">
                    <span className={`soft-badge ${badgeClass}`}>{profile.label}</span>
                    <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
                      {canRun
                        ? `${profile.extractionMode} extraction available`
                        : profile.supportLevel === "browser-required"
                          ? "Browser automation planned"
                          : "Needs a dedicated adapter"}
                    </p>
                    <p className="mt-1 text-xs uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
                      {company.isActive ? "Scheduled locally" : "Paused"}
                    </p>
                  </td>
                  <td className="px-6 py-5 align-top text-sm text-[var(--color-text-secondary)]">
                    Every {company.frequencyMinutes >= 60 ? `${company.frequencyMinutes / 60} hour(s)` : `${company.frequencyMinutes} min`}
                  </td>
                  <td className="px-6 py-5 align-top text-sm text-[var(--color-text-secondary)]">
                    {company.lastRunAt
                      ? `${company.lastRunStatus} ${formatDistanceToNow(new Date(company.lastRunAt), {
                          addSuffix: true,
                        })}`
                      : "Never run"}
                  </td>
                  <td className="px-6 py-5 align-top">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        disabled={!canRun || runningId === company.id || refreshing}
                        onClick={() => void handleRun(company.id)}
                        className="secondary-button disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Play className="h-4 w-4" />
                        {runningId === company.id ? "Running" : "Run"}
                      </button>
                      <button
                        type="button"
                        onClick={() => void deleteCompany(company.id)}
                        className="danger-button"
                      >
                        <Trash2 className="h-4 w-4" />
                        Remove
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="support-note mt-6 px-4 py-3 text-sm">
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-[var(--color-primary)]" />
          <p>
            Helpful pattern: add a source, inspect its detected family, run one scrape, then decide whether the generic extractor is good enough or the source deserves a dedicated adapter.
          </p>
        </div>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add job source">
        <CompanyForm
          onSubmit={async (draft) => {
            await addCompany(draft);
            setModalOpen(false);
          }}
          onCancel={() => setModalOpen(false)}
        />
      </Modal>
    </Layout>
  );
}


