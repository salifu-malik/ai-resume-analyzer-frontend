import type { Route } from "./+types/home";
import Navbar from "~/components/Navbar";
import { resumes } from "~/constants";
import ResumeCard from "~/components/ResumeCard";
import { usePuterStore } from "~/lib/puter";
import { useNavigate } from "react-router";
import { useEffect, useMemo, useState } from "react";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Resucheck" },
    { name: "description", content: "Brilliant response for your dream job" },
  ];
}

// Paystack inline script url
const PAYSTACK_JS = "https://js.paystack.co/v1/inline.js";

export default function Home() {
  const { auth, kv } = usePuterStore();
  const navigate = useNavigate();

  const [coins, setCoins] = useState<number>(0);
  const [loadingCoins, setLoadingCoins] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const isValidEmail = (val: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.toLowerCase());
  const paystackPublicKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY ?? "pk_test_c17ec87aa11d9458ca8c5331f80fa3880d8845f1";

  const userId = auth.user?.uuid;

  useEffect(() => {
    if (!auth.isAuthenticated) navigate("/auth?next=/");
  }, [auth.isAuthenticated]);

  // Load current coin balance
  useEffect(() => {
    const loadCoins = async () => {
      if (!userId) return;
      setLoadingCoins(true);
      try {
        const raw = await kv.get(`coins:${userId}`);
        const val = raw ? Number(raw) : 0;
        setCoins(Number.isFinite(val) ? val : 0);
      } catch (e) {
        setError("Failed to load balance");
      } finally {
        setLoadingCoins(false);
      }
    };
    loadCoins();
  }, [userId]);

  // Dynamically load a Paystack script when needed
  const ensurePaystackScript = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (typeof window !== "undefined" && (window as any).PaystackPop) {
        resolve();
        return;
      }
      const existing = document.querySelector(`script[src="${PAYSTACK_JS}"]`);
      if (existing) {
        existing.addEventListener("load", () => resolve());
        existing.addEventListener("error", () => reject(new Error("Failed to load Paystack")));
        return;
      }
      const s = document.createElement("script");
      s.src = PAYSTACK_JS;
      s.async = true;
      s.onload = () => resolve();
      s.onerror = () => reject(new Error("Failed to load Paystack"));
      document.body.appendChild(s);
    });
  };

  const refreshBalance = async () => {
    if (!userId) return;
    const raw = await kv.get(`coins:${userId}`);
    const val = raw ? Number(raw) : 0;
    setCoins(Number.isFinite(val) ? val : 0);
  };

  const creditOneCoin = async () => {
    if (!userId) return;
    const raw = await kv.get(`coins:${userId}`);
    const current = raw ? Number(raw) : 0;
    const next = (Number.isFinite(current) ? current : 0) + 1;
    await kv.set(`coins:${userId}`, String(next));
    setCoins(next);
  };

  const handleBuyCoin = async () => {
    try {
      setError("");
      if (!userId) {
        setError("You must be signed in");
        return;
      }
      if (!paystackPublicKey) {
        setError("Missing Paystack public key (VITE_PAYSTACK_PUBLIC_KEY)");
        return;
      }
      if (!email || !isValidEmail(email)) {
        setError("Please enter a valid email address to proceed with payment");
        return;
      }
      await ensurePaystackScript();
      const PaystackPop = (window as any).PaystackPop;
      const handler = PaystackPop.setup({
        key: paystackPublicKey,
        email,
        amount: 500 /* 5 GHS in pesewas */,
        currency: "GHS",
        callback: function (response: any) {
          // Optionally verify transaction on your backend here.
          creditOneCoin().catch(() => {
            setError("Payment succeeded but failed to credit coins. Contact support.");
          });
        },
        onClose: function () {
          // User closed payment modal
        },
        metadata: {
          custom_fields: [
            { display_name: "User ID", variable_name: "user_id", value: userId },
            { display_name: "Plan", variable_name: "plan", value: "Resume Review (1 coin)" },
          ],
        },
        label: "Resucheck",
      });
      handler.openIframe();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to initialize payment");
    }
  };

  return (
    <main className="bg-[url(images/bg-main.svg)] bg-cover">
      <Navbar />

      <section className="main-section">
        <div className="page-heading py-16 flex flex-col items-start">
          <h1>Track Your Applications & Resume Ratings</h1>
          <h2> Review submissions and check AI-powered feedback.</h2>

          {/* Wallet card */}
          <div className="mt-8 w-full md:max-w-lg md:self-end">
            <div className="rounded-2xl bg-gradient-to-br from-amber-50 to-white border border-amber-200 shadow-xl shadow-amber-100 p-6 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-amber-100 flex items-center justify-center text-2xl">🪙</div>
                  <div>
                    <p className="text-lg font-semibold text-amber-800">Wallet</p>
                    <p className="text-xs text-amber-600/80">Pay GH₵5 to get 1 coin</p>
                  </div>
                </div>
                <div className="px-3 py-1.5 rounded-full bg-amber-100 text-amber-800 text-sm font-semibold border border-amber-200">
                  {loadingCoins ? "--" : `${coins} coin${coins === 1 ? '' : 's'}`}
                </div>
              </div>

              <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-amber-800/80 mb-1" htmlFor="wallet-email">Email</label>
                  <input
                    id="wallet-email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full border border-amber-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-200/60 outline-none rounded-lg px-3 py-2 bg-white"
                  />
                  <p className="mt-1 text-[11px] text-amber-700/70">We’ll use this with Paystack for your receipt.</p>
                </div>
                <div className="md:w-auto">
                  <button onClick={handleBuyCoin} className="primary-button w-full md:w-auto">
                    Buy 1 coin (GH₵5)
                  </button>
                  <p className="mt-2 text-[11px] text-gray-500 text-center md:text-left">Each upload & review costs 1 coin.</p>
                </div>
              </div>

              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 text-red-700 text-sm px-3 py-2">
                  {error}
                </div>
              )}
            </div>
          </div>
        </div>

        {resumes.length > 0 && (
          <div className="resumes-section">
            {resumes.map((resume) => (
              <ResumeCard key={resume.id} resume={resume} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
