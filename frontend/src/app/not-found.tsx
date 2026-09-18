import Link from "next/link";
import { Activity, Database, Home } from "lucide-react";
import Button from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4 relative overflow-hidden">
      <div className="glow-blob top-[-120px] left-1/2 -translate-x-1/2 h-[380px] w-[520px] bg-signal/30" aria-hidden="true" />
      <div className="glow-blob bottom-[-160px] right-[-80px] h-[360px] w-[360px] bg-info/25" aria-hidden="true" />
      <div className="w-full max-w-md relative text-center">
        <div className="flex justify-center mb-6">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-signal/15 border border-signal/30 shadow-[var(--shadow-glow-emerald)]">
            <Activity className="h-6 w-6 text-signal" />
          </div>
        </div>
        <p className="font-display font-semibold text-7xl tracking-tight text-text-primary bg-clip-text text-transparent bg-gradient-to-b from-text-primary to-text-muted">
          404
        </p>
        <h1 className="font-display font-semibold text-xl text-text-primary mt-4">
          Page not found
        </h1>
        <p className="text-sm text-text-muted mt-2 max-w-xs mx-auto">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
          <Link href="/dashboard">
            <Button>
              <Home className="h-4 w-4" />
              Go to Dashboard
            </Button>
          </Link>
          <Link href="/datasets">
            <Button variant="secondary">
              <Database className="h-4 w-4" />
              Browse Datasets
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}