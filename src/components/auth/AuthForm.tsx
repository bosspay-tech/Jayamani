import Link from "next/link";
import { cn } from "@/lib/utils";

interface AuthFieldProps {
  label: string;
  id: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  autoComplete?: string;
  placeholder?: string;
}

export function AuthField({
  label,
  id,
  type = "text",
  value,
  onChange,
  required,
  autoComplete,
  placeholder,
}: AuthFieldProps) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm font-medium text-foreground">
        {label}
      </label>
      <input
        id={id}
        type={type}
        required={required}
        value={value}
        autoComplete={autoComplete}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-accent"
      />
    </div>
  );
}

interface AuthShellProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}

export function AuthShell({ title, subtitle, children, footer }: AuthShellProps) {
  return (
    <div className="min-h-screen bg-background">
      <div className="grid min-h-screen lg:grid-cols-2">
        <div className="relative hidden overflow-hidden bg-primary lg:block">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(201,162,39,0.2),transparent_50%)]" />
          <div className="relative flex h-full flex-col justify-between p-12 text-primary-foreground">
            <Link href="/" className="inline-flex flex-col leading-none">
              <span className="font-display text-3xl tracking-[0.18em]">JAYAMANI</span>
              <span className="mt-1 text-xs tracking-[0.35em] text-accent uppercase">
                Export
              </span>
            </Link>
            <div>
              <p className="text-xs font-semibold tracking-[0.3em] text-accent uppercase">
                Member Benefits
              </p>
              <h2 className="mt-3 font-display text-4xl leading-tight">
                Sign up & enjoy 10% off your first order
              </h2>
              <p className="mt-4 max-w-md text-primary-foreground/80">
                Create an account to track orders, save wishlists, and get early
                access to new saree and ethnic wear collections.
              </p>
            </div>
            <p className="text-sm text-primary-foreground/60">
              Free shipping on Tamil Nadu orders over ₹2,500
            </p>
          </div>
        </div>

        <div className="flex items-center justify-center px-4 py-12 sm:px-8">
          <div className="w-full max-w-md">
            <Link
              href="/"
              className="mb-8 inline-flex flex-col leading-none lg:hidden"
            >
              <span className="font-display text-2xl tracking-[0.18em]">JAYAMANI</span>
              <span className="mt-1 text-[10px] tracking-[0.35em] text-accent uppercase">
                Export
              </span>
            </Link>
            <h1 className="font-display text-3xl text-foreground">{title}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
            <div className="mt-8">{children}</div>
            <div className="mt-6 text-center text-sm text-muted-foreground">{footer}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AuthMessage({
  type,
  message,
}: {
  type: "success" | "error";
  message: string;
}) {
  return (
    <p
      className={cn(
        "rounded-2xl px-4 py-3 text-sm",
        type === "success"
          ? "bg-accent/15 text-foreground"
          : "bg-rose/20 text-foreground"
      )}
    >
      {message}
    </p>
  );
}

export function AuthSubmitButton({
  label,
  loading,
}: {
  label: string;
  loading: boolean;
}) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="w-full rounded-full bg-primary py-3 text-sm font-semibold tracking-wide text-primary-foreground uppercase transition hover:bg-primary/90 disabled:opacity-60"
    >
      {loading ? "Please wait..." : label}
    </button>
  );
}
