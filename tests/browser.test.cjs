const { test } = require("node:test");
const assert = require("node:assert/strict");
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const { once } = require("node:events");
const path = require("node:path");

// Serve only the local project during browser checks.
test("restaurant finder browser workflows", async (t) => {
  const server = spawn(process.execPath, ["-e", `
    const http = require('node:http');
    const fs = require('node:fs');
    const path = require('node:path');
    const types = {'.html':'text/html', '.css':'text/css', '.js':'text/javascript'};
    http.createServer((req, res) => {
      const pathname = new URL(req.url, 'http://localhost').pathname;
      const name = pathname === '/' ? 'index.html' : pathname.slice(1);
      if (!['index.html','styles.css','model.js','view.js','controller.js','persistence.js','query-state.js'].includes(name)) {
        res.writeHead(404); res.end(); return;
      }
      res.setHeader('Content-Type', types[path.extname(name)]);
      res.end(fs.readFileSync(name));
    }).listen(0, '127.0.0.1', function () { console.log(this.address().port); });
  `], { cwd: path.resolve(__dirname, ".."), stdio: ["ignore", "pipe", "inherit"] });
  t.after(() => server.kill());
  const [output] = await once(server.stdout, "data");
  const url = `http://127.0.0.1:${String(output).trim()}`;
  const browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL || undefined });
  t.after(() => browser.close());
  const context = await browser.newContext();
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  await page.goto(url);
  const cards = page.locator(".restaurant-card");

  await t.test("initial cards show all required fields", async () => {
    assert.equal(await cards.count(), 5);
    assert.match(await cards.first().innerText(), /ITALIAN[\s\S]*Milano's[\s\S]*Rating: 4.5[\s\S]*Price: \$\$/);
    assert.equal(await page.locator("#resultCount").textContent(), "5 restaurants");
  });
  await t.test("price and rating buttons apply Model rules", async () => {
    await page.locator("#showInexpensive").click();
    assert.equal(await cards.count(), 2);
    assert.deepEqual(await cards.locator("h3").allTextContents(), ["Pho Corner", "Tandoor Palace"]);
    await page.locator("#showTopRated").click();
    assert.deepEqual(await cards.locator("h3").allTextContents(), ["Milano's", "The Brass Elephant"]);
    assert.equal(await page.locator('[aria-pressed="true"]').count(), 1);
  });
  await t.test("each cuisine works and combined choices expose empty feedback", async () => {
    await page.locator("#showAll").click();
    for (const cuisine of ["American", "Indian", "Italian", "Japanese", "Vietnamese"]) {
      await page.getByLabel("Cuisine", {exact: true}).selectOption(cuisine);
      assert.equal(await cards.count(), 1);
      assert.equal(await cards.locator(".cuisine").textContent(), cuisine);
    }
    await page.getByLabel("Cuisine", {exact: true}).selectOption("Italian");
    await page.locator("#showInexpensive").click();
    assert.equal(await cards.count(), 0);
    assert.equal(await page.getByRole("heading", {name: "No restaurants found.", exact: true}).isVisible(), true);
    assert.equal(await page.locator("#resultCount").textContent(), "0 restaurants");
    await page.locator("#showAll").click();
    assert.equal(await cards.count(), 5);
    assert.equal(await page.locator("#cuisineFilter").inputValue(), "");
  });
  await t.test("keyboard users can reach and activate controls", async () => {
    await page.goto(url);
    await page.keyboard.press("Tab");
    assert.equal(await page.locator(".skip-link").evaluate((element) => element === document.activeElement), true);
    await page.keyboard.press("Tab");
    assert.equal(await page.locator("#restaurantSearch").evaluate((element) => element === document.activeElement), true);
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    await page.keyboard.press("Enter");
    assert.equal(await page.locator("#showTopRated").getAttribute("aria-pressed"), "true");
    await page.keyboard.press("Tab");
    await page.keyboard.press("Space");
    assert.equal(await page.locator("#showInexpensive").getAttribute("aria-pressed"), "true");
  });
  await t.test("layouts stay within the viewport and support enlarged text", async () => {
    await page.locator("#showAll").click();
    for (const width of [320, 375, 768, 1440]) {
      await page.setViewportSize({width, height: 1000});
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `overflow at ${width}`);
      assert.equal(await cards.count(), 5);
    }
    await page.setViewportSize({width: 375, height: 900});
    await page.addStyleTag({content: "p, button, select, label {font-size: 200% !important;}"});
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    await page.reload();
    await page.emulateMedia({forcedColors: "active", reducedMotion: "reduce"});
    await page.locator("#showInexpensive").click();
    assert.equal(await cards.count(), 2);
    await page.emulateMedia({forcedColors: "none", reducedMotion: "no-preference"});
  });
  await t.test("restaurant names render as literal text", async () => {
    await page.evaluate(() => restaurantView.displayRestaurants([{ name: '<img src=x onerror="alert(1)">', cuisine: 'Test', rating: 4.5, priceRange: '$' }]));
    assert.equal(await cards.locator("img").count(), 0);
    assert.match(await cards.locator("h3").textContent(), /<img/);
    await page.reload();
  });
  await t.test("the app also opens directly as a local file", async () => {
    await page.goto(require("node:url").pathToFileURL(path.resolve("index.html")).href);
    assert.equal(await cards.count(), 5);
    await page.locator("#showInexpensive").click();
    assert.equal(await cards.count(), 2);
    await page.goto(url);
  });
  await t.test("live search sorting and reset work together", async () => {
    await page.locator("#showAll").click();
    await page.getByLabel("Search restaurants", {exact: true}).fill("  PHO  ");
    assert.equal(await cards.count(), 1);
    assert.equal(await cards.locator("h3").textContent(), "Pho Corner");
    await page.getByLabel("Search restaurants", {exact: true}).fill("Japanese");
    assert.equal(await cards.locator("h3").textContent(), "Sakura Sushi");
    await page.locator("#showAll").click();
    await page.getByLabel("Sort by", {exact: true}).selectOption("rating");
    assert.equal(await cards.first().locator("h3").textContent(), "The Brass Elephant");
    await page.getByLabel("Sort by", {exact: true}).selectOption("price");
    assert.equal(await cards.first().locator("h3").textContent(), "Pho Corner");
    await page.getByLabel("Search restaurants", {exact: true}).fill("missing place");
    assert.equal(await cards.count(), 0);
    await page.locator("#showAll").click();
    assert.equal(await cards.count(), 5);
    assert.equal(await page.locator("#restaurantSearch").inputValue(), "");
    assert.equal(await page.locator("#sortOrder").inputValue(), "recommended");
  });
  await t.test("saved places persist sync across tabs and preserve keyboard focus", async () => {
    await page.getByRole("button", {name: "Save Milano's", exact: true}).click();
    assert.equal(await page.getByRole("button", {name: "Unsave Milano's", exact: true}).evaluate((element) => element === document.activeElement), true);
    await page.reload();
    assert.equal(await page.getByRole("button", {name: "Unsave Milano's", exact: true}).getAttribute("aria-pressed"), "true");
    await page.locator("#savedOnly").check();
    assert.equal(await cards.count(), 1);
    await page.getByRole("button", {name: "Unsave Milano's", exact: true}).focus();
    const other = await page.context().newPage();
    await other.goto(url);
    await other.getByRole("button", {name: "Save Pho Corner", exact: true}).click();
    await page.waitForFunction(() => document.querySelector("#savedLabel").textContent === "Saved only (2)");
    assert.equal(await cards.count(), 2);
    assert.equal(await page.getByRole("button", {name: "Unsave Milano's", exact: true}).evaluate((element) => element === document.activeElement), true);
    await other.close();
    await page.getByRole("button", {name: "Unsave Milano's", exact: true}).click();
    assert.equal(await page.locator("#savedOnly").evaluate((element) => element === document.activeElement), true);
    await page.getByRole("button", {name: "Unsave Pho Corner", exact: true}).click();
    assert.equal(await cards.count(), 0);
    assert.equal(await page.evaluate(() => localStorage.getItem("restaurant-finder.saved.v1")), null);
    await page.locator("#showAll").click();
  });
  await t.test("shared URLs restore filters and invalid choices use safe defaults", async () => {
    await page.goto(`${url}/?cuisine=Italian&sort=rating&filter=topRated&q=Milano`);
    assert.equal(await cards.count(), 1);
    assert.equal(await page.locator("#restaurantSearch").inputValue(), "Milano");
    assert.equal(await page.locator("#cuisineFilter").inputValue(), "Italian");
    assert.equal(await page.locator("#showTopRated").getAttribute("aria-pressed"), "true");
    await page.goto(`${url}/?sort=invalid&filter=bad&cuisine=Unknown`);
    assert.equal(await cards.count(), 5);
    assert.equal(await page.locator("#sortOrder").inputValue(), "recommended");
    await page.evaluate(() => { history.pushState(null, "", "?cuisine=Indian"); window.dispatchEvent(new PopStateEvent("popstate")); });
    assert.equal(await page.locator("#cuisineFilter").inputValue(), "Indian");
    assert.equal(await cards.locator("h3").textContent(), "Tandoor Palace");
    await page.locator("#showAll").click();
  });
  await t.test("copy links exclude saved places and denied clipboard offers a manual field", async () => {
    await page.evaluate(() => Object.defineProperty(navigator, "clipboard", {configurable: true, value: { writeText: async (text) => { window.copiedSearchLink = text; } }}));
    await page.getByRole("button", {name: "Save Milano's", exact: true}).click();
    await page.locator("#savedOnly").check();
    await page.locator("#sortOrder").selectOption("rating");
    await page.locator("#shareSearch").click();
    const copied = await page.evaluate(() => window.copiedSearchLink);
    assert.ok(copied.includes("sort=rating"));
    assert.ok(!copied.includes("milanos"));
    assert.ok(!copied.includes("saved"));
    await page.evaluate(() => Object.defineProperty(navigator, "clipboard", {configurable: true, value: { writeText: async () => { throw Error("denied"); } }}));
    await page.locator("#shareSearch").click();
    assert.equal(await page.locator("#shareLink").isVisible(), true);
    assert.equal(await page.locator("#shareLink").inputValue(), copied);
    assert.equal(await page.locator("#shareLink").evaluate((element) => element === document.activeElement), true);
    await page.locator("#showAll").click();
    assert.equal(await page.locator("#shareLink").isVisible(), false);
    await page.getByRole("button", {name: "Unsave Milano's", exact: true}).click();
  });
  await t.test("delayed clipboard results never surface a stale link or steal focus", async () => {
    for (const outcome of ["reject", "resolve"]) {
      await page.goto(url);
      await page.evaluate(() => Object.defineProperty(navigator, "clipboard", {configurable: true, value: {
        writeText: () => new Promise((resolve, reject) => { window.finishCopy = {resolve, reject}; })
      }}));
      await page.locator("#shareSearch").click();
      await page.locator("#restaurantSearch").fill("Pho");
      await page.evaluate((method) => window.finishCopy[method](), outcome);
      assert.equal(await page.locator("#shareLink").isVisible(), false);
      assert.equal(await page.locator("#restaurantSearch").evaluate((element) => element === document.activeElement), true);
      assert.ok(!(await page.locator("#actionStatus").textContent()).includes("copied"));
    }
    await page.goto(url);
  });
  await t.test("blocked storage still permits saving for the current visit", async () => {
    const context = await browser.newContext();
    await context.addInitScript(() => Object.defineProperty(window, "localStorage", {get() { throw Error("blocked"); }}));
    const blocked = await context.newPage();
    const failures = [];
    blocked.on("pageerror", (error) => failures.push(error.message));
    await blocked.goto(url);
    await blocked.getByRole("button", {name: "Save Pho Corner", exact: true}).click();
    await blocked.locator("#savedOnly").check();
    assert.equal(await blocked.locator(".restaurant-card").count(), 1);
    assert.match(await blocked.locator("#actionStatus").textContent(), /visit only/);
    assert.deepEqual(failures, []);
    await context.close();
  });
  await t.test("corrupt or unknown saved data cannot inject records", async () => {
    for (const raw of ['{broken', JSON.stringify({version: 1, ids: ["milanos", "<script>", "unknown"]})]) {
      await page.evaluate((value) => localStorage.setItem("restaurant-finder.saved.v1", value), raw);
      await page.reload();
      assert.equal(await cards.count(), 5);
      await page.locator("#savedOnly").check();
      assert.equal(await cards.count(), raw === '{broken' ? 0 : 1);
    }
    await page.evaluate(() => localStorage.removeItem("restaurant-finder.saved.v1"));
    await page.goto(url);
  });
  if (process.env.CAPTURE_SCREENSHOTS === "1") {
    const fs = require("node:fs");
    fs.mkdirSync("docs/assets", {recursive: true});
    await page.getByRole("button", {name: "Save Pho Corner", exact: true}).click();
    await page.setViewportSize({width: 1440, height: 1000});
    await page.screenshot({path: "docs/assets/preview-desktop.png", fullPage: true});
    await page.setViewportSize({width: 375, height: 900});
    await page.screenshot({path: "docs/assets/preview-mobile.png", fullPage: true});
    await page.getByLabel("Cuisine", {exact: true}).selectOption("Italian");
    await page.locator("#showInexpensive").click();
    await page.screenshot({path: "docs/assets/preview-empty.png", fullPage: true});
  }
  assert.deepEqual(errors, []);
});
