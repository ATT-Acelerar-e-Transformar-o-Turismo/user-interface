import { Page, expect } from '@playwright/test';

export class TestHelpers {
  /**
   * Wait for areas to load and verify they are visible
   */
  static async waitForAreasToLoad(page: Page) {
    // Backend endpoint is still `/api/domains/` (the UI-level rename to
    // "areas" is display-only). Match both so the helper keeps working if
    // the backend later gets renamed to /api/areas/.
    await page.waitForResponse(response => {
      const url = response.url();
      return url.includes("/api/domains") || url.includes("/api/areas");
    }, { timeout: 30000 });
  }

  /**
   * Wait for indicators to load and verify they are visible
   */
  static async waitForIndicatorsToLoad(page: Page) {
    await page.waitForResponse(response => 
      response.url().includes("/api/indicators"),
      { timeout: 30000 }
    );

    // Wait for loading to finish - try multiple selectors
    try {
      await page.waitForSelector(".flex-wrap", { timeout: 10000 });
    } catch {
      // If flex-wrap doesn't appear, try waiting for cards or other indicators
      try {
        await page.waitForSelector(".card", { timeout: 10000 });
      } catch {
        // If nothing appears, just wait a bit more
        await page.waitForTimeout(2000);
      }
    }
  }

  /**
   * Navigate to home page and wait for areas to load
   */
  static async navigateToHome(page: Page) {
    await page.goto("/home");
    await TestHelpers.waitForAreasToLoad(page);
  }

  /**
   * Navigate to area page and wait for indicators to load
   */
  static async navigateToArea(page: Page, areaName: string = "Environment") {
    await page.goto(`/${areaName.toLowerCase()}`);
    await TestHelpers.waitForIndicatorsToLoad(page);
  }

  /**
   * Click on a area and wait for navigation
   */
  static async clickArea(page: Page, areaName: string = "Environment") {
    const areaButton = page.getByRole("button", { name: areaName });
    await areaButton.click();
    
    // Wait for URL to change
    await expect(page).toHaveURL(`/${areaName.toLowerCase()}`);
  }

  /**
   * Click on an indicator and wait for navigation
   */
  static async clickIndicator(page: Page, indicatorName: string) {
    console.log("Looking for indicator card with text:", indicatorName);
    
    const indicatorCard = page.locator(".card").filter({ hasText: indicatorName });
    await expect(indicatorCard).toBeVisible();
    console.log("Found indicator card");

    const viewIndicatorButton = indicatorCard.locator("button", { hasText: "Ver Indicador" });
    await expect(viewIndicatorButton).toBeVisible();
    console.log("Found Ver Indicador button");
    
    await viewIndicatorButton.click();
    console.log("Clicked Ver Indicador button");

    // Wait for navigation to complete
    await page.waitForURL(/^\/indicator\/[a-f0-9]{24}$/);
    console.log("Navigation completed");
  }

  /**
   * Select a dimension from dropdown
   */
  static async selectDimension(page: Page, dimensionName: string) {
    // Open dimension dropdown by clicking its summary
    const dimensionSummary = page.getByText("Escolha o Dimensão");
    await dimensionSummary.click();

    // Wait for dropdown menu to be visible and click dimension option
    await page.evaluate((dimension) => {
      const details = document.querySelectorAll("details")[1];
      details.setAttribute("open", "");
      const link = Array.from(details.querySelectorAll("a")).find(a => a.textContent === dimension);
      if (link) link.click();
    }, dimensionName);
  }

  /**
   * Verify indicator card is visible with correct content
   */
  static async verifyIndicatorCard(page: Page, indicatorName: string) {
    const indicatorCard = page.locator(".card").filter({ hasText: indicatorName });
    await expect(indicatorCard).toBeVisible();

    const viewIndicatorButton = indicatorCard.locator("button", { hasText: "Ver Indicador" });
    await expect(viewIndicatorButton).toBeVisible();
  }

  /**
   * Verify indicator details page content
   */
  static async verifyIndicatorDetails(page: Page, indicatorName: string, dimensionName: string) {
    // Verify URL changed to indicator page
    const currentUrl = page.url();
    const urlPath = new URL(currentUrl).pathname;
    expect(urlPath).toMatch(/^\/indicator\/[a-f0-9]{24}$/);

    // Check if indicator details are visible
    const indicatorNameHeading = page.getByRole("heading", { name: indicatorName });
    await expect(indicatorNameHeading).toBeVisible();

    // Look for dimension in the specific section where it should appear
    const dimensionText = page.locator("p").filter({ hasText: "Dimension" }).filter({ hasText: dimensionName });
    await expect(dimensionText).toBeVisible();
  }
}

// Convenience functions
export const waitForAreasToLoad = TestHelpers.waitForAreasToLoad;
export const waitForIndicatorsToLoad = TestHelpers.waitForIndicatorsToLoad;
export const navigateToHome = TestHelpers.navigateToHome;
export const navigateToArea = TestHelpers.navigateToArea;
export const clickArea = TestHelpers.clickArea;
export const clickIndicator = TestHelpers.clickIndicator;
export const selectDimension = TestHelpers.selectDimension;
export const verifyIndicatorCard = TestHelpers.verifyIndicatorCard;
export const verifyIndicatorDetails = TestHelpers.verifyIndicatorDetails; 