import { getDesktopApi } from "../services/api";
import type { FilterDraft, FilterUpdate, Toast } from "../types";

export function createFilterActions(
  refresh: () => Promise<void>,
  addToast: (toast: Omit<Toast, "id">) => void,
  setError: (error: string | null) => void,
) {
  const withFeedback = async (
    action: () => Promise<void>,
    successToast: Omit<Toast, "id">,
  ) => {
    setError(null);
    try {
      await action();
      addToast(successToast);
    } catch (actionError) {
      const message = actionError instanceof Error ? actionError.message : "Action failed.";
      setError(message);
      addToast({ title: "Action failed", message, type: "error" });
      throw actionError;
    }
  };

  return {
    addFilter: async (draft: FilterDraft) => {
      await withFeedback(
        async () => {
          await getDesktopApi().filters.create(draft);
          await refresh();
        },
        {
          title: "Filter saved",
          message: "The rule will be applied on future supported scrapes.",
          type: "success",
        },
      );
    },

    updateFilter: async (id: string, update: FilterUpdate) => {
      await withFeedback(
        async () => {
          await getDesktopApi().filters.update(id, update);
          await refresh();
        },
        {
          title: "Filter updated",
          message: "The rule changes were saved locally.",
          type: "success",
        },
      );
    },

    deleteFilter: async (id: string) => {
      await withFeedback(
        async () => {
          await getDesktopApi().filters.delete(id);
          await refresh();
        },
        {
          title: "Filter removed",
          message: "The local matching rule was deleted.",
          type: "success",
        },
      );
    },
  };
}
