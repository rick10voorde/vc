"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setMessage("Check your email for the confirmation link!");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f0f0f] px-4">
      <div className="max-w-md w-full card">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[#3b82f6] mb-2">vochat.io</h1>
          <p className="text-[#a1a1aa]">Create your account</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-md">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {message && (
          <div className="mb-4 p-3 bg-[#3b82f6]/10 border border-[#3b82f6]/30 rounded-md">
            <p className="text-sm text-[#3b82f6]">{message}</p>
          </div>
        )}

        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-[#e4e4e7] mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="input w-full"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-[#e4e4e7] mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="input w-full"
              placeholder="••••••••"
            />
            <p className="mt-1 text-xs text-[#71717a]">At least 6 characters</p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Creating account..." : "Sign up"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-[#a1a1aa]">
          Already have an account?{" "}
          <Link href="/auth/login" className="text-[#3b82f6] hover:text-[#2563eb] font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
