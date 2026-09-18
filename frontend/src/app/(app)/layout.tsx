"use client";

import { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldAlert, ShieldCheck } from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import BrandSplash from "@/components/layout/BrandSplash";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/components/ui/Toast";
import { verifyEmail } from "@/lib/api/auth";
import { isAxiosError } from "axios";

export default function ProtectedLayout({ children }: { children: ReactNode }) {
  const { isAuthenticated, loading, email, isVerified, setVerified } = useAuth();
  const router = useRouter();
  const { showToast } = useToast();

  const [verifyOpen, setVerifyOpen] = useState(false);
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState("");
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [loading, isAuthenticated, router]);

  useEffect(() => {
    if (!loading) return;
    const timer = setTimeout(() => setTimedOut(true), 10000);
    return () => clearTimeout(timer);
  }, [loading]);

  async function handleVerify() {
    if (!email || verifying) return;
    setVerifying(true);
    setVerifyError("");
    try {
      await verifyEmail({ email, code });
      setVerified(true);
      setVerifyOpen(false);
      setCode("");
      showToast("Email verified successfully", "success");
    } catch (err) {
      if (isAxiosError(err) && err.response?.data?.detail) {
        setVerifyError(err.response.data.detail);
      } else {
        setVerifyError("Something went wrong. Please try again.");
      }
    } finally {
      setVerifying(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-bg">
        {timedOut ? (
          <div className="flex flex-col items-center gap-4 text-center px-6">
            <p className="text-sm text-text-muted max-w-sm">
              Taking too long? Check your connection and try again.
            </p>
            <Button onClick={() => window.location.reload()}>Retry</Button>
          </div>
        ) : (
          <BrandSplash label="Initializing workspace…" />
        )}
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <AppShell>
      {!isVerified && email && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-amber-500/30 bg-amber-500/10 px-5 py-2.5">
          <p className="flex items-center gap-2 text-sm text-amber-200">
            <ShieldAlert className="h-4 w-4 shrink-0" />
            Please verify your email. Check the server console for your verification code.
          </p>
          <Button size="sm" onClick={() => setVerifyOpen(true)}>
            <ShieldCheck className="h-4 w-4 mr-1" />
            Verify
          </Button>
        </div>
      )}
      {children}

      <Modal open={verifyOpen} onClose={() => setVerifyOpen(false)} title="Verify your email" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-text-muted">
            Enter the 6-digit verification code that was printed to the server console when you
            registered.
          </p>
          <Input
            label="Verification code"
            inputMode="numeric"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="6-digit code"
          />
          {verifyError && (
            <p className="text-sm text-negative bg-negative/10 border border-negative/30 rounded-[var(--radius-sm)] px-3 py-2">
              {verifyError}
            </p>
          )}
          <Button onClick={handleVerify} className="w-full" loading={verifying} disabled={code.trim().length === 0}>
            Verify
          </Button>
        </div>
      </Modal>
    </AppShell>
  );
}