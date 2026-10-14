"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [generalError, setGeneralError] = useState("");

  // Zod errors
  const [errors, setErrors] = useState<{
    name?: string[];
    email?: string[];
    password?: string[];
  }>({});

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrors({});
    setGeneralError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrors(data.errors || {});
        setGeneralError(
          data.error ||
            "Failed to create an account. Please check your inputs.",
        );
        return;
      }

      setName("");
      setEmail("");
      setPassword("");
      setErrors({});
      router.push("/");
      router.refresh();
    } catch (error) {
      console.error("Request failed:", error);
      setGeneralError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-gray backdrop-blur-xl shadow-2xl rounded-2xl p-8 space-y-6 "
      >
        {/* Header Title */}
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-black">
            Create an Account
          </h1>
          <p className="text-xs text-slate-600">
            Join Mini Social and start sharing your thoughts
          </p>
        </div>

        {/* General Error Message */}
        {generalError && (
          <div className="bg-red-950/60 border border-red-800/60 p-3 rounded-xl text-red-400 text-xs text-center">
            {generalError}
          </div>
        )}

        <div className="space-y-4">
          {/* Name Field */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-600">Name</label>
            <input
              type="text"
              placeholder="Your Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-white border border-gray-300 p-3 rounded-xl text-sm text-black placeholder-slate-600 focus:outline-none focus:border-blue-500 transition shadow-inner"
            />
            {errors.name && (
              <p className="text-red-400 text-xs mt-1">{errors.name[0]}</p>
            )}
          </div>

          {/* Email Field */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-600">Email</label>
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
            <label className="text-xs font-medium text-slate-600">
              Password
            </label>
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

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-medium py-3 rounded-xl transition shadow-lg text-sm disabled:opacity-50 cursor-pointer"
        >
          {loading ? "Creating account..." : "Sign Up"}
        </button>

        {/* Divider */}
        <div className="relative flex py-2 items-center">
          <div className="flex-grow border-t border-slate-800"></div>
          <span className="flex-shrink mx-4 text-slate-500 text-xs uppercase tracking-wider">
            or
          </span>
          <div className="flex-grow border-t border-slate-800"></div>
        </div>

        {/* Login Link */}
        <div className="text-center text-xs text-slate-400">
          Already have an account?{" "}
          <Link
            href="/auth/login"
            className="text-blue-400 hover:underline font-medium"
          >
            Sign In
          </Link>
        </div>
      </form>
    </div>
  );
}
