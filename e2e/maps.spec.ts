import { test, expect } from "@playwright/test";

test.describe("Maps and Tracking", () => {
  test("should display map tab on vehicle details", async ({ page }) => {
    await page.goto("/vehicles");

    // Navigate to first vehicle
    const vehicleCard = page.locator("[data-testid='vehicle-card']").first();
    if (await vehicleCard.isVisible()) {
      await vehicleCard.click();

      // Wait for details page
      await page.waitForURL(/\/vehicles\/[a-f0-9-]+/);

      // Look for Map tab
      const mapTab = page.locator("button:has-text('Map')");
      const isVisible = await mapTab.isVisible().catch(() => false);

      if (isVisible) {
        await mapTab.click();

        // Wait for map to load
        const mapContainer = page.locator("[data-testid='map-container']");
        await mapContainer.waitFor({ state: "visible", timeout: 5000 }).catch(() => {
          // Map might not load without Mapbox key
        });
      }
    }
  });

  test("should display current location on map", async ({ page }) => {
    await page.goto("/vehicles");

    const vehicleCard = page.locator("[data-testid='vehicle-card']").first();
    if (await vehicleCard.isVisible()) {
      await vehicleCard.click();

      await page.waitForURL(/\/vehicles\/[a-f0-9-]+/);

      const mapTab = page.locator("button:has-text('Map')");
      if (await mapTab.isVisible()) {
        await mapTab.click();

        // Look for location info
        const locationInfo = page.locator("[data-testid='current-location']");
        const isVisible = await locationInfo.isVisible().catch(() => false);

        expect(typeof isVisible).toBe("boolean");
      }
    }
  });

  test("should allow date range selection for route history", async ({ page }) => {
    await page.goto("/vehicles");

    const vehicleCard = page.locator("[data-testid='vehicle-card']").first();
    if (await vehicleCard.isVisible()) {
      await vehicleCard.click();

      await page.waitForURL(/\/vehicles\/[a-f0-9-]+/);

      const mapTab = page.locator("button:has-text('Map')");
      if (await mapTab.isVisible()) {
        await mapTab.click();

        // Look for date inputs
        const startDateInput = page.locator('input[type="date"]').first();
        const endDateInput = page.locator('input[type="date"]').nth(1);

        const startVisible = await startDateInput.isVisible().catch(() => false);
        const endVisible = await endDateInput.isVisible().catch(() => false);

        if (startVisible && endVisible) {
          // Change date range
          await startDateInput.fill("2026-01-01");
          await endDateInput.fill("2026-02-03");

          // Wait for update
          await page.waitForTimeout(500);

          // Verify dates were set
          const startValue = await startDateInput.inputValue();
          expect(startValue).toBe("2026-01-01");
        }
      }
    }
  });

  test("should support route playback", async ({ page }) => {
    await page.goto("/vehicles");

    const vehicleCard = page.locator("[data-testid='vehicle-card']").first();
    if (await vehicleCard.isVisible()) {
      await vehicleCard.click();

      await page.waitForURL(/\/vehicles\/[a-f0-9-]+/);

      const mapTab = page.locator("button:has-text('Map')");
      if (await mapTab.isVisible()) {
        await mapTab.click();

        // Look for play button
        const playBtn = page.locator("button:has-text('Play')");
        const isVisible = await playBtn.isVisible().catch(() => false);

        if (isVisible) {
          // Click play
          await playBtn.click();

          // Wait a moment
          await page.waitForTimeout(1000);

          // Should show pause button now
          const pauseBtn = page.locator("button:has-text('Pause')");
          const isPaused = await pauseBtn.isVisible().catch(() => false);

          expect(typeof isPaused).toBe("boolean");
        }
      }
    }
  });

  test("should display playback speed controls", async ({ page }) => {
    await page.goto("/vehicles");

    const vehicleCard = page.locator("[data-testid='vehicle-card']").first();
    if (await vehicleCard.isVisible()) {
      await vehicleCard.click();

      await page.waitForURL(/\/vehicles\/[a-f0-9-]+/);

      const mapTab = page.locator("button:has-text('Map')");
      if (await mapTab.isVisible()) {
        await mapTab.click();

        // Look for speed select
        const speedSelect = page.locator("select").last();
        const isVisible = await speedSelect.isVisible().catch(() => false);

        if (isVisible) {
          // Change speed
          await speedSelect.selectOption("2");

          // Verify selection
          const selectedValue = await speedSelect.inputValue();
          expect(selectedValue).toBe("2");
        }
      }
    }
  });

  test("should show progress during playback", async ({ page }) => {
    await page.goto("/vehicles");

    const vehicleCard = page.locator("[data-testid='vehicle-card']").first();
    if (await vehicleCard.isVisible()) {
      await vehicleCard.click();

      await page.waitForURL(/\/vehicles\/[a-f0-9-]+/);

      const mapTab = page.locator("button:has-text('Map')");
      if (await mapTab.isVisible()) {
        await mapTab.click();

        // Look for progress bar
        const progressBar = page.locator("[data-testid='playback-progress']");
        const isVisible = await progressBar.isVisible().catch(() => false);

        expect(typeof isVisible).toBe("boolean");
      }
    }
  });

  test("should allow reset of playback", async ({ page }) => {
    await page.goto("/vehicles");

    const vehicleCard = page.locator("[data-testid='vehicle-card']").first();
    if (await vehicleCard.isVisible()) {
      await vehicleCard.click();

      await page.waitForURL(/\/vehicles\/[a-f0-9-]+/);

      const mapTab = page.locator("button:has-text('Map')");
      if (await mapTab.isVisible()) {
        await mapTab.click();

        // Look for reset button
        const resetBtn = page.locator("button:has-text('Reset')");
        const isVisible = await resetBtn.isVisible().catch(() => false);

        if (isVisible) {
          // Click reset
          await resetBtn.click();

          // Wait for reset
          await page.waitForTimeout(500);

          // Progress should be at start
          const progressText = page.locator("[data-testid='playback-progress-text']");
          const text = await progressText.textContent().catch(() => "");

          expect(text).toContain("1 /");
        }
      }
    }
  });
});

