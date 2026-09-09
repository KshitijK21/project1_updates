import { InputHTMLAttributes, forwardRef } from "react";
import { cn } from "@/utils/cn";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="mb-1.5 block text-sm font-medium text-text-secondary"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            "w-full h-10 rounded-[var(--radius-sm)] bg-surface border border-border px-3 text-sm text-text-primary",
            "placeholder:text-text-muted",
            "focus:outline-none focus:ring-2 focus:ring-signal/40 focus:border-signal-dim",
            "transition-colors duration-150",
            error && "border-negative focus:ring-negative/40 focus:border-negative",
            className
          )}
          {...props}
        />
        {hint && !error && <p className="mt-1.5 text-xs text-text-muted">{hint}</p>}
        {error && <p className="mt-1.5 text-xs text-negative">{error}</p>}
      </div>
    );
  }
);
Input.displayName = "Input";

export default Input;
