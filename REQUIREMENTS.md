# DTI Calculator — Product Requirements Document

## Overview

A client-side web application that helps people understand their current borrowing power from a lender's perspective and explore how real estate purchases (or sales) will change that power. The primary value is an interactive playground: users configure their baseline financial picture once, then run unlimited "what-if" scenarios without touching their saved profile.

---

## Goals

- Give anyone a fast, accurate read of their debt-to-income ratio and maximum borrowing power.
- Show clearly how each debt and each investment property chips away at (or adds to) borrowing power.
- Let users explore property scenarios freely — buying, selling, or refinancing — without modifying their real portfolio data.
- MVP is fully client-side; no account required. Data persists in `localStorage`.

---

## Target Users

General public — homebuyers, real estate investors, and curious people who want to understand lending math. The UI should explain itself. Assume no financial expertise but do assume basic literacy around terms like "mortgage", "DTI", and "monthly payment".

---

## Tech Stack

| Layer           | Choice                                                           |
| --------------- | ---------------------------------------------------------------- |
| Framework       | React 19 + TypeScript                                            |
| Toolchain       | Vite+ (`vp` CLI) — see CLAUDE.md                                 |
| Styling         | Tailwind CSS v4                                                  |
| Components      | shadcn/ui (Tailwind-based primitives, dark mode, fully owned)    |
| State           | Zustand (global store, persisted to localStorage via middleware) |
| Routing         | TanStack Router v1 (file-based, fully type-safe)                 |
| Charts          | Recharts (optional, for borrowing power waterfall visualization) |
| Package manager | pnpm (via `vp` commands — see CLAUDE.md)                         |

---

## Project Setup

The project is already scaffolded with Vite+ (toolchain, git hooks, linting, formatting, and tests are all working). An agent should not re-scaffold or run `vp migrate`.

**1. Install dependencies**

```bash
vp install
```

**2. Add TanStack Router**

```bash
vp add @tanstack/react-router
vp add -D @tanstack/router-plugin @tanstack/router-devtools
```

Configure the router plugin in `vite.config.ts`:

```ts
import { defineConfig } from "vite-plus";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";

export default defineConfig({
  plugins: [TanStackRouterVite({ routesDirectory: "./src/routes" }), react()],
});
```

**3. Install additional dependencies**

```bash
vp add zustand
vp dlx shadcn@latest init        # choose dark theme, Tailwind CSS v4
```

Install shadcn/ui components as needed during development — do not install all upfront:

```bash
vp dlx shadcn@latest add button input card label
```

Recharts is optional — only add if implementing the waterfall chart:

```bash
vp add recharts
```

**4. Establish the file structure**

```
src/
├── routes/
│   ├── __root.tsx          # Root layout: nav, global providers
│   ├── index.tsx           # Dashboard (/)
│   └── scenarios.tsx       # Scenario sandbox (/scenarios)
├── lib/
│   └── calculations.ts     # Pure functions only — no React, no store imports
├── store/
│   └── index.ts            # Zustand store with persist middleware
└── components/             # Shared UI components
```

**5. Verify setup**

```bash
vp dev        # dev server loads
vp check      # TypeScript + lint + format pass
vp test       # test runner initializes
```

All three must pass cleanly before writing any feature code.

---

## Branding & Design

**Name:** DTI Calculator

