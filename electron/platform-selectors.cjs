"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PLATFORM_SELECTORS = void 0;
exports.getSelectorsForSource = getSelectorsForSource;
const defaultSelectors = {
    waitFor: ['[class*="job"]', '[class*="position"]', '[class*="opening"]', 'a[href*="job"]'],
    jobCard: '[class*="job-card"], [class*="job-listing"], [class*="position-card"]',
    title: '[class*="title"], h2, h3',
    location: '[class*="location"], [class*="city"]',
    link: 'a[href*="job"], a[href*="position"], a[href*="career"]',
};
exports.PLATFORM_SELECTORS = {
    workday: {
        waitFor: ['[data-automation-id="jobTitle"]', '[class*="WGDC"]'],
        jobCard: '[data-automation-id="jobItem"], [class*="job-item"]',
        title: '[data-automation-id="jobTitle"]',
        location: '[data-automation-id="location"]',
        link: 'a[data-automation-id="jobTitle"]',
    },
    icims: {
        waitFor: ['.iCIMS_JobsTable', '.iCIMS_JobHeaderLink'],
        jobCard: '.iCIMS_JobsTable tr, .iCIMS_Jobs_Card',
        title: '.iCIMS_JobHeaderLink, .iCIMS_JobTitle',
        location: '.iCIMS_Location',
        link: '.iCIMS_JobHeaderLink',
    },
    smartrecruiters: {
        waitFor: ['.job-item', '[data-test="job-list"]'],
        jobCard: '.job-item, [data-test="job-card"]',
        title: '.job-title, [data-test="job-title"]',
        location: '.job-location, [data-test="job-location"]',
        link: 'a.job-link, a[data-test="job-link"]',
    },
    ashby: {
        waitFor: ['[class*="posting"]', '[class*="job-board"]'],
        jobCard: '[class*="posting-card"], [class*="job-card"]',
        title: '[class*="posting-title"], h3',
        location: '[class*="posting-location"], [class*="location"]',
        link: 'a[href*="/job/"]',
    },
    bamboohr: {
        waitFor: ['.BambooHR-ATS-board', '[class*="job-listing"]'],
        jobCard: '.BambooHR-ATS-Jobs-List tr, .BambooHR-Job-Card',
        title: '.BambooHR-ATS-Jobs-Title, .job-title',
        location: '.BambooHR-ATS-Location, .location',
        link: '.BambooHR-ATS-Jobs-Title a',
    },
    taleo: {
        waitFor: ['[id*="requisition"]', '.contentlinepanel'],
        jobCard: '.contentlinepanel, [class*="requisition-row"]',
        title: '.contentlinepaneltext, [class*="requisition-title"]',
        location: '.contentlinepaneltext:nth-child(2)',
        link: 'a[href*="requisition"]',
    },
    microsoft: {
        waitFor: ['[data-m*="job"]', '[class*="job-card"]'],
        jobCard: '[data-m*="job"], .job-card',
        title: '[data-m*="title"], .job-title',
        location: '[data-m*="location"], .job-location',
        link: 'a[href*="/job/"], a[href*="/en-us/job/"]',
    },
};
function getSelectorsForSource(sourceType) {
    return exports.PLATFORM_SELECTORS[sourceType] ?? defaultSelectors;
}
