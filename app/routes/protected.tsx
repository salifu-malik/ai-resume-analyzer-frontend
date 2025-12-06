import { Outlet, useLocation, Navigate } from "react-router";
import React, { useEffect, useMemo, useState } from "react";
import { useAuthStore } from "~/lib/backend";

// A simple global auth gate that protects all nested routes.
// If the user is not authenticated, redirect to /auth?next=<currentPathAndQuery>
// While auth state is loading, render a minimal placeholder to avoid layout shift.
export default function ProtectedLayout() {
  const { isLoading, isAuthenticated, fetchMe } = useAuthStore();
  const location = useLocation();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchMe().catch(() => {});
  }, [fetchMe]);

  // Compute the `next` target as the current path + search
  const next = useMemo(() => {
    const path = location.pathname || "/";
    const q = location.search || "";
    return `${path}${q}`;
  }, [location.pathname, location.search]);

  // During SSR (not mounted) or while loading, render placeholder to avoid StaticRouter <Navigate> on first render
  if (!mounted || isLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-500 text-sm">
          <span className="inline-block h-4 w-4 rounded-full border-2 border-gray-300 border-t-gray-500 animate-spin" aria-hidden="true" />
          <span className="sr-only">Checking session…</span>
        </div>
      </main>
    );
  }

  // Not authenticated → redirect to auth route with `next`
  if (!isAuthenticated) {
    const to = `/auth?next=${encodeURIComponent(next)}`;
    return <Navigate to={to} replace />;
  }

  // Authenticated → allow access to nested routes
  return <Outlet />;
}
