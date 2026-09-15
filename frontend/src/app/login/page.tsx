"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Activity } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { loginRequest } from "@/lib/api/auth";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/components/ui/Toast";
import { isAxiosError } from "axios";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const { showToast } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await loginRequest({ email, password });
      login(data.access_token, email, data.role);
      showToast("Logged in successfully", "success");
      router.push("/dashboard");
    } catch (err) {
      if (isAxiosError(err) && err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4 relative overflow-hidden">
      <div className="glow-blob top-[-120px] left-1/2 -translate-x-1/2 h-[380px] w-[520px] bg-signal/30" aria-hidden="true" />
      <div className="glow-blob bottom-[-160px] right-[-80px] h-[360px] w-[360px] bg-info/25" aria-hidden="true" />
      <div className="w-full max-w-sm relative">
        <div className="flex flex-col items-center mb-8">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-signal/15 border border-signal/30 mb-3 shadow-[var(--shadow-glow-emerald)]">
            <Activity className="h-5 w-5 text-signal" />
          </div>
          <h1 className="font-display font-semibold text-lg text-text-primary">
            Autonomous BI Platform
          </h1>
          <p className="text-sm text-text-muted mt-1">Sign in to your account</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="glass border border-border rounded-[var(--radius-lg)] shadow-[var(--shadow-glow)] p-6 space-y-4"
        >
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            autoComplete="email"
          />

          <div className="relative">
            <Input
              label="Password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="current-password"
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-3 top-[34px] p-1 rounded-[var(--radius-sm)] text-text-muted hover:text-text-primary transition-colors"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          {error && (
            <p className="text-sm text-negative bg-negative/10 border border-negative/30 rounded-[var(--radius-sm)] px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex justify-end">
            <Link href="/forgot-password" className="text-xs text-text-muted hover:text-signal">
              Forgot password?
            </Link>
          </div>

          <Button type="submit" className="w-full" loading={loading}>
            Sign in
          </Button>
        </form>

        <p className="text-center text-sm text-text-muted mt-6">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-signal hover:underline">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}