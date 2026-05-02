import { create } from "zustand";
import { persist } from "zustand/middleware";

// Types
export type IncomeSource = {
  id: string;
  label: string;
  annualAmount: number;
};

export type DebtItem = {
  id: string;
  label: string;
  monthlyPayment: number;
};

export type SaleDetails = {
  salePrice: number;
  realtorFeePercent: number; // default 6
  closingCosts: number; // default 10_000
  remainingMortgageBalance: number;
};

export type InvestmentProperty = {
  id: string;
  label: string;
  purchasePrice: number;
  cashToClose: number;
  revenuePerMonth: number;
  mortgagePlusTaxesInsurance: number;
  monthlyExpenses: number;
  revenueCountedByBank: number;
  saleDetails?: SaleDetails;
};

export type LoanParams = {
  aprPercent: number;
  loanTermYears: number;
  maxDtiPercent: number;
  taxesInsuranceRate: number;
};

export type Scenario = {
  id: string;
  name: string;
  createdAt: string;
  incomeSources: IncomeSource[];
  debtItems: DebtItem[];
  investmentProperties: InvestmentProperty[];
  loanParams: LoanParams;
  cashOnHand?: number;
  snapshotPropertyIds?: string[];
};

const DEFAULT_LOAN_PARAMS: LoanParams = {
  aprPercent: 7.0,
  loanTermYears: 30,
  maxDtiPercent: 40,
  taxesInsuranceRate: 2.0,
};

type AppState = {
  // Baseline
  incomeSources: IncomeSource[];
  debtItems: DebtItem[];
  investmentProperties: InvestmentProperty[];
  loanParams: LoanParams;
  cashOnHand?: number;

  // Scenarios
  scenarios: Scenario[];
  activeScenarioId: string | null;

  // Baseline actions
  addIncomeSource: () => void;
  updateIncomeSource: (id: string, updates: Partial<IncomeSource>) => void;
  removeIncomeSource: (id: string) => void;

  addDebtItem: () => void;
  updateDebtItem: (id: string, updates: Partial<DebtItem>) => void;
  removeDebtItem: (id: string) => void;

  addInvestmentProperty: () => void;
  updateInvestmentProperty: (id: string, updates: Partial<InvestmentProperty>) => void;
  removeInvestmentProperty: (id: string) => void;

  updateLoanParams: (updates: Partial<LoanParams>) => void;

  setCashOnHand: (amount: number | undefined) => void;

  // Scenario actions
  createScenario: (name: string) => void;
  updateScenario: (id: string, updates: Partial<Scenario>) => void;
  deleteScenario: (id: string) => void;
  setActiveScenario: (id: string | null) => void;

  // Scenario sub-item actions
  addScenarioIncomeSource: (scenarioId: string) => void;
  updateScenarioIncomeSource: (
    scenarioId: string,
    sourceId: string,
    updates: Partial<IncomeSource>,
  ) => void;
  removeScenarioIncomeSource: (scenarioId: string, sourceId: string) => void;

  addScenarioDebtItem: (scenarioId: string) => void;
  updateScenarioDebtItem: (scenarioId: string, debtId: string, updates: Partial<DebtItem>) => void;
  removeScenarioDebtItem: (scenarioId: string, debtId: string) => void;

  addScenarioProperty: (scenarioId: string) => void;
  updateScenarioProperty: (
    scenarioId: string,
    propId: string,
    updates: Partial<InvestmentProperty>,
  ) => void;
  removeScenarioProperty: (scenarioId: string, propId: string) => void;

  updateScenarioLoanParams: (scenarioId: string, updates: Partial<LoanParams>) => void;

  sellScenarioProperty: (scenarioId: string, propertyId: string, saleDetails: SaleDetails) => void;
  updateScenarioPropertySaleDetails: (
    scenarioId: string,
    propertyId: string,
    saleDetails: SaleDetails,
  ) => void;
  unsellScenarioProperty: (scenarioId: string, propertyId: string) => void;
};

function newIncomeSource(): IncomeSource {
  return { id: crypto.randomUUID(), label: "", annualAmount: 0 };
}

