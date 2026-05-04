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

  if (scenarioId) {
    const scenario = store.scenarios.find((s) => s.id === scenarioId);
    const baseCash = scenario?.cashOnHand;
    const effective = effectiveCashOnHand ?? baseCash ?? 0;
    const hasActivity =
      effectiveCashOnHand !== undefined &&
      baseCash !== undefined &&
      effectiveCashOnHand !== baseCash;

    return (
      <Card className="mb-6">
        <CardContent className="pt-4">
          <div className="space-y-1">
            <Label htmlFor={`cash-on-hand-${scenarioId}`}>Cash on Hand ($)</Label>
            <Input
              id={`cash-on-hand-${scenarioId}`}
              type="number"
              min="0"
              placeholder="e.g. 50000"
              value={baseCash === undefined || baseCash === 0 ? "" : baseCash}
              onChange={(e) => {
                const val = e.target.value;
                if (val === "" || val === "0") {
                  store.setScenarioCashOnHand(scenarioId, undefined);
                } else {
                  const num = parseFloat(val);
                  if (!isNaN(num) && num >= 0) {
                    store.setScenarioCashOnHand(scenarioId, num);
                  }
                }
              }}
            />
            <p className="text-xs text-gray-500">
              Inherited from your baseline — adjust freely for this scenario.
            </p>
            {hasActivity && (
              <p className="text-xs text-gray-400">
                Effective after scenario activity:{" "}
                <span className="font-mono font-semibold text-green-400">
                  {formatCurrency(effective)}
                </span>
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Dashboard (baseline) mode
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
            value={store.cashOnHand === undefined || store.cashOnHand === 0 ? "" : store.cashOnHand}
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
