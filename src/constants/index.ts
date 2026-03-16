// Application Constants
// Centralized location for all application-wide constants

// API Configuration
export const API_TIMEOUT = 30000; // 30 seconds
export const MAX_RETRIES = 3;
export const RETRY_DELAY = 1000; // 1 second

// Toast Configuration
export const TOAST_AUTO_DISMISS = 5000; // 5 seconds
export const MAX_TOASTS = 5;

// Pagination
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

// Scraping
export const DEFAULT_SCRAPER_FREQUENCY = 1440; // 24 hours in minutes
export const MIN_SCRAPER_FREQUENCY = 15; // 15 minutes
export const MAX_CONCURRENT_SCRAPES = 5;

// Validation
export const MAX_COMPANY_NAME_LENGTH = 100;
export const MAX_URL_LENGTH = 500;
export const MIN_SALARY = 0;
export const MAX_SALARY = 1000000;

// Date Formats
export const DATE_FORMAT = "MMM d, yyyy";
export const TIME_FORMAT = "h:mm a";
export const DATETIME_FORMAT = "MMM d, yyyy h:mm a";

// Status Colors
export const STATUS_COLORS = {
  success: "green",
  warning: "yellow",
  error: "red",
  info: "blue",
} as const;

export const STATUS_VARIANTS = {
  success: "bg-green-50 text-green-700 ring-green-600/20",
  warning: "bg-yellow-50 text-yellow-700 ring-yellow-600/20",
  error: "bg-red-50 text-red-700 ring-red-600/20",
  info: "bg-blue-50 text-blue-700 ring-blue-600/20",
} as const;

// Frequency Options (in minutes)
export const FREQUENCY_OPTIONS = [
  { value: 15, label: "Every 15 minutes" },
  { value: 30, label: "Every 30 minutes" },
  { value: 60, label: "Every hour" },
  { value: 1440, label: "Every 24 hours" },
  { value: 10080, label: "Weekly" },
] as const;

// Employment Types
export const EMPLOYMENT_TYPES = [
  "Full-time",
  "Part-time",
  "Contract",
  "Internship",
  "Freelance",
] as const;

// Salary Currencies
export const SALARY_CURRENCIES = ["USD", "EUR", "GBP", "CAD", "AUD"] as const;

// Location Types
export const LOCATION_TYPES = ["Remote", "On-site", "Hybrid"] as const;
