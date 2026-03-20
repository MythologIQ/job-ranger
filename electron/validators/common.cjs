"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateExternalUrl = validateExternalUrl;
exports.isRecord = isRecord;
exports.validateId = validateId;
exports.validateOptionalString = validateOptionalString;
exports.validateBoolean = validateBoolean;
exports.validateOptionalBoolean = validateOptionalBoolean;
exports.validateFiniteNumber = validateFiniteNumber;
exports.validateStringArray = validateStringArray;
exports.validateOptionalStringArray = validateOptionalStringArray;
exports.validateNullableCompanyId = validateNullableCompanyId;
exports.validateOptionalNullableCompanyId = validateOptionalNullableCompanyId;
function validateExternalUrl(rawUrl) {
    let parsed;
    try {
        parsed = new URL(rawUrl);
    }
    catch {
        throw new Error("Invalid external URL.");
    }
    if (!["http:", "https:"].includes(parsed.protocol)) {
        throw new Error("Only http and https links can be opened outside Job Ranger.");
    }
    return parsed.toString();
}
function isRecord(value) {
    return typeof value === "object" && value !== null;
}
function validateId(rawValue, label) {
    if (typeof rawValue !== "string") {
        throw new Error(`${label} must be a string.`);
    }
    const normalized = rawValue.trim();
    if (!/^\d+$/.test(normalized)) {
        throw new Error(`${label} must be a numeric identifier.`);
    }
    return normalized;
}
function validateOptionalString(rawValue, label) {
    if (rawValue === undefined) {
        return undefined;
    }
    if (typeof rawValue !== "string") {
        throw new Error(`${label} must be a string.`);
    }
    return rawValue.trim();
}
function validateBoolean(rawValue, label) {
    if (typeof rawValue !== "boolean") {
        throw new Error(`${label} must be true or false.`);
    }
    return rawValue;
}
function validateOptionalBoolean(rawValue, label) {
    if (rawValue === undefined) {
        return undefined;
    }
    return validateBoolean(rawValue, label);
}
function validateFiniteNumber(rawValue, label) {
    if (typeof rawValue !== "number" || !Number.isFinite(rawValue)) {
        throw new Error(`${label} must be a finite number.`);
    }
    return rawValue;
}
function validateStringArray(rawValue, label) {
    if (!Array.isArray(rawValue)) {
        throw new Error(`${label} must be an array of strings.`);
    }
    return rawValue.map((entry, index) => {
        if (typeof entry !== "string") {
            throw new Error(`${label}[${index}] must be a string.`);
        }
        return entry.trim();
    });
}
function validateOptionalStringArray(rawValue, label) {
    if (rawValue === undefined) {
        return undefined;
    }
    return validateStringArray(rawValue, label);
}
function validateNullableCompanyId(rawValue, label) {
    if (rawValue === null) {
        return null;
    }
    return validateId(rawValue, label);
}
function validateOptionalNullableCompanyId(rawValue, label) {
    if (rawValue === undefined) {
        return undefined;
    }
    return validateNullableCompanyId(rawValue, label);
}
