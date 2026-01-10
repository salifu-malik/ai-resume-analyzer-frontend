import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  // Public auth page
  route("/auth", "routes/auth.tsx"),
  // Protected layout wrapping all app pages
  route("", "routes/protected.tsx", [
    index("routes/home.tsx"),
    route("/upload", "routes/upload.tsx"),
    route("/resume/:id", "routes/resume.tsx"),
    route("/profile", "routes/profile.tsx"),
      route("/verifySuccess", "routes/verifySuccess.tsx"),
      route("/verifyFailed", "routes/verifyFailed.tsx"),
      route("/verifyExpired", "routes/verifyExpired.tsx"),
    ]),

    // Admin Portal
    route("/admin", "routes/admin/layout.tsx", [
      index("routes/admin/dashboard.tsx"),
      route("transactions", "routes/admin/transactions.tsx"),
        route("sendEmail", "routes/admin/sendEmail.tsx"),
    ]),

  // Super Admin Portal
  route("/super_admin", "routes/super_admin/layout.tsx", [
    index("routes/super_admin/userDashboard.tsx"),
    route("adminDashboard.tsx", "routes/super_admin/adminDashboard.tsx"),
    route("transactions", "routes/super_admin/transactions.tsx"),
  ]),
  ] satisfies RouteConfig;
