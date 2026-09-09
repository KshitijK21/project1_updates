"use client";

import Link from "next/link";
import { ArrowLeft, Mail } from "lucide-react";

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4">
      <div className="w-full max-w-sm text-center">
        <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-sm)] bg-signal/10 border border-signal/30 mb-4 mx-auto">
          <Mail className="h-5 w-5 text-signal" />
        </div>
        <h1 className="font-display font-semibold text-lg text-text-primary">
          Password reset
        </h1>
        <p className="text-sm text-text-muted mt-2 max-w-xs mx-auto">
          Self-service password reset isn&apos;t available yet. Please contact an
          administrator to reset your password.
        </p>
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