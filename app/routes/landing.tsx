import React from "react";
import { Link } from "react-router";

export default function LandingPage() {
  const year = new Date().getFullYear();
  return (
    <main className="min-h-screen bg-[url('/images/bg-auth.svg')] bg-cover bg-center bg-no-repeat text-gray-900">
      <div className="min-h-screen flex flex-col">
        {/* HERO SECTION */}
        <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-24 grid md:grid-cols-2 gap-10 md:gap-12 items-center">
          <div>
            <h1 className="text-4xl sm:text-5xl font-bold leading-tight mb-4 sm:mb-6">
              Secure, Fast & Smart Verification
            </h1>
            <p className="text-base sm:text-lg mb-6 sm:mb-8 max-w-md">
              Verify identities with confidence using our next‑generation automated system built for speed, accuracy and privacy.
            </p>
            <Link
              to="/auth"
              className="primary-button w-full sm:w-auto text-center text-lg font-semibold"
              aria-label="Get started - go to authentication"
            >
              Get started
            </Link>
          </div>

          <div className="flex justify-center">
            <div className="w-64 sm:w-80 aspect-square bg-white rounded-3xl shadow-xl border border-gray-200" />
          </div>
        </section>

        {/* FEATURES */}
        <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-10 sm:mb-14">
            Why Choose Us
          </h2>

          <div className="grid gap-6 sm:gap-8 md:grid-cols-3">
            <div className="p-6 bg-white rounded-2xl shadow-md border border-gray-200">
              <div className="w-full h-36 sm:h-40 primary-gradient rounded-xl mb-5" />
              <h3 className="text-lg sm:text-xl font-semibold mb-3">Fast Processing</h3>
              <p className="text-sm text-gray-600">
                Our system verifies user identities in seconds with high precision.
              </p>
            </div>

            <div className="p-6 bg-white rounded-2xl shadow-md border border-gray-200">
              <div className="w-full h-36 sm:h-40 primary-gradient rounded-xl mb-5" />
              <h3 className="text-lg sm:text-xl font-semibold mb-3">High Accuracy</h3>
              <p className="text-sm text-gray-600">
                Advanced AI ensures each verification meets strict industry standards.
              </p>
            </div>

            <div className="p-6 bg-white rounded-2xl shadow-md border border-gray-200">
              <div className="w-full h-36 sm:h-40 primary-gradient rounded-xl mb-5" />
              <h3 className="text-lg sm:text-xl font-semibold mb-3">Secure & Private</h3>
              <p className="text-sm text-gray-600">
                Your data is encrypted end‑to‑end with full compliance guarantees.
              </p>
            </div>
          </div>
        </section>

        {/* CALL TO ACTION */}
        <section className="w-full py-16 sm:py-20 lg:py-24 bg-white/80 backdrop-blur text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6">Ready to Get Started?</h2>
          <p className="text-gray-600 mb-6 sm:mb-8 max-w-md mx-auto px-4">
            Join thousands using our verification system to secure their platforms.
          </p>
          <Link to="/auth" className="primary-button w-full sm:w-auto inline-block text-lg font-semibold">
            Get started
          </Link>
        </section>

        {/* FOOTER */}
        <footer className="mt-auto bg-white/80 backdrop-blur">
          <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-600">© {year} Resucheck. All rights reserved.</p>
            <Link to="/auth" className="primary-button w-full sm:w-auto text-center">
              Get started
            </Link>
          </div>
        </footer>
      </div>
    </main>
  );
}
