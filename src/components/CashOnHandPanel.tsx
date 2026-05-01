import { useStore } from "../store/index";
import { formatCurrency } from "../lib/calculations";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card, CardContent } from "./ui/card";

type CashOnHandPanelProps = {
  scenarioId?: string;
  effectiveCashOnHand?: number;
};

export function CashOnHandPanel({ scenarioId, effectiveCashOnHand }: CashOnHandPanelProps) {
  const store = useStore();

  const rawCashOnHand = store.cashOnHand;

  if (scenarioId) {
    // Scenario mode: read-only display of effective value
    const scenario = store.scenarios.find((s) => s.id === scenarioId);
    const scenarioCash = scenario?.cashOnHand;
    const effective = effectiveCashOnHand ?? scenarioCash ?? 0;
    const showAdjusted =
      effectiveCashOnHand !== undefined &&
      scenarioCash !== undefined &&
      effectiveCashOnHand !== scenarioCash;

    return (
      <Card className="mb-6">
        <CardContent className="pt-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-300">Cash on Hand</p>
              <p className="text-xs text-gray-500">Liquid capital available to close</p>
            </div>
            <div className="text-right">
              {showAdjusted ? (
                <div>
                  <p className="font-mono text-lg font-bold text-green-400">
                    {formatCurrency(effective)}
                  </p>
                  <p className="text-xs text-gray-500">
                    Base: {formatCurrency(scenarioCash ?? 0)} · Adjusted:{" "}
                    {formatCurrency(effective)}
                  </p>
                </div>
              ) : (
                <p className="font-mono text-lg font-bold text-green-400">
                  {formatCurrency(effective)}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Dashboard (baseline) mode: editable input
  return (
    <Card className="mb-6">
      <CardContent className="pt-4">
        <div className="space-y-1">
          <Label htmlFor="cash-on-hand">Cash on Hand ($)</Label>
          <Input
            id="cash-on-hand"
            type="number"
            min="0"
            placeholder="e.g. 50000"
            value={rawCashOnHand === undefined || rawCashOnHand === 0 ? "" : rawCashOnHand}
            onChange={(e) => {
              const val = e.target.value;
              if (val === "" || val === "0") {
                store.setCashOnHand(undefined);
              } else {
                const num = parseFloat(val);
                if (!isNaN(num) && num >= 0) {
                  store.setCashOnHand(num);
                }
              }
            }}
          />
          <p className="text-xs text-gray-500">
            Your liquid capital available to close on a property
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
