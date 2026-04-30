import { test, expect } from "@playwright/test";

test("app loads and shows DTI Calculator", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/DTI Calculator/i);
});

test("borrowing power shows $0 with no income entered", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("borrowing-power")).toContainText("$0");
});

test("borrowing power updates when income is added", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: /add income/i }).click();
  await page.getByTestId("income-label-input").fill("Salary");
  await page.getByTestId("income-amount-input").fill("300000");

  const borrowingPower = page.getByTestId("borrowing-power");
  await expect(borrowingPower).not.toContainText("$0");
  await expect(borrowingPower).toContainText("$");
});

test("adding a debt reduces borrowing power", async ({ page }) => {
  await page.goto("/");

  // Add income first
  await page.getByRole("button", { name: /add income/i }).click();
  await page.getByTestId("income-amount-input").fill("300000");

  const initialPower = await page.getByTestId("borrowing-power").textContent();

  // Add a debt
  await page.getByRole("button", { name: /add debt/i }).click();
  await page.getByTestId("debt-amount-input").fill("500");

  const reducedPower = await page.getByTestId("borrowing-power").textContent();

  expect(initialPower).not.toEqual(reducedPower);
});

test("data persists after page reload", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: /add income/i }).click();
  await page.getByTestId("income-label-input").fill("Salary");
  await page.getByTestId("income-amount-input").fill("120000");

  await page.reload();

  await expect(page.getByTestId("income-label-input")).toHaveValue("Salary");
  await expect(page.getByTestId("income-amount-input")).toHaveValue("120000");
});

test("scenario does not modify baseline", async ({ page }) => {
  await page.goto("/");

  // Set baseline income
  await page.getByRole("button", { name: /add income/i }).click();
  await page.getByTestId("income-amount-input").fill("200000");

  const baselinePower = await page.getByTestId("borrowing-power").textContent();

  // Go to scenarios
  await page.getByRole("link", { name: /scenarios/i }).click();
  await page.getByRole("button", { name: /new scenario/i }).click();

  // Add a debt inside the scenario
  await page.getByRole("button", { name: /add debt/i }).click();
  await page.getByTestId("debt-amount-input").fill("2000");

  // Go back to dashboard — baseline should be unchanged
  await page.getByRole("link", { name: /dashboard/i }).click();
  await expect(page.getByTestId("borrowing-power")).toContainText(baselinePower!);
});
