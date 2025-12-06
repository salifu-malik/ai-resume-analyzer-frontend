import {useEffect, useMemo, useState} from "react";
import {useLocation, useNavigate} from "react-router";
import { backend, useAuthStore } from "~/lib/backend";

export const meta = () => ([
    { title: 'Resucheck | Auth' },
    { name: 'description', content: 'Log into your account' },
])

const Auth = () => {
    const { isLoading, isAuthenticated, login, register, logout, error } = useAuthStore();
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

    useEffect(() => {
        if (isAuthenticated) navigate(next, { replace: true });
    }, [isAuthenticated, next, navigate]);

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
    <main className="bg-[url('/images/bg-auth.svg')] bg-cover min-h-screen flex items-center justify-center p-4">
      {isAuthenticated ? (
        <div className="w-[430px] bg-white p-8 rounded-2xl shadow-lg flex flex-col items-center gap-6">
          <h2 className="text-2xl font-semibold">You are logged in</h2>
          {(localError || error) && (
            <div className="text-red-600 text-sm text-center">{localError || error}</div>
          )}
          <button className="w-full p-3 bg-gradient-to-r from-blue-700 via-cyan-600 to-cyan-200 text-white rounded-full text-lg font-medium hover:opacity-90 transition" onClick={logout}>
            Log Out
          </button>
        </div>
      ) : (
        <div className="w-[430px] bg-white p-8 rounded-2xl shadow-lg">
          {/* Header Titles */}
          <div className="flex justify-center mb-4">
            <h2 className="text-3xl font-semibold text-center">{mode === 'login' ? 'Login' : 'Sign Up'}</h2>
          </div>

          {/* Tab Controls */}
          <div className="relative flex h-12 mb-6 border border-gray-300 rounded-full overflow-hidden">
            <button
              type="button"
              className={`w-1/2 text-lg font-medium transition-all z-10 ${mode === 'login' ? 'text-white' : 'text-black'}`}
              onClick={() => setMode('login')}
            >
              Login
            </button>
            <button
              type="button"
              className={`w-1/2 text-lg font-medium transition-all z-10 ${mode === 'register' ? 'text-white' : 'text-black'}`}
              onClick={() => setMode('register')}
            >
              Signup
            </button>
            <div
              className={`absolute top-0 h-full w-1/2 rounded-full bg-gradient-to-r from-blue-700 via-cyan-600 to-cyan-200 transition-all ${
                mode === 'login' ? 'left-0' : 'left-1/2'
              }`}
            />
          </div>

          {(localError || error) && (
            <div className="text-red-600 text-sm text-center mb-3">{localError || error}</div>
          )}

          {/* Form Section */}
          <form className="space-y-4" onSubmit={handleSubmit}>
            {/* Signup-only Field */}
            {mode === 'register' && (
              <input
                type="text"
                placeholder="Username"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full p-3 border-b-2 border-gray-300 outline-none focus:border-cyan-500 placeholder-gray-400"
              />
            )}

            {/* Shared Fields */}
            <input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full p-3 border-b-2 border-gray-300 outline-none focus:border-cyan-500 placeholder-gray-400"
            />

            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full p-3 pr-10 border-b-2 border-gray-300 outline-none focus:border-cyan-500 placeholder-gray-400"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-2 flex items-center text-gray-500 hover:text-gray-700"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                    <path d="M3 3l18 18" />
                    <path d="M10.584 10.587a2 2 0 102.829 2.829" />
                    <path d="M9.88 5.09A9.953 9.953 0 0112 5c5 0 9.27 3.11 10.94 7.5a11.05 11.05 0 01-3.18 4.51M6.18 6.18A11.05 11.05 0 001.06 12.5 11.04 11.04 0 006.6 17.49" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>

            {/* Signup-only Field */}
            {mode === 'register' && (
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full p-3 pr-10 border-b-2 border-gray-300 outline-none focus:border-cyan-500 placeholder-gray-400"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-2 flex items-center text-gray-500 hover:text-gray-700"
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  title={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                      <path d="M3 3l18 18" />
                      <path d="M10.584 10.587a2 2 0 102.829 2.829" />
                      <path d="M9.88 5.09A9.953 9.953 0 0112 5c5 0 9.27 3.11 10.94 7.5a11.05 11.05 0 01-3.18 4.51M6.18 6.18A11.05 11.05 0 001.06 12.5 11.04 11.04 0 006.6 17.49" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            )}

            {/* Forgot Password (Only for Login) */}
            {mode === 'login' && (
              <div className="text-right">
                <button type="button" onClick={() => { setFpEmail(email); setForgotOpen(true); }} className="text-cyan-600 hover:underline">
                  Forgot password?
                </button>
              </div>
            )}

            {/* Submit Button */}
            <button
              disabled={isLoading || (mode==='register' && (!!localError || !password || !confirmPassword))}
              className={`w-full p-3 bg-gradient-to-r from-blue-700 via-cyan-600 to-cyan-200 text-white rounded-full text-lg font-medium hover:opacity-90 transition ${isLoading ? 'opacity-80' : ''}`}
            >
              {isLoading ? (mode === 'login' ? 'Signing in…' : 'Creating account…') : (mode === 'login' ? 'Login' : 'Signup')}
            </button>

            {/* Switch Mode Link */}
            <p className="text-center text-gray-600">
              {mode === 'login' ? "Don't have an account?" : "Already have an account?"}{' '}
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setMode(mode === 'login' ? 'register' : 'login');
                  setLocalError(null);
                }}
                className="text-cyan-600 hover:underline"
              >
                {mode === 'login' ? 'Signup now' : 'Login'}
              </a>
            </p>
          </form>
        </div>
      )}
    {/* Forgot Password Modal */}
          {forgotOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-label="Password recovery">
              <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6 relative">
                <button
                  type="button"
                  aria-label="Close"
                  onClick={() => {
                    setForgotOpen(false);
                    setForgotStep('start');
                    setFpEmail(''); setFpCode(''); setFpToken(''); setFpNewPw(''); setFpNewPw2(''); setFpError(null); setFpInfo(null); setResendIn(0);
                  }}
                  className="absolute right-3 top-3 text-gray-500 hover:text-gray-700"
                >✕</button>

                <h3 className="text-xl font-semibold mb-1">Forgot password</h3>
                <p className="text-sm text-gray-600 mb-4">
                  {forgotStep === 'start' && 'Enter your account email. We will send a 6‑character code to reset your password.'}
                  {forgotStep === 'verify' && 'Enter the 6‑character code we emailed to you.'}
                  {forgotStep === 'reset' && 'Create a new password for your account.'}
                  {forgotStep === 'done' && 'Your password has been updated. You can now sign in.'}
                </p>

                {/* Status */}
                {(fpError || fpInfo) && (
                  <div className={`mb-3 text-sm rounded-lg px-3 py-2 border ${fpError ? 'bg-red-50 border-red-200 text-red-700' : 'bg-emerald-50 border-emerald-200 text-emerald-700'}`}>
                    {fpError || fpInfo}
                  </div>
                )}

                {/* Step: start */}
                {forgotStep === 'start' && (
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      setFpError(null); setFpInfo(null);
                      const emailVal = fpEmail.trim().toLowerCase();
                      const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal);
                      if (!isValidEmail) { setFpError('Please enter a valid email'); return; }
                      try {
                        setFpLoading(true);
                        await backend.forgotStart(emailVal);
                        setFpInfo('A 6 - character code has been sent to your email.');
                        setForgotStep('verify');
                        setResendIn(300);
                      } catch (err: any) {
                        setFpError(err?.message || 'Failed to start recovery');
                      } finally { setFpLoading(false); }
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
                      <button type="button" onClick={() => setForgotOpen(false)} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50">Cancel</button>
                      <button disabled={fpLoading} className={`px-4 py-2 rounded-full text-white bg-gradient-to-r from-blue-700 via-cyan-600 to-cyan-200 ${fpLoading ? 'opacity-70' : ''}`}>{fpLoading ? 'Sending…' : 'Send code'}</button>
                    </div>
                  </form>
                )}

                {/* Step: verify */}
                {forgotStep === 'verify' && (
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      setFpError(null); setFpInfo(null);
                      const emailVal = fpEmail.trim().toLowerCase();
                      const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal);
                      if (!isValidEmail) { setFpError('Invalid email'); return; }
                      const clean = fpCode.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
                      if (clean.length !== 6) { setFpError('Enter the 6‑character code'); return; }
                      try {
                        setFpLoading(true);
                        const res = await backend.forgotVerify(emailVal, clean);
                        setFpToken(res.token);
                        setForgotStep('reset');
                      } catch (err: any) {
                        setFpError(err?.message || 'Invalid or expired code');
                      } finally { setFpLoading(false); }
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
                            setFpError(null); setFpInfo(null);
                            const emailVal = fpEmail.trim().toLowerCase();
                            const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal);
                            if (!isValidEmail) { setFpError('Invalid email'); return; }
                            await backend.forgotStart(emailVal);
                            setFpInfo('Code resent. Please check your email.');
                            setResendIn(60);
                          } catch (err: any) {
                            setFpError(err?.message || 'Failed to resend code');
                          }
                        }}
                        className={`text-sm px-3 py-1.5 rounded-full border ${resendIn>0 ? 'border-gray-200 text-gray-400' : 'border-cyan-300 text-cyan-700 hover:bg-cyan-50'}`}
                      >
                        {resendIn > 0 ? `Resend in ${resendIn}s` : 'Resend code'}
                      </button>
                      <div className="flex items-center gap-2">
                        <button type="button" onClick={() => setForgotOpen(false)} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50">Cancel</button>
                        <button disabled={fpLoading} className={`px-4 py-2 rounded-full text-white bg-gradient-to-r from-blue-700 via-cyan-600 to-cyan-200 ${fpLoading ? 'opacity-70' : ''}`}>{fpLoading ? 'Verifying…' : 'Verify code'}</button>
                      </div>
                    </div>
                  </form>
                )}

                {/* Step: reset */}
                {forgotStep === 'reset' && (
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      setFpError(null); setFpInfo(null);
                      if (fpNewPw.length < 6) { setFpError('Password must be at least 6 characters'); return; }
                      if (fpNewPw !== fpNewPw2) { setFpError('Passwords do not match'); return; }
                      try {
                        setFpLoading(true);
                        await backend.forgotReset(fpEmail.trim().toLowerCase(), fpToken, fpNewPw, fpNewPw2);
                        setForgotStep('done');
                        setFpInfo('Password updated. You can now sign in.');
                      } catch (err: any) {
                        setFpError(err?.message || 'Failed to reset password');
                      } finally { setFpLoading(false); }
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
                      <button type="button" onClick={() => setForgotOpen(false)} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50">Close</button>
                      <button disabled={fpLoading} className={`px-4 py-2 rounded-full text-white bg-gradient-to-r from-blue-700 via-cyan-600 to-cyan-200 ${fpLoading ? 'opacity-70' : ''}`}>{fpLoading ? 'Updating…' : 'Update password'}</button>
                    </div>
                  </form>
                )}

                {forgotStep === 'done' && (
                  <div className="space-y-4">
                    <div className="rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 text-sm px-3 py-2">Password updated. Please sign in with your new password.</div>
                    <button
                      onClick={() => {
                        setForgotOpen(false);
                        setMode('login');
                        if (fpEmail) setEmail(fpEmail);
                      }}
                      className="w-full p-3 bg-gradient-to-r from-blue-700 via-cyan-600 to-cyan-200 text-white rounded-full text-lg font-medium hover:opacity-90 transition"
                    >Go to Login</button>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
    )
}

export default Auth