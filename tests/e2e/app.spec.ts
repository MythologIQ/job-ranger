import { test, expect } from "@playwright/test";
import { launchElectronApp, closeElectronApp, type ElectronAppFixture } from "./electron-app";

let fixture: ElectronAppFixture;

test.beforeAll(async () => {
  fixture = await launchElectronApp();
});

test.afterAll(async () => {
  await closeElectronApp(fixture);
});

async function navigateToCompanies(page: ElectronAppFixture["page"]) {
  await page.click("text=Companies");
  await page.waitForTimeout(500);
}

async function navigateToJobs(page: ElectronAppFixture["page"]) {
  await page.click("text=Jobs");
  await page.waitForTimeout(500);
}

async function navigateToFilters(page: ElectronAppFixture["page"]) {
  await page.click("text=Filters");
  await page.waitForTimeout(500);
}

async function navigateToSettings(page: ElectronAppFixture["page"]) {
  await page.click("text=Settings");
  await page.waitForTimeout(500);
}

async function navigateToDashboard(page: ElectronAppFixture["page"]) {
  await page.click("text=Dashboard");
  await page.waitForTimeout(500);
}

test.describe("Job Ranger E2E Tests", () => {
  test("app launches and shows dashboard", async () => {
    const { page } = fixture;

    // Dashboard should be the default route - check for Job Ranger branding
    await expect(page.locator("text=Job Ranger")).toBeVisible();
  });

  test("navigation sidebar works", async () => {
    const { page } = fixture;

    // Navigate to Companies
    await navigateToCompanies(page);
    await expect(page.locator("text=Source setup")).toBeVisible();

    // Navigate to Jobs
    await navigateToJobs(page);
    await expect(page.locator("h1")).toBeVisible();

    // Navigate to Filters
    await navigateToFilters(page);
    await expect(page.locator("h1")).toBeVisible();

    // Navigate to Settings
    await navigateToSettings(page);
    await expect(page.locator("text=Functional themes")).toBeVisible();

    // Navigate back to Dashboard
    await navigateToDashboard(page);
  });

  test("companies page shows empty state", async () => {
    const { page } = fixture;

    await navigateToCompanies(page);

    // Should show "Total sources" metric
    await expect(page.locator("text=Total sources")).toBeVisible();
  });

  test("can open add company modal", async () => {
    const { page } = fixture;

    await navigateToCompanies(page);

    // Click "Add source" button
    await page.click("button:has-text('Add source')");
    await page.waitForTimeout(300);

    // Modal should appear with form fields
    await expect(page.locator("#company-name")).toBeVisible();
    await expect(page.locator("#company-url")).toBeVisible();

    // Close modal
    await page.click("button:has-text('Cancel')");
    await page.waitForTimeout(300);
  });

  test("can add a company source", async () => {
    const { page } = fixture;

    await navigateToCompanies(page);

    // Open modal
    await page.click("button:has-text('Add source')");
    await page.waitForTimeout(300);

    // Fill form
    await page.fill("#company-name", "Test Company");
    await page.fill("#company-url", "https://boards.greenhouse.io/testcompany");

    // Submit
    await page.click("button:has-text('Save source')");
    await page.waitForTimeout(500);

    // Company should appear in the list
    await expect(page.locator("text=Test Company")).toBeVisible();
    await expect(page.locator("text=Greenhouse")).toBeVisible();
  });

  test("jobs page loads", async () => {
    const { page } = fixture;

    await navigateToJobs(page);

    // Jobs page should load
    await expect(page.locator("h1")).toBeVisible();
  });

  test("filters page shows empty state", async () => {
    const { page } = fixture;

    await navigateToFilters(page);

    // Filters page should load
    await expect(page.locator("h1")).toBeVisible();
  });

  test("can open add filter modal", async () => {
    const { page } = fixture;

    await navigateToFilters(page);

    // Click "Add filter" button
    await page.click("button:has-text('Add filter')");
    await page.waitForTimeout(300);

    // Modal should appear with form fields
    await expect(page.locator("#filter-name")).toBeVisible();

    // Close modal
    await page.click("button:has-text('Cancel')");
    await page.waitForTimeout(300);
  });

  test("settings page shows configuration options", async () => {
    const { page } = fixture;

    await navigateToSettings(page);

    // Should show theme options
    await expect(page.locator("text=Functional themes")).toBeVisible();

    // Should show runtime behavior section
    await expect(page.locator("text=Runtime behavior")).toBeVisible();

    // Should show notification settings
    await expect(page.locator("text=Notifications")).toBeVisible();

    // Should have save button
    await expect(page.locator("button:has-text('Save')")).toBeVisible();
  });

  test("can toggle notification settings", async () => {
    const { page } = fixture;

    await navigateToSettings(page);

    // Find the notifications checkbox (Enable desktop notifications)
    const notificationCheckbox = page.locator("input[type='checkbox']").first();
    const initialChecked = await notificationCheckbox.isChecked();

    await notificationCheckbox.click();
    await page.waitForTimeout(100);

    const newChecked = await notificationCheckbox.isChecked();
    expect(newChecked).not.toBe(initialChecked);
  });

  test("can delete a company", async () => {
    const { page } = fixture;

    await navigateToCompanies(page);

    // Check if Test Company exists from earlier test
    const companyExists = await page.locator("text=Test Company").count();

    if (companyExists > 0) {
      // Find and click the Remove button for the test company
      await page.click("button:has-text('Remove')");
      await page.waitForTimeout(500);

      // Company should be removed
      await expect(page.locator("text=Test Company")).toHaveCount(0);
    }
  });
});
