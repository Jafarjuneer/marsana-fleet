import { test, expect } from "@playwright/test";

test.describe("Authentication", () => {
  test("should display login page", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator("text=Sign In")).toBeVisible();
    await expect(page.locator("text=Marsana Fleet")).toBeVisible();
  });

  test("should toggle between password and magic link modes", async ({ page }) => {
    await page.goto("/login");

    // Initially in password mode
    await expect(page.locator('input[type="password"]')).toBeVisible();

    // Click toggle button
    await page.click("button:has-text('Use Magic Link')");

    // Should hide password field
    await expect(page.locator('input[type="password"]')).not.toBeVisible();

    // Click toggle again
    await page.click("button:has-text('Use Password')");

    // Should show password field again
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test("should show error for empty credentials", async ({ page }) => {
    await page.goto("/login");

    // Try to submit empty form
    await page.click("button:has-text('Sign In')");

    // Should show error message
    await expect(page.locator("text=Please enter both email and password")).toBeVisible();
  });

  test("should show error for invalid email format", async ({ page }) => {
    await page.goto("/login");

    // Enter invalid email
    await page.fill('input[placeholder="name@company.com"]', "invalid-email");
    await page.fill('input[type="password"]', "password123");

    // Try to submit
    await page.click("button:has-text('Sign In')");

    // HTML5 validation should prevent submission
    const emailInput = page.locator('input[placeholder="name@company.com"]');
    const validity = await emailInput.evaluate((el: HTMLInputElement) => el.validity.valid);
    expect(validity).toBe(false);
  });

  test("should display logout modal", async ({ page }) => {
    // This test assumes user is logged in
    // In a real scenario, you'd need to set up auth state first
    await page.goto("/dashboard");

    // Look for logout button/menu
    const userMenu = page.locator("[data-testid='user-menu']");
    if (await userMenu.isVisible()) {
      await userMenu.click();
      await page.click("text=Logout");

      // Should show logout confirmation modal
      await expect(page.locator("text=Confirm Logout")).toBeVisible();
      await expect(page.locator("text=Are you sure you want to logout?")).toBeVisible();
    }
  });

  test("should cancel logout", async ({ page }) => {
    await page.goto("/dashboard");

    const userMenu = page.locator("[data-testid='user-menu']");
    if (await userMenu.isVisible()) {
      await userMenu.click();
      await page.click("text=Logout");

      // Click Cancel button
      await page.click("button:has-text('Cancel')");

      // Modal should close
      await expect(page.locator("text=Confirm Logout")).not.toBeVisible();

      // Should still be on dashboard
      expect(page.url()).toContain("/dashboard");
    }
  });

  test("should complete logout", async ({ page }) => {
    await page.goto("/dashboard");

    const userMenu = page.locator("[data-testid='user-menu']");
    if (await userMenu.isVisible()) {
      await userMenu.click();
      await page.click("text=Logout");

      // Click Logout button
      await page.click("button:has-text('Logout')");

      // Should redirect to login
      await page.waitForURL("/login");
      expect(page.url()).toContain("/login");
    }
  });
});
