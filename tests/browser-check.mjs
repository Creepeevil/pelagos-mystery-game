import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";

await mkdir("tmp", { recursive: true });
const browser = await chromium.launch({ headless: true });
const results = [];
try {
  for (const viewport of [
    { width: 1280, height: 1000 },
    { width: 390, height: 844 },
    { width: 768, height: 1024 },
    { width: 320, height: 740 },
    { width: 1536, height: 1000 },
  ]) {
    const context = await browser.newContext({ viewport });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("response", (response) => {
      if (
        response.status() >= 400 &&
        response.url().startsWith("http://localhost:3000")
      )
        errors.push(`${response.status()} ${response.url()}`);
    });
    await page.goto("http://localhost:3000/");
    await page.locator(".cell").last().waitFor();
    assert.equal(await page.locator(".cell").count(), 48);
    assert.equal(await page.locator(".card").count(), 0);
    for (const category of ["suspects", "weapons", "locations"]) {
      await page.locator(`[data-category="${category}"]`).click();
      assert.equal(await page.locator(".card").count(), 4);
      await page.waitForFunction(() =>
        [...document.querySelectorAll(".card img")].every(
          (image) => image.complete && image.naturalWidth > 0,
        ),
      );
      const card = page.locator(".card-flip").first();
      await card.click();
      assert.equal(await card.getAttribute("aria-pressed"), "true");
      await page.waitForTimeout(600);
      if (category === "suspects")
        await page.screenshot({
          path: `tmp/back-${viewport.width}.png`,
          fullPage: true,
        });
      if (viewport.width === 390 && category === "suspects") {
        await page.locator("#card-size").click();
        assert.equal(
          await page.locator("#card-size").getAttribute("aria-pressed"),
          "true",
        );
        assert.ok(
          (await card.evaluate((node) => node.getBoundingClientRect().width)) >
            300,
        );
        await page.screenshot({
          path: "tmp/mobile-large-back.png",
          fullPage: true,
        });
        await page.locator("#card-size").click();
      }
      await card.press("Space");
      assert.equal(await card.getAttribute("aria-pressed"), "false");
      await page.waitForTimeout(600);
    }
    await page.locator('[data-category="suspects"]').click();
    const cell = page.locator('[data-key="weapons-suspects:moon-key:bernica"]');
    await cell.click();
    assert.equal(await cell.getAttribute("data-state"), "1");
    await cell.press("Enter");
    assert.equal(await cell.getAttribute("data-state"), "2");
    assert.equal(await page.locator('.cell[data-state="1"]').count(), 0);
    await cell.click();
    assert.equal(await cell.getAttribute("data-state"), "3");
    assert.equal(await page.locator('.cell[data-state="1"]').count(), 6);
    await page.reload();
    assert.equal(await cell.getAttribute("data-state"), "3");
    assert.equal(await page.locator('.cell[data-state="1"]').count(), 6);
    await cell.click();
    assert.equal(await page.locator('.cell[data-state="0"]').count(), 48);
    await page.reload();
    assert.equal(await page.locator('.cell[data-state="0"]').count(), 48);
    for (let i = 0; i < 3; i++) await cell.click();
    await page.locator('[data-category="suspects"]').click();
    await page.waitForFunction(() =>
      [...document.querySelectorAll("img")].every(
        (image) => image.complete && image.naturalWidth > 0,
      ),
    );
    const sizes = await page.evaluate(() => ({
      width: innerWidth,
      body: document.documentElement.scrollWidth,
      cell: document.querySelector(".cell").getBoundingClientRect().width,
      scroll:
        document.querySelector(".grid-scroll").scrollWidth >
        document.querySelector(".grid-scroll").clientWidth,
    }));
    assert.ok(
      sizes.body <= sizes.width,
      `Body overflow at ${viewport.width}: ${JSON.stringify(sizes)}`,
    );
    assert.ok(sizes.cell >= 44);
    if (viewport.width === 390) assert.equal(sizes.scroll, true);
    await page.waitForTimeout(250);
    await page.screenshot({
      path: `tmp/desktop-${viewport.width}.png`,
      fullPage: true,
    });
    await page.locator("#reset").click();
    await page.getByRole("button", { name: "Giữ ghi chú" }).click();
    assert.equal(await cell.getAttribute("data-state"), "3");
    await page.locator("#reset").click();
    await page.getByRole("button", { name: "Xóa toàn bộ" }).click();
    await page.waitForFunction(
      () => document.querySelectorAll('.cell[data-state="0"]').length === 48,
    );
    assert.equal(await page.locator('.cell[data-state="0"]').count(), 48);
    assert.equal(
      await page.evaluate(() =>
        localStorage.getItem("pelagos-deduction-grid-v1"),
      ),
      null,
    );
    await page.reload();
    assert.equal(await page.locator('.cell[data-state="0"]').count(), 48);
    assert.deepEqual(errors, []);
    results.push({ viewport, ...sizes, errors, passed: true });
    await context.close();
  }
  await writeFile("tmp/browser-results.json", JSON.stringify(results, null, 2));
  console.log(
    "Browser checks passed at 320, 390, 768, 1280 and 1536 px: categories, flip, keyboard, elimination, persistence, reset, images, overflow.",
  );
} finally {
  await browser.close();
}
