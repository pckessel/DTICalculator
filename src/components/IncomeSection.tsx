import { Trash2, Plus } from "lucide-react";
import { useStore, type IncomeSource } from "../store/index";
import { computeMonthlyGrossIncome } from "../lib/calculations";
import { formatCurrency } from "../lib/calculations";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

type IncomeSectionProps = {
  scenarioId?: string;
};

export function IncomeSection({ scenarioId }: IncomeSectionProps) {
  const store = useStore();

  const incomeSources: IncomeSource[] = scenarioId
    ? (store.scenarios.find((s) => s.id === scenarioId)?.incomeSources ?? [])
    : store.incomeSources;

  function addIncome() {
    if (scenarioId) {
      store.addScenarioIncomeSource(scenarioId);
    } else {
      store.addIncomeSource();
    }
  }

  function updateIncome(id: string, field: keyof IncomeSource, value: string | number) {
    if (scenarioId) {
      store.updateScenarioIncomeSource(scenarioId, id, { [field]: value });
    } else {
      store.updateIncomeSource(id, { [field]: value });
    }
  }

  function removeIncome(id: string) {
    if (scenarioId) {
      store.removeScenarioIncomeSource(scenarioId, id);
    } else {
      store.removeIncomeSource(id);
    }
  }

  const monthlyGross = computeMonthlyGrossIncome(incomeSources);

  return (
    <section className="mb-8">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-200">Income</h2>
        <Button variant="outline" size="sm" onClick={addIncome}>
          <Plus size={14} />
          Add Income Source
        </Button>
      </div>

      {incomeSources.length === 0 && (
        <p className="mb-4 text-sm text-gray-500 italic">
          Start by entering your income sources below.
        </p>
      )}

      <div className="space-y-3">
        {incomeSources.map((source) => (
          <div
            key={source.id}
            className="flex items-center gap-3 rounded-lg border border-gray-800 bg-gray-900/30 p-3"
          >
            <div className="flex-1 space-y-1">
              <Label htmlFor={`income-label-${source.id}`}>Label</Label>
              <Input
                id={`income-label-${source.id}`}
                data-testid="income-label-input"
                placeholder="e.g. Salary"
                value={source.label}
                onChange={(e) => updateIncome(source.id, "label", e.target.value)}
              />
            </div>
            <div className="w-40 space-y-1">
              <Label htmlFor={`income-amount-${source.id}`}>Annual Amount ($)</Label>
              <Input
                id={`income-amount-${source.id}`}
                data-testid="income-amount-input"
                type="number"
                min="0"
                placeholder="0"
                value={source.annualAmount === 0 ? "" : source.annualAmount}
                onChange={(e) => {
                  const val = e.target.value === "" ? 0 : parseFloat(e.target.value);
                  if (!isNaN(val)) updateIncome(source.id, "annualAmount", val);
                }}
              />
            </div>
            <button
              className="mt-5 text-gray-600 hover:text-red-400 transition-colors"
              onClick={() => removeIncome(source.id)}
              type="button"
              aria-label="Remove income source"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>

      {incomeSources.length > 0 && (
        <div className="mt-3 flex justify-end">
          <span className="text-sm text-gray-400">
            Monthly Gross:{" "}
            <span className="font-mono font-semibold text-cyan-400">
              {formatCurrency(monthlyGross)}
            </span>
            /mo
          </span>
        </div>
      )}
    </section>
  );
}
