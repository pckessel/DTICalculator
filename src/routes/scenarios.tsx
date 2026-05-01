import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Trash2, ArrowLeft, TrendingUp, TrendingDown } from "lucide-react";
import { useStore } from "../store/index";
import { computeFinancialSummary } from "../lib/calculations";
import { formatCurrency } from "../lib/calculations";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { LoanParamsPanel } from "../components/LoanParamsPanel";
import { IncomeSection } from "../components/IncomeSection";
import { DebtsSection } from "../components/DebtsSection";
import { InvestmentPropertiesSection } from "../components/InvestmentPropertiesSection";
import { BorrowingPowerSummary } from "../components/BorrowingPowerSummary";

export const Route = createFileRoute("/scenarios")({
  component: ScenariosPage,
});

function ScenariosPage() {
  const store = useStore();
  const { scenarios, activeScenarioId, createScenario, deleteScenario, setActiveScenario } = store;
  const [newName, setNewName] = useState("");

  const activeScenario = activeScenarioId
    ? (scenarios.find((s) => s.id === activeScenarioId) ?? null)
    : null;

  const baselineSummary = computeFinancialSummary(
    store.incomeSources,
    store.debtItems,
    store.investmentProperties,
    store.loanParams,
  );

  function handleCreateScenario() {
    const name = newName.trim() || `Scenario ${scenarios.length + 1}`;
    createScenario(name);
    setNewName("");
  }

  if (activeScenario) {
    const scenarioSummary = computeFinancialSummary(
      activeScenario.incomeSources,
      activeScenario.debtItems,
      activeScenario.investmentProperties,
      activeScenario.loanParams,
    );

    const bpDelta = scenarioSummary.borrowingPower - baselineSummary.borrowingPower;
    const incomeDelta =
      scenarioSummary.adjustedMonthlyIncome - baselineSummary.adjustedMonthlyIncome;
    const debtDelta = scenarioSummary.totalMonthlyDebt - baselineSummary.totalMonthlyDebt;

    return (
      <div>
        {/* Banner */}
        <div className="mb-6 rounded-lg border border-yellow-800 bg-yellow-900/20 px-4 py-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <p className="text-sm font-semibold text-yellow-300">
                Scenario: {activeScenario.name}
              </p>
              <p className="text-xs text-yellow-600">
                Changes here don't affect your saved profile
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <span>vs baseline:</span>
                {incomeDelta !== 0 && (
                  <span className={incomeDelta > 0 ? "text-green-400" : "text-red-400"}>
                    income {incomeDelta > 0 ? "+" : ""}
                    {formatCurrency(incomeDelta)}/mo
                  </span>
                )}
                {debtDelta !== 0 && (
                  <span className={debtDelta < 0 ? "text-green-400" : "text-red-400"}>
                    debt {debtDelta > 0 ? "+" : ""}
                    {formatCurrency(debtDelta)}/mo
                  </span>
                )}
                {bpDelta !== 0 && (
                  <span className={bpDelta > 0 ? "text-green-400" : "text-red-400"}>
                    {bpDelta > 0 ? (
                      <TrendingUp size={12} className="inline" />
                    ) : (
                      <TrendingDown size={12} className="inline" />
                    )}{" "}
                    BP {bpDelta > 0 ? "+" : ""}
                    {formatCurrency(bpDelta)}
                  </span>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const currentName = window.prompt("Rename scenario:", activeScenario.name);
                  if (currentName && currentName.trim()) {
                    store.updateScenario(activeScenario.id, { name: currentName.trim() });
                  }
                }}
              >
                Rename
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setActiveScenario(null)}>
                <ArrowLeft size={14} />
                Back to Scenarios
              </Button>
            </div>
          </div>
        </div>

        {/* Scenario sandbox - same layout as dashboard */}
        <LoanParamsPanel scenarioId={activeScenario.id} />
        <IncomeSection scenarioId={activeScenario.id} />
        <DebtsSection scenarioId={activeScenario.id} />
        <InvestmentPropertiesSection scenarioId={activeScenario.id} />
        <BorrowingPowerSummary scenarioId={activeScenario.id} />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">Scenarios</h1>
          <p className="text-sm text-gray-500">
            Explore what-if scenarios without affecting your baseline
          </p>
        </div>
        <Link to="/">
          <Button variant="outline" size="sm">
            <ArrowLeft size={14} />
            Dashboard
          </Button>
        </Link>
      </div>

      {/* Create new scenario */}
      <div className="mb-8 rounded-lg border border-gray-800 bg-gray-900/30 p-4">
        <h2 className="mb-3 text-sm font-semibold text-gray-300">Create New Scenario</h2>
        <div className="flex gap-3">
          <Input
            placeholder="Scenario name (optional)"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreateScenario()}
            className="flex-1"
          />
          <Button onClick={handleCreateScenario}>New Scenario</Button>
        </div>
        <p className="mt-2 text-xs text-gray-500">
          Starts as a copy of your current baseline profile
        </p>
      </div>

      {/* Scenarios list */}
      {scenarios.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-800 p-8 text-center">
          <p className="text-gray-500">No scenarios yet.</p>
          <p className="mt-1 text-sm text-gray-600">
            Create one above to start exploring what-if scenarios.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {scenarios.map((scenario) => {
            const summary = computeFinancialSummary(
              scenario.incomeSources,
              scenario.debtItems,
              scenario.investmentProperties,
              scenario.loanParams,
            );
            const bpDelta = summary.borrowingPower - baselineSummary.borrowingPower;

            return (
              <div
                key={scenario.id}
                className="flex items-center gap-4 rounded-lg border border-gray-800 bg-gray-900/30 p-4"
              >
                <div className="flex-1">
                  <p className="font-medium text-gray-200">{scenario.name}</p>
                  <p className="text-xs text-gray-500">
                    Created {new Date(scenario.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-lg font-bold text-purple-400">
                    {formatCurrency(summary.borrowingPower)}
                  </p>
                  {bpDelta !== 0 && (
                    <p
                      className={`text-xs font-mono ${bpDelta > 0 ? "text-green-400" : "text-red-400"}`}
                    >
                      {bpDelta > 0 ? "+" : ""}
                      {formatCurrency(bpDelta)} vs baseline
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setActiveScenario(scenario.id)}
                  >
                    Open
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deleteScenario(scenario.id)}
                    aria-label={`Delete ${scenario.name}`}
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
