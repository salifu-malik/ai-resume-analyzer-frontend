import { Outlet, useLocation, Navigate } from "react-router";
import { usePuterStore } from "~/lib/puter";
import React, { useEffect, useMemo, useState } from "react";

// A simple global auth gate that protects all nested routes.
// If the user is not authenticated, redirect to /auth?next=<currentPathAndQuery>
// While auth state is loading, render a minimal placeholder to avoid layout shift.
export default function ProtectedLayout() {
  const { isLoading, auth } = usePuterStore();
  const location = useLocation();

  // Compute the `next` target as the current path + search
  const next = useMemo(() => {
    const path = location.pathname || "/";
    const q = location.search || "";
    return `${path}${q}`;
  }, [location.pathname, location.search]);

  // Render a very small loading shell while checking auth state
  if (isLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500 text-sm">Checking session…</div>
      </main>
    );
  }

  // Not authenticated → redirect to auth route with `next`
  if (!auth.isAuthenticated) {
    const to = `/auth?next=${encodeURIComponent(next)}`;
    return <Navigate to={to} replace />;
  }

  // Authenticated → allow access to nested routes
  return <Outlet />;
}
