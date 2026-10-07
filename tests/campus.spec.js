import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Campus graph", exact: true }),
  ).toBeVisible();
});

test("Python-backed BFS and DFS show the expected visit orders", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.getByRole("button", { name: "Run BFS" }).click();
  await expect(
    page.getByRole("heading", { name: "Breadth First Search (BFS)" }),
  ).toBeVisible();
  await expect(page.locator(".visit-list li")).toHaveText([
    "1Main Gate",
    "2Admin Block",
    "3Parking",
    "4Classroom Block",
    "5Library",
    "6Canteen",
    "7Playground",
    "8Computer Lab",
    "9Auditorium",
  ]);
  await expect(page.locator(".graph-node.visited")).toHaveCount(9);
  await page.getByRole("button", { name: "Run DFS" }).click();
  await expect(
    page.getByRole("heading", { name: "Depth First Search (DFS)" }),
  ).toBeVisible();
  await expect(page.locator(".visit-list li")).toHaveText([
    "1Main Gate",
    "2Admin Block",
    "3Library",
    "4Computer Lab",
    "5Auditorium",
    "6Canteen",
    "7Classroom Block",
    "8Playground",
    "9Parking",
  ]);
  await page
    .getByLabel("Starting location", { exact: true })
    .selectOption("library");
  await expect(page.locator(".visit-list")).toHaveCount(0);
  await expect(page.locator(".graph-node.visited")).toHaveCount(0);
  await page.getByRole("button", { name: "Run BFS" }).click();
  await expect(page.locator(".visit-list li").first()).toHaveText("1Library");
  expect(errors).toEqual([]);
});

test("representations and arrow directions follow the selected graph mode", async ({
  page,
}) => {
  await expect(page.locator(".adjacency-row")).toHaveCount(9);
  await expect(
    page
      .locator(".adjacency-row")
      .filter({ has: page.locator("dt", { hasText: "Main Gate" }) })
      .locator("dd"),
  ).toContainText("Parking");
  await page.getByRole("tab", { name: "Adjacency Matrix" }).click();
  await expect(page.locator(".matrix-table tbody tr")).toHaveCount(9);
  await expect(page.locator(".connected-cell")).toHaveCount(24);
  await page
    .getByRole("button", { name: "Directed Graph", exact: true })
    .click();
  await expect(page.locator(".graph-edge[marker-end]")).toHaveCount(12);
  await expect(
    page
      .locator(".adjacency-row")
      .filter({ has: page.locator("dt", { hasText: "Main Gate" }) })
      .locator("dd"),
  ).not.toContainText("Parking");
  await page.getByRole("tab", { name: "Adjacency Matrix" }).click();
  await expect(page.locator(".connected-cell")).toHaveCount(12);
  const gateRow = page.locator(".matrix-table tbody tr").nth(0);
  const parkingRow = page.locator(".matrix-table tbody tr").nth(7);
  await expect(gateRow.locator("td").nth(7)).toHaveText("0");
  await expect(parkingRow.locator("td").nth(0)).toHaveText("1");
  await page.getByRole("tab", { name: "Adjacency Matrix" }).focus();
  await page.keyboard.press("ArrowLeft");
  await expect(
    page.getByRole("tab", { name: "Adjacency List" }),
  ).toHaveAttribute("aria-selected", "true");
});

test("connectivity uses Python BFS and respects one-way paths", async ({
  page,
}) => {
  await page.getByRole("button", { name: "Check Connectivity" }).click();
  await expect(
    page.getByRole("heading", { name: "Connected", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".path-sequence")).toHaveText(
    "Main Gate→Admin Block→Library",
  );
  await expect(page.locator(".graph-edge.active")).toHaveCount(2);
  await page
    .getByRole("button", { name: "Directed Graph", exact: true })
    .click();
  await page.getByLabel("Destination location").selectOption("parking");
  await page.getByRole("button", { name: "Check Connectivity" }).click();
  await expect(
    page.getByRole("heading", { name: "Not Connected", exact: true }),
  ).toBeVisible();
  await page.getByLabel("Source location").selectOption("parking");
  await page.getByLabel("Destination location").selectOption("gate");
  await page.getByRole("button", { name: "Check Connectivity" }).click();
  await expect(
    page.getByRole("heading", { name: "Connected", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".path-sequence")).toHaveText("Parking→Main Gate");
  await page.getByLabel("Destination location").selectOption("parking");
  await page.getByRole("button", { name: "Check Connectivity" }).click();
  await expect(page.locator(".path-sequence")).toHaveText("Parking");
});

test("weighted view displays all distances without changing binary matrix", async ({
  page,
}) => {
  await page
    .getByRole("button", { name: "Weighted Graph", exact: true })
    .click();
  await expect(page.locator(".edge-weight")).toHaveCount(12);
  await expect(page.locator(".edge-weight").first()).toHaveText("100 m");
  await expect(page.locator(".graph-edge[marker-end]")).toHaveCount(0);
  await expect(page.locator(".neighbor-chip small")).toHaveCount(24);
  await page.getByRole("tab", { name: "Adjacency Matrix" }).click();
  const cells = await page.locator(".matrix-table td").allTextContents();
  expect(cells).toHaveLength(81);
  expect(cells.every((cell) => ["0", "1"].includes(cell))).toBe(true);
  await page.getByRole("button", { name: "Run BFS" }).click();
  await expect(page.locator(".visit-list li")).toHaveCount(9);
  await page.screenshot({
    path: ".verification/desktop-weighted.png",
    fullPage: true,
  });
});

test("mobile layout stays within the viewport and all controls work", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "Run DFS" }).click();
  await expect(page.locator(".visit-list li")).toHaveCount(9);
  await page.getByRole("tab", { name: "Adjacency Matrix" }).click();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "Check Connectivity" }).click();
  await expect(
    page.getByRole("heading", { name: "Connected", exact: true }),
  ).toBeVisible();
  await page.screenshot({ path: ".verification/mobile.png", fullPage: true });
});

test("connection failure gives a recoverable error", async ({ page }) => {
  await page.route("**/api/graph", (route) => route.abort());
  await page.getByRole("button", { name: "Run BFS" }).click();
  await expect(page.getByRole("alert")).toContainText(
    "Cannot reach the local Python program",
  );
  await page.unroute("**/api/graph");
  await page.getByRole("button", { name: "Run BFS" }).click();
  await expect(page.locator(".visit-list li")).toHaveCount(9);
  await expect(page.getByRole("alert")).toHaveCount(0);
});
