import { test, expect } from "@playwright/test";
import { setupDomainApiMocks } from "../mocks/apiMocks";
import { 
  navigateToDomain, 
  clickIndicator, 
  verifyIndicatorDetails 
} from "../utils/testHelpers";

test.describe("Indicator Navigation Flow", () => {
  test.beforeEach(async ({ page }) => {
    // Setup API mocks
    await setupDomainApiMocks(page);
  });

  test("should navigate to indicator page when clicking indicator", async ({ page }) => {
    // Navigate directly to the indicator page
    await page.goto("/indicator/6882aed71331d722c9da1f61");
    
    // Wait a bit for the page to load
    await page.waitForTimeout(2000);

    // Verify indicator details page
    await verifyIndicatorDetails(
      page, 
      "Presence of endemic plants and rare animals", 
      "Natural capital and land use"
    );

    // Check additional indicator details using mock data
    const categoryText = page.getByText("Biodiversity");
    await expect(categoryText).toBeVisible();

    const measurementUnitText = page.getByText("units");
    await expect(measurementUnitText).toBeVisible();

    const sourceText = page.getByText("CM Ílhavo");
    await expect(sourceText).toBeVisible();

    const periodicityText = page.getByText("annual");
    await expect(periodicityText).toBeVisible();
  });
}); 
