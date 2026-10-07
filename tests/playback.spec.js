import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Campus graph", exact: true }),
  ).toBeVisible();
});

for (const mode of ["Undirected", "Directed", "Weighted"]) {
  for (const method of ["BFS", "DFS"]) {
    test(`${mode} ${method}: every animation frame matches the real Python output`, async ({
      page,
    }) => {
      await page
        .getByRole("button", { name: `${mode} Graph`, exact: true })
        .click();
      await expect(page.locator(".canvas-label")).toHaveText(`${mode} Graph`);
      await page.clock.install();
      await page.clock.pauseAt(new Date(Date.now() + 1000));
      const responsePromise = page.waitForResponse(
        (response) =>
          response.url().endsWith("/api/graph") &&
          response.request().postDataJSON()?.action === method.toLowerCase(),
      );
      await page
        .getByRole("button", { name: `Run ${method}`, exact: true })
        .press("Enter");
      const { order } = await (await responsePromise).json();
      for (let count = 1; count <= order.length; count += 1) {
        await expect(page.getByRole("progressbar")).toHaveAttribute(
          "aria-valuenow",
          String(count),
        );
        expect(
          await page
            .locator(".visit-list li")
            .evaluateAll((items) => items.map((item) => item.dataset.vertex)),
        ).toEqual(order.slice(0, count));
        await expect(page.locator(".graph-node.visited")).toHaveCount(count);
        const renderedOrder = await page
          .locator(".graph-node.visited")
          .evaluateAll((nodes) =>
            nodes
              .sort(
                (a, b) =>
                  Number(a.querySelector(".visit-number").textContent) -
                  Number(b.querySelector(".visit-number").textContent),
              )
              .map((node) => node.dataset.vertex),
          );
        expect(renderedOrder).toEqual(order.slice(0, count));
        if (count < order.length) {
          await expect(page.locator(".graph-node.current")).toHaveAttribute(
            "data-vertex",
            order[count - 1],
          );
          await expect(
            page.getByRole("button", {
              name: "Check Connectivity",
              exact: true,
            }),
          ).toBeDisabled();
          await page.clock.runFor(600);
        }
      }
      await expect(page.locator(".graph-node.current")).toHaveCount(0);
      await expect(page.locator(".state-tag")).toHaveText("Complete");
      await expect(
        page.getByRole("button", { name: "Check Connectivity", exact: true }),
      ).toBeEnabled();
    });
  }
}

test("pause, resume, finish, and reset remain synchronized", async ({
  page,
}) => {
  await page.clock.install();
  await page.clock.pauseAt(new Date(Date.now() + 1000));
  await page.getByRole("button", { name: "Run BFS", exact: true }).click();
  await expect(page.getByRole("progressbar")).toHaveAttribute(
    "aria-valuenow",
    "1",
  );
  await page.clock.runFor(600);
  await expect(page.getByRole("progressbar")).toHaveAttribute(
    "aria-valuenow",
    "2",
  );
  await page.clock.runFor(600);
  await expect(page.getByRole("progressbar")).toHaveAttribute(
    "aria-valuenow",
    "3",
  );
  await page.getByRole("button", { name: "Pause", exact: true }).click();
  await page.clock.runFor(6000);
  await expect(page.getByRole("progressbar")).toHaveAttribute(
    "aria-valuenow",
    "3",
  );
  await expect(page.locator(".graph-node.current")).toHaveAttribute(
    "data-vertex",
    "parking",
  );
  await page.getByRole("button", { name: "Resume", exact: true }).click();
  await page.clock.runFor(600);
  await expect(page.getByRole("progressbar")).toHaveAttribute(
    "aria-valuenow",
    "4",
  );
  await page
    .getByRole("button", { name: "Show full result", exact: true })
    .click();
  await expect(page.locator(".graph-node.visited")).toHaveCount(9);
  await page.getByRole("button", { name: "Clear graph highlights" }).click();
  await page.clock.runFor(6000);
  await expect(page.locator(".visit-list")).toHaveCount(0);
  await expect(page.locator(".graph-node.visited")).toHaveCount(0);
  await expect(page.locator(".state-tag")).toHaveText("Ready to explore");
});

test("changing graph type cancels playback and ignores a delayed response", async ({
  page,
}) => {
  let release;
  const gate = new Promise((resolve) => {
    release = resolve;
  });
  await page.route("**/api/graph", async (route) => {
    if (route.request().postDataJSON()?.action === "bfs") {
      const response = await route.fetch();
      await gate;
      await route.fulfill({ response });
    } else await route.continue();
  });
  await page.getByRole("button", { name: "Run BFS", exact: true }).click();
  await expect(page.locator(".state-tag")).toHaveText("Preparing");
  await page
    .getByRole("button", { name: "Directed Graph", exact: true })
    .click();
  await expect(page.locator(".canvas-label")).toHaveText("Directed Graph");
  const oldResponse = page.waitForResponse(
    (response) => response.request().postDataJSON()?.action === "bfs",
  );
  release();
  await oldResponse;
  await expect(page.locator(".graph-node.visited")).toHaveCount(0);
  await expect(page.locator(".state-tag")).toHaveText("Ready to explore");
  await page.getByRole("button", { name: "Run DFS", exact: true }).click();
  await expect(page.locator(".graph-node.current")).toHaveCount(1);
  await page
    .getByRole("button", { name: "Weighted Graph", exact: true })
    .click();
  await expect(page.locator(".edge-weight")).toHaveCount(12);
  await expect(page.locator(".graph-node.visited")).toHaveCount(0);
});

test("reduced motion presents the complete accurate result without playback", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.getByRole("button", { name: "Run DFS", exact: true }).click();
  await expect(page.locator(".visit-list li")).toHaveCount(9);
  await expect(page.locator(".state-tag")).toHaveText("Complete");
  await expect(
    page.getByRole("button", { name: "Pause", exact: true }),
  ).toHaveCount(0);
  expect(
    await page
      .locator(".graph-node")
      .first()
      .evaluate((node) => getComputedStyle(node).animationName),
  ).toBe("none");
});

test("a directed traversal from a sink finishes at its single reachable node", async ({
  page,
}) => {
  await page
    .getByRole("button", { name: "Directed Graph", exact: true })
    .click();
  await page
    .getByLabel("Starting location", { exact: true })
    .selectOption("auditorium");
  await page.getByRole("button", { name: "Run BFS", exact: true }).click();
  await expect(page.locator(".visit-list li")).toHaveText(["1Auditorium"]);
  await expect(page.locator(".state-tag")).toHaveText("Complete");
  await expect(page.locator(".reachability-note")).toContainText(
    "8 location(s)",
  );
});

test("laptop, tablet, and narrow mobile layouts stay readable without page overflow", async ({
  page,
}) => {
  for (const width of [1280, 1024, 820, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    await expect(
      page.getByRole("button", { name: "Weighted Graph", exact: true }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Weighted Graph", exact: true })
      .click();
    await expect(page.locator(".edge-weight")).toHaveCount(12);
    await page.getByRole("tab", { name: "Adjacency Matrix" }).click();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: `.verification/polished-${width}.png`,
      fullPage: true,
    });
  }
});
