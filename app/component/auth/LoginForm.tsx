"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Zod errors
  const [errors, setErrors] = useState<{
    email?: string[];
    password?: string[];
  }>({});
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    // Clear old errors
    setErrors({});

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
        console.log("Error:", data);

        // Get Zod errors from API
        setErrors(data.errors || {});

        return;
      }

      console.log("Success:", data);

      // Successful login
      setEmail("");
      setPassword("");
      setErrors({});

      // အရင်ဆုံး router.push လုပ်ပြီး Page ကို refresh လုပ်ပေးခြင်း
      window.location.href = "/";
    } catch (error) {
      console.error("Request failed:", error);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-sm space-y-4 text-white border rounded p-4"
    >
      <div>
        <h1 className="text-center ">LOGIN</h1>
      </div>
      <div>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full bg-slate-950 border border-slate-700 p-3 rounded-lg text-slate-100 focus:outline-none focus:border-blue-500 transition"
        />
        {errors.email && (
          <p className="text-red-400 text-xs mt-1">{errors.email[0]}</p>
        )}
      </div>

      <div>
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full bg-slate-950 border border-slate-700 p-3 rounded-lg text-slate-100 focus:outline-none focus:border-blue-500 transition"
        />
        {errors.password && (
          <p className="text-red-400 text-xs mt-1">{errors.password[0]}</p>
        )}
      </div>

      <button
        type="submit"
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition shadow-md"
      >
        Login
      </button>
      <h2 className="text-center">or</h2>
      <Link href={"../../auth/register"}>
        <button
          type="submit"
          className="w-full bg-gray-400 hover:bg-blue-400 text-white font-medium py-3 rounded-lg transition shadow-md "
        >
          Register
        </button>
      </Link>
    </form>
  );
}
