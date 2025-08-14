import { test, expect } from "@playwright/test";
import { setupDomainApiMocks } from "../mocks/apiMocks";
import { 
  navigateToHome, 
  clickDomain, 
  navigateToDomain, 
  verifyIndicatorCard, 
  selectSubdomain 
} from "../utils/testHelpers";

test.describe("Domain Selection Flow", () => {
  test.beforeEach(async ({ page }) => {
    // Setup API mocks
    await setupDomainApiMocks(page);
    
    // Navigate to home
    await navigateToHome(page);
  });

  test("should display domains on home page", async ({ page }) => {
    // Check if domain button exists
    const domainButton = page.getByRole("button", { name: "Environment" });
    await expect(domainButton).toBeVisible();
  });

  test("should navigate to domain page when clicking domain", async ({ page }) => {
    // Click domain button
    await clickDomain(page, "Environment");

    // Check if subdomain dropdown is visible
    const subdomainDropdown = page.getByText("Escolha o Subdomínio");
    await expect(subdomainDropdown).toBeVisible();
  });

  test("should display indicators when selecting domain", async ({ page }) => {
    // Navigate to domain page
    await navigateToDomain(page, "Environment");

    // Check if indicator exists
    await verifyIndicatorCard(page, "Presence of endemic plants and rare animals");
  });

  test("should filter indicators when selecting subdomain", async ({ page }) => {
    // Navigate to domain page
    await navigateToDomain(page, "Environment");

    // Select subdomain
    await selectSubdomain(page, "Natural capital and land use");

    // Wait for the filtered indicator to be visible
    await verifyIndicatorCard(page, "Presence of endemic plants and rare animals");
  });
}); 
