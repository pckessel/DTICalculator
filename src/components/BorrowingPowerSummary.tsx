import { useStore } from "../store/index";
import {
  computeFinancialSummary,
  computeWaterfallRows,
  computeEffectiveCashOnHand,
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

  const isOverDti = summary.availableMonthlyCash <= 0;

  // Cash on Hand display
  const baselineCashOnHand = store.cashOnHand;
  const effectiveCashOnHand = scenario
    ? computeEffectiveCashOnHand(
        scenario.cashOnHand,
        scenario.investmentProperties,
        scenario.snapshotPropertyIds ?? [],
      )
    : baselineCashOnHand;
  const showCashOnHand = effectiveCashOnHand !== undefined && effectiveCashOnHand !== null;
  const cashDelta = scenario
    ? effectiveCashOnHand !== undefined && baselineCashOnHand !== undefined
      ? effectiveCashOnHand - baselineCashOnHand
      : undefined
    : undefined;

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
          {showCashOnHand && (
            <div className="col-span-2 text-center sm:col-span-3">
              <p className="text-xs text-gray-500">Cash on Hand</p>
              <p className="font-mono text-xl font-bold text-green-400">
                {formatCurrency(effectiveCashOnHand!)}
                {cashDelta !== undefined && cashDelta !== 0 && (
                  <span
                    className={cn(
                      "ml-2 text-sm font-medium",
                      cashDelta > 0 ? "text-green-300" : "text-red-400",
                    )}
                  >
                    ({cashDelta > 0 ? "+" : ""}
                    {formatCurrency(cashDelta)})
                  </span>
                )}
              </p>
              <p className="text-xs text-gray-600">liquid capital</p>
            </div>
          )}
        </div>

        {/* Waterfall breakdown */}
        {(debtItems.length > 0 || investmentProperties.some((p) => !p.saleDetails)) && (
          <div className="border-t border-gray-800 pt-4">
            <p className="mb-3 text-xs font-medium uppercase tracking-wider text-gray-500">
              Borrowing Power Breakdown
            </p>

            {(() => {
              const { startBP, rows } = computeWaterfallRows(
                incomeSources,
                debtItems,
                investmentProperties,
                loanParams,
              );

              return (
                <div className="text-sm">
                  {/* Column headers — hidden on mobile */}
                  <div className="mb-1 hidden grid-cols-[1fr_auto_auto_auto_auto] gap-x-4 text-xs font-medium uppercase tracking-wider text-gray-600 sm:grid">
                    <span>Item</span>
                    <span className="text-right">Net/mo</span>
                    <span className="text-right">DTI</span>
                    <span className="text-right">Change</span>
                    <span className="text-right">Running Total</span>
                  </div>

                  {/* Starting power row */}
                  <div className="mb-1 grid grid-cols-[1fr_auto] gap-x-4 border-b border-gray-800 pb-2 sm:grid-cols-[1fr_auto_auto_auto_auto]">
                    <span className="text-gray-400">Wage Income Only</span>
                    <span className="hidden sm:block" />
                    <span className="hidden sm:block" />
                    <span className="hidden sm:block" />
                    <span className="font-mono font-semibold text-gray-300 text-right">
                      {formatCurrency(startBP)}
                    </span>
                  </div>

                  {/* Debt rows */}
                  {rows.filter((r) => r.type === "debt").length > 0 && (
                    <div className="space-y-1 pb-2">
                      {rows
                        .filter((r) => r.type === "debt")
                        .map((row) => (
                          <div
                            key={row.id}
                            className="grid grid-cols-[1fr_auto] items-center gap-x-4 sm:grid-cols-[1fr_auto_auto_auto_auto]"
                          >
                            <span className="truncate text-gray-400">{row.label}</span>
                            <span className="hidden font-mono text-xs text-red-500/80 text-right sm:block">
                              −{formatCurrency(row.netMonthlyCost)}/mo
                            </span>
                            <span className="hidden font-mono text-xs text-red-500/80 text-right sm:block">
                              +{formatPercent(row.dtiDelta)}
                            </span>
                            <span className="font-mono text-xs font-medium text-red-400 text-right">
                              {formatCurrency(row.bpDelta)}
                            </span>
                            <span className="font-mono text-xs text-gray-500 text-right">
                              {formatCurrency(row.runningBP)}
                            </span>
                          </div>
                        ))}
                    </div>
                  )}

                  {/* Property rows */}
                  {rows.filter((r) => r.type === "property").length > 0 && (
                    <div className="space-y-1 border-t border-gray-800 pt-2 pb-2">
                      {rows
                        .filter((r) => r.type === "property")
                        .map((row) => {
                          const pos = row.bpDelta >= 0;
                          return (
                            <div
                              key={row.id}
                              className="grid grid-cols-[1fr_auto] items-center gap-x-4 sm:grid-cols-[1fr_auto_auto_auto_auto]"
                            >
                              <span className="truncate text-gray-400">{row.label}</span>
                              <span
                                className={cn(
                                  "hidden font-mono text-xs text-right sm:block",
                                  pos ? "text-green-500/80" : "text-red-500/80",
                                )}
                              >
                                {row.netMonthlyCost >= 0 ? "−" : "+"}
                                {formatCurrency(Math.abs(row.netMonthlyCost))}/mo net
                              </span>
                              <span
                                className={cn(
                                  "hidden font-mono text-xs text-right sm:block",
                                  pos ? "text-green-500/80" : "text-red-500/80",
                                )}
                              >
                                {row.dtiDelta >= 0 ? "+" : ""}
                                {formatPercent(row.dtiDelta)}
                              </span>
                              <span
                                className={cn(
                                  "font-mono text-xs font-medium text-right",
                                  pos ? "text-green-400" : "text-red-400",
                                )}
                              >
                                {pos ? "+" : ""}
                                {formatCurrency(row.bpDelta)}
                              </span>
                              <span className="font-mono text-xs text-gray-500 text-right">
                                {formatCurrency(row.runningBP)}
                              </span>
                            </div>
                          );
                        })}
                    </div>
                  )}

                  {/* Final row */}
                  <div className="mt-1 grid grid-cols-[1fr_auto] items-center gap-x-4 border-t border-gray-700 pt-2 sm:grid-cols-[1fr_auto_auto_auto_auto]">
                    <span className="font-medium text-gray-200">Your Borrowing Power</span>
                    <span className="hidden sm:block" />
                    <span className="hidden sm:block" />
                    <span className="hidden sm:block" />
                    <span
                      className={cn(
                        "font-mono font-bold text-right",
                        isOverDti ? "text-red-400" : "text-purple-400",
                      )}
                    >
                      {formatCurrency(summary.borrowingPower)}
                    </span>
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>
    </section>
  );
}
