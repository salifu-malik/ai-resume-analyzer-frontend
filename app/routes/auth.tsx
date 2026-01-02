import {useEffect, useMemo, useState} from "react";
import {useLocation, useNavigate} from "react-router";
import { backend, useAuthStore } from "~/lib/backend";

export const meta = () => ([
    { title: 'Resucheck | Auth' },
    { name: 'description', content: 'Log into your account' },
])

const Auth = () => {
    const { isLoading, isAuthenticated, login, register, logout, user,error } = useAuthStore();
    const location = useLocation();
    const navigate = useNavigate();

    const [mode, setMode] = useState<'login' | 'register'>('login');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [localError, setLocalError] = useState<string | null>(null);

    // Mobile menu state
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    // Forgot password state
    const [forgotOpen, setForgotOpen] = useState(false);
    type ForgotStep = 'start' | 'verify' | 'reset' | 'done';
    const [forgotStep, setForgotStep] = useState<ForgotStep>('start');
    const [fpEmail, setFpEmail] = useState('');
    const [fpCode, setFpCode] = useState(''); // 6-char alphanumeric
    const [fpToken, setFpToken] = useState(''); // short-lived token from backend after verify
    const [fpNewPw, setFpNewPw] = useState('');
    const [fpNewPw2, setFpNewPw2] = useState('');
    const [fpError, setFpError] = useState<string | null>(null);
    const [fpInfo, setFpInfo] = useState<string | null>(null);
    const [fpLoading, setFpLoading] = useState(false);
    const [resendIn, setResendIn] = useState<number>(0);

    // Countdown timer for resend
    useEffect(() => {
        if (resendIn <= 0) return;
        const t = setInterval(() => {
            setResendIn((s) => (s > 0 ? s - 1 : 0));
        }, 1000);
        return () => clearInterval(t);
    }, [resendIn]);

    const next = useMemo(() => {
        const params = new URLSearchParams(location.search);
        return params.get('next') || '/';
    }, [location.search]);

    // useEffect(() => {
    //     if (isAuthenticated) {
    //         setMobileMenuOpen(false);
    //         navigate(next, { replace: true });
    //     }
    // }, [isAuthenticated, next, navigate]);

    useEffect(() => {
        if (!isAuthenticated || !user) return;

        setMobileMenuOpen(false);

        // Respect ?next= if it exists (e.g. protected routes)
        if (next && next !== "/") {
            navigate(next, { replace: true });
            return;
        }

        // Role-based redirect
        if (user.role === "admin") {
            navigate("/admin", { replace: true });
        } else {
            navigate("/", { replace: true });
        }
    }, [isAuthenticated, user, next, navigate]);


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLocalError(null);
        if (mode === 'login') {
            await login({ email, password });
        } else {
            if (!confirmPassword) {
                setLocalError('Please confirm your password');
                return;
            }
            if (password !== confirmPassword) {
                setLocalError('Passwords do not match');
                return;
            }
            await register({ name, email, password, confirm_password: confirmPassword });
        }
    };

    // Clear local error when the user edits password fields
    useEffect(() => {
        if (localError) setLocalError(null);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [password, confirmPassword]);

    return (
        <div className="min-h-screen flex flex-col bg-gray-50 relative">
            {/* Top Right Toggle for Mobile */}
            <div className="lg:hidden absolute top-6 right-6 z-40">
                <button
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    className="p-3 bg-white shadow-lg rounded-full text-cyan-600 border border-cyan-100 focus:outline-none"
                    aria-label="Toggle authentication menu"
                >
                    {mobileMenuOpen ? (
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    ) : (
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" />
                        </svg>
                    )}
                </button>
            </div>

            <main className="flex-grow bg-[url('/images/bg-auth.svg')] bg-cover bg-center flex items-center justify-center p-4 lg:p-8 relative">
                <div className="max-w-6xl w-full grid lg:grid-cols-2 gap-8 items-center">

                    {/* Left Side: Information about the system */}
                    <div className="flex flex-col text-white space-y-6 p-6 lg:p-8 rounded-3xl bg-black/20 backdrop-blur-sm font-outfit">
                        <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight">
                            Resucheck: <span className="text-cyan-300">AI-Powered</span> Resume Intelligence
                        </h1>
                        <p className="text-lg lg:text-xl text-gray-100 leading-relaxed">
                            Elevate your career with our next-generation resume analyzer. We use advanced AI to provide
                            instant feedback, detect missing keywords, and ensure your profile stands out to recruiters
                            and ATS systems.
                        </p>
                        <ul className="space-y-3 lg:space-y-4">
                            {[
                                "Instant ATS Compatibility Scoring",
                                "AI-Driven Keyword Optimization",
                                "Professional Formatting Suggestions",
                                "Detailed Industry Benchmarking"
                            ].map((feature, idx) => (
                                <li key={idx} className="flex items-center gap-3 text-base lg:text-lg">
                                    <div className="bg-cyan-400/20 p-1 rounded-full shrink-0">
                                        <svg className="w-5 h-5 lg:w-6 lg:h-6 text-cyan-300" fill="none" stroke="currentColor"
                                             viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5"
                                                  d="M5 13l4 4L19 7"/>
                                        </svg>
                                    </div>
                                    {feature}
                                </li>
                            ))}
                        </ul>
                        <div className="pt-6 border-t border-white/20">
                            <p className="italic text-cyan-100">"The smartest way to land your dream job."</p>
                        </div>
                    </div>

                    {/* Right Side: Auth Card */}
                    <div className={`
                        flex justify-center transition-all duration-300
                        lg:static lg:block lg:opacity-100 lg:scale-100 lg:pointer-events-auto
                        ${mobileMenuOpen 
                            ? 'fixed inset-0 z-30 bg-black/60 backdrop-blur-md flex items-center justify-center opacity-100 scale-100' 
                            : 'fixed inset-0 z-30 opacity-0 scale-95 pointer-events-none'
                        }
                    `} onClick={() => setMobileMenuOpen(false)}>
                        <div className="w-full max-w-md p-4 lg:p-0 flex justify-center" onClick={(e) => e.stopPropagation()}>
                            {isAuthenticated ? (
                                <div
                                    className="w-full max-w-[430px] bg-white p-8 lg:p-10 rounded-3xl shadow-2xl flex flex-col items-center gap-8 border border-gray-100">
                                    <div className="w-20 h-20 bg-cyan-50 rounded-full flex items-center justify-center">
                                        <svg className="w-10 h-10 text-cyan-600" fill="none" stroke="currentColor"
                                             viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                                  d="M5 13l4 4L19 7"/>
                                        </svg>
                                    </div>
                                    <div className="text-center">
                                        <h2 className="text-3xl font-bold text-gray-900 mb-2 font-outfit">Welcome Back!</h2>
                                        <p className="text-gray-500 font-outfit">You are currently logged into your account.</p>
                                    </div>
                                    {(localError || error) && (
                                        <div
                                            className="w-full text-red-600 text-sm text-center bg-red-50 p-3 rounded-lg border border-red-100">{localError || error}</div>
                                    )}
                                    <button
                                        className="w-full p-4 bg-gradient-to-r from-blue-700 via-cyan-600 to-cyan-200 text-white rounded-2xl text-lg font-semibold hover:opacity-90 transition-all shadow-lg hover:shadow-cyan-200/50"
                                        onClick={() => {
                                            logout();
                                            setMobileMenuOpen(false);
                                        }}>
                                        Log Out
                                    </button>
                                    <button className="text-cyan-600 font-medium hover:underline"
                                            onClick={() => {
                                                navigate('/');
                                                setMobileMenuOpen(false);
                                            }}>
                                        Go to Dashboard
                                    </button>
                                </div>
                            ) : (
                                <div
                                    className="w-full max-w-[430px] bg-white p-8 lg:p-10 rounded-3xl shadow-2xl border border-gray-100">
                                    {/* Header Titles */}
                                    <div className="text-center mb-8">
                                        <h2 className="text-3xl font-bold text-gray-900 mb-2 font-outfit">{mode === 'login' ? 'Welcome Back' : 'Create Account'}</h2>
                                        <p className="text-gray-500 mt-2 font-outfit">{mode === 'login' ? 'Please enter your details to sign in' : 'Start your journey with Resucheck today'}</p>
                                    </div>

                                    {/* Tab Controls */}
                                    <div className="relative flex h-14 mb-8 bg-gray-100 p-1 rounded-2xl">
                                        <button
                                            type="button"
                                            className={`flex-1 text-sm font-bold transition-all z-10 ${mode === 'login' ? 'text-white' : 'text-gray-500'}`}
                                            onClick={() => setMode('login')}
                                        >
                                            LOGIN
                                        </button>
                                        <button
                                            type="button"
                                            className={`flex-1 text-sm font-bold transition-all z-10 ${mode === 'register' ? 'text-white' : 'text-gray-500'}`}
                                            onClick={() => setMode('register')}
                                        >
                                            SIGNUP
                                        </button>
                                        <div
                                            className={`absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-xl bg-gradient-to-r from-blue-700 via-cyan-600 to-cyan-500 transition-all shadow-md ${
                                                mode === 'login' ? 'left-1' : 'left-[50%]'
                                            }`}
                                        />
                                    </div>

                                    {(localError || error) && (
                                        <div
                                            className="text-red-600 text-sm text-center mb-6 bg-red-50 p-3 rounded-xl border border-red-100">{localError || error}</div>
                                    )}

                                    {/* Form Section */}
                                    <form className="space-y-5" onSubmit={handleSubmit}>
                                        {/* Signup-only Field */}
                                        {mode === 'register' && (
                                            <div className="group">
                                                <label
                                                    className="block text-xs font-bold text-gray-400 uppercase mb-1 ml-1">Username</label>
                                                <input
                                                    type="text"
                                                    placeholder="e.g. johndoe"
                                                    value={name}
                                                    onChange={(e) => setName(e.target.value)}
                                                    required
                                                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:border-cyan-500 focus:bg-white transition-all placeholder-gray-300"
                                                />
                                            </div>
                                        )}

                                        {/* Shared Fields */}
                                        <div className="group">
                                            <label
                                                className="block text-xs font-bold text-gray-400 uppercase mb-1 ml-1">Email
                                                Address</label>
                                            <input
                                                type="email"
                                                placeholder="name@company.com"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                required
                                                className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:border-cyan-500 focus:bg-white transition-all placeholder-gray-300"
                                            />
                                        </div>

                                        <div className="group">
                                            <label
                                                className="block text-xs font-bold text-gray-400 uppercase mb-1 ml-1">Password</label>
                                            <div className="relative">
                                                <input
                                                    type={showPassword ? 'text' : 'password'}
                                                    placeholder="••••••••"
                                                    value={password}
                                                    onChange={(e) => setPassword(e.target.value)}
                                                    required
                                                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:border-cyan-500 focus:bg-white transition-all placeholder-gray-300 pr-12"
                                                />
                                                <button
                                                    type="button"
                                                    className="absolute inset-y-0 right-4 flex items-center text-gray-400 hover:text-cyan-600 transition-colors"
                                                    onClick={() => setShowPassword((v) => !v)}
                                                >
                                                    {showPassword ? (
                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none"
                                                             viewBox="0 0 24 24" stroke="currentColor" className="h-5 w-5">
                                                            <path strokeLinecap="round" strokeLinejoin="round"
                                                                  strokeWidth="2"
                                                                  d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"/>
                                                        </svg>
                                                    ) : (
                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none"
                                                             viewBox="0 0 24 24" stroke="currentColor" className="h-5 w-5">
                                                            <path strokeLinecap="round" strokeLinejoin="round"
                                                                  strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                                                            <path strokeLinecap="round" strokeLinejoin="round"
                                                                  strokeWidth="2"
                                                                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268-2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                                                        </svg>
                                                    )}
                                                </button>
                                            </div>
                                        </div>

                                        {/* Signup-only Field */}
                                        {mode === 'register' && (
                                            <div className="group">
                                                <label
                                                    className="block text-xs font-bold text-gray-400 uppercase mb-1 ml-1">Confirm
                                                    Password</label>
                                                <div className="relative">
                                                    <input
                                                        type={showConfirmPassword ? 'text' : 'password'}
                                                        placeholder="••••••••"
                                                        value={confirmPassword}
                                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                                        required
                                                        className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:border-cyan-500 focus:bg-white transition-all placeholder-gray-300 pr-12"
                                                    />
                                                    <button
                                                        type="button"
                                                        className="absolute inset-y-0 right-4 flex items-center text-gray-400 hover:text-cyan-600 transition-colors"
                                                        onClick={() => setShowConfirmPassword((v) => !v)}
                                                    >
                                                        {showConfirmPassword ? (
                                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none"
                                                                 viewBox="0 0 24 24" stroke="currentColor"
                                                                 className="h-5 w-5">
                                                                <path strokeLinecap="round" strokeLinejoin="round"
                                                                      strokeWidth="2"
                                                                      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"/>
                                                            </svg>
                                                        ) : (
                                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none"
                                                                 viewBox="0 0 24 24" stroke="currentColor"
                                                                 className="h-5 w-5">
                                                                <path strokeLinecap="round" strokeLinejoin="round"
                                                                      strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                                                                <path strokeLinecap="round" strokeLinejoin="round"
                                                                      strokeWidth="2"
                                                                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                                                            </svg>
                                                        )}
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        {/* Forgot Password (Only for Login) */}
                                        {mode === 'login' && (
                                            <div className="text-right">
                                                <button type="button" onClick={() => {
                                                    setFpEmail(email);
                                                    setForgotOpen(true);
                                                }}
                                                        className="text-sm font-semibold text-cyan-600 hover:text-blue-700 transition-colors">
                                                    Forgot password?
                                                </button>
                                            </div>
                                        )}

                                        {/* Submit Button */}
                                        <button
                                            disabled={isLoading || (mode === 'register' && (!!localError || !password || !confirmPassword))}
                                            className={`w-full p-4 bg-gradient-to-r from-blue-700 via-cyan-600 to-cyan-400 text-white rounded-2xl text-lg font-bold hover:opacity-90 transition-all shadow-lg hover:shadow-cyan-200/50 ${isLoading ? 'opacity-80' : ''}`}
                                        >
                                            {isLoading ? (mode === 'login' ? 'SIGNING IN...' : 'CREATING ACCOUNT...') : (mode === 'login' ? 'SIGN IN' : 'GET STARTED')}
                                        </button>

                                        {/* Switch Mode Link */}
                                        <p className="text-center text-gray-500 font-medium pt-2">
                                            {mode === 'login' ? "New to Resucheck?" : "Already joined?"}{' '}
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    setMode(mode === 'login' ? 'register' : 'login');
                                                    setLocalError(null);
                                                }}
                                                className="text-cyan-600 hover:text-blue-700 font-bold ml-1 transition-colors"
                                            >
                                                {mode === 'login' ? 'Create an account' : 'Sign in here'}
                                            </button>
                                        </p>
                                    </form>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>

            {/* Responsive Footer */}
            <footer className="bg-white border-t border-gray-100 py-8 px-4 font-outfit">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex flex-col items-center md:items-start gap-1">
                        <p className="text-2xl font-black bg-gradient-to-r from-blue-700 to-cyan-500 bg-clip-text text-transparent">RESUCHECK</p>
                        <p className="text-sm text-gray-500 font-bold">
                            Developed by <a href="tel:+233545038856" className="hover:text-cyan-600 transition-colors underline decoration-cyan-200 underline-offset-4">WASS TECH SOLUTIONS</a>
                        </p>
                    </div>

                    {/*<div className="flex gap-8 text-sm font-bold text-gray-400">*/}
                    {/*    <a href="#" className="hover:text-cyan-600 transition-colors">PRIVACY POLICY</a>*/}
                    {/*    <a href="#" className="hover:text-cyan-600 transition-colors">TERMS OF SERVICE</a>*/}
                    {/*    <a href="#" className="hover:text-cyan-600 transition-colors">CONTACT US</a>*/}
                    {/*</div>*/}

                    <div className="text-sm text-gray-400 font-bold">
                        © {new Date().getFullYear()} Resucheck. All rights reserved.
                    </div>
                </div>
            </footer>

            {/* Forgot Password Modal */}
            {forgotOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog"
                     aria-modal="true" aria-label="Password recovery">
                    <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6 relative">
                        <button
                            type="button"
                            aria-label="Close"
                            onClick={() => {
                                setForgotOpen(false);
                                setForgotStep('start');
                                setFpEmail('');
                                setFpCode('');
                                setFpToken('');
                                setFpNewPw('');
                                setFpNewPw2('');
                                setFpError(null);
                                setFpInfo(null);
                                setResendIn(0);
                            }}
                            className="absolute right-3 top-3 text-gray-500 hover:text-gray-700"
                        >✕
                        </button>

                        <h3 className="text-xl font-semibold mb-1 font-outfit">Forgot password</h3>
                        <p className="text-sm text-gray-600 mb-4 font-outfit">
                            {forgotStep === 'start' && 'Enter your account email. We will send a 6‑character code to reset your password.'}
                            {forgotStep === 'verify' && 'Enter the 6‑character code we emailed to you.'}
                            {forgotStep === 'reset' && 'Create a new password for your account.'}
                            {forgotStep === 'done' && 'Your password has been updated. You can now sign in.'}
                        </p>

                        {/* Status */}
                        {(fpError || fpInfo) && (
                            <div
                                className={`mb-3 text-sm rounded-lg px-3 py-2 border ${fpError ? 'bg-red-50 border-red-200 text-red-700' : 'bg-emerald-50 border-emerald-200 text-emerald-700'}`}>
                                {fpError || fpInfo}
                            </div>
                        )}

                        {/* Step: start */}
                        {forgotStep === 'start' && (
                            <form
                                onSubmit={async (e) => {
                                    e.preventDefault();
                                    setFpError(null);
                                    setFpInfo(null);
                                    const emailVal = fpEmail.trim().toLowerCase();
                                    const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal);
                                    if (!isValidEmail) {
                                        setFpError('Please enter a valid email');
                                        return;
                                    }
                                    try {
                                        setFpLoading(true);
                                        await backend.forgotStart(emailVal);
                                        setFpInfo('A 6 - character code has been sent to your email.');
                                        setForgotStep('verify');
                                        setResendIn(300);
                                    } catch (err: any) {
                                        setFpError(err?.message || 'Failed to start recovery');
                                    } finally {
                                        setFpLoading(false);
                                    }
                                }}
                                className="space-y-4"
                            >
                                <input
                                    type="email"
                                    value={fpEmail}
                                    onChange={(e) => setFpEmail(e.target.value)}
                                    placeholder="Email address"
                                    className="w-full p-3 border-b-2 border-gray-300 outline-none focus:border-cyan-500 placeholder-gray-400"
                                    required
                                />
                                <div className="flex items-center justify-end gap-2">
                                    <button type="button" onClick={() => setForgotOpen(false)}
                                            className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50">Cancel
                                    </button>
                                    <button disabled={fpLoading}
                                            className={`px-4 py-2 rounded-full text-white bg-gradient-to-r from-blue-700 via-cyan-600 to-cyan-200 ${fpLoading ? 'opacity-70' : ''}`}>{fpLoading ? 'Sending…' : 'Send code'}</button>
                                </div>
                            </form>
                        )}

                        {/* Step: verify */}
                        {forgotStep === 'verify' && (
                            <form
                                onSubmit={async (e) => {
                                    e.preventDefault();
                                    setFpError(null);
                                    setFpInfo(null);
                                    const emailVal = fpEmail.trim().toLowerCase();
                                    const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal);
                                    if (!isValidEmail) {
                                        setFpError('Invalid email');
                                        return;
                                    }
                                    const clean = fpCode.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
                                    if (clean.length !== 6) {
                                        setFpError('Enter the 6‑character code');
                                        return;
                                    }
                                    try {
                                        setFpLoading(true);
                                        const res = await backend.forgotVerify(emailVal, clean);
                                        setFpToken(res.token);
                                        setForgotStep('reset');
                                    } catch (err: any) {
                                        setFpError(err?.message || 'Invalid or expired code');
                                    } finally {
                                        setFpLoading(false);
                                    }
                                }}
                                className="space-y-4"
                            >
                                <input
                                    type="email"
                                    value={fpEmail}
                                    onChange={(e) => setFpEmail(e.target.value)}
                                    placeholder="Email address"
                                    className="w-full p-3 border-b-2 border-gray-300 outline-none focus:border-cyan-500 placeholder-gray-400"
                                    required
                                />
                                <input
                                    type="text"
                                    inputMode="latin-prose"
                                    value={fpCode}
                                    onChange={(e) => setFpCode(e.target.value.toUpperCase())}
                                    placeholder="6‑character code"
                                    maxLength={8}
                                    className="w-full tracking-widest uppercase p-3 border-b-2 border-gray-300 outline-none focus:border-cyan-500 placeholder-gray-400"
                                    required
                                />
                                <div className="flex items-center justify-between">
                                    <button
                                        type="button"
                                        disabled={resendIn > 0 || fpLoading}
                                        onClick={async () => {
                                            try {
                                                setFpError(null);
                                                setFpInfo(null);
                                                const emailVal = fpEmail.trim().toLowerCase();
                                                const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal);
                                                if (!isValidEmail) {
                                                    setFpError('Invalid email');
                                                    return;
                                                }
                                                await backend.forgotStart(emailVal);
                                                setFpInfo('Code resent. Please check your email.');
                                                setResendIn(60);
                                            } catch (err: any) {
                                                setFpError(err?.message || 'Failed to resend code');
                                            }
                                        }}
                                        className={`text-sm px-3 py-1.5 rounded-full border ${resendIn > 0 ? 'border-gray-200 text-gray-400' : 'border-cyan-300 text-cyan-700 hover:bg-cyan-50'}`}
                                    >
                                        {resendIn > 0 ? `Resend in ${resendIn}s` : 'Resend code'}
                                    </button>
                                    <div className="flex items-center gap-2">
                                        <button type="button" onClick={() => setForgotOpen(false)}
                                                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50">Cancel
                                        </button>
                                        <button disabled={fpLoading}
                                                className={`px-4 py-2 rounded-full text-white bg-gradient-to-r from-blue-700 via-cyan-600 to-cyan-200 ${fpLoading ? 'opacity-70' : ''}`}>{fpLoading ? 'Verifying…' : 'Verify code'}</button>
                                    </div>
                                </div>
                            </form>
                        )}

                        {/* Step: reset */}
                        {forgotStep === 'reset' && (
                            <form
                                onSubmit={async (e) => {
                                    e.preventDefault();
                                    setFpError(null);
                                    setFpInfo(null);
                                    if (fpNewPw.length < 6) {
                                        setFpError('Password must be at least 6 characters');
                                        return;
                                    }
                                    if (fpNewPw !== fpNewPw2) {
                                        setFpError('Passwords do not match');
                                        return;
                                    }
                                    try {
                                        setFpLoading(true);
                                        await backend.forgotReset(fpEmail.trim().toLowerCase(), fpToken, fpNewPw, fpNewPw2);
                                        setForgotStep('done');
                                        setFpInfo('Password updated. You can now sign in.');
                                    } catch (err: any) {
                                        setFpError(err?.message || 'Failed to reset password');
                                    } finally {
                                        setFpLoading(false);
                                    }
                                }}
                                className="space-y-4"
                            >
                                <div className="relative">
                                    <input
                                        type="password"
                                        value={fpNewPw}
                                        onChange={(e) => setFpNewPw(e.target.value)}
                                        placeholder="New password"
                                        className="w-full p-3 pr-10 border-b-2 border-gray-300 outline-none focus:border-cyan-500 placeholder-gray-400"
                                        required
                                    />
                                </div>
                                <div className="relative">
                                    <input
                                        type="password"
                                        value={fpNewPw2}
                                        onChange={(e) => setFpNewPw2(e.target.value)}
                                        placeholder="Confirm new password"
                                        className="w-full p-3 pr-10 border-b-2 border-gray-300 outline-none focus:border-cyan-500 placeholder-gray-400"
                                        required
                                    />
                                </div>
                                <div className="flex items-center justify-end gap-2">
                                    <button type="button" onClick={() => setForgotOpen(false)}
                                            className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50">Close
                                    </button>
                                    <button disabled={fpLoading}
                                            className={`px-4 py-2 rounded-full text-white bg-gradient-to-r from-blue-700 via-cyan-600 to-cyan-200 ${fpLoading ? 'opacity-70' : ''}`}>{fpLoading ? 'Updating…' : 'Update password'}</button>
                                </div>
                            </form>
                        )}

                        {forgotStep === 'done' && (
                            <div className="space-y-4">
                                <div
                                    className="rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 text-sm px-3 py-2">Password
                                    updated. Please sign in with your new password.
                                </div>
                                <button
                                    onClick={() => {
                                        setForgotOpen(false);
                                        setMode('login');
                                        if (fpEmail) setEmail(fpEmail);
                                        // On mobile, if they just reset password, we might want to keep the menu open
                                        // or close it and let them reopen. Given the UX, keeping it open makes sense.
                                    }}
                                    className="w-full p-3 bg-gradient-to-r from-blue-700 via-cyan-600 to-cyan-200 text-white rounded-full text-lg font-medium hover:opacity-90 transition"
                                >Go to Login
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

export default Auth