**Aesthetic:** Inspired by [Syntax.fm](https://syntax.fm) — dark, developer-friendly, slightly playful.

- Background: deep dark (e.g. `#0f0f0f` / `#1a1a1a`)
- Accent colors: electric purple (`#8b5cf6`), hot pink (`#ec4899`), cyan (`#06b6d4`)
- Typography: monospace or code-adjacent font for numbers (JetBrains Mono or similar); clean sans-serif for body text
- Inputs: clean, floating-label or labeled fields; well-spaced
- Numbers: always formatted as currency where applicable
- Tone: informative without being clinical — tooltips and helper text should feel like a knowledgeable friend explaining things, not a bank disclaimer

**Responsive:** Must work on mobile. Single-column stacked layout on small screens. Desktop gets a more spacious two-column layout where appropriate.

---

## Application Structure

### Two Main Views

#### 1. `/` — Dashboard (Baseline + Borrowing Power)

The primary view. One long scrollable page with these sections stacked vertically:

1. **Loan Parameters** (top, always visible or sticky)
2. **Income**
3. **Monthly Debts**
4. **Investment Properties (Portfolio)**
5. **Borrowing Power Summary**

#### 2. `/scenarios` — Scenario Sandbox

A sandbox that starts from a copy of the user's saved baseline and lets them freely add, remove, or modify anything to explore a what-if. Changes here do NOT affect the saved baseline. Users can save named scenarios and compare them.

---

## Data Model

All data lives in a single Zustand store, persisted to `localStorage`.

```ts
type IncomeSource = {
  id: string;
  label: string; // e.g. "Salary", "Bonuses", "Rental Income"
  annualAmount: number; // always stored as annual; display can toggle
};

type DebtItem = {
  id: string;
  label: string; // e.g. "Car Loan", "Credit Cards"
  monthlyPayment: number;
};

type InvestmentProperty = {
  id: string;
  label: string; // e.g. "Cabin", "Shasta"
  purchasePrice: number;
  cashToClose: number; // free form; suggestion: 20% down + $10k closing
  revenuePerMonth: number;
  mortgagePlusTaxesInsurance: number; // the actual monthly cost (PITI)
  monthlyExpenses: number; // free form; suggestion: 30% of revenue
  revenueCountedByBank: number; // decimal, default 0.75; configurable per property
};

type LoanParams = {
  aprPercent: number; // e.g. 6.75
  loanTermYears: number; // e.g. 30
  maxDtiPercent: number; // working target, e.g. 40
  hardMaxDtiPercent: number; // lender hard max, e.g. 45
  taxesInsuranceRate: number; // annual % of home value, e.g. 0.02
};

type SaleDetails = {
  salePrice: number;
  realtorFeePercent: number; // default 6
  closingCosts: number; // default 10_000
  remainingMortgageBalance: number; // user-entered
};

// An InvestmentProperty can optionally carry sale details.
// When saleDetails is set, the property is considered "sold" within that scenario.
type InvestmentProperty = {
  id: string;
  label: string;
  purchasePrice: number;
  cashToClose: number;
  revenuePerMonth: number;
  mortgagePlusTaxesInsurance: number;
  monthlyExpenses: number;
  revenueCountedByBank: number;
  saleDetails?: SaleDetails; // present only when the property has been sold in a scenario
};

type Scenario = {
  id: string;
  name: string;
  createdAt: string;
  incomeSources: IncomeSource[];
  debtItems: DebtItem[];
  investmentProperties: InvestmentProperty[];
  loanParams: LoanParams;
  cashOnHand?: number; // snapshot of baseline cashOnHand at scenario creation
  snapshotPropertyIds: string[]; // IDs of properties that existed at snapshot time (inherited, already purchased)
};

type AppState = {
  // Baseline (the user's real saved profile)
  incomeSources: IncomeSource[];
  debtItems: DebtItem[];
  investmentProperties: InvestmentProperty[];
  loanParams: LoanParams;
  cashOnHand?: number; // optional; user-entered liquid capital

  // Scenarios (sandbox copies)
  scenarios: Scenario[];
  activeScenarioId: string | null;
};
```

---

## Calculations

All calculations should live in a pure, tested utility module (`src/lib/calculations.ts`).

### Monthly Gross Income

```
monthlyGrossIncome = sum(incomeSources.map(s => s.annualAmount)) / 12
```

For investment properties, the bank counts a percentage of rental revenue as income:

```
adjustedMonthlyIncome = monthlyGrossIncome
  + sum(properties.map(p => p.revenuePerMonth * p.revenueCountedByBank))
```

### Total Monthly Debt

```
totalMonthlyDebt = sum(debtItems.map(d => d.monthlyPayment))
  + sum(properties.map(p => p.mortgagePlusTaxesInsurance))
```

### DTI Ratio

```
dtiRatio = totalMonthlyDebt / adjustedMonthlyIncome
```

### Available Monthly Cash (for a new mortgage)

This is the money left over within the DTI target after all existing debts:

```
availableMonthlyCash = (adjustedMonthlyIncome * maxDtiPercent) - totalMonthlyDebt
```

If `availableMonthlyCash <= 0`, borrowing power is $0 and the UI should surface a warning.

### Mortgage Rate Factor

Standard amortization formula constant (monthly payment per dollar of principal):

```
i = aprPercent / 100 / 12          // monthly interest rate
n = loanTermYears * 12             // total months
mortgageFactor = i * (1 + i)^n / ((1 + i)^n - 1)
```

### Estimated Borrowing Power

Accounts for the fact that taxes & insurance are also paid monthly and count toward DTI. Solving for principal `P`:

```
P * mortgageFactor + P * (taxesInsuranceRate / 12) = availableMonthlyCash
P = availableMonthlyCash / (mortgageFactor + taxesInsuranceRate / 12)
```

### Per-Item DTI Effect

For each debt item or investment property, calculate the marginal impact it has:

```
itemEffect = {
  dtiDelta: item.monthlyPayment / adjustedMonthlyIncome,
  cashDelta: -item.monthlyPayment,
  borrowingPowerDelta: -(item.monthlyPayment / (mortgageFactor + taxesInsuranceRate / 12))
}
```

For investment properties, the net effect accounts for income offset:

```
netMonthlyImpact = p.mortgagePlusTaxesInsurance - (p.revenuePerMonth * p.revenueCountedByBank)
```

### Investment Property ROI

```
monthlyCashFlow = p.revenuePerMonth - p.mortgagePlusTaxesInsurance - p.monthlyExpenses
annualCashFlow = monthlyCashFlow * 12
cashOnCashReturn = annualCashFlow / p.cashToClose   // as a percentage
```

### Net Sale Proceeds

```
realtorFeeAmount = salePrice * (realtorFeePercent / 100)
netProceeds = salePrice - realtorFeeAmount - closingCosts - remainingMortgageBalance
```

`netProceeds` may be negative (underwater sale). Always display it; never clamp to zero.

### Effective Cash on Hand (Scenario)

Cash on Hand is a running balance that updates as properties are sold or purchased within a scenario. Inherited properties (those in `snapshotPropertyIds`) are treated as already-purchased; their `cashToClose` was spent before the scenario began and is **not** deducted again.

```
soldProceeds     = sum(netProceeds for each sold property in investmentProperties)
newPurchaseCosts = sum(p.cashToClose for each p where p.id NOT IN snapshotPropertyIds AND p.saleDetails == null)
effectiveCashOnHand = (scenario.cashOnHand ?? 0) + soldProceeds - newPurchaseCosts
```

This value is recomputed live whenever any sale detail or new property changes.

### DTI and Income Adjustments for Sold Properties

A sold property is excluded from all financial calculations — its debt and income both drop off:

```
// When computing totals, skip properties where saleDetails is set
totalMonthlyDebt    = ... + sum(p.mortgagePlusTaxesInsurance for ACTIVE properties only)
adjustedMonthlyIncome = ... + sum(p.revenuePerMonth * p.revenueCountedByBank for ACTIVE properties only)
```

---

## Feature Specifications

### Loan Parameters Panel

A collapsible/sticky panel (top of Dashboard) with these fields:

| Field                      | Default | Helper text                                                                                                  |
| -------------------------- | ------- | ------------------------------------------------------------------------------------------------------------ |
| Mortgage APR (%)           | 7.00    | Current 30-yr fixed avg                                                                                      |
| Loan Term (years)          | 30      |                                                                                                              |
| Max DTI Target (%)         | 40      | ℹ️ "Most lenders approve up to 45%. 40% gives you a comfortable buffer."                                     |
| Hard Max DTI (%)           | 45      | Read-only label: "Lender maximum"                                                                            |
| Taxes & Insurance Rate (%) | 2.0     | ℹ️ "Rule of thumb: 2–3% of home value per year covers property taxes and insurance. Adjust for your market." |

### Income Section

- Start empty; user clicks **+ Add Income Source**
- Each row: text label input + annual dollar amount input
- Delete button per row
- Calculated footer: shows **Monthly Gross Income** = total / 12

### Monthly Debts Section

- Start empty; user clicks **+ Add Debt**
- Each row: text label input + monthly payment input
- Delete button per row
- Each row shows its DTI impact and borrowing power delta (e.g. "–$34,000 borrowing power")
- Running totals shown at bottom of section

### Investment Properties (Portfolio) Section

- Start empty; user clicks **+ Add Property**
- Each property is a card with:

**Inputs:**

- Property name/label
- Purchase Price
- Cash to Close — helper text: "Typically 20% down + ~$10k closing costs"
- Revenue / Month
- Revenue % bank counts — default 75% with ℹ️ "Most lenders count 70–75% of rental income. Check with your lender."
- Mortgage + Taxes + Insurance (monthly total)
- Monthly Expenses — helper text: "Rule of thumb: ~30% of monthly revenue"

**Calculated outputs (shown on the card):**

- Monthly Cash Flow
- Annualized Cash Flow
- Cash-on-Cash Return (%)
- DTI effect: net change to DTI%, available monthly cash, and borrowing power

### Borrowing Power Summary

Pinned or prominent at the bottom (or top) of the page. Shows:

- **Current Borrowing Power** — large, prominent dollar figure
- **Current DTI** — shown with a color-coded status:
  - Green: < 36%
  - Yellow: 36–43%
  - Red: > 43%
- **Available Monthly Cash** (for a new mortgage)
- A waterfall breakdown: starting borrowing power → each debt/property chips away → final number
  - Each row: label, monthly cost, DTI delta, borrowing power delta
  - Red if negative impact, green if positive (investment property with good income offset)

### Scenario Sandbox (`/scenarios`)

- **My Scenarios** list page: shows saved scenarios with name, created date, and borrowing power at time of save
- **New Scenario** button: opens a sandbox pre-loaded with a deep copy of the current baseline
- The sandbox is identical in layout to the Dashboard but with a banner: "Scenario: [name] — changes here don't affect your saved profile"
- User can rename the scenario
- **Save Scenario** button persists it to the store
- **Compare to Baseline** button shows a side-by-side diff: income delta, debt delta, borrowing power delta
- Scenarios can be deleted

---

## Feature Specifications — Cash on Hand & Sell Property

### Cash on Hand Panel

A new optional section on the Dashboard, positioned near the top (after Loan Parameters, before Income). Also present in the Scenario Sandbox.

**Input:**

- Single currency input: "Cash on Hand" with helper text: "Your liquid capital available to close on a property — down payment, closing costs, reserves."
- Optional — leaving it blank disables all cash-related indicators.

**Dashboard behavior:**

- Entering a value saves it to the baseline `cashOnHand` immediately (auto-save, same as all baseline fields).

**Scenario behavior:**

- Scenarios snapshot `cashOnHand` from baseline at creation time.
- The displayed value is `effectiveCashOnHand` (computed — see Calculations), not the raw stored value.
- When a sale has occurred, show both: "Base: $50,000 · Adjusted: $150,000" so the user understands why the number changed.
- The field is not directly editable in a scenario (it is derived). The user adjusts it on the Dashboard.

**Cash to Close indicator on property cards:**
When `cashOnHand` is set and the property has a `cashToClose` value, display an inline indicator on the property card next to the Cash to Close field:

| Condition                            | Indicator                             |
| ------------------------------------ | ------------------------------------- |
| `cashToClose <= effectiveCashOnHand` | Green badge: "Covered · $X remaining" |
| `cashToClose > effectiveCashOnHand`  | Amber/red badge: "Short by $X"        |

The indicator updates live as the user types the `cashToClose` value or as scenario sales/purchases change the effective balance.

**In Borrowing Power Summary:**

- Add a "Cash on Hand" line showing the effective value.
- In scenarios, show the delta vs baseline in parentheses (e.g., "+$100,000 from sales").

---

### Sell Property (Scenarios Only)

The Sell Property action is available only within a Scenario sandbox — it never appears on the baseline Dashboard. Any property visible in a scenario (whether inherited from baseline or added within the scenario) can be sold.

#### Trigger

Each active property card in a scenario has a **"Sell Property"** button (secondary/ghost style, below the property inputs). Clicking it transitions the card into sale entry mode.

#### Sale Entry Mode

The card expands with a sale configuration form:

| Field                          | Default | Notes                             |
| ------------------------------ | ------- | --------------------------------- |
| Sale Price                     | blank   | Required to show non-zero summary |
| Realtor Fee (%)                | 6       | Editable                          |
| Closing Costs ($)              | 10,000  | Editable                          |
| Remaining Mortgage Balance ($) | blank   | Manually entered by user          |

Below the form, a live summary panel updates as the user types:

```
Sale Price:                  $XXX,XXX
  − Realtor Fee (6%):        −$XX,XXX
  − Closing Costs:           −$XX,XXX
  − Remaining Mortgage:      −$XXX,XXX
  ─────────────────────────────────────
  Net Proceeds:              $XX,XXX
```

Also display below the summary:

- "Cash on Hand after this sale: $XXX,XXX" (using `effectiveCashOnHand` + this sale's net proceeds)
- "DTI after this sale: X.X%"

A **"Confirm Sale"** and a **"Cancel"** button sit below the summary. Cancel returns the card to normal property-editing mode. Confirm transitions the card to SOLD state.

#### SOLD Card

After confirming, the card transforms in place. It occupies the same position in the property list.

**Visual design:**

- A large, tilted "SOLD" badge — playful, high-contrast (hot pink or electric purple, rotated ~−6°, heavy font weight, slight drop shadow). Rubber-stamp aesthetic.
- Card background subtly muted vs active cards (reduced opacity border, slight desaturation) to signal the property is no longer active.
- Property label displayed as the card header.

**Content:**

- The same four sale fields (Sale Price, Realtor Fee %, Closing Costs, Remaining Mortgage) remain **fully editable** — adjusting any of them recalculates net proceeds, effective cash on hand, DTI, and borrowing power in real-time.
- Net proceeds summary remains visible at all times.
- A small "impact" section shows:
  - "Net Proceeds: +$X added to Cash on Hand"
  - "Monthly Debt: −$X/mo (mortgage removed)"
  - "DTI: decreased by X%"
  - "Borrowing Power: +$X"

The SOLD card persists for the lifetime of the scenario — it is always shown and cannot be dismissed.

#### Effect on Scenario Calculations

Once a property's `saleDetails` is present:

- Its `mortgagePlusTaxesInsurance` is excluded from `totalMonthlyDebt`.
- Its `revenuePerMonth * revenueCountedByBank` is excluded from `adjustedMonthlyIncome`.
- Its `netProceeds` is included in `effectiveCashOnHand`.
- All downstream values (DTI, available cash, borrowing power) recalculate.

This happens live during sale entry mode — the user sees the impact before confirming.

#### Multiple Sales in One Scenario

There is no limit on sales per scenario. Each sale's proceeds compound: selling Property A frees cash and DTI headroom that is immediately reflected when evaluating or adding Property C.

---

### Info Panel (`?` Modal)

A `?` icon button in the top navigation bar opens a modal overlay explaining what the tool does and how to use it. The modal is dismissible (click outside or press Escape).

**Trigger:** A small `?` icon button, right-aligned in the nav header next to the app name.

**Modal content:**

> **What is this?**
>
> This tool shows you your **borrowing power** — the maximum mortgage you'd qualify for right now based on your debt-to-income ratio (DTI). Set up your baseline once: income, existing debts, loan parameters, and any investment properties you already own.
>
> Then comes the fun part. Head to **Scenarios** and start playing: add a rental property, sell one, pay off a loan, model a raise. Every change instantly shows you how your DTI shifts and whether your borrowing power goes up or down — without ever touching your saved profile. It's a real estate "what-if" machine.
>
> **The numbers that matter:**
>
> - **DTI** — your total monthly debt payments ÷ monthly income. Most lenders cap this around 43–50%.
> - **Borrowing power** — the loan you can support while staying under your DTI limit.
> - **Available monthly cash** — the room left in your budget for a new mortgage payment.
>
> _Everything stays in your browser. No account, no server._

**Design notes:**

- Modal background: dark overlay, consistent with app aesthetic
- Icon: `CircleHelp` or similar from Lucide, small, unobtrusive
- No auto-open on first load — passive discovery only

---

## Smart Suggestions (UX Detail)

When a user adds a property, pre-fill suggestions for calculated fields as placeholder text (not locked values):

- Cash to Close placeholder: computed as `purchasePrice * 0.20 + 10000`
- Monthly Expenses placeholder: computed as `revenuePerMonth * 0.30`
- These update live as the user types the purchase price / revenue

---

## Persistence

- All baseline data (income, debts, properties, loan params) saved automatically to `localStorage` on every change via Zustand persist middleware.
- Scenarios saved to `localStorage` as well.
- No manual "save" button needed for baseline — it's always auto-saved.
- On first load with no data, show a brief onboarding prompt: "Start by entering your income sources below."

---

## Out of Scope for MVP

- User authentication / accounts
- Cloud database / sync across devices
- Sharing scenarios via URL
- PDF export
- Multiple users / household income splitting
- Lender-specific rule sets (FHA, VA, jumbo limits)
- Credit score inputs

These are valid future features, especially user accounts + cloud sync. The data model should be designed so migration from localStorage to a backend is straightforward (all data already has stable IDs).

## Full-Stack Migration Path (Post-MVP)

TanStack Router is the foundation for this upgrade. TanStack Start is TanStack Router's full-stack framework — the route files are identical, server capabilities are layered on top.

**Upgrade sequence:**

1. **Add TanStack Start** — install `@tanstack/start` and replace Vite+ as the dev/build tool with Vinxi. Existing route files require no changes.

2. **Add auth** — integrate Clerk or Supabase Auth via a TanStack Start middleware. Protected routes wrap existing route definitions with a session check.

3. **Add a database** — Supabase (Postgres) is the recommended choice. The data model maps directly to relational tables (see Data Model section). Supabase Row Level Security enforces that users only access their own data at the database layer.

4. **Add server functions** — replace Zustand's `persist` middleware with `createServerFn()` calls for reading/writing user data. Swap to TanStack Query for server-state caching on the client. Route `loader` functions fetch baseline data before the page renders.

5. **One-time data migration** — on a user's first login, detect any existing localStorage data and offer to import it to their account.

Route files and UI components require no changes — server functions and loaders are purely additive.

---

## Calculation Test Fixtures

All tests live in `src/lib/calculations.test.ts` and import only from `calculations.ts`. These are the expected values the implementation must produce — derived from the source spreadsheet and verified independently.

### Mortgage Factor

```
input:  APR 6.75%, term 30 years
        i = 0.005625, n = 360
output: 0.006485980966
```

### Monthly Gross Income

```
input:  [{ annual: 200_000 }, { annual: 40_000 }, { annual: 60_000 }]
output: monthlyGross = 25_000
```

### DTI Ratio

```
input:  monthlyIncome = 25_000, monthlyDebts = 3_400
output: dtiRatio = 0.136  (13.6%)
```

### Available Monthly Cash

```
input:  monthlyIncome = 25_000, monthlyDebts = 3_400, maxDtiPercent = 0.40
output: availableCash = 6_600
```

### Borrowing Power

The T&I adjustment means available cash is split between mortgage payment and taxes+insurance. Use these clean inputs to verify formula structure:

```
input:  availableCash = 10_000
        mortgageFactor = 0.006485980966   (6.75% APR, 30yr)
        taxesInsuranceRate = 0.02          (2% annual)
output: borrowingPower = 10_000 / (0.006485980966 + 0.02/12)
                       = 10_000 / 0.008152648
                       ≈ 1_226_904

input:  availableCash = 6_600, same rates
output: ≈ 809_757
```

Note: the spreadsheet's displayed value of $1,145,602 at $10,000 available cash implies a T&I rate of ~2.69%. This is because the spreadsheet author used a custom rate, not exactly 2%. The app's formula is correct at 2% — the spreadsheet is the reference for structure, not for that specific output value.

### Investment Property — DTI Adjustment

The user enters actual revenue; the app multiplies by the bank percentage automatically.

```
input:  baseMonthlyIncome = 25_000
        baseMonthlyDebts  = 0
        property: { revenuePerMonth: 2_000, piti: 1_500, revenueCountedByBank: 0.75 }

output: bankIncome        = 2_000 * 0.75 = 1_500
        adjustedIncome    = 25_000 + 1_500 = 26_500
        adjustedDebts     = 0 + 1_500 = 1_500
        adjustedDTI       = 1_500 / 26_500 ≈ 0.0566  (5.66%)
```

### Investment Property — ROI (from spreadsheet Cabin example)

```
input:  revenuePerMonth = 2_333.33   (=$28,000 / 12)
        piti            = 1_000
        monthlyExpenses = 200
        cashToClose     = 25_000

output: monthlyCashFlow  = 2_333.33 - 1_000 - 200 = 1_133.33
        annualCashFlow   = 1_133.33 * 12 = 13_600
        cashOnCashReturn = 13_600 / 25_000 = 0.544  (54.4%)
```

These three outputs match the spreadsheet exactly.

---

## Quality Gates

### Automatic (pre-commit hook — do not bypass)

- `vp staged` → auto-fixes formatting, runs type-aware linting on staged files, fails on TypeScript errors
- `vp test --run` → full unit test suite must pass before commit lands

### Manual (run before finishing any task)

- `vp check` — TypeScript + lint + format
- `vp test` — unit tests
- `vp run test:e2e` — Playwright smoke tests (requires dev server; Playwright starts it automatically)

### Playwright E2E

Smoke tests live in `e2e/smoke.test.ts`. They test the app in a real browser (Chromium headless). The tests use `data-testid` attributes — these **must** be added to the relevant elements when building the UI:

| `data-testid`         | Element                         |
| --------------------- | ------------------------------- |
| `borrowing-power`     | Main borrowing power output     |
| `income-label-input`  | Label field on each income row  |
| `income-amount-input` | Amount field on each income row |
| `debt-amount-input`   | Amount field on each debt row   |

---

## Store Actions (Reference)

New actions required for the Cash on Hand and Sell Property features:

| Action                                                                   | Description                                                                 |
| ------------------------------------------------------------------------ | --------------------------------------------------------------------------- |
| `setCashOnHand(amount \| undefined)`                                     | Set or clear baseline Cash on Hand                                          |
| `setScenarioCashOnHand(scenarioId, amount \| undefined)`                 | Not needed — scenario cash on hand is always derived, never directly set    |
| `sellScenarioProperty(scenarioId, propertyId, saleDetails)`              | Attach `saleDetails` to a property in a scenario                            |
| `updateScenarioPropertySaleDetails(scenarioId, propertyId, saleDetails)` | Update sale details on an already-sold property (live editing of SOLD card) |
| `unsellScenarioProperty(scenarioId, propertyId)`                         | Remove `saleDetails` from a property (Cancel in sale entry mode)            |

When creating a scenario snapshot, the store must populate `snapshotPropertyIds` with the IDs of all `investmentProperties` at that moment.

---

## Acceptance Criteria

- [ ] Borrowing power calculation matches the spreadsheet formula for the same inputs
- [ ] Adding a debt item updates DTI and borrowing power in real time
- [ ] Adding an investment property updates DTI using the 75% revenue rule
- [ ] Investment property ROI (cash flow, annualized, CoC return) calculates correctly
- [ ] Loan parameters (APR, term, DTI target, T&I rate) are editable and recalculate everything live
- [ ] All data survives a page refresh (localStorage persistence)
- [ ] Scenarios are isolated from baseline — editing a scenario does not change baseline data
- [ ] UI is usable on a 375px wide mobile screen
- [ ] `vp check` passes — TypeScript, linting, and formatting
- [ ] `vp test` passes — all calculation unit tests
- [ ] `vp run test:e2e` passes — all Playwright smoke tests
- [ ] Cash on Hand value is optional and, when blank, disables all cash-related indicators
- [ ] Effective Cash on Hand in a scenario = baseline cash + sale proceeds − new purchase costs
- [ ] Inherited properties (snapshotPropertyIds) do not deduct from scenario Cash on Hand
- [ ] Cash to Close indicator on a property card shows green "Covered" or red "Short by $X" based on effective cash on hand
- [ ] Sell Property button is only visible in scenario sandbox, never on the Dashboard
- [ ] Sale entry mode shows live net proceeds and post-sale DTI/cash on hand before confirming
- [ ] SOLD card renders in the same position as the original property card
- [ ] SOLD card sale fields are fully editable; all downstream values recalculate on change
- [ ] Selling a property removes its mortgage from DTI and its rental income from adjusted income
- [ ] Multiple properties can be sold in a single scenario; proceeds compound correctly
- [ ] `computeNetProceeds` and `computeEffectiveCashOnHand` are covered by unit tests
