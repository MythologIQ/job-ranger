"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateCompanyDraft = validateCompanyDraft;
exports.validateCompanyUpdate = validateCompanyUpdate;
const common_cjs_1 = require("./common.cjs");
function validateCompanyDraft(rawValue) {
    if (!(0, common_cjs_1.isRecord)(rawValue)) {
        throw new Error("Company payload must be an object.");
    }
    const name = (0, common_cjs_1.validateOptionalString)(rawValue.name, "Company name");
    const url = (0, common_cjs_1.validateOptionalString)(rawValue.url, "Company URL");
    if (!name) {
        throw new Error("Company name is required.");
    }
    if (!url) {
        throw new Error("Company URL is required.");
    }
    return {
        name,
        url: (0, common_cjs_1.validateExternalUrl)(url),
        frequencyMinutes: (0, common_cjs_1.validateFiniteNumber)(rawValue.frequencyMinutes, "Frequency"),
        isActive: (0, common_cjs_1.validateBoolean)(rawValue.isActive, "Company active flag"),
    };
}
function validateCompanyUpdate(rawValue) {
    if (!(0, common_cjs_1.isRecord)(rawValue)) {
        throw new Error("Company update payload must be an object.");
    }
    const update = {};
    const name = (0, common_cjs_1.validateOptionalString)(rawValue.name, "Company name");
    const url = (0, common_cjs_1.validateOptionalString)(rawValue.url, "Company URL");
    if (name !== undefined) {
        if (!name) {
            throw new Error("Company name cannot be empty.");
        }
        update.name = name;
    }
    if (url !== undefined) {
        update.url = (0, common_cjs_1.validateExternalUrl)(url);
    }
    if (rawValue.frequencyMinutes !== undefined) {
        update.frequencyMinutes = (0, common_cjs_1.validateFiniteNumber)(rawValue.frequencyMinutes, "Frequency");
    }
    if (rawValue.isActive !== undefined) {
        update.isActive = (0, common_cjs_1.validateBoolean)(rawValue.isActive, "Company active flag");
    }
    return update;
}
