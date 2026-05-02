import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useStore } from "../store/index";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Slider } from "./ui/slider";
import { DtiSlider } from "./DtiSlider";
import { useMortgageRate } from "../hooks/useMortgageRate";

type LoanParamsPanelProps = {
  scenarioId?: string;
};

// Round to nearest 0.125 (standard mortgage rate increment)
function roundToEighth(n: number) {
  return Math.round(n * 8) / 8;
}

export function LoanParamsPanel({ scenarioId }: LoanParamsPanelProps) {
  const [open, setOpen] = useState(false);
  const store = useStore();
  const { rate: marketRate, weekOf, loading: rateLoading } = useMortgageRate();

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

  // Slider range centered on market rate, or a sensible static fallback
  const sliderMin = marketRate != null ? roundToEighth(Math.max(3, marketRate - 1.5)) : 3;
  const sliderMax = marketRate != null ? roundToEighth(Math.min(15, marketRate + 3)) : 12;

  // Position of market-rate indicator as a percentage of the slider track
  const avgMarkerPct =
    marketRate != null
      ? Math.max(0, Math.min(100, ((marketRate - sliderMin) / (sliderMax - sliderMin)) * 100))
      : null;

  const weekOfFormatted =
    weekOf != null
      ? new Date(weekOf + "T00:00:00").toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        })
      : null;

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
            {/* APR — slider + override input */}
            <div className="space-y-2 sm:col-span-2 lg:col-span-3">
              <div className="flex items-center justify-between">
                <Label htmlFor={`apr-input-${scenarioId ?? "base"}`}>Mortgage APR (%)</Label>
                {rateLoading && (
                  <span className="text-xs text-gray-600">Fetching current rates…</span>
                )}
                {marketRate != null && weekOfFormatted && (
                  <span className="text-xs text-cyan-600">
                    Freddie Mac avg: {marketRate.toFixed(2)}% · week of {weekOfFormatted}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-4">
                {/* Slider with avg marker */}
                <div className="relative flex-1">
                  <Slider
                    min={sliderMin}
                    max={sliderMax}
                    step={0.125}
                    value={[Math.max(sliderMin, Math.min(sliderMax, loanParams.aprPercent))]}
                    onValueChange={([val]) => update("aprPercent", String(val))}
                  />
                  {avgMarkerPct != null && (
                    <div
                      className="pointer-events-none absolute top-1/2 -translate-y-1/2 -translate-x-1/2"
                      style={{ left: `${avgMarkerPct}%` }}
                    >
                      <div className="h-2.5 w-0.5 rounded-full bg-cyan-500 opacity-60" />
                    </div>
                  )}
                </div>

                {/* Override input */}
                <div className="flex items-center gap-1">
                  <input
                    id={`apr-input-${scenarioId ?? "base"}`}
                    type="number"
                    step="0.125"
                    min="0"
                    max="30"
                    value={loanParams.aprPercent}
                    onChange={(e) => update("aprPercent", e.target.value)}
                    className="w-16 rounded-md border border-gray-700 bg-gray-900 px-2 py-1 text-right font-mono text-sm text-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
                  />
                  <span className="text-xs text-gray-500">%</span>
                </div>
              </div>

              <div className="flex justify-between text-xs text-gray-600">
                <span>{sliderMin}%</span>
                <span>{sliderMax}%</span>
              </div>
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

            {/* DTI Range — dual-thumb gradient slider */}
            <div className="space-y-2 sm:col-span-2 lg:col-span-3">
              <Label>DTI Target Range</Label>
              <DtiSlider
                instanceId={scenarioId ?? "base"}
                value={loanParams.maxDtiPercent}
                onChange={(val) => update("maxDtiPercent", String(val))}
              />
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
