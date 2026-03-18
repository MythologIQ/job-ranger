import { useState } from "react";
import type { CompanyDraft } from "../types";

interface CompanyFormProps {
  onSubmit: (draft: CompanyDraft) => Promise<void>;
  onCancel: () => void;
}

const defaultForm: CompanyDraft = {
  name: "",
  url: "",
  frequencyMinutes: 1440,
  isActive: true,
};

export function CompanyForm({ onSubmit, onCancel }: CompanyFormProps) {
  const [formData, setFormData] = useState(defaultForm);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    await onSubmit(formData);
  };

  return (
    <form className="space-y-4" onSubmit={(event) => void handleSubmit(event)}>
      <div>
        <label htmlFor="company-name" className="block text-sm font-medium">
          Name
        </label>
        <input
          id="company-name"
          type="text"
          required
          value={formData.name}
          onChange={(event) =>
            setFormData((current) => ({ ...current, name: event.target.value }))
          }
          className="input-shell mt-1"
        />
      </div>
      <div>
        <label htmlFor="company-url" className="block text-sm font-medium">
          Careers or board URL
        </label>
        <input
          id="company-url"
          type="url"
          required
          value={formData.url}
          onChange={(event) =>
            setFormData((current) => ({ ...current, url: event.target.value }))
          }
          className="input-shell mt-1"
        />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="frequency" className="block text-sm font-medium">
            Frequency
          </label>
          <select
            id="frequency"
            value={formData.frequencyMinutes}
            onChange={(event) =>
              setFormData((current) => ({
                ...current,
                frequencyMinutes: Number(event.target.value),
              }))
            }
            className="select-shell mt-1"
          >
            <option value={15}>Every 15 minutes</option>
            <option value={30}>Every 30 minutes</option>
            <option value={60}>Every hour</option>
            <option value={1440}>Every 24 hours</option>
          </select>
        </div>
        <label className="panel panel-muted flex items-center gap-3 rounded-2xl px-4 py-3 text-sm">
          <input
            type="checkbox"
            checked={formData.isActive}
            onChange={(event) =>
              setFormData((current) => ({ ...current, isActive: event.target.checked }))
            }
          />
          Enable local scheduling
        </label>
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onCancel} className="secondary-button">
          Cancel
        </button>
        <button type="submit" className="primary-button">
          Save source
        </button>
      </div>
    </form>
  );
}
