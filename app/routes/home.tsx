import type { Route } from "./+types/home";
import Navbar from "~/components/Navbar";
import { resumes } from "~/constants";
import ResumeCard from "~/components/ResumeCard";
import { useLocation, useNavigate } from "react-router";
import { useEffect, useState } from "react";
import { backend, useAuthStore } from "~/lib/backend";

export function meta({}: Route.MetaArgs) {
    return [
        { title: "Resucheck | Home" },
        { name: "description", content: "Brilliant response for your dream job" },
    ];
}

export default function Home() {
    const { isAuthenticated, user, fetchMe, logout } = useAuthStore();
    const navigate = useNavigate();
    const location = useLocation();

    const [coins, setCoins] = useState<number>(0);
    const [loadingCoins, setLoadingCoins] = useState<boolean>(true);
    const [error, setError] = useState<string>("");
    const [email, setEmail] = useState<string>("");
    const [coinsToBuy, setCoinsToBuy] = useState<number>(1);
    const [isPaying, setIsPaying] = useState<boolean>(false);

    const isValidEmail = (val: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.toLowerCase());
    const paystackPublicKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY ?? "pk_test_c17ec87aa11d9458ca8c5331f80fa3880d8845f1";

    useEffect(() => {
        if (!isAuthenticated) navigate("/auth?next=/");
    }, [isAuthenticated]);

    // Load current coin balance from backend
    useEffect(() => {
        const loadCoins = async () => {
            setLoadingCoins(true);
            try {
                await fetchMe();
                const bal = (useAuthStore.getState().user?.coins ?? 0) as number;
                setCoins(Number.isFinite(bal) ? bal : 0);
                if (!email && useAuthStore.getState().user?.email) {
                    setEmail(useAuthStore.getState().user!.email!);
                }
            } catch {
                setError("Failed to load balance");
            } finally {
                setLoadingCoins(false);
            }
        };
        loadCoins();
    }, [fetchMe]);

    // Verify Paystack payment if redirected with reference
    useEffect(() => {
        const params = new URLSearchParams(location.search || "");
        const ref = params.get("reference");
        if (!ref) return;
        (async () => {
            try {
                setIsPaying(true);
                setError("");
                const verify = await backend.paystackVerify(ref);
                if (!verify.ok) throw new Error("Verification failed");
                await refreshBalance();
            } catch (err: any) {
                setError(err?.message || "Failed to verify payment");
            } finally {
                setIsPaying(false);
                navigate("/", { replace: true });
            }
        })();
    }, [location.search]);

    const refreshBalance = async () => {
        await fetchMe();
        const bal = (useAuthStore.getState().user?.coins ?? 0) as number;
        setCoins(Number.isFinite(bal) ? bal : 0);
    };

    const handleBuyCoin = async () => {
        try {
            setError("");
            if (!isAuthenticated) {
                setError("You must be signed in");
                navigate("/auth?next=/");
                return;
            }
            if (!email || !isValidEmail(email)) {
                setError("Please enter a valid email address to proceed with payment");
                return;
            }
            if (coinsToBuy < 1) {
                setError("Please enter at least 1 coin");
                return;
            }
            if (isPaying) return;

            setIsPaying(true);

            const amountInPesewas = coinsToBuy * 500; // GH₵5 per coin

            const callback_url = `${window.location.origin}/`;
            const init = await backend.paystackInit({
                email,
                coins: coinsToBuy,
                amount: amountInPesewas,
                currency: "GHS",
                metadata: { uid: useAuthStore.getState().user?.id, plan: `Buy ${coinsToBuy} coin${coinsToBuy > 1 ? 's' : ''}` },
                callback_url,
            });

            if (!init?.ok) {
                throw new Error("Failed to initialize payment");
            }

            const authUrl = init?.paystack?.data?.authorization_url;
            if (!authUrl) {
                throw new Error("Missing authorization URL from Paystack");
            }

            window.location.href = authUrl;
        } catch (e) {
            setIsPaying(false);
            setError(e instanceof Error ? e.message : "Failed to initialize payment");
        }
    };

    return (
        <main className="bg-[url(images/bg-main.svg)] bg-cover">
            <Navbar />
            <section className="main-section">
                <div className="page-heading py-16 flex flex-col items-start">
                    <h1>Track Your Applications & Resume Ratings</h1>
                    <h2>Review submissions and check AI-powered feedback.</h2>

                    {/* Wallet card */}
                    <div className="mt-8 w-full md:max-w-lg md:self-end">
                        <div className="rounded-2xl bg-gradient-to-br from-amber-50 to-white border border-amber-200 shadow-xl shadow-amber-100 p-6 flex flex-col gap-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-xl bg-amber-100 flex items-center justify-center text-2xl">🪙</div>
                                    <div>
                                        <p className="text-lg font-semibold text-amber-800">Wallet</p>
                                        <p className="text-xs text-amber-600/80">Pay GH₵5 per coin</p>
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

                                    <label className="block text-xs font-medium text-amber-800/80 mt-3 mb-1" htmlFor="coins-to-buy">Number of Coins</label>
                                    <input
                                        id="coins-to-buy"
                                        type="number"
                                        min={1}
                                        value={coinsToBuy}
                                        onChange={(e) => setCoinsToBuy(Number(e.target.value))}
                                        className="w-full border border-amber-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-200/60 outline-none rounded-lg px-3 py-2 bg-white"
                                    />
                                    <p className="mt-1 text-[11px] text-amber-700/70">Each coin costs GH₵5.</p>
                                </div>

                                <div className="md:w-auto">
                                    <button
                                        onClick={handleBuyCoin}
                                        disabled={isPaying}
                                        className={`primary-button w-full md:w-auto ${isPaying ? 'opacity-70 cursor-not-allowed' : ''}`}
                                    >
                                        {isPaying ? 'Processing…' : `Buy ${coinsToBuy} coin${coinsToBuy > 1 ? 's' : ''} (GH₵${coinsToBuy * 5})`}
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
