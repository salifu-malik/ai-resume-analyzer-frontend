import { Outlet, Navigate } from "react-router";
import { useAuthStore } from "~/lib/backend";
import Navbar from "~/components/Navbar";

export default function AdminLayout() {
  const { user, isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 font-outfit">Admin Portal</h1>
          <p className="text-gray-600 font-outfit">Manage users and monitor transactions</p>
        </div>
        
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar/Nav */}
          <aside className="w-full md:w-64 shrink-0">
            <nav className="space-y-1">
              <a
                href="/admin"
                className="group flex items-center px-3 py-2 text-sm font-medium rounded-md bg-white text-gray-900 border border-gray-200 shadow-sm hover:bg-gray-50 transition-colors"
              >
                <span className="truncate">Users Management</span>
              </a>
              <a
                href="/admin/transactions"
                className="group flex items-center px-3 py-2 text-sm font-medium rounded-md bg-white text-gray-900 border border-gray-200 shadow-sm hover:bg-gray-50 transition-colors"
              >
                <span className="truncate">All Transactions</span>
              </a>
            </nav>
          </aside>

          {/* Content */}
          <div className="flex-1">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
