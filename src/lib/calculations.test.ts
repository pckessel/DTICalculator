import { expect, test } from "vite-plus/test";
import {
  computeAdjustedMonthlyIncome,
  computeAvailableMonthlyCash,
  computeBorrowingPower,
  computeDtiRatio,
  computeMortgageFactor,
  computeMonthlyGrossIncome,
  computePropertyROI,
} from "./calculations";
import type { InvestmentProperty } from "../store/index";

// 1. Mortgage factor: APR 6.75%, term 30 years → 0.006485980966
test("computeMortgageFactor(6.75, 30) ≈ 0.006485980966", () => {
  const factor = computeMortgageFactor(6.75, 30);
  expect(factor).toBeCloseTo(0.006485980966, 9);
});

// 2. Monthly gross income: [200000, 40000, 60000] → 25000
test("computeMonthlyGrossIncome with 300k annual total = 25000", () => {
  const sources = [
    { id: "1", label: "A", annualAmount: 200000 },
    { id: "2", label: "B", annualAmount: 40000 },
    { id: "3", label: "C", annualAmount: 60000 },
  ];
  expect(computeMonthlyGrossIncome(sources)).toBe(25000);
});

// 3. DTI ratio: monthlyIncome=25000, monthlyDebts=3400 → 0.136
test("computeDtiRatio(25000, 3400) ≈ 0.136", () => {
  expect(computeDtiRatio(25000, 3400)).toBeCloseTo(0.136, 3);
});

// 4. Available monthly cash: income=25000, debts=3400, maxDti=40 → 6600
test("computeAvailableMonthlyCash(25000, 3400, 40) = 6600", () => {
  expect(computeAvailableMonthlyCash(25000, 3400, 40)).toBe(6600);
});

// 5. Borrowing power: availableCash=10000, mortgageFactor=0.006485980966, tiRate=2.0
// Formula: 10000 / (0.006485980966 + 2.0/100/12) = 10000 / 0.008152647632... ≈ 1226595
test("computeBorrowingPower(10000, 0.006485980966, 2.0) is correct", () => {
  const bp = computeBorrowingPower(10000, 0.006485980966, 2.0);
  expect(Math.round(bp)).toBe(1226595);
});

// 6. Borrowing power: availableCash=6600, same rates
// Formula: 6600 / (0.006485980966 + 2.0/100/12) ≈ 809553
test("computeBorrowingPower(6600, 0.006485980966, 2.0) is correct", () => {
  const bp = computeBorrowingPower(6600, 0.006485980966, 2.0);
  expect(Math.round(bp)).toBe(809553);
});

// 7. Investment property DTI adjustment
test("investment property DTI adjustment with 75% bank rate", () => {
  const sources = [{ id: "1", label: "Salary", annualAmount: 300000 }];
  const property: InvestmentProperty = {
    id: "p1",
    label: "Rental",
    purchasePrice: 0,
    cashToClose: 0,
    revenuePerMonth: 2000,
    mortgagePlusTaxesInsurance: 1500,
    monthlyExpenses: 0,
    revenueCountedByBank: 0.75,
  };
  // adjustedIncome = 25000 + 2000*0.75 = 26500
  // adjustedDebts = 1500
  // adjustedDTI = 1500/26500 ≈ 0.0566
  const adjustedIncome = computeAdjustedMonthlyIncome(sources, [property]);
  expect(adjustedIncome).toBeCloseTo(26500, 0);

  const dti = computeDtiRatio(adjustedIncome, 1500);
  expect(dti).toBeCloseTo(0.0566, 4);
});

// 8. Property ROI: revenue=2333.33, piti=1000, expenses=200, cashToClose=25000
test("computePropertyROI matches spreadsheet Cabin example", () => {
  const property: InvestmentProperty = {
    id: "p1",
    label: "Cabin",
    purchasePrice: 0,
    cashToClose: 25000,
    revenuePerMonth: 2333.33,
    mortgagePlusTaxesInsurance: 1000,
    monthlyExpenses: 200,
    revenueCountedByBank: 0.75,
  };
  const roi = computePropertyROI(property);
  expect(roi.monthlyCashFlow).toBeCloseTo(1133.33, 1);
  expect(roi.annualCashFlow).toBeCloseTo(13600, 0);
  expect(roi.cashOnCashReturn).toBeCloseTo(0.544, 2);
});
