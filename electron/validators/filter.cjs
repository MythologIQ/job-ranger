"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateFilterDraft = validateFilterDraft;
exports.validateFilterUpdate = validateFilterUpdate;
const common_cjs_1 = require("./common.cjs");
function validateFilterDraft(rawValue) {
    if (!(0, common_cjs_1.isRecord)(rawValue)) {
        throw new Error("Filter payload must be an object.");
    }
    const name = (0, common_cjs_1.validateOptionalString)(rawValue.name, "Filter name");
    if (!name) {
        throw new Error("Filter name is required.");
    }
    return {
        name,
        companyId: (0, common_cjs_1.validateNullableCompanyId)(rawValue.companyId, "Filter company id"),
        titleInclude: (0, common_cjs_1.validateStringArray)(rawValue.titleInclude, "titleInclude"),
        titleExclude: (0, common_cjs_1.validateStringArray)(rawValue.titleExclude, "titleExclude"),
        keywordsInclude: (0, common_cjs_1.validateStringArray)(rawValue.keywordsInclude, "keywordsInclude"),
        keywordsExclude: (0, common_cjs_1.validateStringArray)(rawValue.keywordsExclude, "keywordsExclude"),
        salaryMin: rawValue.salaryMin === null
            ? null
            : (0, common_cjs_1.validateFiniteNumber)(rawValue.salaryMin, "salaryMin"),
        locationInclude: (0, common_cjs_1.validateStringArray)(rawValue.locationInclude, "locationInclude"),
        locationExclude: (0, common_cjs_1.validateStringArray)(rawValue.locationExclude, "locationExclude"),
        isActive: (0, common_cjs_1.validateBoolean)(rawValue.isActive, "Filter active flag"),
    };
}
function validateFilterUpdate(rawValue) {
    if (!(0, common_cjs_1.isRecord)(rawValue)) {
        throw new Error("Filter update payload must be an object.");
    }
    const update = {};
    const name = (0, common_cjs_1.validateOptionalString)(rawValue.name, "Filter name");
    if (name !== undefined) {
        if (!name) {
            throw new Error("Filter name cannot be empty.");
        }
        update.name = name;
    }
    update.companyId = (0, common_cjs_1.validateOptionalNullableCompanyId)(rawValue.companyId, "Filter company id");
    update.titleInclude = (0, common_cjs_1.validateOptionalStringArray)(rawValue.titleInclude, "titleInclude");
    update.titleExclude = (0, common_cjs_1.validateOptionalStringArray)(rawValue.titleExclude, "titleExclude");
    update.keywordsInclude = (0, common_cjs_1.validateOptionalStringArray)(rawValue.keywordsInclude, "keywordsInclude");
    update.keywordsExclude = (0, common_cjs_1.validateOptionalStringArray)(rawValue.keywordsExclude, "keywordsExclude");
    if (rawValue.salaryMin !== undefined) {
        update.salaryMin =
            rawValue.salaryMin === null
                ? null
                : (0, common_cjs_1.validateFiniteNumber)(rawValue.salaryMin, "salaryMin");
    }
    update.locationInclude = (0, common_cjs_1.validateOptionalStringArray)(rawValue.locationInclude, "locationInclude");
    update.locationExclude = (0, common_cjs_1.validateOptionalStringArray)(rawValue.locationExclude, "locationExclude");
    update.isActive = (0, common_cjs_1.validateOptionalBoolean)(rawValue.isActive, "Filter active flag");
    return update;
}
