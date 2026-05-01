import { useState } from "react";
import { Trash2, Plus } from "lucide-react";
import { useStore, type InvestmentProperty, type SaleDetails } from "../store/index";
import {
  computePropertyROI,
  computePropertyEffect,
  computeAdjustedMonthlyIncome,
  computeMortgageFactor,
  computeNetProceeds,
  computeEffectiveCashOnHand,
  computeFinancialSummary,
  formatCurrency,
  formatPercent,
} from "../lib/calculations";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card, CardContent, CardHeader } from "./ui/card";

type InvestmentPropertiesSectionProps = {
  scenarioId?: string;
  effectiveCashOnHand?: number;
};

const DEFAULT_SALE_DRAFT: SaleDetails = {
  salePrice: 0,
  realtorFeePercent: 6,
  closingCosts: 10_000,
  remainingMortgageBalance: 0,
};

function SaleFieldsForm({
  draft,
  onChange,
}: {
  draft: SaleDetails;
  onChange: (updated: SaleDetails) => void;
}) {
  function numField(field: keyof SaleDetails, value: string) {
    const num = value === "" ? 0 : parseFloat(value);
    if (!isNaN(num)) onChange({ ...draft, [field]: num });
  }

  const netProceeds = computeNetProceeds(draft);

  return (
    <div className="mt-4 space-y-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label>Sale Price ($)</Label>
          <Input
            type="number"
            min="0"
            placeholder="e.g. 500000"
            value={draft.salePrice === 0 ? "" : draft.salePrice}
            onChange={(e) => numField("salePrice", e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label>Realtor Fee (%)</Label>
          <Input
            type="number"
            min="0"
            max="20"
            step="0.1"
            placeholder="6"
            value={draft.realtorFeePercent === 0 ? "" : draft.realtorFeePercent}
            onChange={(e) => numField("realtorFeePercent", e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label>Closing Costs ($)</Label>
          <Input
            type="number"
            min="0"
            placeholder="10000"
            value={draft.closingCosts === 0 ? "" : draft.closingCosts}
            onChange={(e) => numField("closingCosts", e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label>Remaining Mortgage Balance ($)</Label>
          <Input
            type="number"
            min="0"
            placeholder="e.g. 300000"
            value={draft.remainingMortgageBalance === 0 ? "" : draft.remainingMortgageBalance}
            onChange={(e) => numField("remainingMortgageBalance", e.target.value)}
          />
        </div>
      </div>

      {/* Net proceeds breakdown */}
      <div className="rounded-lg border border-gray-700 bg-gray-900/60 p-3 font-mono text-sm">
        <div className="flex justify-between">
          <span className="text-gray-400">Sale Price:</span>
          <span className="text-gray-200">{formatCurrency(draft.salePrice)}</span>
        </div>
        <div className="flex justify-between text-red-400">
          <span>− Realtor Fee ({draft.realtorFeePercent}%):</span>
          <span>−{formatCurrency(draft.salePrice * (draft.realtorFeePercent / 100))}</span>
        </div>
        <div className="flex justify-between text-red-400">
          <span>− Closing Costs:</span>
          <span>−{formatCurrency(draft.closingCosts)}</span>
        </div>
        <div className="flex justify-between text-red-400">
          <span>− Remaining Mortgage:</span>
          <span>−{formatCurrency(draft.remainingMortgageBalance)}</span>
        </div>
        <div className="mt-2 flex justify-between border-t border-gray-600 pt-2">
          <span
            className={netProceeds >= 0 ? "text-green-400 font-bold" : "text-red-400 font-bold"}
          >
            Net Proceeds:
          </span>
          <span
            className={netProceeds >= 0 ? "text-green-400 font-bold" : "text-red-400 font-bold"}
          >
            {formatCurrency(netProceeds)}
          </span>
        </div>
      </div>
    </div>
  );
}

export function InvestmentPropertiesSection({
  scenarioId,
  effectiveCashOnHand: externalEffectiveCashOnHand,
}: InvestmentPropertiesSectionProps) {
  const store = useStore();

  const [saleEntryPropId, setSaleEntryPropId] = useState<string | null>(null);
  const [saleEntryDraft, setSaleEntryDraft] = useState<SaleDetails>({ ...DEFAULT_SALE_DRAFT });

  const scenario = scenarioId ? store.scenarios.find((s) => s.id === scenarioId) : null;

  const investmentProperties: InvestmentProperty[] = scenario
    ? scenario.investmentProperties
    : store.investmentProperties;
  const incomeSources = scenario ? scenario.incomeSources : store.incomeSources;
  const debtItems = scenario ? scenario.debtItems : store.debtItems;
  const loanParams = scenario ? scenario.loanParams : store.loanParams;

  // Effective cash on hand for cash-to-close indicator
  // In scenario mode: use passed-in effective value; in baseline mode: use raw store cashOnHand
  const effectiveCashOnHand = scenarioId ? externalEffectiveCashOnHand : store.cashOnHand;

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

  function handleSellClick(prop: InvestmentProperty) {
    setSaleEntryPropId(prop.id);
    setSaleEntryDraft({
      salePrice: prop.purchasePrice > 0 ? prop.purchasePrice : 0,
      realtorFeePercent: 6,
      closingCosts: 10_000,
      remainingMortgageBalance: 0,
    });
  }

  function handleConfirmSale(propId: string) {
    if (scenarioId) {
      store.sellScenarioProperty(scenarioId, propId, saleEntryDraft);
    }
    setSaleEntryPropId(null);
  }

  function handleCancelSale() {
    setSaleEntryPropId(null);
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
          const isSold = prop.saleDetails != null;
          const isInSaleEntry = saleEntryPropId === prop.id;

          // SOLD card
          if (isSold && scenarioId) {
            const sd = prop.saleDetails!;
            const netProceeds = computeNetProceeds(sd);
            const snapshotIds = scenario?.snapshotPropertyIds ?? [];

            // Compute cash on hand with this property sold
            const cashAfterSale = computeEffectiveCashOnHand(
              scenario?.cashOnHand,
              investmentProperties,
              snapshotIds,
            );

            // Compute DTI/BP with vs without this sold property
            const summaryWithSold = computeFinancialSummary(
              incomeSources,
              debtItems,
              investmentProperties,
              loanParams,
            );
            // Summary without selling this property (treat it as active)
            const propsWithoutSale = investmentProperties.map((p) =>
              p.id === prop.id ? { ...p, saleDetails: undefined } : p,
            );
            const summaryWithoutSold = computeFinancialSummary(
              incomeSources,
              debtItems,
              propsWithoutSale,
              loanParams,
            );

            const dtiDecrease = summaryWithoutSold.dtiRatio - summaryWithSold.dtiRatio;
            const bpIncrease = summaryWithSold.borrowingPower - summaryWithoutSold.borrowingPower;
            const debtRemoved = prop.mortgagePlusTaxesInsurance;

            return (
              <Card key={prop.id} className="relative border-gray-700/50 bg-gray-900/40">
                <CardHeader>
                  <div className="relative flex items-start justify-between">
                    <p className="text-base font-semibold text-gray-400">
                      {prop.label || "Property"}
                    </p>
                    {/* SOLD rubber stamp */}
                    <div
                      className="absolute right-0 top-0 select-none font-black text-4xl tracking-widest uppercase"
                      style={{
                        color: "#ec4899",
                        transform: "rotate(-6deg)",
                        textShadow: "2px 2px 4px rgba(0,0,0,0.5)",
                        fontFamily: "monospace",
                        opacity: 0.9,
                        lineHeight: 1,
                      }}
                    >
                      SOLD
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  <SaleFieldsForm
                    draft={sd}
                    onChange={(updated) => {
                      if (scenarioId) {
                        store.updateScenarioPropertySaleDetails(scenarioId, prop.id, updated);
                      }
                    }}
                  />

                  {/* Impact section */}
                  <div className="mt-4 space-y-1 rounded-lg border border-gray-700 bg-gray-900/60 p-3 text-sm">
                    <p className="mb-2 text-xs font-medium uppercase tracking-wider text-gray-500">
                      Impact
                    </p>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Net Proceeds:</span>
                      <span className="font-mono text-green-400">
                        +{formatCurrency(netProceeds)} added to Cash on Hand
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Monthly Debt:</span>
                      <span className="font-mono text-green-400">
                        −{formatCurrency(debtRemoved)}/mo (mortgage removed)
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">DTI:</span>
                      <span className="font-mono text-green-400">
                        decreased by {formatPercent(dtiDecrease)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Borrowing Power:</span>
                      <span className="font-mono text-green-400">
                        +{formatCurrency(bpIncrease)}
                      </span>
                    </div>
                    <div className="flex justify-between border-t border-gray-700 pt-1 mt-1">
                      <span className="text-gray-400">Cash on Hand after sale:</span>
                      <span className="font-mono text-green-400">
                        {formatCurrency(cashAfterSale)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          }

          // Normal or sale entry mode
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
                    {effectiveCashOnHand !== undefined &&
                      effectiveCashOnHand > 0 &&
                      prop.cashToClose > 0 && (
                        <p
                          className={`text-xs font-medium ${
                            prop.cashToClose <= effectiveCashOnHand
                              ? "text-green-400"
                              : "text-red-400"
                          }`}
                        >
                          {prop.cashToClose <= effectiveCashOnHand
                            ? `Covered · ${formatCurrency(effectiveCashOnHand - prop.cashToClose)} remaining`
                            : `Short by ${formatCurrency(prop.cashToClose - effectiveCashOnHand)}`}
                        </p>
                      )}
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

                {/* Sale Entry Mode */}
                {isInSaleEntry && scenarioId && (
                  <div className="mt-4 border-t border-yellow-800/50 pt-4">
                    <p className="mb-2 text-sm font-semibold text-yellow-300">Enter Sale Details</p>
                    <SaleFieldsForm draft={saleEntryDraft} onChange={setSaleEntryDraft} />

                    {/* Preview: cash on hand and DTI after this draft sale */}
                    {(() => {
                      const draftProps = investmentProperties.map((p) =>
                        p.id === prop.id ? { ...p, saleDetails: saleEntryDraft } : p,
                      );
                      const snapshotIds = scenario?.snapshotPropertyIds ?? [];
                      const cashAfterDraft = computeEffectiveCashOnHand(
                        scenario?.cashOnHand,
                        draftProps,
                        snapshotIds,
                      );
                      const summaryAfterDraft = computeFinancialSummary(
                        incomeSources,
                        debtItems,
                        draftProps,
                        loanParams,
                      );
                      return (
                        <div className="mt-3 space-y-1 rounded border border-gray-700 bg-gray-900/50 p-2 text-xs text-gray-400">
                          <p>
                            Cash on Hand after this sale:{" "}
                            <span className="font-mono text-green-400">
                              {formatCurrency(cashAfterDraft)}
                            </span>
                          </p>
                          <p>
                            DTI after this sale:{" "}
                            <span className="font-mono text-cyan-400">
                              {formatPercent(summaryAfterDraft.dtiRatio)}
                            </span>
                          </p>
                        </div>
                      );
                    })()}

                    <div className="mt-3 flex gap-2">
                      <Button size="sm" onClick={() => handleConfirmSale(prop.id)}>
                        Confirm Sale
                      </Button>
                      <Button variant="outline" size="sm" onClick={handleCancelSale}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}

                {/* Sell Property button (scenario only, not in sale entry mode) */}
                {scenarioId && !isInSaleEntry && (
                  <div className="mt-4 border-t border-gray-800 pt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-pink-400 border-pink-800 hover:bg-pink-900/20 hover:text-pink-300"
                      onClick={() => handleSellClick(prop)}
                    >
                      Sell Property
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
