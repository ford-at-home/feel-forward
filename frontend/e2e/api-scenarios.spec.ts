import { test, expect } from '@playwright/test';

test.describe('API Integration Scenarios', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should handle API online scenario', async ({ page }) => {
    // Mock successful API responses
    await page.route('**/health', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ status: 'online', healthy: true })
      });
    });

    await page.route('**/phase0/factors', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          factors: [
            {
              category: 'Professional',
              items: ['Career Growth', 'Skill Development', 'Leadership Opportunities']
            },
            {
              category: 'Personal',
              items: ['Work-Life Balance', 'Family Time', 'Personal Fulfillment']
            }
          ]
        })
      });
    });

    // Start journey
    await page.getByRole('button', { name: /begin your journey/i }).click();
    
    const topicInput = page.getByRole('textbox');
    await topicInput.fill('Should I pursue a leadership role?');
    await page.getByRole('button', { name: /continue/i }).click();
    
    // Should receive API factors
    await expect(page.getByText(/factors loaded successfully/i)).toBeVisible();
    await expect(page.getByText('Career Growth')).toBeVisible();
    await expect(page.getByText('Leadership Opportunities')).toBeVisible();
    await expect(page.getByText('Personal Fulfillment')).toBeVisible();
  });

  test('should handle API offline scenario with fallback', async ({ page }) => {
    // Mock API failure
    await page.route('**/health', async route => {
      await route.abort();
    });

    await page.route('**/phase0/factors', async route => {
      await route.abort();
    });

    // Start journey
    await page.getByRole('button', { name: /begin your journey/i }).click();
    
    const topicInput = page.getByRole('textbox');
    await topicInput.fill('Career change decision');
    await page.getByRole('button', { name: /continue/i }).click();
    
    // Should show offline mode message and fallback factors
    await expect(page.getByText(/using offline mode/i)).toBeVisible();
    
    // Should still show standard fallback factors
    await expect(page.getByText('Salary')).toBeVisible();
    await expect(page.getByText('Work-Life Balance')).toBeVisible();
    await expect(page.getByText('Job Security')).toBeVisible();
  });

  test('should handle API rate limiting', async ({ page }) => {
    let requestCount = 0;
    
    await page.route('**/phase0/factors', async route => {
      requestCount++;
      if (requestCount === 1) {
        // First request returns 429
        await route.fulfill({
          status: 429,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Rate limit exceeded' })
        });
      } else {
        // Second request succeeds
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            factors: [
              { category: 'Test', items: ['Factor 1', 'Factor 2'] }
            ]
          })
        });
      }
    });

    // Start journey
    await page.getByRole('button', { name: /begin your journey/i }).click();
    
    const topicInput = page.getByRole('textbox');
    await topicInput.fill('Rate limit test');
    await page.getByRole('button', { name: /continue/i }).click();
    
    // Should eventually succeed after retry
    await expect(page.getByText('Factor 1')).toBeVisible({ timeout: 10000 });
    
    // Should have made 2 requests (initial + retry)
    expect(requestCount).toBe(2);
  });

  test('should handle server errors gracefully', async ({ page }) => {
    // Mock server error
    await page.route('**/phase0/factors', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' })
      });
    });

    // Start journey
    await page.getByRole('button', { name: /begin your journey/i }).click();
    
    const topicInput = page.getByRole('textbox');
    await topicInput.fill('Server error test');
    await page.getByRole('button', { name: /continue/i }).click();
    
    // Should fall back to offline mode
    await expect(page.getByText(/using offline mode/i)).toBeVisible();
    
    // Should still show fallback factors
    await expect(page.getByText('Salary')).toBeVisible();
  });

  test('should handle partial API failures', async ({ page }) => {
    // Health check succeeds
    await page.route('**/health', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ status: 'online', healthy: true })
      });
    });

    // Factors request fails
    await page.route('**/phase0/factors', async route => {
      await route.abort();
    });

    // Preferences save succeeds
    await page.route('**/phase1/preferences', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, message: 'Saved successfully' })
      });
    });

    // Start journey
    await page.getByRole('button', { name: /begin your journey/i }).click();
    
    const topicInput = page.getByRole('textbox');
    await topicInput.fill('Partial failure test');
    await page.getByRole('button', { name: /continue/i }).click();
    
    // Should use fallback factors
    await expect(page.getByText(/using offline mode/i)).toBeVisible();
    
    // Continue with fallback
    await page.getByRole('button', { name: /salary/i }).click();
    await page.getByRole('button', { name: /continue to preferences/i }).click();
    
    // Should reach preferences phase
    await expect(page.getByText(/how important is/i)).toBeVisible();
    
    // Complete preferences - should succeed with API
    await page.getByRole('button', { name: /generate scenarios/i }).click();
    
    // Should show success message from API
    await expect(page.getByText(/preferences saved/i)).toBeVisible();
  });

  test('should handle slow API responses', async ({ page }) => {
    // Mock slow API response
    await page.route('**/phase0/factors', async route => {
      // Delay for 3 seconds
      await new Promise(resolve => setTimeout(resolve, 3000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          factors: [
            { category: 'Slow API', items: ['Factor 1', 'Factor 2'] }
          ]
        })
      });
    });

    // Start journey
    await page.getByRole('button', { name: /begin your journey/i }).click();
    
    const topicInput = page.getByRole('textbox');
    await topicInput.fill('Slow API test');
    await page.getByRole('button', { name: /continue/i }).click();
    
    // Should show loading state
    await expect(page.getByText(/loading/i)).toBeVisible();
    
    // Should eventually load factors
    await expect(page.getByText('Factor 1')).toBeVisible({ timeout: 5000 });
    
    // Loading should disappear
    await expect(page.getByText(/loading/i)).not.toBeVisible();
  });

  test('should handle malformed API responses', async ({ page }) => {
    // Mock malformed response
    await page.route('**/phase0/factors', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: 'invalid json response'
      });
    });

    // Start journey
    await page.getByRole('button', { name: /begin your journey/i }).click();
    
    const topicInput = page.getByRole('textbox');
    await topicInput.fill('Malformed response test');
    await page.getByRole('button', { name: /continue/i }).click();
    
    // Should fall back to offline mode
    await expect(page.getByText(/using offline mode/i)).toBeVisible();
    
    // Should show fallback factors
    await expect(page.getByText('Salary')).toBeVisible();
  });

  test('should handle network interruption during workflow', async ({ page }) => {
    let networkEnabled = true;
    
    // Start with working API
    await page.route('**/phase0/factors', async route => {
      if (networkEnabled) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            factors: [
              { category: 'Network Test', items: ['Factor 1', 'Factor 2'] }
            ]
          })
        });
      } else {
        await route.abort();
      }
    });

    await page.route('**/phase1/preferences', async route => {
      if (networkEnabled) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true })
        });
      } else {
        await route.abort();
      }
    });

    // Start journey with working network
    await page.getByRole('button', { name: /begin your journey/i }).click();
    
    const topicInput = page.getByRole('textbox');
    await topicInput.fill('Network interruption test');
    await page.getByRole('button', { name: /continue/i }).click();
    
    // Should load factors successfully
    await expect(page.getByText('Factor 1')).toBeVisible();
    
    // Select factors and continue
    await page.getByRole('button', { name: /factor 1/i }).click();
    await page.getByRole('button', { name: /continue to preferences/i }).click();
    
    // Now simulate network failure
    networkEnabled = false;
    
    // Try to complete preferences
    await expect(page.getByText(/how important is/i)).toBeVisible();
    await page.getByRole('button', { name: /generate scenarios/i }).click();
    
    // Should handle network failure gracefully
    await expect(page.getByText(/saved locally/i)).toBeVisible();
    
    // Should still proceed to next phase
    await expect(page.getByText('Step 3 of 5')).toBeVisible();
  });
});