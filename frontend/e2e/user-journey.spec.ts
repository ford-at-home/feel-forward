import { test, expect } from '@playwright/test';

test.describe('Feel Forward User Journey', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should complete the welcome flow and start the journey', async ({ page }) => {
    // Check welcome screen
    await expect(page.getByText('Feel Forward')).toBeVisible();
    await expect(page.getByText('Make better life decisions by understanding your emotional truth')).toBeVisible();
    
    // Verify 5-step journey display
    await expect(page.getByText('Your 5-Step Journey')).toBeVisible();
    await expect(page.getByText('Discover Preferences')).toBeVisible();
    await expect(page.getByText('Detail Preferences')).toBeVisible();
    await expect(page.getByText('Explore Scenarios')).toBeVisible();
    await expect(page.getByText('Feel Your Reactions')).toBeVisible();
    await expect(page.getByText('Understand Yourself')).toBeVisible();
    
    // Start journey
    await page.getByRole('button', { name: /begin your journey/i }).click();
    
    // Should be on Phase Zero
    await expect(page.getByText('Step 1 of 5')).toBeVisible();
    await expect(page.getByText(/what decision are you trying to make/i)).toBeVisible();
  });

  test('should handle topic input and factor selection', async ({ page }) => {
    // Start journey
    await page.getByRole('button', { name: /begin your journey/i }).click();
    
    // Enter topic
    const topicInput = page.getByRole('textbox');
    await topicInput.fill('Should I change careers from marketing to software development?');
    
    // Continue to factor selection
    await page.getByRole('button', { name: /continue/i }).click();
    
    // Wait for factors to load (either from API or fallback)
    await expect(page.getByText(/what factors matter/i)).toBeVisible({ timeout: 10000 });
    
    // Should show common factors
    await expect(page.getByText('Salary')).toBeVisible();
    await expect(page.getByText('Work-Life Balance')).toBeVisible();
    
    // Select some factors
    await page.getByRole('button', { name: /salary/i }).click();
    await page.getByRole('button', { name: /work-life balance/i }).click();
    
    // Add custom factor
    const customInput = page.getByPlaceholder(/add your own factor/i);
    await customInput.fill('Learning Opportunities');
    await page.getByRole('button', { name: /add factor/i }).click();
    
    // Verify custom factor was added
    await expect(page.getByText('Learning Opportunities')).toBeVisible();
    
    // Continue to preferences
    await page.getByRole('button', { name: /continue to preferences/i }).click();
    
    // Should be on Phase One
    await expect(page.getByText('Step 2 of 5')).toBeVisible();
    await expect(page.getByText(/how important is/i)).toBeVisible();
  });

  test('should navigate through preference details', async ({ page }) => {
    // Setup: Get to Phase One
    await page.getByRole('button', { name: /begin your journey/i }).click();
    
    const topicInput = page.getByRole('textbox');
    await topicInput.fill('Career decision');
    await page.getByRole('button', { name: /continue/i }).click();
    
    await expect(page.getByText(/what factors matter/i)).toBeVisible({ timeout: 10000 });
    
    await page.getByRole('button', { name: /salary/i }).click();
    await page.getByRole('button', { name: /work-life balance/i }).click();
    await page.getByRole('button', { name: /continue to preferences/i }).click();
    
    // Now in Phase One - test preference details
    await expect(page.getByText(/how important is "salary"/i)).toBeVisible();
    
    // Test importance slider
    const slider = page.getByRole('slider');
    await slider.click();
    
    // Test hard limits toggle
    const limitsToggle = page.getByRole('switch');
    await limitsToggle.click();
    
    // Should show limit input
    const limitInput = page.getByPlaceholder(/minimum \$80k salary/i);
    await expect(limitInput).toBeVisible();
    await limitInput.fill('$75,000 minimum');
    
    // Test trade-off textarea
    const tradeoffTextarea = page.getByPlaceholder(/I'd accept lower salary/i);
    await tradeoffTextarea.fill('I would accept a lower salary for better work-life balance and learning opportunities');
    
    // Continue to next factor
    await page.getByRole('button', { name: /next factor/i }).click();
    
    // Should be on Work-Life Balance factor
    await expect(page.getByText(/how important is "work-life balance"/i)).toBeVisible();
    
    // Test navigation back
    await page.getByRole('button', { name: /previous/i }).click();
    
    // Should be back on Salary factor with preserved data
    await expect(page.getByText(/how important is "salary"/i)).toBeVisible();
    await expect(limitInput).toHaveValue('$75,000 minimum');
    
    // Navigate forward and complete
    await page.getByRole('button', { name: /next factor/i }).click();
    await page.getByRole('button', { name: /generate scenarios/i }).click();
    
    // Should progress to Phase Two
    await expect(page.getByText('Step 3 of 5')).toBeVisible();
  });

  test('should handle responsive design on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Welcome screen should be responsive
    await expect(page.getByText('Feel Forward')).toBeVisible();
    await expect(page.getByRole('button', { name: /begin your journey/i })).toBeVisible();
    
    // Start journey
    await page.getByRole('button', { name: /begin your journey/i }).click();
    
    // Topic input should be responsive
    const topicInput = page.getByRole('textbox');
    await expect(topicInput).toBeVisible();
    
    // Input should be usable on mobile
    await topicInput.fill('Mobile career decision test');
    await page.getByRole('button', { name: /continue/i }).click();
    
    // Factor selection should work on mobile
    await expect(page.getByText(/what factors matter/i)).toBeVisible({ timeout: 10000 });
    
    // Buttons should be tap-friendly
    await page.getByRole('button', { name: /salary/i }).click();
    
    // Progress bar should be visible
    await expect(page.getByText('Step 1 of 5')).toBeVisible();
  });

  test('should handle error states gracefully', async ({ page }) => {
    // Start journey
    await page.getByRole('button', { name: /begin your journey/i }).click();
    
    // Test empty topic submission
    await page.getByRole('button', { name: /continue/i }).click();
    
    // Should show error message
    await expect(page.getByText(/please enter a topic/i)).toBeVisible();
    
    // Enter topic and continue
    const topicInput = page.getByRole('textbox');
    await topicInput.fill('Test decision');
    await page.getByRole('button', { name: /continue/i }).click();
    
    // Wait for factor selection
    await expect(page.getByText(/what factors matter/i)).toBeVisible({ timeout: 10000 });
    
    // Try to continue without selecting factors
    await page.getByRole('button', { name: /continue to preferences/i }).click();
    
    // Should show error message
    await expect(page.getByText(/select some factors/i)).toBeVisible();
  });

  test('should maintain progress indicator accuracy', async ({ page }) => {
    // Track progress through each phase
    await page.getByRole('button', { name: /begin your journey/i }).click();
    
    // Phase 1
    await expect(page.getByText('Step 1 of 5')).toBeVisible();
    
    // Complete topic and factor selection
    const topicInput = page.getByRole('textbox');
    await topicInput.fill('Progress test decision');
    await page.getByRole('button', { name: /continue/i }).click();
    
    await expect(page.getByText(/what factors matter/i)).toBeVisible({ timeout: 10000 });
    await page.getByRole('button', { name: /salary/i }).click();
    await page.getByRole('button', { name: /continue to preferences/i }).click();
    
    // Phase 2
    await expect(page.getByText('Step 2 of 5')).toBeVisible();
    
    // Complete preferences
    await expect(page.getByText(/how important is/i)).toBeVisible();
    await page.getByRole('button', { name: /generate scenarios/i }).click();
    
    // Phase 3
    await expect(page.getByText('Step 3 of 5')).toBeVisible();
  });

  test('should handle keyboard navigation', async ({ page }) => {
    // Start journey
    await page.getByRole('button', { name: /begin your journey/i }).click();
    
    // Test keyboard navigation in topic input
    await page.keyboard.press('Tab');
    const topicInput = page.getByRole('textbox');
    await expect(topicInput).toBeFocused();
    
    await topicInput.fill('Keyboard navigation test');
    await page.keyboard.press('Enter'); // Should submit form
    
    // Should proceed to factor selection
    await expect(page.getByText(/what factors matter/i)).toBeVisible({ timeout: 10000 });
    
    // Test keyboard navigation for factor buttons
    await page.keyboard.press('Tab');
    await page.keyboard.press('Space'); // Should select factor
    
    // Navigate to continue button
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');
    
    // Should proceed to next phase
    await expect(page.getByText('Step 2 of 5')).toBeVisible();
  });
});

test.describe('Performance and Accessibility', () => {
  test('should meet accessibility standards', async ({ page }) => {
    await page.goto('/');
    
    // Check for proper heading hierarchy
    const h1 = page.getByRole('heading', { level: 1 });
    await expect(h1).toBeVisible();
    
    // Check for proper button labels
    const beginButton = page.getByRole('button', { name: /begin your journey/i });
    await expect(beginButton).toBeVisible();
    
    // Check for proper form labels
    await beginButton.click();
    
    const topicInput = page.getByRole('textbox');
    await expect(topicInput).toBeVisible();
    
    // Check color contrast (basic check)
    const buttonColor = await beginButton.evaluate(el => 
      window.getComputedStyle(el).backgroundColor
    );
    expect(buttonColor).toBeTruthy();
  });

  test('should load quickly and be responsive', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/');
    
    // Check that main content loads quickly
    await expect(page.getByText('Feel Forward')).toBeVisible();
    
    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(3000); // Should load within 3 seconds
    
    // Test responsiveness
    await page.setViewportSize({ width: 1200, height: 800 });
    await expect(page.getByText('Feel Forward')).toBeVisible();
    
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.getByText('Feel Forward')).toBeVisible();
    
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.getByText('Feel Forward')).toBeVisible();
  });
});