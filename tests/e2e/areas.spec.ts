import { test, expect } from "@playwright/test";
import { setupAreaApiMocks } from "../mocks/apiMocks";
import { 
  navigateToHome, 
  clickArea, 
  navigateToArea, 
  verifyIndicatorCard, 
  selectDimension 
} from "../utils/testHelpers";

test.describe("Area Selection Flow", () => {
  test.beforeEach(async ({ page }) => {
    // Setup API mocks
    await setupAreaApiMocks(page);
    
    // Navigate to home
    await navigateToHome(page);
  });

  test("should display areas on home page", async ({ page }) => {
    // Check if area button exists
    const areaButton = page.getByRole("button", { name: "Environment" });
    await expect(areaButton).toBeVisible();
  });

  test("should navigate to area page when clicking area", async ({ page }) => {
    // Click area button
    await clickArea(page, "Environment");

    // Check if dimension dropdown is visible
    const dimensionDropdown = page.getByText("Escolha o Dimensão");
    await expect(dimensionDropdown).toBeVisible();
  });

  test("should display indicators when selecting area", async ({ page }) => {
    // Navigate to area page
    await navigateToArea(page, "Environment");

    // Check if indicator exists
    await verifyIndicatorCard(page, "Presence of endemic plants and rare animals");
  });

  test("should filter indicators when selecting dimension", async ({ page }) => {
    // Navigate to area page
    await navigateToArea(page, "Environment");

    // Select dimension
    await selectDimension(page, "Natural capital and land use");

    // Wait for the filtered indicator to be visible
    await verifyIndicatorCard(page, "Presence of endemic plants and rare animals");
  });
}); 
