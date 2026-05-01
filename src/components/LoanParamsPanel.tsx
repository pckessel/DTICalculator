import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useStore } from "../store/index";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

type LoanParamsPanelProps = {
  scenarioId?: string;
};

export function LoanParamsPanel({ scenarioId }: LoanParamsPanelProps) {
  const [open, setOpen] = useState(false);
  const store = useStore();

  const loanParams = scenarioId
    ? (store.scenarios.find((s) => s.id === scenarioId)?.loanParams ?? store.loanParams)
    : store.loanParams;

  function update(key: string, value: string) {
    const num = parseFloat(value);
    if (isNaN(num)) return;
    const updates = { [key]: num };
    if (scenarioId) {
      store.updateScenarioLoanParams(scenarioId, updates);
    } else {
      store.updateLoanParams(updates);
    }
  }

  return (
    <div className="rounded-lg border border-gray-800 bg-gray-900/30 mb-6">
      <button
        className="flex w-full items-center justify-between px-4 py-3 text-left"
        onClick={() => setOpen(!open)}
        type="button"
      >
        <span className="text-sm font-semibold text-gray-200">Loan Parameters</span>
        <span className="text-gray-500">
          {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </span>
      </button>

      {open && (
        <div className="border-t border-gray-800 px-4 py-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-1">
              <Label htmlFor={`apr-${scenarioId ?? "base"}`}>Mortgage APR (%)</Label>
              <Input
                id={`apr-${scenarioId ?? "base"}`}
                type="number"
                step="0.01"
                min="0"
                value={loanParams.aprPercent}
                onChange={(e) => update("aprPercent", e.target.value)}
              />
              <p className="text-xs text-gray-500">Current 30-yr fixed avg</p>
            </div>

            <div className="space-y-1">
              <Label htmlFor={`term-${scenarioId ?? "base"}`}>Loan Term (years)</Label>
              <Input
                id={`term-${scenarioId ?? "base"}`}
                type="number"
                step="1"
                min="1"
                value={loanParams.loanTermYears}
                onChange={(e) => update("loanTermYears", e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor={`maxdti-${scenarioId ?? "base"}`}>Max DTI Target (%)</Label>
              <Input
                id={`maxdti-${scenarioId ?? "base"}`}
                type="number"
                step="1"
                min="0"
                max="100"
                value={loanParams.maxDtiPercent}
                onChange={(e) => update("maxDtiPercent", e.target.value)}
              />
              <p className="text-xs text-gray-500">
                Most lenders approve up to 45%. 40% gives you a comfortable buffer.
              </p>
            </div>

            <div className="space-y-1">
              <Label htmlFor={`hardmax-${scenarioId ?? "base"}`}>Hard Max DTI (%)</Label>
              <Input
                id={`hardmax-${scenarioId ?? "base"}`}
                type="number"
                step="1"
                min="0"
                max="100"
                value={loanParams.hardMaxDtiPercent}
                onChange={(e) => update("hardMaxDtiPercent", e.target.value)}
              />
              <p className="text-xs text-gray-500">Lender maximum</p>
            </div>

            <div className="space-y-1">
              <Label htmlFor={`ti-${scenarioId ?? "base"}`}>Taxes & Insurance Rate (%)</Label>
              <Input
                id={`ti-${scenarioId ?? "base"}`}
                type="number"
                step="0.1"
                min="0"
                value={loanParams.taxesInsuranceRate}
                onChange={(e) => update("taxesInsuranceRate", e.target.value)}
              />
              <p className="text-xs text-gray-500">
                Rule of thumb: 2–3% of home value per year. Adjust for your market.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