function newDebtItem(): DebtItem {
  return { id: crypto.randomUUID(), label: "", monthlyPayment: 0 };
}

function newInvestmentProperty(): InvestmentProperty {
  return {
    id: crypto.randomUUID(),
    label: "",
    purchasePrice: 0,
    cashToClose: 0,
    revenuePerMonth: 0,
    mortgagePlusTaxesInsurance: 0,
    monthlyExpenses: 0,
    revenueCountedByBank: 0.75,
  };
}

function updateScenarioById(
  scenarios: Scenario[],
  id: string,
  updater: (s: Scenario) => Scenario,
): Scenario[] {
  return scenarios.map((s) => (s.id === id ? updater(s) : s));
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      incomeSources: [],
      debtItems: [],
      investmentProperties: [],
      loanParams: { ...DEFAULT_LOAN_PARAMS },
      cashOnHand: undefined,
      scenarios: [],
      activeScenarioId: null,

      // Baseline income actions
      addIncomeSource: () =>
        set((state) => ({
          incomeSources: [...state.incomeSources, newIncomeSource()],
        })),
      updateIncomeSource: (id, updates) =>
        set((state) => ({
          incomeSources: state.incomeSources.map((s) => (s.id === id ? { ...s, ...updates } : s)),
        })),
      removeIncomeSource: (id) =>
        set((state) => ({
          incomeSources: state.incomeSources.filter((s) => s.id !== id),
        })),

      // Baseline debt actions
      addDebtItem: () =>
        set((state) => ({
          debtItems: [...state.debtItems, newDebtItem()],
        })),
      updateDebtItem: (id, updates) =>
        set((state) => ({
          debtItems: state.debtItems.map((d) => (d.id === id ? { ...d, ...updates } : d)),
        })),
      removeDebtItem: (id) =>
        set((state) => ({
          debtItems: state.debtItems.filter((d) => d.id !== id),
        })),

      // Baseline property actions
      addInvestmentProperty: () =>
        set((state) => ({
          investmentProperties: [...state.investmentProperties, newInvestmentProperty()],
        })),
      updateInvestmentProperty: (id, updates) =>
        set((state) => ({
          investmentProperties: state.investmentProperties.map((p) =>
            p.id === id ? { ...p, ...updates } : p,
          ),
        })),
      removeInvestmentProperty: (id) =>
        set((state) => ({
          investmentProperties: state.investmentProperties.filter((p) => p.id !== id),
        })),

      updateLoanParams: (updates) =>
        set((state) => ({
          loanParams: { ...state.loanParams, ...updates },
        })),

      setCashOnHand: (amount) => set({ cashOnHand: amount }),

      // Scenario actions
      createScenario: (name) => {
        const state = get();
        const scenario: Scenario = {
          id: crypto.randomUUID(),
          name,
          createdAt: new Date().toISOString(),
          incomeSources: state.incomeSources.map((s) => ({ ...s })),
          debtItems: state.debtItems.map((d) => ({ ...d })),
          investmentProperties: state.investmentProperties.map((p) => ({
            ...p,
          })),
          loanParams: { ...state.loanParams },
          cashOnHand: state.cashOnHand,
          snapshotPropertyIds: state.investmentProperties.map((p) => p.id),
        };
        set((s) => ({
          scenarios: [...s.scenarios, scenario],
          activeScenarioId: scenario.id,
        }));
      },

      updateScenario: (id, updates) =>
        set((state) => ({
          scenarios: updateScenarioById(state.scenarios, id, (s) => ({
            ...s,
            ...updates,
          })),
        })),

      deleteScenario: (id) =>
        set((state) => ({
          scenarios: state.scenarios.filter((s) => s.id !== id),
          activeScenarioId: state.activeScenarioId === id ? null : state.activeScenarioId,
        })),

      setActiveScenario: (id) => set({ activeScenarioId: id }),

      // Scenario income actions
      addScenarioIncomeSource: (scenarioId) =>
        set((state) => ({
          scenarios: updateScenarioById(state.scenarios, scenarioId, (s) => ({
            ...s,
            incomeSources: [...s.incomeSources, newIncomeSource()],
          })),
        })),
      updateScenarioIncomeSource: (scenarioId, sourceId, updates) =>
        set((state) => ({
          scenarios: updateScenarioById(state.scenarios, scenarioId, (s) => ({
            ...s,
            incomeSources: s.incomeSources.map((inc) =>
              inc.id === sourceId ? { ...inc, ...updates } : inc,
            ),
          })),
        })),
      removeScenarioIncomeSource: (scenarioId, sourceId) =>
        set((state) => ({
          scenarios: updateScenarioById(state.scenarios, scenarioId, (s) => ({
            ...s,
            incomeSources: s.incomeSources.filter((inc) => inc.id !== sourceId),
          })),
        })),

      // Scenario debt actions
      addScenarioDebtItem: (scenarioId) =>
        set((state) => ({
          scenarios: updateScenarioById(state.scenarios, scenarioId, (s) => ({
            ...s,
            debtItems: [...s.debtItems, newDebtItem()],
          })),
        })),
      updateScenarioDebtItem: (scenarioId, debtId, updates) =>
        set((state) => ({
          scenarios: updateScenarioById(state.scenarios, scenarioId, (s) => ({
            ...s,
            debtItems: s.debtItems.map((d) => (d.id === debtId ? { ...d, ...updates } : d)),
          })),
        })),
      removeScenarioDebtItem: (scenarioId, debtId) =>
        set((state) => ({
          scenarios: updateScenarioById(state.scenarios, scenarioId, (s) => ({
            ...s,
            debtItems: s.debtItems.filter((d) => d.id !== debtId),
          })),
        })),

      // Scenario property actions
      addScenarioProperty: (scenarioId) =>
        set((state) => ({
          scenarios: updateScenarioById(state.scenarios, scenarioId, (s) => ({
            ...s,
            investmentProperties: [...s.investmentProperties, newInvestmentProperty()],
          })),
        })),
      updateScenarioProperty: (scenarioId, propId, updates) =>
        set((state) => ({
          scenarios: updateScenarioById(state.scenarios, scenarioId, (s) => ({
            ...s,
            investmentProperties: s.investmentProperties.map((p) =>
              p.id === propId ? { ...p, ...updates } : p,
            ),
          })),
        })),
      removeScenarioProperty: (scenarioId, propId) =>
        set((state) => ({
          scenarios: updateScenarioById(state.scenarios, scenarioId, (s) => ({
            ...s,
            investmentProperties: s.investmentProperties.filter((p) => p.id !== propId),
          })),
        })),

      updateScenarioLoanParams: (scenarioId, updates) =>
        set((state) => ({
          scenarios: updateScenarioById(state.scenarios, scenarioId, (s) => ({
            ...s,
            loanParams: { ...s.loanParams, ...updates },
          })),
        })),

      sellScenarioProperty: (scenarioId, propertyId, saleDetails) =>
        set((state) => ({
          scenarios: updateScenarioById(state.scenarios, scenarioId, (s) => ({
            ...s,
            investmentProperties: s.investmentProperties.map((p) =>
              p.id === propertyId ? { ...p, saleDetails } : p,
            ),
          })),
        })),

      updateScenarioPropertySaleDetails: (scenarioId, propertyId, saleDetails) =>
        set((state) => ({
          scenarios: updateScenarioById(state.scenarios, scenarioId, (s) => ({
            ...s,
            investmentProperties: s.investmentProperties.map((p) =>
              p.id === propertyId ? { ...p, saleDetails } : p,
            ),
          })),
        })),

      unsellScenarioProperty: (scenarioId, propertyId) =>
        set((state) => ({
          scenarios: updateScenarioById(state.scenarios, scenarioId, (s) => ({
            ...s,
            investmentProperties: s.investmentProperties.map((p) => {
              if (p.id !== propertyId) return p;
              const { saleDetails: _removed, ...rest } = p;
              void _removed;
              return rest;
            }),
          })),
        })),
    }),
    {
      name: "dti-calculator",
    },
  ),
);
