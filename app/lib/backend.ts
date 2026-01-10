
import { create } from "zustand";
// console.log("VITE_BACKEND_URL =", import.meta.env.VITE_BACKEND_URL);

export interface BackendUser {
  id: string;
  email: string;
  name?: string;
  coins?: number;
  role?: "user" | "admin" | "super_admin";
  is_blocked?: boolean;
  is_verify?: boolean;
}

export interface Transaction {
  id: string;
  user_id: string;
  amount: number;
  type: "credit" | "debit";
  description: string;
  phone: string | null;
  receipt_number: string | null;
  paystack_status: string | null;
  channel: string | null;
  created_at: string;
  user?: {
    name: string;
    email: string;
  };
}

export interface AdminSendEmailPayload {
  to: string;
  subject: string;
  message: string;
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

const ERROR_MESSAGES: Record<string, string> = {
  account_blocked_permanently: "Your account has been permanently blocked. Please contact support.",
  invalid_credentials: "Incorrect email or password",
  unauthorized: "You are not authorized to perform this action",
  account_not_verified: " Your account is not verified, Kindly click on the link sent to your mail to verify your account.",
  method_not_allowed: "You are not allowed to perform this action",
  logged_out: "You were logged out because your account was used on another device.",
  account_temporarily_blocked: "Your account is blocked temporarily. Please try again after  the required minutes.",
  account_temporarily_blocked1: "Your account has been blocked temporarily. Please try again after 10 minutes.",
 account_temporarily_blocked2: "Your account has been temporarily blocked. Please try again after 30 minutes." ,

};


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

// const CLIENT_KEY = import.meta.env.VITE_CLIENT_KEY;
const apiFetch = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const url = `${BASE_URL?.replace(/\/$/, "") ?? ""}/${path.replace(/^\//, "")}`;
  // console.log("API FETCH URL =", url);
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    // "X-CLIENT-KEY": CLIENT_KEY || "",

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
    // const msg = (isJSON ? (body?.message || body?.error) : body) || `Request failed (${res.status})`;
    // throw new Error(typeof msg === "string" ? msg : JSON.stringify(msg));
    const raw =
        (isJSON ? (body?.error || body?.message) : body) ||
        `Request failed (${res.status})`;

    const friendly =
        typeof raw === "string" && ERROR_MESSAGES[raw]
            ? ERROR_MESSAGES[raw]
            : raw;

    throw new Error(
        typeof friendly === "string" ? friendly : JSON.stringify(friendly)
    );

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

  // admin
  async adminGetUsers(query?: string): Promise<{ ok: boolean; users: BackendUser[] }> {
    const q = query ? `?q=${encodeURIComponent(query)}` : "";
    return apiFetch<{ ok: boolean; users: BackendUser[] }>(`/admin/users${q}`, { method: "GET" });
  },
  async adminGetTransactions(query?: string): Promise<{ ok: boolean; transactions: Transaction[] }> {
    const q = query ? `?q=${encodeURIComponent(query)}` : "";
    return apiFetch<{ ok: boolean; transactions: Transaction[] }>(
        `/admin/transactions${q}`,
        { method: "GET" }
    );
  },
  async adminSendEmail(
      payload: AdminSendEmailPayload
  ): Promise<{ ok: boolean }> {
    return apiFetch<{ ok: boolean }>(`/admin/send-email`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async adminBlockUser(userId: string, block: boolean): Promise<{ ok: boolean }> {
    return apiFetch<{ ok: boolean }>(`/admin/users/${userId}/block`, {
      method: "POST",
      body: JSON.stringify({ block }),
    });
  },
  async adminDeleteUser(userId: string): Promise<{ ok: boolean }> {
    return apiFetch<{ ok: boolean }>(`/admin/users/${userId}`, { method: "DELETE" });
  },



// Super admin
async superAdminGetUsers(query?: string): Promise<{ ok: boolean; users: BackendUser[] }> {
  const q = query ? `?q=${encodeURIComponent(query)}` : "";
  return apiFetch<{ ok: boolean; users: BackendUser[] }>(`/super_admin/users${q}`, { method: "GET" });
},
    async superAdminGetTransactions(query?: string): Promise<{ ok: boolean; transactions: Transaction[] }> {
  const q = query ? `?q=${encodeURIComponent(query)}` : "";
  return apiFetch<{ ok: boolean; transactions: Transaction[] }>(
      `/super_admin/transactions${q}`,
      { method: "GET" }
  );
},


    async superAdminBlockUser(userId: string, block: boolean): Promise<{ ok: boolean }> {
  return apiFetch<{ ok: boolean }>(`/super_admin/users/${userId}/block`, {
    method: "POST",
    body: JSON.stringify({ block }),
  });
},
    async superAdminDeleteUser(userId: string): Promise<{ ok: boolean }> {
  return apiFetch<{ ok: boolean }>(`/super_admin/users/${userId}`, { method: "DELETE" });
},
};