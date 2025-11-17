import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  // Public auth page
  route("/auth", "routes/auth.tsx"),
  // Protected layout wrapping all app pages
  route("", "routes/protected.tsx", [
    index("routes/home.tsx"),
    route("/upload", "routes/upload.tsx"),
    route("/resume/:id", "routes/resume.tsx"),
  ]),
] satisfies RouteConfig;
