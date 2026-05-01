import { createRootRoute, Link, Outlet } from "@tanstack/react-router";

export const Route = createRootRoute({
  component: () => (
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
      </nav>
      <main className="max-w-5xl mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  ),
});
