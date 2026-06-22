import Link from "next/link";

export default function AdminAccessPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md rounded-3xl border border-border bg-surface p-8 text-center">
        <p className="text-xs font-semibold tracking-[0.3em] text-accent uppercase">
          Admin Access
        </p>
        <h1 className="mt-3 font-display text-3xl text-foreground">
          Admin permission required
        </h1>
        <p className="mt-4 text-sm text-muted-foreground">
          Your account is logged in but does not have admin access yet. Run this
          in the project folder with your email:
        </p>
        <code className="mt-4 block rounded-2xl bg-muted px-4 py-3 text-left text-xs">
          npm run make-admin -- your@email.com
        </code>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/"
            className="rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground uppercase"
          >
            Back to store
          </Link>
          <Link
            href="/login?redirect=/admin"
            className="rounded-full border border-border px-5 py-3 text-sm font-semibold uppercase"
          >
            Switch account
          </Link>
        </div>
      </div>
    </div>
  );
}
