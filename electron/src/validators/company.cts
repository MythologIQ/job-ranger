import type { CompanyDraft, CompanyUpdate } from "../../../src/shared/contracts.js";
import {
  isRecord,
  validateBoolean,
  validateExternalUrl,
  validateFiniteNumber,
  validateOptionalString,
} from "./common.cjs";

export function validateCompanyDraft(rawValue: unknown): CompanyDraft {
  if (!isRecord(rawValue)) {
    throw new Error("Company payload must be an object.");
  }

  const name = validateOptionalString(rawValue.name, "Company name");
  const url = validateOptionalString(rawValue.url, "Company URL");
  if (!name) {
    throw new Error("Company name is required.");
  }
  if (!url) {
    throw new Error("Company URL is required.");
  }

  return {
    name,
    url: validateExternalUrl(url),
    frequencyMinutes: validateFiniteNumber(rawValue.frequencyMinutes, "Frequency"),
    isActive: validateBoolean(rawValue.isActive, "Company active flag"),
  };
}

export function validateCompanyUpdate(rawValue: unknown): CompanyUpdate {
  if (!isRecord(rawValue)) {
    throw new Error("Company update payload must be an object.");
  }

  const update: CompanyUpdate = {};
  const name = validateOptionalString(rawValue.name, "Company name");
  const url = validateOptionalString(rawValue.url, "Company URL");
  if (name !== undefined) {
    if (!name) {
      throw new Error("Company name cannot be empty.");
    }
    update.name = name;
  }
  if (url !== undefined) {
    update.url = validateExternalUrl(url);
  }
  if (rawValue.frequencyMinutes !== undefined) {
    update.frequencyMinutes = validateFiniteNumber(
      rawValue.frequencyMinutes,
      "Frequency",
    );
  }
  if (rawValue.isActive !== undefined) {
    update.isActive = validateBoolean(rawValue.isActive, "Company active flag");
  }
  return update;
}
