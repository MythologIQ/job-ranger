import type { FilterDraft, FilterUpdate } from "../../../src/shared/contracts.js";
import {
  isRecord,
  validateBoolean,
  validateFiniteNumber,
  validateNullableCompanyId,
  validateOptionalBoolean,
  validateOptionalNullableCompanyId,
  validateOptionalString,
  validateOptionalStringArray,
  validateStringArray,
} from "./common.cjs";

export function validateFilterDraft(rawValue: unknown): FilterDraft {
  if (!isRecord(rawValue)) {
    throw new Error("Filter payload must be an object.");
  }

  const name = validateOptionalString(rawValue.name, "Filter name");
  if (!name) {
    throw new Error("Filter name is required.");
  }

  return {
    name,
    companyId: validateNullableCompanyId(rawValue.companyId, "Filter company id"),
    titleInclude: validateStringArray(rawValue.titleInclude, "titleInclude"),
    titleExclude: validateStringArray(rawValue.titleExclude, "titleExclude"),
    keywordsInclude: validateStringArray(rawValue.keywordsInclude, "keywordsInclude"),
    keywordsExclude: validateStringArray(rawValue.keywordsExclude, "keywordsExclude"),
    salaryMin:
      rawValue.salaryMin === null
        ? null
        : validateFiniteNumber(rawValue.salaryMin, "salaryMin"),
    locationInclude: validateStringArray(rawValue.locationInclude, "locationInclude"),
    locationExclude: validateStringArray(rawValue.locationExclude, "locationExclude"),
    isActive: validateBoolean(rawValue.isActive, "Filter active flag"),
  };
}

export function validateFilterUpdate(rawValue: unknown): FilterUpdate {
  if (!isRecord(rawValue)) {
    throw new Error("Filter update payload must be an object.");
  }

  const update: FilterUpdate = {};
  const name = validateOptionalString(rawValue.name, "Filter name");
  if (name !== undefined) {
    if (!name) {
      throw new Error("Filter name cannot be empty.");
    }
    update.name = name;
  }
  update.companyId = validateOptionalNullableCompanyId(
    rawValue.companyId,
    "Filter company id",
  );
  update.titleInclude = validateOptionalStringArray(rawValue.titleInclude, "titleInclude");
  update.titleExclude = validateOptionalStringArray(rawValue.titleExclude, "titleExclude");
  update.keywordsInclude = validateOptionalStringArray(
    rawValue.keywordsInclude,
    "keywordsInclude",
  );
  update.keywordsExclude = validateOptionalStringArray(
    rawValue.keywordsExclude,
    "keywordsExclude",
  );
  if (rawValue.salaryMin !== undefined) {
    update.salaryMin =
      rawValue.salaryMin === null
        ? null
        : validateFiniteNumber(rawValue.salaryMin, "salaryMin");
  }
  update.locationInclude = validateOptionalStringArray(
    rawValue.locationInclude,
    "locationInclude",
  );
  update.locationExclude = validateOptionalStringArray(
    rawValue.locationExclude,
    "locationExclude",
  );
  update.isActive = validateOptionalBoolean(rawValue.isActive, "Filter active flag");
  return update;
}
