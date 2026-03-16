import {
  createContext,
  startTransition,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type {
  Company,
  CompanyDraft,
  CompanyUpdate,
  Filter,
  FilterDraft,
  FilterUpdate,
  Job,
  ScrapeRun,
  Settings,
  SettingsUpdate,
  SystemStatus,
  Toast,
} from "../types";
import { getDesktopApi } from "../services/api";

interface AppState {
  companies: Company[];
  jobs: Job[];
  filters: Filter[];
  scrapeRuns: ScrapeRun[];
  settings: Settings | null;
  systemStatus: SystemStatus | null;
  toasts: Toast[];
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  addCompany: (draft: CompanyDraft) => Promise<void>;
  updateCompany: (id: string, update: CompanyUpdate) => Promise<void>;
  deleteCompany: (id: string) => Promise<void>;
  runScraper: (companyId: string) => Promise<void>;
  addFilter: (draft: FilterDraft) => Promise<void>;
  updateFilter: (id: string, update: FilterUpdate) => Promise<void>;
  deleteFilter: (id: string) => Promise<void>;
  updateSettings: (update: SettingsUpdate) => Promise<void>;
  markJobAsSeen: (id: string) => Promise<void>;
  removeToast: (id: string) => void;
}

const AppContext = createContext<AppState | undefined>(undefined);

const autoDismissMs = 5000;

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filters, setFilters] = useState<Filter[]>([]);
  const [scrapeRuns, setScrapeRuns] = useState<ScrapeRun[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addToast = (toast: Omit<Toast, "id">) => {
    const nextToast: Toast = {
      ...toast,
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    };

    setToasts((current) => [nextToast, ...current].slice(0, 5));
    window.setTimeout(() => {
      setToasts((current) => current.filter((item) => item.id !== nextToast.id));
    }, autoDismissMs);
  };

  const removeToast = (id: string) => {
    setToasts((current) => current.filter((item) => item.id !== id));
  };

  const refresh = async () => {
    const api = getDesktopApi();
    setRefreshing(true);
    setError(null);

    try {
      const [
        nextCompanies,
        nextJobs,
        nextFilters,
        nextSettings,
        nextRuns,
        nextSystemStatus,
      ] = await Promise.all([
        api.companies.list(),
        api.jobs.list(),
        api.filters.list(),
        api.settings.get(),
        api.scrapeRuns.listRecent(12),
        api.system.getStatus(),
      ]);

      startTransition(() => {
        setCompanies(nextCompanies);
        setJobs(nextJobs);
        setFilters(nextFilters);
        setSettings(nextSettings);
        setScrapeRuns(nextRuns);
        setSystemStatus(nextSystemStatus);
      });
    } catch (refreshError) {
      const message =
        refreshError instanceof Error
          ? refreshError.message
          : "Failed to load Job Ranger data.";
      setError(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void refresh();

    const intervalId = window.setInterval(() => {
      void refresh();
    }, 30000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  const withFeedback = async (
    action: () => Promise<void>,
    successToast: Omit<Toast, "id">,
  ) => {
    setError(null);

    try {
      await action();
      addToast(successToast);
    } catch (actionError) {
      const message =
        actionError instanceof Error ? actionError.message : "Action failed.";
      setError(message);
      addToast({
        title: "Action failed",
        message,
        type: "error",
      });
      throw actionError;
    }
  };

  const value = useMemo<AppState>(
    () => ({
      companies,
      jobs,
      filters,
      scrapeRuns,
      settings,
      systemStatus,
      toasts,
      loading,
      refreshing,
      error,
      refresh,
      addCompany: async (draft) => {
        await withFeedback(
          async () => {
            await getDesktopApi().companies.create(draft);
            await refresh();
          },
          {
            title: "Company saved",
            message: "Job Ranger is now tracking the new source locally.",
            type: "success",
          },
        );
      },
      updateCompany: async (id, update) => {
        await withFeedback(
          async () => {
            await getDesktopApi().companies.update(id, update);
            await refresh();
          },
          {
            title: "Company updated",
            message: "The source configuration was updated.",
            type: "success",
          },
        );
      },
      deleteCompany: async (id) => {
        await withFeedback(
          async () => {
            await getDesktopApi().companies.delete(id);
            await refresh();
          },
          {
            title: "Company removed",
            message: "Associated jobs and scrape history were removed.",
            type: "success",
          },
        );
      },
      runScraper: async (companyId) => {
        setError(null);

        try {
          const run = await getDesktopApi().companies.runScrape(companyId);
          await refresh();

          if (run.status === "success") {
            addToast({
              title: "Scrape finished",
              message: "Latest jobs and run history have been refreshed.",
              type: "success",
            });
            return;
          }

          if (run.status === "unsupported") {
            addToast({
              title: "Source unsupported",
              message:
                run.errorMessage ??
                "This source needs a different extraction path or a dedicated adapter.",
              type: "info",
            });
            return;
          }

          const failureMessage =
            run.errorMessage ?? "The scrape did not complete successfully.";
          setError(failureMessage);
          addToast({
            title: "Scrape failed",
            message: failureMessage,
            type: "error",
          });
        } catch (actionError) {
          const message =
            actionError instanceof Error ? actionError.message : "Action failed.";
          setError(message);
          addToast({
            title: "Action failed",
            message,
            type: "error",
          });
          throw actionError;
        }
      },
      addFilter: async (draft) => {
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
      updateFilter: async (id, update) => {
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
      deleteFilter: async (id) => {
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
      updateSettings: async (update) => {
        await withFeedback(
          async () => {
            const nextSettings = await getDesktopApi().settings.update(update);
            setSettings(nextSettings);
            await refresh();
          },
          {
            title: "Settings saved",
            message: "Desktop runtime settings were persisted locally.",
            type: "success",
          },
        );
      },
      markJobAsSeen: async (id) => {
        await withFeedback(
          async () => {
            await getDesktopApi().jobs.markSeen(id);
            await refresh();
          },
          {
            title: "Job updated",
            message: "The job is no longer marked as new.",
            type: "info",
          },
        );
      },
      removeToast,
    }),
    [companies, jobs, filters, scrapeRuns, settings, systemStatus, toasts, loading, refreshing, error],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
};



