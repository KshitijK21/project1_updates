"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { ArrowLeft, Mail, KeyRound } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { requestPasswordReset, resetPassword } from "@/lib/api/auth";
import { useToast } from "@/components/ui/Toast";
import { isAxiosError } from "axios";

export default function ForgotPasswordPage() {
  const { showToast } = useToast();

  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function handleRequest(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await requestPasswordReset({ email });
      showToast("If an account exists, a reset code has been sent.", "success");
      setStep(2);
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

  async function handleReset(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      await resetPassword({ email, code, new_password: password });
      showToast("Password reset successful. Sign in with your new password.", "success");
      setDone(true);
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
            {step === 1 ? <Mail className="h-5 w-5 text-signal" /> : <KeyRound className="h-5 w-5 text-signal" />}
          </div>
          <h1 className="font-display font-semibold text-lg text-text-primary">
            {done ? "Password updated" : step === 1 ? "Reset your password" : "Enter reset code"}
          </h1>
          <p className="text-sm text-text-muted mt-1 text-center">
            {done
              ? "Your password has been reset successfully."
              : step === 1
                ? "Enter your account email to receive a 6-digit reset code."
                : `We sent a code to ${email}. Check the server console for it.`}
          </p>
        </div>

        {done ? (
          <div className="glass border border-border rounded-[var(--radius-lg)] shadow-[var(--shadow-glow)] p-6 space-y-4">
            <Link
              href="/login"
              className="w-full inline-flex items-center justify-center gap-1.5 text-sm font-medium text-zinc-950 bg-signal hover:bg-[#34d399] rounded-[var(--radius-md)] h-10 transition-colors"
            >
              Back to sign in
            </Link>
          </div>
        ) : step === 1 ? (
          <form
            onSubmit={handleRequest}
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

            {error && (
              <p className="text-sm text-negative bg-negative/10 border border-negative/30 rounded-[var(--radius-sm)] px-3 py-2">
                {error}
              </p>
            )}

            <Button type="submit" className="w-full" loading={loading}>
              Send reset code
            </Button>
          </form>
        ) : (
          <form
            onSubmit={handleReset}
            className="glass border border-border rounded-[var(--radius-lg)] shadow-[var(--shadow-glow)] p-6 space-y-4"
          >
            <Input
              label="Reset code"
              inputMode="numeric"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="6-digit code"
              required
            />

            <Input
              label="New password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              required
              autoComplete="new-password"
            />

            <Input
              label="Confirm new password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter password"
              required
              autoComplete="new-password"
              error={confirmPassword.length > 0 && password !== confirmPassword ? "Passwords do not match" : undefined}
            />

            {error && (
              <p className="text-sm text-negative bg-negative/10 border border-negative/30 rounded-[var(--radius-sm)] px-3 py-2">
                {error}
              </p>
            )}

            <Button type="submit" className="w-full" loading={loading}>
              Reset password
            </Button>

            <button
              type="button"
              onClick={() => setStep(1)}
              className="w-full text-center text-xs text-text-muted hover:text-signal transition-colors"
            >
              Resend code to a different email
            </button>
          </form>
        )}

        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-sm text-signal hover:underline mt-6"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to sign in
        </Link>
      </div>
    </div>
  );
}