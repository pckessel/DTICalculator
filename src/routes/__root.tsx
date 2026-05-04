import { useState, useEffect } from "react";
import { createRootRoute, Link, Outlet } from "@tanstack/react-router";
import { CircleHelp, X } from "lucide-react";

export const Route = createRootRoute({ component: RootLayout });

function RootLayout() {
  const [helpOpen, setHelpOpen] = useState(false);

  useEffect(() => {
    if (!helpOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setHelpOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [helpOpen]);

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-gray-100">
      <nav className="border-b border-gray-800 px-4 py-3 flex items-center gap-6">
        <span className="font-bold text-lg text-purple-400 font-mono">DTI Calculator</span>
        <Link
          to="/"
          className="text-sm text-gray-400 hover:text-white"
          activeProps={{ className: "text-white" }}
        >
          Dashboard
        </Link>
        <Link
          to="/scenarios"
          className="text-sm text-gray-400 hover:text-white"
          activeProps={{ className: "text-white" }}
        >
          Scenarios
        </Link>

        {/* Right-aligned help button */}
        <button
          type="button"
          onClick={() => setHelpOpen(true)}
          className="ml-auto text-gray-600 hover:text-purple-400 transition-colors"
          aria-label="How this works"
        >
          <CircleHelp size={18} />
        </button>
      </nav>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <Outlet />
      </main>

      {/* Info modal */}
      {helpOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={() => setHelpOpen(false)}
        >
          <div
            className="relative w-full max-w-lg rounded-xl border border-purple-900/60 bg-[#1a1a1a] p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setHelpOpen(false)}
              className="absolute right-4 top-4 text-gray-600 hover:text-gray-300 transition-colors"
              aria-label="Close"
            >
              <X size={16} />
            </button>

            <h2 className="mb-4 text-lg font-bold text-gray-100">What is this?</h2>

            <div className="space-y-3 text-sm text-gray-300 leading-relaxed">
              <p>
                This tool shows you your <strong className="text-white">borrowing power</strong> —
                the maximum mortgage you'd qualify for right now based on your debt-to-income ratio
                (DTI). Set up your baseline once: income, existing debts, loan parameters, and any
                investment properties you already own.
              </p>
              <p>
                Then comes the fun part. Head to{" "}
                <strong className="text-purple-400">Scenarios</strong> and start playing: add a
                rental property, sell one, pay off a loan, model a raise. Every change instantly
                shows you how your DTI shifts and whether your borrowing power goes up or down —
                without ever touching your saved profile. It's a real estate "what-if" machine.
              </p>

              <div className="border-t border-gray-800 pt-3">
                <p className="mb-2 font-semibold text-gray-200">The numbers that matter:</p>
                <ul className="space-y-1.5 text-gray-400">
                  <li>
                    <span className="text-white font-medium">DTI</span> — your total monthly debt
                    payments ÷ monthly income. Most lenders cap this around 43–50%.
                  </li>
                  <li>
                    <span className="text-white font-medium">Borrowing power</span> — the loan you
                    can support while staying under your DTI limit.
                  </li>
                  <li>
                    <span className="text-white font-medium">Available monthly cash</span> — the
                    room left in your budget for a new mortgage payment.
                  </li>
                </ul>
              </div>

              <p className="pt-1 text-xs italic text-gray-600">
                Everything stays in your browser. No account, no server.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
