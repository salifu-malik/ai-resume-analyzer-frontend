import React from "react";
import { FaCheckCircle } from "react-icons/fa";

export default function VerifySuccess() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-green-50 p-4">
            <FaCheckCircle className="text-green-600 text-6xl mb-6" />
            <h1 className="text-3xl font-bold mb-2 text-green-800">Verification Successful!</h1>
            <p className="text-green-700 mb-6 text-center max-w-md">
                Your email has been verified. You can now fully use your account, buy coins, and update your profile.
            </p>
            <a
                href="/auth"
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            >
                Go to Login
            </a>
        </div>
    );
}
