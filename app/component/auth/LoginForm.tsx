"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [generalError, setGeneralError] = useState("");

  // Zod errors
  const [errors, setErrors] = useState<{
    email?: string[];
    password?: string[];
  }>({});
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrors({});
    setGeneralError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrors(data.errors || {});
        setGeneralError(
          data.error || "Failed to login. Please check your credentials.",
        );
        return;
      }

      setEmail("");
      setPassword("");
      setErrors({});
      window.location.href = "/";
    } catch (error) {
      console.error("Request failed:", error);
      setGeneralError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      {/* <div className="w-full max-w-md bg-[#48426D]/60 backdrop-blur-xl border border-white/10 p-6 sm:p-8 rounded-3xl shadow-2xl"></div> */}
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-gray backdrop-blur-xl border border-gray shadow-2xl rounded-2xl p-8 space-y-6 "
      >
        {/* Header Title */}
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-bold tracking-tight">Welcome Back</h1>
          <p className="text-xs text-slate-400">
            Please enter your details to sign in
          </p>
        </div>

        {/* General Error Message */}
        {generalError && (
          <div className="bg-red-950/60 border border-red-800/60 p-3 rounded-xl text-red-400 text-xs text-center">
            {generalError}
          </div>
        )}

        <div className="space-y-4">
          {/* Email Field */}
          <div className="space-y-1.5">
            <label className="text-xs font-lg text-slate-600">Email</label>
            <input
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-white border border-gray-300 p-3 rounded-xl text-sm text-black placeholder-slate-600 focus:outline-none focus:border-blue-500 transition shadow-inner"
            />
            {errors.email && (
              <p className="text-red-400 text-xs mt-1">{errors.email[0]}</p>
            )}
          </div>

          {/* Password Field */}
          <div className="space-y-1.5">
            <label className="text-xs font-lg text-slate-600">Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white border border-gray-300 p-3 rounded-xl text-sm text-black placeholder-slate-600 focus:outline-none focus:border-blue-500 transition shadow-inner"
            />
            {errors.password && (
              <p className="text-red-400 text-xs mt-1">{errors.password[0]}</p>
            )}
          </div>
        </div>

        {/* Login Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-medium py-3 rounded-xl transition shadow-lg text-sm disabled:opacity-50 cursor-pointer"
        >
          {loading ? "Signing in..." : "Sign In"}
        </button>

        {/* Divider */}
        <div className="relative flex py-2 items-center">
          <div className="flex-grow border-t border-slate-800"></div>
          <span className="flex-shrink mx-4 text-slate-500 text-xs uppercase tracking-wider">
            or
          </span>
          <div className="flex-grow border-t border-slate-800"></div>
        </div>

        {/* Register Link / Button */}
        <Link href="/auth/register" className="block w-full">
          <button
            type="button"
            className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium py-3 rounded-xl transition text-sm border border-slate-700/60 cursor-pointer"
          >
            Create an Account
          </button>
        </Link>
      </form>
    </div>
  );
}
