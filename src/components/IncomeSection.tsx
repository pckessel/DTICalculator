import { useState } from "react";
import { Trash2, Plus } from "lucide-react";
import { useStore, type IncomeSource } from "../store/index";
import { computeMonthlyGrossIncome } from "../lib/calculations";
import { formatCurrency } from "../lib/calculations";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { cn } from "../lib/cn";

type IncomeSectionProps = {
  scenarioId?: string;
};

type DisplayMode = "annual" | "monthly";

export function IncomeSection({ scenarioId }: IncomeSectionProps) {
  const store = useStore();
  const [displayMode, setDisplayMode] = useState<DisplayMode>("annual");

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
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-gray-200">Income</h2>
        <div className="flex items-center gap-2">
          {/* Annual / Monthly toggle */}
          <div className="flex rounded-md border border-gray-700 text-xs overflow-hidden">
            <button
              type="button"
              onClick={() => setDisplayMode("annual")}
              className={cn(
                "px-2.5 py-1 transition-colors",
                displayMode === "annual"
                  ? "bg-purple-600 text-white"
                  : "text-gray-400 hover:text-gray-200",
              )}
            >
              Annual
            </button>
            <button
              type="button"
              onClick={() => setDisplayMode("monthly")}
              className={cn(
                "px-2.5 py-1 transition-colors",
                displayMode === "monthly"
                  ? "bg-purple-600 text-white"
                  : "text-gray-400 hover:text-gray-200",
              )}
            >
              Monthly
            </button>
          </div>
          <Button variant="outline" size="sm" onClick={addIncome}>
            <Plus size={14} />
            Add Income Source
          </Button>
        </div>
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
              <Label htmlFor={`income-amount-${source.id}`}>
                {displayMode === "annual" ? "Annual ($)" : "Monthly ($)"}
              </Label>
              <Input
                id={`income-amount-${source.id}`}
                data-testid="income-amount-input"
                type="number"
                min="0"
                placeholder="0"
                value={
                  displayMode === "annual"
                    ? source.annualAmount === 0
                      ? ""
                      : source.annualAmount
                    : source.annualAmount === 0
                      ? ""
                      : Math.round(source.annualAmount / 12)
                }
                onChange={(e) => {
                  const raw = e.target.value === "" ? 0 : parseFloat(e.target.value);
                  if (!isNaN(raw)) {
                    const annual = displayMode === "annual" ? raw : raw * 12;
                    updateIncome(source.id, "annualAmount", annual);
                  }
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
