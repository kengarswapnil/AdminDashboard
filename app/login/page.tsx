"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { loginUser } from "@/lib/auth";

const focus =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500";

const field =
  "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 shadow-sm transition focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/15";

export default function LoginPage() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    // Prevent multiple requests
    if (loading) {
      return;
    }

    setError("");

    // Validation
    if (!username.trim()) {
      setError("Username is required.");
      return;
    }

    if (!password.trim()) {
      setError("Password is required.");
      return;
    }

    try {
      setLoading(true);

      const data = await loginUser(username, password);

      // Save authentication information
      localStorage.setItem("accessToken", data.accessToken);
      localStorage.setItem("username", data.username);

      // Go to products page
      router.push("/products");
    } catch (error) {
      setError("Invalid username or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="fixed inset-0 overflow-y-auto bg-[#12143a]">
      <div className="flex min-h-full items-center justify-center px-4 py-8">
        <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl shadow-black/30 sm:p-10">
          <div
            aria-hidden
            className="mb-6 flex size-12 items-center justify-center rounded-2xl bg-[#12143a] text-xl font-semibold text-white"
          >
            P
          </div>

          <h1 className="mb-2 text-3xl font-semibold tracking-tight text-slate-900">
            Product Admin
          </h1>

          <p className="mb-8 text-slate-500">Login to manage products</p>

          <form onSubmit={handleLogin} className="space-y-5">
            {/* Username */}
            <div>
              <label
                htmlFor="username"
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                Username
              </label>

              <input
                id="username"
                type="text"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="Enter username"
                className={field}
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                Password
              </label>

              <input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter password"
                className={field}
              />
            </div>

            {/* Error */}
            {error && (
              <div
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600"
              >
                {error}
              </div>
            )}

            {/* Login button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full rounded-xl bg-[#12143a] py-3 font-medium text-white shadow-lg shadow-indigo-950/20 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50 ${focus}`}
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>

          <div className="mt-8 rounded-2xl bg-slate-50 p-4 text-sm text-slate-500 ring-1 ring-inset ring-slate-200">
            <p className="mb-1 font-medium text-slate-700">Test credentials:</p>
            <p>
              Username: <strong className="text-slate-800">emilys</strong>
            </p>
            <p>
              Password: <strong className="text-slate-800">emilyspass</strong>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}