import React from "react";
import { FaTimesCircle } from "react-icons/fa";

export default function VerifyFailed() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-red-50 p-4">
            <FaTimesCircle className="text-red-600 text-6xl mb-6" />
            <h1 className="text-3xl font-bold mb-2 text-red-800">Verification Failed</h1>
            <p className="text-red-700 mb-6 text-center max-w-md">
                The verification link is invalid. It may have already been used or is incorrect. Please check your email and try again.
            </p>
            <a
                href="/auth"
                className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
            >
                Go to Signup
            </a>
        </div>
    );
}
