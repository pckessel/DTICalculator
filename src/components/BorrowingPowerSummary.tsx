import { useStore } from "../store/index";
import {
  computeFinancialSummary,
  computeDebtItemEffect,
  computePropertyEffect,
  formatCurrency,
  formatPercent,
} from "../lib/calculations";
import { cn } from "../lib/cn";

type BorrowingPowerSummaryProps = {
  scenarioId?: string;
};

function dtiColor(ratio: number): string {
  if (ratio < 0.36) return "text-green-400";
  if (ratio <= 0.43) return "text-yellow-400";
  return "text-red-400";
}

function dtiLabel(ratio: number): string {
  if (ratio < 0.36) return "Good";
  if (ratio <= 0.43) return "Caution";
  return "High";
}

export function BorrowingPowerSummary({ scenarioId }: BorrowingPowerSummaryProps) {
  const store = useStore();

  const scenario = scenarioId ? store.scenarios.find((s) => s.id === scenarioId) : null;

  const incomeSources = scenario ? scenario.incomeSources : store.incomeSources;
  const debtItems = scenario ? scenario.debtItems : store.debtItems;
  const investmentProperties = scenario
    ? scenario.investmentProperties
    : store.investmentProperties;
  const loanParams = scenario ? scenario.loanParams : store.loanParams;

  const summary = computeFinancialSummary(
    incomeSources,
    debtItems,
    investmentProperties,
    loanParams,
  );

  const { mortgageFactor } = summary;
  const tiRate = loanParams.taxesInsuranceRate;

  const isOverDti = summary.availableMonthlyCash <= 0;

  return (
    <section className="mb-8">
      <h2 className="mb-4 text-lg font-semibold text-gray-200">Borrowing Power Summary</h2>

      <div className="rounded-xl border border-purple-900/50 bg-gray-900/70 p-6">
        {/* Main borrowing power display */}
        <div className="mb-6 text-center">
          <p className="mb-1 text-sm text-gray-400">Estimated Borrowing Power</p>
          <p
            data-testid="borrowing-power"
            className={cn(
              "font-mono text-5xl font-bold tracking-tight",
              isOverDti ? "text-red-400" : "text-purple-400",
            )}
          >
            {formatCurrency(summary.borrowingPower)}
          </p>
          {isOverDti && (
            <p className="mt-2 text-sm text-red-400">
              ⚠ Your current debts exceed your DTI target. Reduce debts to unlock borrowing power.
            </p>
          )}
        </div>

        {/* Stats row */}
        <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div className="text-center">
            <p className="text-xs text-gray-500">Current DTI</p>
            <p className={cn("font-mono text-2xl font-bold", dtiColor(summary.dtiRatio))}>
              {formatPercent(summary.dtiRatio)}
            </p>
            <p className={cn("text-xs font-medium", dtiColor(summary.dtiRatio))}>
              {dtiLabel(summary.dtiRatio)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500">Monthly Income</p>
            <p className="font-mono text-xl font-bold text-cyan-400">
              {formatCurrency(summary.adjustedMonthlyIncome)}
            </p>
            <p className="text-xs text-gray-600">adjusted</p>
          </div>
          <div className="col-span-2 text-center sm:col-span-1">
            <p className="text-xs text-gray-500">Available for Mortgage</p>
            <p
              className={cn(
                "font-mono text-xl font-bold",
                summary.availableMonthlyCash > 0 ? "text-green-400" : "text-red-400",
              )}
            >
              {formatCurrency(Math.max(0, summary.availableMonthlyCash))}
            </p>
            <p className="text-xs text-gray-600">/month</p>
          </div>
        </div>

        {/* Waterfall breakdown */}
        {(debtItems.length > 0 || investmentProperties.length > 0) && (
          <div className="border-t border-gray-800 pt-4">
            <p className="mb-3 text-xs font-medium uppercase tracking-wider text-gray-500">
              Impact Breakdown
            </p>
            <div className="space-y-2">
              {debtItems.map((debt) => {
                if (debt.monthlyPayment === 0) return null;
                const effect = computeDebtItemEffect(
                  debt.monthlyPayment,
                  summary.adjustedMonthlyIncome,
                  mortgageFactor,
                  tiRate,
                );
                return (
                  <div key={debt.id} className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">{debt.label || "Debt"}</span>
                    <div className="flex items-center gap-4">
                      <span className="text-xs text-gray-600">
                        {formatCurrency(debt.monthlyPayment)}/mo
                      </span>
                      <span className="font-mono text-xs text-red-400">
                        +{formatPercent(effect.dtiDelta)} DTI
                      </span>
                      <span className="font-mono text-sm font-medium text-red-400">
                        {formatCurrency(effect.borrowingPowerDelta)}
                      </span>
                    </div>
                  </div>
                );
              })}

              {investmentProperties.map((prop) => {
                const effect = computePropertyEffect(
                  prop,
                  summary.adjustedMonthlyIncome,
                  mortgageFactor,
                  tiRate,
                );
                const isPositive = effect.borrowingPowerDelta >= 0;
                return (
                  <div key={prop.id} className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">{prop.label || "Property"}</span>
                    <div className="flex items-center gap-4">
                      <span className="text-xs text-gray-600">
                        net {formatCurrency(-effect.cashDelta)}/mo
                      </span>
                      <span
                        className={cn(
                          "font-mono text-xs",
                          isPositive ? "text-green-400" : "text-red-400",
                        )}
                      >
                        {effect.dtiDelta > 0 ? "+" : ""}
                        {formatPercent(effect.dtiDelta)} DTI
                      </span>
                      <span
                        className={cn(
                          "font-mono text-sm font-medium",
                          isPositive ? "text-green-400" : "text-red-400",
                        )}
                      >
                        {isPositive ? "+" : ""}
                        {formatCurrency(effect.borrowingPowerDelta)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
