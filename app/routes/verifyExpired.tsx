import React from "react";
import { FaExclamationTriangle } from "react-icons/fa";

export default function VerifyExpired() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-yellow-50 p-4">
            <FaExclamationTriangle className="text-yellow-600 text-6xl mb-6" />
            <h1 className="text-3xl font-bold mb-2 text-yellow-800">Verification Link Expired</h1>
            <p className="text-yellow-700 mb-6 text-center max-w-md">
                Your verification link has expired. Please request a new verification email to activate your account.
            </p>
            <a
                href="/auth"
                className="px-6 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition"
            >
                Resend Verification Email
            </a>
        </div>
    );
}
