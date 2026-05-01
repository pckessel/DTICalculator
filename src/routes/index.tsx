import { createFileRoute } from "@tanstack/react-router";
import { LoanParamsPanel } from "../components/LoanParamsPanel";
import { IncomeSection } from "../components/IncomeSection";
import { DebtsSection } from "../components/DebtsSection";
import { InvestmentPropertiesSection } from "../components/InvestmentPropertiesSection";
import { BorrowingPowerSummary } from "../components/BorrowingPowerSummary";

export const Route = createFileRoute("/")({
  component: Dashboard,
});

function Dashboard() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-100">Dashboard</h1>
        <p className="text-sm text-gray-500">Your baseline financial profile</p>
      </div>

      <LoanParamsPanel />
      <IncomeSection />
      <DebtsSection />
      <InvestmentPropertiesSection />
      <BorrowingPowerSummary />
    </div>
  );
}
