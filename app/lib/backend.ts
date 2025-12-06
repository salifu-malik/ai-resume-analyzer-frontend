import { create } from "zustand";



export interface BackendUser {
  id: string;
  email: string;
  name?: string;
  coins?: number;
}

export interface LoginPayload { email: string; password: string }
export interface RegisterPayload { name?: string; email: string; password: string; confirm_password?: string }

export interface PaystackInitResponse {
  ok: boolean;
  http_status: number;
  paystack: any; // raw paystack init response as provided by backend
}

export interface VerifyResponse {
  ok: boolean;
  http_status: number;
  paystack: any; // raw paystack verify response
}

const BASE_URL = import.meta.env.VITE_BACKEND_URL as string | undefined;

if (!BASE_URL) {
  // eslint-disable-next-line no-console
  console.warn("BACKEND_URL is not set.");
}

// --- Lightweight auth cache to reduce perceived delay ---
const CACHE_KEY = "auth.cache.v1";
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

const readCache = (): { user: BackendUser; ts: number } | null => {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.user || !parsed?.ts) return null;
    return parsed;
  } catch {
    return null;
  }
};

const writeCache = (user: BackendUser) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CACHE_KEY, JSON.stringify({ user, ts: Date.now() }));
  } catch {}
};

const clearCache = () => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(CACHE_KEY);
  } catch {}
};

const hasFreshCache = (): { fresh: boolean; user: BackendUser | null } => {
  const cached = readCache();
  if (!cached) return { fresh: false, user: null };
  const fresh = Date.now() - cached.ts < CACHE_TTL_MS;
  return { fresh, user: fresh ? cached.user : null };
};

const apiFetch = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const url = `${BASE_URL?.replace(/\/$/, "") ?? ""}/${path.replace(/^\//, "")}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init?.headers || {} as any),
  };
  const res = await fetch(url, {
    ...init,
    headers,
    credentials: "include", // allow cookie-based sessions if backend uses them
  });
  const contentType = res.headers.get("content-type") || "";
  const isJSON = contentType.includes("application/json");
  const body = isJSON ? await res.json() : await res.text();
  if (!res.ok) {
    const msg = (isJSON ? (body?.message || body?.error) : body) || `Request failed (${res.status})`;
    throw new Error(typeof msg === "string" ? msg : JSON.stringify(msg));
  }
  return body as T;
};

// AUTH STORE
interface AuthState {
  isLoading: boolean;
  user: BackendUser | null;
  isAuthenticated: boolean;
  error: string | null;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  fetchMe: () => Promise<void>;
}

// Initialize from cache if available (client-only)
const initialFromCache = hasFreshCache();

export const useAuthStore = create<AuthState>((set, get) => ({
  isLoading: false,
  user: initialFromCache.user,
  isAuthenticated: Boolean(initialFromCache.user),
  error: null,
  async login(payload) {
    set({ isLoading: true, error: null });
    try {
      // Perform login on backend
      await apiFetch<{ ok: boolean; user?: BackendUser }>("login", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      // Immediately revalidate against session to avoid client/server mismatch
      try {
        const me = await apiFetch<{ user: BackendUser }>("/me", { method: "GET" });
        writeCache(me.user);
        set({ user: me.user, isAuthenticated: true, isLoading: false });
      } catch (revalErr: any) {
        clearCache();
        set({ error: revalErr?.message || "Login failed to establish session", isLoading: false, user: null, isAuthenticated: false });
      }
    } catch (e: any) {
      clearCache();
      set({ error: e?.message || "Login failed", isLoading: false, user: null, isAuthenticated: false });
    }
  },
  async register(payload) {
    set({ isLoading: true, error: null });
    try {
      const res = await apiFetch<{ ok: boolean; user: BackendUser }>("register", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      writeCache(res.user);
      set({ user: res.user, isAuthenticated: true, isLoading: false });
    } catch (e: any) {
      clearCache();
      set({ error: e?.message || "Registration failed", isLoading: false, user: null, isAuthenticated: false });
    }
  },
  async logout() {
    // Call backend to destroy server session, then clear client state and cache.
    try {
      await apiFetch<{ ok: boolean }>("logout", { method: "POST" });
    } catch (_) {
      // Even if server call fails, proceed to clear client state
    }
    clearCache();
    set({ user: null, isAuthenticated: false });
  },
  async fetchMe() {
    const cached = hasFreshCache();
    if (cached.fresh && cached.user) {
      // Optimistic: keep current UI responsive; refresh in background
      try {
        const res = await apiFetch<{ user: BackendUser }>("me", { method: "GET" });
        writeCache(res.user);
        set({ user: res.user, isAuthenticated: true, isLoading: false });
      } catch (_) {
        clearCache();
        set({ user: null, isAuthenticated: false, isLoading: false });
      }
      return;
    }

    // No fresh cache → show loading state while checking session
    set({ isLoading: true, error: null });
    try {
      const res = await apiFetch<{ user: BackendUser }>("me", { method: "GET" });
      writeCache(res.user);
      set({ user: res.user, isAuthenticated: true, isLoading: false });
    } catch (_) {
      clearCache();
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },
}));

// WALLET / COINS CLIENT
export const backend = {
  // profile
  async profileGet(): Promise<{ ok: boolean; user: BackendUser }> {
    return apiFetch<{ ok: boolean; user: BackendUser }>("profile", { method: "GET" });
  },
  async profileUpdate(payload: { name?: string | null; current_password?: string | null; new_password?: string | null; confirm_password?: string | null; }): Promise<{ ok: boolean; user: BackendUser }> {
    // Ensure we only send provided fields; nulls allowed for backend semantics
    return apiFetch<{ ok: boolean; user: BackendUser }>("profile", {
      method: "POST",
      body: JSON.stringify(payload ?? {}),
    });
  },

  // password recovery
  async forgotStart(email: string): Promise<{ ok: boolean }> {
    return apiFetch<{ ok: boolean }>("forgot-start", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  },
  async forgotVerify(email: string, code: string): Promise<{ ok: boolean; token: string }> {
    return apiFetch<{ ok: boolean; token: string }>("forgot-verify", {
      method: "POST",
      body: JSON.stringify({ email, code }),
    });
  },
  async forgotReset(email: string, token: string, new_password: string, confirm_password: string): Promise<{ ok: boolean }> {
    return apiFetch<{ ok: boolean }>("forgot-reset", {
      method: "POST",
      body: JSON.stringify({ email, token, new_password, confirm_password }),
    });
  },

  // coins
  async addCoins(amount: number, description?: string): Promise<{ ok: boolean }> {
    return apiFetch<{ ok: boolean }>("add-coins", {
      method: "POST",
      body: JSON.stringify({ amount, description }),
    });
  },
  async spendCoins(amount: number, description?: string): Promise<{ ok: boolean }> {
    return apiFetch<{ ok: boolean }>("spend-coins", {
      method: "POST",
      body: JSON.stringify({ amount, description }),
    });
  },
  // paystack
  async paystackInit(params: { email: string; amount: number; currency?: string; metadata?: Record<string, any>; callback_url?: string; }): Promise<PaystackInitResponse> {
    return apiFetch<PaystackInitResponse>("paystack-init", {
      method: "POST",
      body: JSON.stringify(params),
    });
  },
  async paystackVerify(reference: string): Promise<VerifyResponse> {
    return apiFetch<VerifyResponse>("paystack-verify", {
      method: "POST",
      body: JSON.stringify({ reference }),
    });
  },
};
