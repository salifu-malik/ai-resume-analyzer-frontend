import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import Navbar from "~/components/Navbar";
import { backend, useAuthStore } from "~/lib/backend";

export const meta = () => ([
    { title: "Resucheck | Profile" },
    { name: "description", content: "View and update your profile" },
]);

export default function Profile() {
    const navigate = useNavigate();
    const { fetchMe, user: authUser } = useAuthStore();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const [email, setEmail] = useState("");
    const [name, setName] = useState("");

    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const canSave = useMemo(() => {
        const nameChanged = name.trim() !== "" && name.trim() !== (authUser?.name || "");
        const wantsPw = currentPassword || newPassword || confirmPassword;
        return nameChanged || Boolean(wantsPw);
    }, [name, authUser?.name, currentPassword, newPassword, confirmPassword]);

    useEffect(() => {
        let mounted = true;
        (async () => {
            setLoading(true);
            setError(null);
            try {
                await fetchMe().catch(() => {});
                const res = await backend.profileGet();
                if (!mounted) return;
                setEmail(res.user.email || "");
                setName(res.user.name || "");
            } catch (e: any) {
                if (!mounted) return;
                setError(e?.message || "Failed to load profile");
            } finally {
                if (mounted) setLoading(false);
            }
        })();
        return () => { mounted = false };
    }, [fetchMe]);

    const resetMessages = () => { setError(null); setSuccess(null); };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        resetMessages();

        // Validate password fields if user wants to change
        if (currentPassword || newPassword || confirmPassword) {
            if (!currentPassword || !newPassword || !confirmPassword) {
                setError("Please fill all password fields");
                return;
            }
            if (newPassword.length < 6) {
                setError("New password must be at least 6 characters");
                return;
            }
            if (newPassword !== confirmPassword) {
                setError("New passwords do not match");
                return;
            }
        }

        try {
            setSaving(true);
            const payload: Record<string, any> = {};
            if (name && name !== authUser?.name) payload.name = name.trim();
            if (currentPassword || newPassword || confirmPassword) {
                payload.current_password = currentPassword;
                payload.new_password = newPassword;
                payload.confirm_password = confirmPassword;
            }

            const res = await backend.profileUpdate(payload);
            await useAuthStore.getState().fetchMe().catch(() => {});

            setSuccess("Profile updated successfully");
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
            setName(res.user.name || name);

        } catch (e: any) {
            setError(e?.message || "Failed to update profile");
        } finally {
            setSaving(false);
        }
    };

    // UI helpers: avatar initial and password visibility toggles
    const initial = (authUser?.name || authUser?.email || "").trim().charAt(0).toUpperCase();
    const [showCurPw, setShowCurPw] = useState(false);
    const [showNewPw, setShowNewPw] = useState(false);
    const [showConfPw, setShowConfPw] = useState(false);

    return (
        <main className="bg-[url('/images/bg-main.svg')] bg-cover min-h-screen">
            <Navbar />
            <section className="main-section">
                {/* Header card */}
                <div className="relative mx-auto w-full max-w-4xl">
                    <div className="rounded-2xl bg-gradient-to-r from-cyan-50 to-blue-50 border border-cyan-100 shadow-sm p-6 md:p-8">
                        <div className="flex items-center gap-4 md:gap-6">
                            <div className="h-14 w-14 md:h-16 md:w-16 rounded-2xl bg-white border border-cyan-100 shadow flex items-center justify-center">
                                <span className="text-xl md:text-2xl font-bold text-cyan-700">{initial}</span>
                            </div>
                            <div className="min-w-0">
                                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 truncate">{name || authUser?.name || 'Your name'}</h1>
                                <p className="mt-1 inline-flex items-center gap-2 text-sm text-gray-700 bg-white/80 px-2 py-1 rounded-lg border border-gray-200">
                                    <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" aria-hidden="true" />
                                    {email || authUser?.email}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content grid */}
                <div className="mx-auto w-full max-w-4xl mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left: Account info */}
                    <div className="lg:col-span-2">
                        <div className="rounded-2xl bg-white/90 backdrop-blur border border-gray-200 shadow-md p-5 md:p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">Account information</h2>

                            {loading ? (
                                <div className="flex items-center gap-3 text-gray-500 text-sm">
                                    <span className="inline-block h-4 w-4 rounded-full border-2 border-gray-300 border-t-gray-500 animate-spin" />
                                    <span>Loading profile…</span>
                                </div>
                            ) : (
                                <form className="space-y-5" onSubmit={handleSubmit}>
                                    {/* Live regions for status messages */}
                                    <div aria-live="polite" aria-atomic="true" className="space-y-2">
                                        {error && (
                                            <div className="rounded-lg border border-red-200 bg-red-50 text-red-700 text-sm px-3 py-2 flex items-start gap-2">
                                                <span aria-hidden className="mt-0.5">⚠️</span>
                                                <span>{error}</span>
                                            </div>
                                        )}
                                        {success && (
                                            <div className="rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 text-sm px-3 py-2 flex items-start gap-2">
                                                <span aria-hidden className="mt-0.5">✅</span>
                                                <span>{success}</span>
                                            </div>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="email">Email (read-only)</label>
                                        <input
                                            id="email"
                                            type="email"
                                            value={email}
                                            readOnly
                                            className="w-full bg-gray-50 text-gray-700 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-cyan-100"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">Email cannot be changed.</p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="name">Name</label>
                                        <input
                                            id="name"
                                            type="text"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            placeholder="Your name"
                                            className="w-full border border-gray-300 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200/60 outline-none rounded-lg px-3 py-2 bg-white"
                                        />
                                    </div>

                                    {/* Save / Cancel (desktop) */}
                                    <div className="hidden sm:flex pt-2 items-center gap-3">
                                        <button
                                            type="submit"
                                            disabled={saving || !canSave}
                                            className={`primary-button ${saving || !canSave ? 'opacity-70 cursor-not-allowed' : ''}`}
                                        >
                                            {saving ? 'Saving…' : 'Save changes'}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => navigate(-1)}
                                            className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
                                        >
                                            Cancel
                                        </button>
                                    </div>

                                    {/* Sticky action bar (mobile) */}
                                    <div className="sm:hidden sticky bottom-4 inset-x-0">
                                        <div className="mx-4 rounded-xl shadow-lg border border-gray-200 bg-white p-3 flex items-center gap-3">
                                            <button
                                                type="submit"
                                                disabled={saving || !canSave}
                                                className={`primary-button flex-1 ${saving || !canSave ? 'opacity-70 cursor-not-allowed' : ''}`}
                                            >
                                                {saving ? 'Saving…' : 'Save'}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => navigate(-1)}
                                                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>

                    {/* Right: Password change */}
                    <div className="lg:col-span-1">
                        <div className="rounded-2xl bg-white/90 backdrop-blur border border-gray-200 shadow-md p-5 md:p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">Security</h2>
                            <p className="text-sm text-gray-600 mb-4">Change your password (optional)</p>

                            <div className="space-y-4">
                                <div>
                                    <label htmlFor="cur-pw" className="block text-sm font-medium text-gray-700 mb-1">Current password</label>
                                    <div className="relative">
                                        <input
                                            id="cur-pw"
                                            type={showCurPw ? 'text' : 'password'}
                                            value={currentPassword}
                                            onChange={(e) => setCurrentPassword(e.target.value)}
                                            className="w-full border border-gray-300 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200/60 outline-none rounded-lg px-3 py-2 bg-white pr-10"
                                        />
                                        <button type="button" onClick={() => setShowCurPw(v => !v)}
                                                className="absolute inset-y-0 right-2 flex items-center text-gray-500 hover:text-gray-700"
                                                aria-label={showCurPw ? 'Hide password' : 'Show password'}>
                                            {showCurPw ? '🙈' : '👁️'}
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="new-pw" className="block text-sm font-medium text-gray-700 mb-1">New password</label>
                                    <div className="relative">
                                        <input
                                            id="new-pw"
                                            type={showNewPw ? 'text' : 'password'}
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            className="w-full border border-gray-300 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200/60 outline-none rounded-lg px-3 py-2 bg-white pr-10"
                                        />
                                        <button type="button" onClick={() => setShowNewPw(v => !v)}
                                                className="absolute inset-y-0 right-2 flex items-center text-gray-500 hover:text-gray-700"
                                                aria-label={showNewPw ? 'Hide password' : 'Show password'}>
                                            {showNewPw ? '🙈' : '👁️'}
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="conf-pw" className="block text-sm font-medium text-gray-700 mb-1">Confirm new password</label>
                                    <div className="relative">
                                        <input
                                            id="conf-pw"
                                            type={showConfPw ? 'text' : 'password'}
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className="w-full border border-gray-300 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200/60 outline-none rounded-lg px-3 py-2 bg-white pr-10"
                                        />
                                        <button type="button" onClick={() => setShowConfPw(v => !v)}
                                                className="absolute inset-y-0 right-2 flex items-center text-gray-500 hover:text-gray-700"
                                                aria-label={showConfPw ? 'Hide password' : 'Show password'}>
                                            {showConfPw ? '🙈' : '👁️'}
                                        </button>
                                    </div>
                                </div>

                                <p className="text-xs text-gray-500">Use at least 6 characters for your new password.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </main>
    );
}
