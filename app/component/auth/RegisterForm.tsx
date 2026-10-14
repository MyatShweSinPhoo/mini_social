"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
export default function RegisterForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Zod errors
  const [errors, setErrors] = useState<{
    name?: string[];
    email?: string[];
    password?: string[];
  }>({});

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    // Clear old errors
    setErrors({});

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
        console.log("Error:", data);

        // Get Zod errors from API
        setErrors(data.errors || {});

        return;
      }

      console.log("Success:", data);

      // Clear inputs
      setName("");
      setEmail("");
      setPassword("");
      setErrors({});
      router.push("/");
      router.refresh();
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
        <h1 className="text-center ">REGISTER</h1>
      </div>
      <div>
        <input
          type="text"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full bg-slate-950 border border-slate-700 p-3 rounded-lg text-slate-100 focus:outline-none focus:border-blue-500 transition mb-2"
        />

        {errors.name && (
          <p className="text-red-400 text-xs mt-1">{errors.name[0]}</p>
        )}

        <br />

        {/* Email */}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full bg-slate-950 border border-slate-700 p-3 rounded-lg text-slate-100 focus:outline-none focus:border-blue-500 transition mb-2"
        />

        {errors.email && <p style={{ color: "red" }}>{errors.email[0]}</p>}

        <br />

        {/* Password */}
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full bg-slate-950 border border-slate-700 p-3 rounded-lg text-slate-100 focus:outline-none focus:border-blue-500 transition mb-2"
        />

        {errors.password && (
          <p style={{ color: "red" }}>{errors.password[0]}</p>
        )}

        <br />

        <button
          type="submit"
          className="w-full bg-blue-800 hover:bg-blue-400 text-white font-medium py-3 rounded-lg transition shadow-md mb-2"
        >
          Register
        </button>

        <p className="text-center">
          <Link href={"../../auth/login"}>
            Do you have already account?Login
          </Link>
        </p>
      </div>
    </form>
  );
}
