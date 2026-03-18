import { useState } from "react";
import type { Company, FilterDraft } from "../types";

interface FilterFormProps {
  companies: Company[];
  onSubmit: (draft: FilterDraft) => Promise<void>;
  onCancel: () => void;
}

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

export function FilterForm({ companies, onSubmit, onCancel }: FilterFormProps) {
  const [draft, setDraft] = useState<FilterDraft>(emptyDraft);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    await onSubmit(draft);
  };

  return (
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
        <button type="button" onClick={onCancel} className="secondary-button">
          Cancel
        </button>
        <button type="submit" className="primary-button">
          Save filter
        </button>
      </div>
    </form>
  );
}
