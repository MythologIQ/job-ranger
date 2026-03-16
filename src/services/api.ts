import type { DesktopApi } from "../../shared/contracts";

export class DesktopApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DesktopApiError";
  }
}

export function hasDesktopApi(): boolean {
  return typeof window !== "undefined" && typeof window.electronAPI !== "undefined";
}

export function getDesktopApi(): DesktopApi {
  if (!hasDesktopApi()) {
    throw new DesktopApiError(
      "Job Ranger requires the Electron desktop shell. Use `npm run electron:dev` for local development.",
    );
  }

  return window.electronAPI;
}


