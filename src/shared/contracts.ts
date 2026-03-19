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

export interface SourceProfile {
  type: CompanySourceType;
  label: string;
  extractionMode: SourceExtractionMode;
  supportLevel: SourceSupportLevel;
  canRun: boolean;
  summary: string;
}

export const sourceProfiles: Record<CompanySourceType, SourceProfile> = {
  greenhouse: {
    type: "greenhouse",
    label: "Greenhouse",
    extractionMode: "api",
    supportLevel: "supported",
    canRun: true,
    summary: "Structured board API adapter.",
  },
  lever: {
    type: "lever",
    label: "Lever",
    extractionMode: "api",
    supportLevel: "supported",
    canRun: true,
    summary: "Structured posting API adapter.",
  },
  workday: {
    type: "workday",
    label: "Workday",
    extractionMode: "html",
    supportLevel: "detected",
    canRun: true,
    summary: "Detected Workday portal using generic extraction with browser fallback.",
  },
  icims: {
    type: "icims",
    label: "iCIMS",
    extractionMode: "html",
    supportLevel: "detected",
    canRun: true,
    summary: "Detected iCIMS portal using generic extraction with browser fallback.",
  },
  smartrecruiters: {
    type: "smartrecruiters",
    label: "SmartRecruiters",
    extractionMode: "api",
    supportLevel: "supported",
    canRun: true,
    summary: "Structured posting API adapter.",
  },
  ashby: {
    type: "ashby",
    label: "Ashby",
    extractionMode: "api",
    supportLevel: "supported",
    canRun: true,
    summary: "Structured job board API adapter with compensation data.",
  },
  bamboohr: {
    type: "bamboohr",
    label: "BambooHR",
    extractionMode: "html",
    supportLevel: "detected",
    canRun: true,
    summary: "Detected BambooHR board using generic extraction with browser fallback.",
  },
  taleo: {
    type: "taleo",
    label: "Taleo",
    extractionMode: "html",
    supportLevel: "detected",
    canRun: true,
    summary: "Detected Taleo or Oracle Recruiting page using generic extraction with browser fallback.",
  },
  oracle: {
    type: "oracle",
    label: "Oracle Careers",
    extractionMode: "html",
    supportLevel: "detected",
    canRun: true,
    summary: "Detected Oracle careers page using generic extraction with browser fallback.",
  },
  microsoft: {
    type: "microsoft",
    label: "Microsoft Careers",
    extractionMode: "browser",
    supportLevel: "browser-required",
    canRun: true,
    summary: "Detected Microsoft Careers using browser-backed extraction.",
  },
  "generic-html": {
    type: "generic-html",
    label: "Generic careers page",
    extractionMode: "html",
    supportLevel: "detected",
    canRun: true,
    summary: "Detected a likely careers page using generic extraction with browser fallback.",
  },
  "browser-required": {
    type: "browser-required",
    label: "Browser-backed portal",
    extractionMode: "browser",
    supportLevel: "browser-required",
    canRun: true,
    summary: "Detected a portal that runs through the hidden browser extractor.",
  },
  unsupported: {
    type: "unsupported",
    label: "Unknown source",
    extractionMode: "unknown",
    supportLevel: "manual-review",
    canRun: false,
    summary: "No reliable extraction path has been detected yet.",
  },
};

export function getSourceProfile(type: CompanySourceType): SourceProfile {
  return sourceProfiles[type] ?? sourceProfiles.unsupported;
}

export function canRunSourceType(type: CompanySourceType): boolean {
  return getSourceProfile(type).canRun;
}

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
