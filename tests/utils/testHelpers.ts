import { Page, expect } from '@playwright/test';

export class TestHelpers {
  /**
   * Wait for domains to load and verify they are visible
   */
  static async waitForDomainsToLoad(page: Page) {
    await page.waitForResponse(response => 
      response.url().includes("/api/domains"),
      { timeout: 30000 }
    );
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
   * Navigate to home page and wait for domains to load
   */
  static async navigateToHome(page: Page) {
    await page.goto("/home");
    await TestHelpers.waitForDomainsToLoad(page);
  }

  /**
   * Navigate to domain page and wait for indicators to load
   */
  static async navigateToDomain(page: Page, domainName: string = "Environment") {
    await page.goto(`/${domainName.toLowerCase()}`);
    await TestHelpers.waitForIndicatorsToLoad(page);
  }

  /**
   * Click on a domain and wait for navigation
   */
  static async clickDomain(page: Page, domainName: string = "Environment") {
    const domainButton = page.getByRole("button", { name: domainName });
    await domainButton.click();
    
    // Wait for URL to change
    await expect(page).toHaveURL(`/${domainName.toLowerCase()}`);
  }

  /**
   * Click on an indicator and wait for navigation
   */
  static async clickIndicator(page: Page, indicatorName: string) {
    const indicatorCard = page.locator(".card").filter({ hasText: indicatorName });
    await expect(indicatorCard).toBeVisible();

    const viewIndicatorButton = indicatorCard.locator("button", { hasText: "Ver Indicador" });
    await viewIndicatorButton.click();

    // Wait for indicator details to load
    await page.waitForResponse(response => 
      response.url().includes("/api/indicators/"),
      { timeout: 30000 }
    );
  }

  /**
   * Select a subdomain from dropdown
   */
  static async selectSubdomain(page: Page, subdomainName: string) {
    // Open subdomain dropdown by clicking its summary
    const subdomainSummary = page.getByText("Escolha o Subdomínio");
    await subdomainSummary.click();

    // Wait for dropdown menu to be visible and click subdomain option
    await page.evaluate((subdomain) => {
      const details = document.querySelectorAll("details")[1];
      details.setAttribute("open", "");
      const link = Array.from(details.querySelectorAll("a")).find(a => a.textContent === subdomain);
      if (link) link.click();
    }, subdomainName);
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
  static async verifyIndicatorDetails(page: Page, indicatorName: string, subdomainName: string) {
    // Verify URL changed to indicator page
    await expect(page).toHaveURL(/^\/indicator\/[a-f0-9]{24}$/);

    // Check if indicator details are visible
    const indicatorNameHeading = page.getByRole("heading", { name: indicatorName });
    await expect(indicatorNameHeading).toBeVisible();

    const subdomainText = page.getByText(subdomainName);
    await expect(subdomainText).toBeVisible();
  }
}

// Convenience functions
export const waitForDomainsToLoad = TestHelpers.waitForDomainsToLoad;
export const waitForIndicatorsToLoad = TestHelpers.waitForIndicatorsToLoad;
export const navigateToHome = TestHelpers.navigateToHome;
export const navigateToDomain = TestHelpers.navigateToDomain;
export const clickDomain = TestHelpers.clickDomain;
export const clickIndicator = TestHelpers.clickIndicator;
export const selectSubdomain = TestHelpers.selectSubdomain;
export const verifyIndicatorCard = TestHelpers.verifyIndicatorCard;
export const verifyIndicatorDetails = TestHelpers.verifyIndicatorDetails; 