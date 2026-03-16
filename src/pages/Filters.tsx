import { useState } from "react";
import { Filter as FilterIcon, Plus, SlidersHorizontal, Trash2 } from "lucide-react";
import { Layout } from "../components/Layout";
import { Modal } from "../components/Modal";
import { useAppContext } from "../context/AppContext";
import type { FilterDraft } from "../types";

const emptyDraft: FilterDraft = {
  name: "",
  companyId: null,
  titleInclude: [],
  titleExclude: [],
  keywordsInclude: [],
  keywordsExclude: [],
  salaryMin: null,
  locationInclude: [],
  locationExclude: [],
  isActive: true,
};

function parseTags(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function Filters() {
  const { filters, companies, addFilter, deleteFilter } = useAppContext();
  const [modalOpen, setModalOpen] = useState(false);
  const [draft, setDraft] = useState<FilterDraft>(emptyDraft);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    await addFilter(draft);
    setDraft(emptyDraft);
    setModalOpen(false);
  };

  return (
    <Layout>
      <section className="panel panel-strong px-6 py-7 sm:px-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <span className="alpha-pill">
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Signal tuning
            </span>
            <h1 className="page-title mt-4">Build filters that coach the next scrape toward relevance.</h1>
            <p className="page-copy">
              Filters are a supportive layer, not an advanced configuration burden. Start narrow, observe the match count on the next run, and only add more logic if the queue still feels noisy.
            </p>
          </div>
          <button type="button" onClick={() => setModalOpen(true)} className="primary-button">
            <Plus className="h-4 w-4" />
            Create filter
          </button>
        </div>
      </section>

      <section className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <article className="story-card">
          <p className="story-kicker">Keep it simple</p>
          <h2 className="story-title">Start with title + one keyword</h2>
          <p className="story-copy">
            Most Alpha users get meaningful signal by combining one role title phrase with one domain keyword.
          </p>
        </article>
        <article className="story-card">
          <p className="story-kicker">Scope carefully</p>
          <h2 className="story-title">Use company scoping when a board is noisy</h2>
          <p className="story-copy">
            Company-specific rules help when one source is broad and another is already clean enough.
          </p>
        </article>
        <article className="story-card">
          <p className="story-kicker">Review calmly</p>
          <h2 className="story-title">Tune after the next real scrape</h2>
          <p className="story-copy">
            Filter design is easier when you react to actual results instead of guessing upfront.
          </p>
        </article>
      </section>

      <div className="mt-8 space-y-4">
        {filters.length === 0 && (
          <div className="panel panel-strong px-6 py-12 text-center">
            <FilterIcon className="mx-auto h-10 w-10 text-[var(--color-text-muted)]" />
            <h2 className="mt-4 text-xl font-semibold">No filters yet</h2>
            <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
              Create one rule for the role family you care about most, then let the next scrape show you whether the signal improved.
            </p>
          </div>
        )}

        {filters.map((filter) => {
          const company = companies.find((candidate) => candidate.id === filter.companyId);
          return (
            <section key={filter.id} className="panel panel-strong p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">{filter.name}</h2>
                    <span className={`soft-badge ${filter.isActive ? "soft-badge-success" : "soft-badge-info"}`}>
                      {filter.isActive ? "Active" : "Disabled"}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
                    {company ? `Scoped to ${company.name}` : "Applies to every supported company"}
                  </p>
                </div>
                <button type="button" onClick={() => void deleteFilter(filter.id)} className="danger-button">
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-4 text-sm text-[var(--color-text-secondary)] md:grid-cols-2 xl:grid-cols-4">
                <div>
                  <p className="font-semibold text-[var(--color-text-primary)]">Title includes</p>
                  <p className="mt-1">{filter.titleInclude.join(", ") || "Any"}</p>
                </div>
                <div>
                  <p className="font-semibold text-[var(--color-text-primary)]">Keywords include</p>
                  <p className="mt-1">{filter.keywordsInclude.join(", ") || "Any"}</p>
                </div>
                <div>
                  <p className="font-semibold text-[var(--color-text-primary)]">Location includes</p>
                  <p className="mt-1">{filter.locationInclude.join(", ") || "Any"}</p>
                </div>
                <div>
                  <p className="font-semibold text-[var(--color-text-primary)]">Minimum salary</p>
                  <p className="mt-1">{filter.salaryMin ? `$${filter.salaryMin.toLocaleString()}` : "Any"}</p>
                </div>
              </div>
            </section>
          );
        })}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Create filter">
        <form className="space-y-4" onSubmit={(event) => void handleSubmit(event)}>
          <div>
            <label className="block text-sm font-medium">Filter name</label>
            <input
              type="text"
              required
              value={draft.name}
              onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
              className="input-shell mt-1"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Company scope</label>
            <select
              value={draft.companyId ?? "all"}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  companyId: event.target.value === "all" ? null : event.target.value,
                }))
              }
              className="select-shell mt-1"
            >
              <option value="all">All companies</option>
              {companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium">Title includes</label>
              <input
                type="text"
                placeholder="engineer, platform"
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    titleInclude: parseTags(event.target.value),
                  }))
                }
                className="input-shell mt-1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Title excludes</label>
              <input
                type="text"
                placeholder="senior, manager"
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    titleExclude: parseTags(event.target.value),
                  }))
                }
                className="input-shell mt-1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Keywords include</label>
              <input
                type="text"
                placeholder="typescript, api"
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    keywordsInclude: parseTags(event.target.value),
                  }))
                }
                className="input-shell mt-1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Location includes</label>
              <input
                type="text"
                placeholder="remote, new york"
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    locationInclude: parseTags(event.target.value),
                  }))
                }
                className="input-shell mt-1"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium">Minimum salary</label>
              <input
                type="number"
                min={0}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    salaryMin: event.target.value ? Number(event.target.value) : null,
                  }))
                }
                className="input-shell mt-1"
              />
            </div>
            <label className="panel panel-muted flex items-center gap-3 rounded-2xl px-4 py-3 text-sm text-[var(--color-text-secondary)]">
              <input
                type="checkbox"
                checked={draft.isActive}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, isActive: event.target.checked }))
                }
              />
              Filter is active
            </label>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="secondary-button">
              Cancel
            </button>
            <button type="submit" className="primary-button">
              Save filter
            </button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
}