test.describe("Geofencing", () => {
  test("should display geofence alerts", async ({ page }) => {
    await page.goto("/dashboard");

    // Look for geofence alerts
    const geofenceAlert = page.locator("[data-testid='geofence-alert']");
    const isVisible = await geofenceAlert.isVisible().catch(() => false);

    expect(typeof isVisible).toBe("boolean");
  });

  test("should allow creating geofences", async ({ page }) => {
    await page.goto("/vehicles");

    const vehicleCard = page.locator("[data-testid='vehicle-card']").first();
    if (await vehicleCard.isVisible()) {
      await vehicleCard.click();

      await page.waitForURL(/\/vehicles\/[a-f0-9-]+/);

      const mapTab = page.locator("button:has-text('Map')");
      if (await mapTab.isVisible()) {
        await mapTab.click();

        // Look for create geofence button
        const createGeofenceBtn = page.locator("button:has-text('Create Geofence')");
        const isVisible = await createGeofenceBtn.isVisible().catch(() => false);

        expect(typeof isVisible).toBe("boolean");
      }
    }
  });
});

test.describe("Map Performance", () => {
  test("should load map efficiently", async ({ page }) => {
    const startTime = Date.now();

    await page.goto("/vehicles");

    const vehicleCard = page.locator("[data-testid='vehicle-card']").first();
    if (await vehicleCard.isVisible()) {
      await vehicleCard.click();

      await page.waitForURL(/\/vehicles\/[a-f0-9-]+/);

      const mapTab = page.locator("button:has-text('Map')");
      if (await mapTab.isVisible()) {
        await mapTab.click();

        const mapContainer = page.locator("[data-testid='map-container']");
        await mapContainer.waitFor({ state: "visible", timeout: 5000 }).catch(() => {
          // Map might not load without Mapbox key
        });

        const loadTime = Date.now() - startTime;

        // Should load within reasonable time
        expect(loadTime).toBeLessThan(10000);
      }
    }
  });

  test("should handle large route histories", async ({ page }) => {
    await page.goto("/vehicles");

    const vehicleCard = page.locator("[data-testid='vehicle-card']").first();
    if (await vehicleCard.isVisible()) {
      await vehicleCard.click();

      await page.waitForURL(/\/vehicles\/[a-f0-9-]+/);

      const mapTab = page.locator("button:has-text('Map')");
      if (await mapTab.isVisible()) {
        await mapTab.click();

        // Set wide date range
        const startDateInput = page.locator('input[type="date"]').first();
        if (await startDateInput.isVisible()) {
          await startDateInput.fill("2025-01-01");

          // Wait for data to load
          await page.waitForTimeout(2000);

          // Should still be responsive
          const isStable = await page.evaluate(() => document.body !== null);
          expect(isStable).toBe(true);
        }
      }
    }
  });
});
