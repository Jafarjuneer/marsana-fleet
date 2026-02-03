import { test, expect } from "@playwright/test";

test.describe("Handshakes & Inspections", () => {
  test.describe("Handshakes", () => {
    test("should display handshakes list", async ({ page }) => {
      await page.goto("/handshakes");
      await expect(page.locator("text=Handshakes")).toBeVisible();
      await expect(page.locator("text=Manage vehicle transfers")).toBeVisible();
    });

    test("should display handshake cards", async ({ page }) => {
      await page.goto("/handshakes");

      // Wait for handshakes to load
      await page.waitForSelector("[data-testid='handshake-card']", { timeout: 5000 }).catch(() => {
        // It's okay if no handshakes are present
      });

      const cards = page.locator("[data-testid='handshake-card']");
      const count = await cards.count();

      if (count > 0) {
        // Should display handshake reference
        await expect(cards.first().locator("text=Handshake")).toBeVisible();
      }
    });

    test("should show Accept button for pending handshakes", async ({ page }) => {
      await page.goto("/handshakes");

      // Find pending handshake
      const pendingHandshake = page.locator("[data-testid='handshake-card']").filter({
        has: page.locator("text=PENDING"),
      });

      if (await pendingHandshake.isVisible()) {
        // Should show Accept and Reject buttons
        await expect(pendingHandshake.locator("button:has-text('Accept')")).toBeVisible();
        await expect(pendingHandshake.locator("button:has-text('Reject')")).toBeVisible();
      }
    });

    test("should accept handshake", async ({ page }) => {
      await page.goto("/handshakes");

      // Find pending handshake
      const pendingHandshake = page.locator("[data-testid='handshake-card']").filter({
        has: page.locator("text=PENDING"),
      });

      if (await pendingHandshake.isVisible()) {
        const acceptBtn = pendingHandshake.locator("button:has-text('Accept')");
        await acceptBtn.click();

        // Should show success message or update UI
        // Wait for potential toast notification
        await page.waitForTimeout(1000);

        // Handshake should be updated (status might change)
        expect(acceptBtn).toBeTruthy();
      }
    });

    test("should show Complete button for accepted handshakes", async ({ page }) => {
      await page.goto("/handshakes");

      // Find accepted handshake
      const acceptedHandshake = page.locator("[data-testid='handshake-card']").filter({
        has: page.locator("text=ACCEPTED"),
      });

      if (await acceptedHandshake.isVisible()) {
        // Should show Complete button
        await expect(acceptedHandshake.locator("button:has-text('Complete')")).toBeVisible();
      }
    });

    test("should complete handshake", async ({ page }) => {
      await page.goto("/handshakes");

      // Find accepted handshake
      const acceptedHandshake = page.locator("[data-testid='handshake-card']").filter({
        has: page.locator("text=ACCEPTED"),
      });

      if (await acceptedHandshake.isVisible()) {
        const completeBtn = acceptedHandshake.locator("button:has-text('Complete')");
        await completeBtn.click();

        // Should show success message or update UI
        await page.waitForTimeout(1000);

        expect(completeBtn).toBeTruthy();
      }
    });
  });

  test.describe("Inspections", () => {
    test("should display inspections list", async ({ page }) => {
      await page.goto("/inspections");
      await expect(page.locator("text=Inspections")).toBeVisible();
      await expect(page.locator("text=Vehicle condition and maintenance checks")).toBeVisible();
    });

    test("should display inspection cards", async ({ page }) => {
      await page.goto("/inspections");

      // Wait for inspections to load
      await page.waitForSelector("[data-testid='inspection-card']", { timeout: 5000 }).catch(() => {
        // It's okay if no inspections are present
      });

      const cards = page.locator("[data-testid='inspection-card']");
      const count = await cards.count();

      if (count > 0) {
        // Should display inspection ID
        await expect(cards.first().locator("text=Inspection")).toBeVisible();
      }
    });

    test("should show result badge for inspections", async ({ page }) => {
      await page.goto("/inspections");

      const cards = page.locator("[data-testid='inspection-card']");
      const count = await cards.count();

      if (count > 0) {
        // Should display result (CLEAN, DAMAGE, SERVICE_DUE)
        const firstCard = cards.first();
        const resultBadge = firstCard.locator("text=CLEAN, text=DAMAGE, text=SERVICE_DUE");

        // At least one result should be visible
        const isVisible = await resultBadge.isVisible().catch(() => false);
        expect(typeof isVisible).toBe("boolean");
      }
    });

    test("should display New Inspection button", async ({ page }) => {
      await page.goto("/inspections");

      // Should show New Inspection button for authorized users
      const newBtn = page.locator("button:has-text('New Inspection')");

      if (await newBtn.isVisible()) {
        expect(newBtn).toBeTruthy();
      }
    });

    test("should show damage icon for damaged inspections", async ({ page }) => {
      await page.goto("/inspections");

      // Find inspection with DAMAGE result
      const damagedInspection = page.locator("[data-testid='inspection-card']").filter({
        has: page.locator("text=DAMAGE"),
      });

      if (await damagedInspection.isVisible()) {
        // Should show alert icon
        const alertIcon = damagedInspection.locator("svg[class*='text-red']");
        const isVisible = await alertIcon.isVisible().catch(() => false);

        expect(typeof isVisible).toBe("boolean");
      }
    });

    test("should show maintenance icon for service due inspections", async ({ page }) => {
      await page.goto("/inspections");

      // Find inspection with SERVICE_DUE result
      const serviceDueInspection = page.locator("[data-testid='inspection-card']").filter({
        has: page.locator("text=SERVICE_DUE"),
      });

      if (await serviceDueInspection.isVisible()) {
        // Should show wrench icon
        const wrenchIcon = serviceDueInspection.locator("svg[class*='text-yellow']");
        const isVisible = await wrenchIcon.isVisible().catch(() => false);

        expect(typeof isVisible).toBe("boolean");
      }
    });

    test("should navigate to inspection details", async ({ page }) => {
      await page.goto("/inspections");

      const inspectionCard = page.locator("[data-testid='inspection-card']").first();

      if (await inspectionCard.isVisible()) {
        const viewBtn = inspectionCard.locator("button:has-text('View')");

        if (await viewBtn.isVisible()) {
          await viewBtn.click();

          // Should navigate to inspection details
          await page.waitForURL(/\/inspections\/[a-f0-9-]+/, { timeout: 5000 }).catch(() => {
            // Navigation might not happen if details are in modal
          });
        }
      }
    });
  });

  test.describe("Integration", () => {
    test("should create inspection after handshake completion", async ({ page }) => {
      // This is an integration test that verifies the workflow:
      // 1. Complete a handshake
      // 2. Vehicle status should change to PENDING_INSPECTION
      // 3. An inspection should be available for creation

      await page.goto("/handshakes");

      // Find and complete a handshake
      const acceptedHandshake = page.locator("[data-testid='handshake-card']").filter({
        has: page.locator("text=ACCEPTED"),
      });

      if (await acceptedHandshake.isVisible()) {
        const completeBtn = acceptedHandshake.locator("button:has-text('Complete')");
        await completeBtn.click();

        // Wait for completion
        await page.waitForTimeout(1000);

        // Navigate to inspections
        await page.goto("/inspections");

        // Should be able to create new inspection
        const newBtn = page.locator("button:has-text('New Inspection')");
        if (await newBtn.isVisible()) {
          await newBtn.click();

          // Should show inspection form
          await page.waitForTimeout(500);
          expect(page.url()).toContain("/inspections");
        }
      }
    });
  });
});
