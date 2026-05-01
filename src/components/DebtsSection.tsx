import { Trash2, Plus } from "lucide-react";
import { useStore, type DebtItem } from "../store/index";
import {
  computeAdjustedMonthlyIncome,
  computeDebtItemEffect,
  computeMortgageFactor,
  computeTotalMonthlyDebt,
  formatCurrency,
  formatPercent,
} from "../lib/calculations";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

type DebtsSectionProps = {
  scenarioId?: string;
};

export function DebtsSection({ scenarioId }: DebtsSectionProps) {
  const store = useStore();

  const scenario = scenarioId ? store.scenarios.find((s) => s.id === scenarioId) : null;

  const debtItems: DebtItem[] = scenario ? scenario.debtItems : store.debtItems;
  const incomeSources = scenario ? scenario.incomeSources : store.incomeSources;
  const investmentProperties = scenario
    ? scenario.investmentProperties
    : store.investmentProperties;
  const loanParams = scenario ? scenario.loanParams : store.loanParams;

  const adjustedIncome = computeAdjustedMonthlyIncome(incomeSources, investmentProperties);
  const mortgageFactor = computeMortgageFactor(loanParams.aprPercent, loanParams.loanTermYears);

  function addDebt() {
    if (scenarioId) {
      store.addScenarioDebtItem(scenarioId);
    } else {
      store.addDebtItem();
    }
  }

  function updateDebt(id: string, field: keyof DebtItem, value: string | number) {
    if (scenarioId) {
      store.updateScenarioDebtItem(scenarioId, id, { [field]: value });
    } else {
      store.updateDebtItem(id, { [field]: value });
    }
  }

  function removeDebt(id: string) {
    if (scenarioId) {
      store.removeScenarioDebtItem(scenarioId, id);
    } else {
      store.removeDebtItem(id);
    }
  }

  const totalDebt = computeTotalMonthlyDebt(debtItems, []);

  return (
    <section className="mb-8">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-200">Monthly Debts</h2>
        <Button variant="outline" size="sm" onClick={addDebt}>
          <Plus size={14} />
          Add Debt
        </Button>
      </div>

      <div className="space-y-3">
        {debtItems.map((debt) => {
          const effect = computeDebtItemEffect(
            debt.monthlyPayment,
            adjustedIncome,
            mortgageFactor,
            loanParams.taxesInsuranceRate,
          );
          return (
            <div key={debt.id} className="rounded-lg border border-gray-800 bg-gray-900/30 p-3">
              <div className="flex items-center gap-3">
                <div className="flex-1 space-y-1">
                  <Label htmlFor={`debt-label-${debt.id}`}>Label</Label>
                  <Input
                    id={`debt-label-${debt.id}`}
                    placeholder="e.g. Car Loan"
                    value={debt.label}
                    onChange={(e) => updateDebt(debt.id, "label", e.target.value)}
                  />
                </div>
                <div className="w-40 space-y-1">
                  <Label htmlFor={`debt-amount-${debt.id}`}>Monthly Payment ($)</Label>
                  <Input
                    id={`debt-amount-${debt.id}`}
                    data-testid="debt-amount-input"
                    type="number"
                    min="0"
                    placeholder="0"
                    value={debt.monthlyPayment === 0 ? "" : debt.monthlyPayment}
                    onChange={(e) => {
                      const val = e.target.value === "" ? 0 : parseFloat(e.target.value);
                      if (!isNaN(val)) updateDebt(debt.id, "monthlyPayment", val);
                    }}
                  />
                </div>
                <button
                  className="mt-5 text-gray-600 hover:text-red-400 transition-colors"
                  onClick={() => removeDebt(debt.id)}
                  type="button"
                  aria-label="Remove debt"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              {debt.monthlyPayment > 0 && (
                <div className="mt-2 flex gap-4 text-xs text-gray-500">
                  <span>
                    DTI impact:{" "}
                    <span className="text-red-400">+{formatPercent(effect.dtiDelta)}</span>
                  </span>
                  <span>
                    Borrowing power:{" "}
                    <span className="text-red-400">
                      {formatCurrency(effect.borrowingPowerDelta)}
                    </span>
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {debtItems.length > 0 && (
        <div className="mt-3 flex justify-end">
          <span className="text-sm text-gray-400">
            Total Monthly Debt:{" "}
            <span className="font-mono font-semibold text-red-400">
              {formatCurrency(totalDebt)}
            </span>
            /mo
          </span>
        </div>
      )}
    </section>
  );
}
