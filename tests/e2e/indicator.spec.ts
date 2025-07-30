import { test, expect } from "@playwright/test";
import { setupIndicatorApiMocks } from "../mocks/apiMocks";
import { 
  navigateToDomain, 
  clickIndicator, 
  verifyIndicatorDetails 
} from "../utils/testHelpers";

test.describe("Indicator Navigation Flow", () => {
  test.beforeEach(async ({ page }) => {
    // Setup API mocks
    await setupIndicatorApiMocks(page);
    
    // Navigate to domain page
    await navigateToDomain(page, "Environment");
  });

  test("should navigate to indicator page when clicking indicator", async ({ page }) => {
    // Click on indicator
    await clickIndicator(page, "Presence of endemic plants and rare animals");

    // Verify indicator details page
    await verifyIndicatorDetails(
      page, 
      "Presence of endemic plants and rare animals", 
      "Natural capital and land use"
    );

    // Check additional indicator details
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
