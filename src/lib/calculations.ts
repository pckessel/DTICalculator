import type { DebtItem, IncomeSource, InvestmentProperty, LoanParams } from "../store/index";

export function computeMortgageFactor(aprPercent: number, loanTermYears: number): number {
  const i = aprPercent / 100 / 12;
  const n = loanTermYears * 12;
  return (i * Math.pow(1 + i, n)) / (Math.pow(1 + i, n) - 1);
}

export function computeMonthlyGrossIncome(incomeSources: IncomeSource[]): number {
  return incomeSources.reduce((sum, s) => sum + s.annualAmount, 0) / 12;
}

export function computeAdjustedMonthlyIncome(
  incomeSources: IncomeSource[],
  properties: InvestmentProperty[],
): number {
  const base = computeMonthlyGrossIncome(incomeSources);
  const rentalIncome = properties.reduce(
    (sum, p) => sum + p.revenuePerMonth * p.revenueCountedByBank,
    0,
  );
  return base + rentalIncome;
}

export function computeTotalMonthlyDebt(
  debtItems: DebtItem[],
  properties: InvestmentProperty[],
): number {
  const debts = debtItems.reduce((sum, d) => sum + d.monthlyPayment, 0);
  const propDebts = properties.reduce((sum, p) => sum + p.mortgagePlusTaxesInsurance, 0);
  return debts + propDebts;
}

export function computeDtiRatio(adjustedIncome: number, totalDebt: number): number {
  if (adjustedIncome === 0) return 0;
  return totalDebt / adjustedIncome;
}

export function computeAvailableMonthlyCash(
  adjustedIncome: number,
  totalDebt: number,
  maxDtiPercent: number,
): number {
  return adjustedIncome * (maxDtiPercent / 100) - totalDebt;
}

export function computeBorrowingPower(
  availableCash: number,
  mortgageFactor: number,
  taxesInsuranceRate: number,
): number {
  if (availableCash <= 0) return 0;
  return availableCash / (mortgageFactor + taxesInsuranceRate / 100 / 12);
}

export type PropertyROI = {
  monthlyCashFlow: number;
  annualCashFlow: number;
  cashOnCashReturn: number;
};

export function computePropertyROI(property: InvestmentProperty): PropertyROI {
  const monthlyCashFlow =
    property.revenuePerMonth - property.mortgagePlusTaxesInsurance - property.monthlyExpenses;
  const annualCashFlow = monthlyCashFlow * 12;
  const cashOnCashReturn = property.cashToClose > 0 ? annualCashFlow / property.cashToClose : 0;
  return { monthlyCashFlow, annualCashFlow, cashOnCashReturn };
}

export type ItemEffect = {
  dtiDelta: number;
  cashDelta: number;
  borrowingPowerDelta: number;
};

export function computeDebtItemEffect(
  monthlyPayment: number,
  adjustedIncome: number,
  mortgageFactor: number,
  taxesInsuranceRate: number,
): ItemEffect {
  const divisor = mortgageFactor + taxesInsuranceRate / 100 / 12;
  return {
    dtiDelta: adjustedIncome > 0 ? monthlyPayment / adjustedIncome : 0,
    cashDelta: -monthlyPayment,
    borrowingPowerDelta: -(monthlyPayment / divisor),
  };
}

export function computePropertyEffect(
  property: InvestmentProperty,
  adjustedIncome: number,
  mortgageFactor: number,
  taxesInsuranceRate: number,
): ItemEffect {
  const netMonthlyImpact =
    property.mortgagePlusTaxesInsurance - property.revenuePerMonth * property.revenueCountedByBank;
  const divisor = mortgageFactor + taxesInsuranceRate / 100 / 12;
  return {
    dtiDelta: adjustedIncome > 0 ? netMonthlyImpact / adjustedIncome : 0,
    cashDelta: -netMonthlyImpact,
    borrowingPowerDelta: -(netMonthlyImpact / divisor),
  };
}

export type FinancialSummary = {
  monthlyGrossIncome: number;
  adjustedMonthlyIncome: number;
  totalMonthlyDebt: number;
  dtiRatio: number;
  availableMonthlyCash: number;
  borrowingPower: number;
  mortgageFactor: number;
};

export function computeFinancialSummary(
  incomeSources: IncomeSource[],
  debtItems: DebtItem[],
  investmentProperties: InvestmentProperty[],
  loanParams: LoanParams,
): FinancialSummary {
  const mortgageFactor = computeMortgageFactor(loanParams.aprPercent, loanParams.loanTermYears);
  const monthlyGrossIncome = computeMonthlyGrossIncome(incomeSources);
  const adjustedMonthlyIncome = computeAdjustedMonthlyIncome(incomeSources, investmentProperties);
  const totalMonthlyDebt = computeTotalMonthlyDebt(debtItems, investmentProperties);
  const dtiRatio = computeDtiRatio(adjustedMonthlyIncome, totalMonthlyDebt);
  const availableMonthlyCash = computeAvailableMonthlyCash(
    adjustedMonthlyIncome,
    totalMonthlyDebt,
    loanParams.maxDtiPercent,
  );
  const borrowingPower = computeBorrowingPower(
    availableMonthlyCash,
    mortgageFactor,
    loanParams.taxesInsuranceRate,
  );
  return {
    monthlyGrossIncome,
    adjustedMonthlyIncome,
    totalMonthlyDebt,
    dtiRatio,
    availableMonthlyCash,
    borrowingPower,
    mortgageFactor,
  };
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatPercent(value: number, decimals = 1): string {
  return (value * 100).toFixed(decimals) + "%";
}
