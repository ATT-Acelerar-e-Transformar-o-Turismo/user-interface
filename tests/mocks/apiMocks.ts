import { Page } from '@playwright/test';
import { MOCK_DOMAINS, MOCK_INDICATORS, MOCK_EMPTY_INDICATORS, MOCK_ERROR_RESPONSE } from './mockData';

export class ApiMocks {
  /**
   * Setup all API mocks for basic functionality
   */
  static async setupBasicMocks(page: Page) {
    await ApiMocks.mockDomains(page);
    await ApiMocks.mockIndicators(page);
  }

  /**
   * Setup mocks for domain-specific tests
   */
  static async setupDomainMocks(page: Page) {
    await ApiMocks.mockDomains(page);
    await ApiMocks.mockIndicators(page);
    await ApiMocks.mockDomainIndicators(page);
    await ApiMocks.mockSubdomainIndicators(page);
    await ApiMocks.mockSingleIndicator(page);
  }

  /**
   * Setup mocks for indicator-specific tests
   */
  static async setupIndicatorMocks(page: Page) {
    await ApiMocks.mockDomains(page);
    await ApiMocks.mockIndicators(page);
    await ApiMocks.mockSingleIndicator(page);
  }

  /**
   * Setup mocks for error scenarios
   */
  static async setupErrorMocks(page: Page) {
    await page.route("**/api/domains/**", async route => {
      await route.fulfill({ 
        status: 500,
        json: MOCK_ERROR_RESPONSE 
      });
    });

    await page.route("**/api/indicators/**", async route => {
      await route.fulfill({ 
        status: 500,
        json: MOCK_ERROR_RESPONSE 
      });
    });
  }

  /**
   * Setup mocks for empty data scenarios
   */
  static async setupEmptyMocks(page: Page) {
    await ApiMocks.mockDomains(page);
    
    await page.route("**/api/indicators/**", async route => {
      await route.fulfill({ json: MOCK_EMPTY_INDICATORS });
    });
  }

  // Individual mock methods
  private static async mockDomains(page: Page) {
    await page.route("**/api/domains/**", async route => {
      await route.fulfill({ json: MOCK_DOMAINS });
    });
  }

  private static async mockIndicators(page: Page) {
    await page.route("**/api/indicators/**", async route => {
      await route.fulfill({ json: MOCK_INDICATORS });
    });
  }

  private static async mockDomainIndicators(page: Page) {
    await page.route("**/api/indicators/domain/**", async route => {
      await route.fulfill({ json: MOCK_INDICATORS });
    });
  }

  private static async mockSubdomainIndicators(page: Page) {
    await page.route("**/api/indicators/domain/*/subdomain/**", async route => {
      await route.fulfill({ json: MOCK_INDICATORS });
    });
  }

  private static async mockSingleIndicator(page: Page) {
    await page.route("**/api/indicators/[^?]*", async route => {
      const url = route.request().url();
      const indicatorId = url.split('/').pop()?.split('?')[0]; // Remove query parameters
      
      const indicator = MOCK_INDICATORS.find(ind => ind.id === indicatorId);
      
      await route.fulfill({ json: indicator || MOCK_INDICATORS[0] });
    });
  }
}

// Convenience functions for common scenarios
export const setupApiMocks = ApiMocks.setupBasicMocks;
export const setupDomainApiMocks = ApiMocks.setupDomainMocks;
export const setupIndicatorApiMocks = ApiMocks.setupIndicatorMocks;
export const setupErrorApiMocks = ApiMocks.setupErrorMocks;
export const setupEmptyApiMocks = ApiMocks.setupEmptyMocks; 