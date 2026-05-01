import { Trash2, Plus } from "lucide-react";
import { useStore, type InvestmentProperty } from "../store/index";
import {
  computePropertyROI,
  computePropertyEffect,
  computeAdjustedMonthlyIncome,
  computeMortgageFactor,
  formatCurrency,
  formatPercent,
} from "../lib/calculations";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card, CardContent, CardHeader } from "./ui/card";

type InvestmentPropertiesSectionProps = {
  scenarioId?: string;
};

export function InvestmentPropertiesSection({ scenarioId }: InvestmentPropertiesSectionProps) {
  const store = useStore();

  const scenario = scenarioId ? store.scenarios.find((s) => s.id === scenarioId) : null;

  const investmentProperties: InvestmentProperty[] = scenario
    ? scenario.investmentProperties
    : store.investmentProperties;
  const incomeSources = scenario ? scenario.incomeSources : store.incomeSources;
  const loanParams = scenario ? scenario.loanParams : store.loanParams;

  const adjustedIncome = computeAdjustedMonthlyIncome(incomeSources, investmentProperties);
  const mortgageFactor = computeMortgageFactor(loanParams.aprPercent, loanParams.loanTermYears);

  function addProperty() {
    if (scenarioId) {
      store.addScenarioProperty(scenarioId);
    } else {
      store.addInvestmentProperty();
    }
  }

  function updateProperty(id: string, updates: Partial<InvestmentProperty>) {
    if (scenarioId) {
      store.updateScenarioProperty(scenarioId, id, updates);
    } else {
      store.updateInvestmentProperty(id, updates);
    }
  }

  function removeProperty(id: string) {
    if (scenarioId) {
      store.removeScenarioProperty(scenarioId, id);
    } else {
      store.removeInvestmentProperty(id);
    }
  }

  function numInput(
    prop: InvestmentProperty,
    field: keyof InvestmentProperty,
    value: string,
    scale = 1,
  ) {
    const num = value === "" ? 0 : parseFloat(value) / scale;
    if (!isNaN(num)) updateProperty(prop.id, { [field]: num });
  }

  return (
    <section className="mb-8">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-200">Investment Properties</h2>
        <Button variant="outline" size="sm" onClick={addProperty}>
          <Plus size={14} />
          Add Property
        </Button>
      </div>

      <div className="space-y-4">
        {investmentProperties.map((prop) => {
          const roi = computePropertyROI(prop);
          const effect = computePropertyEffect(
            prop,
            adjustedIncome,
            mortgageFactor,
            loanParams.taxesInsuranceRate,
          );

          const cashToClosePlaceholder =
            prop.purchasePrice > 0
              ? String(Math.round(prop.purchasePrice * 0.2 + 10000))
              : "e.g. 60000";
          const expensesPlaceholder =
            prop.revenuePerMonth > 0 ? String(Math.round(prop.revenuePerMonth * 0.3)) : "e.g. 700";

          return (
            <Card key={prop.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <Input
                      placeholder="Property name"
                      value={prop.label}
                      onChange={(e) => updateProperty(prop.id, { label: e.target.value })}
                      className="text-base font-semibold bg-transparent border-0 border-b border-gray-700 rounded-none px-0 focus-visible:ring-0 focus-visible:border-purple-500"
                    />
                  </div>
                  <button
                    className="ml-2 text-gray-600 hover:text-red-400 transition-colors"
                    onClick={() => removeProperty(prop.id)}
                    type="button"
                    aria-label="Remove property"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </CardHeader>

              <CardContent>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label>Purchase Price ($)</Label>
                    <Input
                      type="number"
                      min="0"
                      placeholder="e.g. 300000"
                      value={prop.purchasePrice === 0 ? "" : prop.purchasePrice}
                      onChange={(e) => numInput(prop, "purchasePrice", e.target.value)}
                    />
                  </div>

                  <div className="space-y-1">
                    <Label>Cash to Close ($)</Label>
                    <Input
                      type="number"
                      min="0"
                      placeholder={cashToClosePlaceholder}
                      value={prop.cashToClose === 0 ? "" : prop.cashToClose}
                      onChange={(e) => numInput(prop, "cashToClose", e.target.value)}
                    />
                    <p className="text-xs text-gray-500">Typically 20% down + ~$10k closing</p>
                  </div>

                  <div className="space-y-1">
                    <Label>Revenue / Month ($)</Label>
                    <Input
                      type="number"
                      min="0"
                      placeholder="e.g. 2000"
                      value={prop.revenuePerMonth === 0 ? "" : prop.revenuePerMonth}
                      onChange={(e) => numInput(prop, "revenuePerMonth", e.target.value)}
                    />
                  </div>

                  <div className="space-y-1">
                    <Label>Mortgage + Taxes + Insurance (PITI) / Month ($)</Label>
                    <Input
                      type="number"
                      min="0"
                      placeholder="e.g. 1500"
                      value={
                        prop.mortgagePlusTaxesInsurance === 0 ? "" : prop.mortgagePlusTaxesInsurance
                      }
                      onChange={(e) => numInput(prop, "mortgagePlusTaxesInsurance", e.target.value)}
                    />
                  </div>

                  <div className="space-y-1">
                    <Label>Monthly Expenses ($)</Label>
                    <Input
                      type="number"
                      min="0"
                      placeholder={expensesPlaceholder}
                      value={prop.monthlyExpenses === 0 ? "" : prop.monthlyExpenses}
                      onChange={(e) => numInput(prop, "monthlyExpenses", e.target.value)}
                    />
                    <p className="text-xs text-gray-500">Rule of thumb: ~30% of monthly revenue</p>
                  </div>

                  <div className="space-y-1">
                    <Label>
                      Bank Rental Income % ({Math.round(prop.revenueCountedByBank * 100)}%)
                    </Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      step="1"
                      placeholder="75"
                      value={Math.round(prop.revenueCountedByBank * 100)}
                      onChange={(e) => numInput(prop, "revenueCountedByBank", e.target.value, 100)}
                    />
                    <p className="text-xs text-gray-500">
                      Most lenders count 70–75% of rental income.
                    </p>
                  </div>
                </div>

                {/* Calculated outputs */}
                <div className="mt-4 border-t border-gray-800 pt-3">
                  <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">
                    <div>
                      <p className="text-xs text-gray-500">Monthly Cash Flow</p>
                      <p
                        className={`font-mono font-semibold ${roi.monthlyCashFlow >= 0 ? "text-green-400" : "text-red-400"}`}
                      >
                        {formatCurrency(roi.monthlyCashFlow)}/mo
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Annual Cash Flow</p>
                      <p
                        className={`font-mono font-semibold ${roi.annualCashFlow >= 0 ? "text-green-400" : "text-red-400"}`}
                      >
                        {formatCurrency(roi.annualCashFlow)}/yr
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Cash-on-Cash Return</p>
                      <p
                        className={`font-mono font-semibold ${roi.cashOnCashReturn >= 0 ? "text-green-400" : "text-red-400"}`}
                      >
                        {formatPercent(roi.cashOnCashReturn, 1)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">DTI Effect</p>
                      <p
                        className={`font-mono text-xs font-semibold ${effect.dtiDelta <= 0 ? "text-green-400" : "text-red-400"}`}
                      >
                        {effect.dtiDelta > 0 ? "+" : ""}
                        {formatPercent(effect.dtiDelta)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Borrowing Power Effect</p>
                      <p
                        className={`font-mono text-xs font-semibold ${effect.borrowingPowerDelta >= 0 ? "text-green-400" : "text-red-400"}`}
                      >
                        {formatCurrency(effect.borrowingPowerDelta)}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
