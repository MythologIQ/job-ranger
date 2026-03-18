export type CompanySourceType =
  | "greenhouse"
  | "lever"
  | "workday"
  | "icims"
  | "smartrecruiters"
  | "ashby"
  | "bamboohr"
  | "taleo"
  | "oracle"
  | "microsoft"
  | "generic-html"
  | "browser-required"
  | "unsupported";

export type SourceExtractionMode = "api" | "html" | "hybrid" | "browser" | "unknown";

export type SourceSupportLevel =
  | "supported"
  | "detected"
  | "browser-required"
  | "manual-review";

export {
  type SourceProfile,
  sourceProfiles,
  getSourceProfile,
  canRunSourceType,
} from "./source-profiles.cjs";

export type CompanyRunStatus =
  | "idle"
  | "success"
  | "failure"
  | "partial"
  | "unsupported";

export type ScrapeRunStatus =
  | "queued"
  | "running"
  | "success"
  | "failure"
  | "partial"
  | "unsupported"
  | "skipped";

export interface Company {
  id: string;
  name: string;
  url: string;
  sourceType: CompanySourceType;
  sourceIdentifier: string | null;
  frequencyMinutes: number;
  isActive: boolean;
  lastRunAt: string | null;
  lastRunStatus: CompanyRunStatus;
  lastErrorMessage: string | null;
  consecutiveFailures: number;
  circuitOpenUntil: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CompanyDraft {
  name: string;
  url: string;
  frequencyMinutes: number;
  isActive: boolean;
}

export interface CompanyUpdate {
  name?: string;
  url?: string;
  frequencyMinutes?: number;
  isActive?: boolean;
}

export interface Job {
  id: string;
  companyId: string;
  sourceJobId: string;
  sourceType: CompanySourceType;
  title: string;
  location: string;
  employmentType: string | null;
  url: string;
  descriptionSnippet: string;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string | null;
  salaryText: string | null;
  postDate: string | null;
  createdAt: string;
  lastSeenAt: string;
  isActive: boolean;
  isNew: boolean;
  matchedFilterCount: number;
}

export interface Filter {
  id: string;
  name: string;
  companyId: string | null;
  titleInclude: string[];
  titleExclude: string[];
  keywordsInclude: string[];
  keywordsExclude: string[];
  salaryMin: number | null;
  locationInclude: string[];
  locationExclude: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FilterDraft {
  name: string;
  companyId: string | null;
  titleInclude: string[];
  titleExclude: string[];
  keywordsInclude: string[];
  keywordsExclude: string[];
  salaryMin: number | null;
  locationInclude: string[];
  locationExclude: string[];
  isActive: boolean;
}

export type FilterUpdate = Partial<FilterDraft>;

export interface ScrapeRun {
  id: string;
  companyId: string;
  startedAt: string;
  finishedAt: string | null;
  status: ScrapeRunStatus;
  jobsFoundCount: number;
  jobsMatchedCount: number;
  errorMessage: string | null;
}

export interface Settings {
  userAgent: string;
  maxConcurrentScrapes: number;
  scrapeTimeoutMs: number;
  retryCount: number;
  scrapeCooldownMinutes: number;
  circuitBreakerThreshold: number;
  circuitBreakerCooldownMinutes: number;
  notificationsEnabled: boolean;
  notifyOnNewJobs: boolean;
  notifyOnMatchedJobs: boolean;
  minimizeToTray: boolean;
}

export type SettingsUpdate = Partial<Settings>;

export interface SystemStatus {
  backend: "electron-ipc";
  platform: string;
  databasePath: string;
  sqliteBinaryPath: string;
  supportedSources: CompanySourceType[];
}

export interface BrowserLoadOptions {
  url: string;
  waitSelectors: string[];
  maxWaitMs: number;
  enableScroll: boolean;
  maxScrollIterations: number;
}

export interface PlatformSelectors {
  waitFor: string[];
  jobCard: string;
  title: string;
  location: string;
  link: string;
}

export interface DesktopApi {
  getAppVersion: () => Promise<string>;
  getPlatform: () => Promise<string>;
  openExternal: (url: string) => Promise<void>;
  showItemInFolder: (path: string) => Promise<void>;
  system: {
    getStatus: () => Promise<SystemStatus>;
  };
  companies: {
    list: () => Promise<Company[]>;
    create: (draft: CompanyDraft) => Promise<Company>;
    update: (id: string, update: CompanyUpdate) => Promise<Company>;
    delete: (id: string) => Promise<void>;
    runScrape: (id: string) => Promise<ScrapeRun>;
  };
  jobs: {
    list: () => Promise<Job[]>;
    markSeen: (id: string) => Promise<Job>;
  };
  filters: {
    list: () => Promise<Filter[]>;
    create: (draft: FilterDraft) => Promise<Filter>;
    update: (id: string, update: FilterUpdate) => Promise<Filter>;
    delete: (id: string) => Promise<void>;
  };
  settings: {
    get: () => Promise<Settings>;
    update: (update: SettingsUpdate) => Promise<Settings>;
  };
  scrapeRuns: {
    listRecent: (limit?: number) => Promise<ScrapeRun[]>;
  };
}
