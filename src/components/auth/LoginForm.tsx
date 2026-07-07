"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import {
  AuthField,
  AuthMessage,
  AuthShell,
  AuthSubmitButton,
} from "@/components/auth/AuthForm";

const DEMO_EMAIL = process.env.NEXT_PUBLIC_DEMO_LOGIN_EMAIL?.trim() ?? "";
const DEMO_PASSWORD = process.env.NEXT_PUBLIC_DEMO_LOGIN_PASSWORD?.trim() ?? "";
const SHOW_DEMO_LOGIN = Boolean(DEMO_EMAIL && DEMO_PASSWORD);

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/";
  const [email, setEmail] = useState(SHOW_DEMO_LOGIN ? DEMO_EMAIL : "");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
    "idle"
  );
  const [message, setMessage] = useState("");

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setStatus("loading");
    setMessage("");

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      setStatus("error");
      setMessage(result.error ?? "Login failed. Please try again.");
      return;
    }

    setStatus("success");
    setMessage(result.data.message);
    router.push(redirectTo);
    router.refresh();
  }

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to your Jayamani account"
      footer={
        <>
          Don&apos;t have an account?{" "}
          <Link href="/register" className="font-semibold text-accent hover:underline">
            Create one
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {SHOW_DEMO_LOGIN && (
          <div className="rounded-2xl border border-border bg-muted/40 p-4 text-sm">
            <p className="font-semibold text-foreground">Demo login credentials</p>
            <p className="mt-2 text-muted-foreground">
              Email: <span className="font-medium text-foreground">{DEMO_EMAIL}</span>
            </p>
            <p className="mt-1 text-muted-foreground">
              Password: <span className="font-medium text-foreground">{DEMO_PASSWORD}</span>
            </p>
            <button
              type="button"
              onClick={() => {
                setEmail(DEMO_EMAIL);
                setPassword(DEMO_PASSWORD);
              }}
              className="mt-3 text-sm font-semibold text-accent hover:underline"
            >
              Use demo credentials
            </button>
          </div>
        )}

        <AuthField
          id="email"
          label="Email"
          type="email"
          value={email}
          onChange={setEmail}
          required
          autoComplete="email"
          placeholder="you@example.com"
        />
        <AuthField
          id="password"
          label="Password"
          type="password"
          value={password}
          onChange={setPassword}
          required
          autoComplete="current-password"
          placeholder="••••••••"
        />

        {message && (
          <AuthMessage
            type={status === "success" ? "success" : "error"}
            message={message}
          />
        )}

        <AuthSubmitButton label="Sign In" loading={status === "loading"} />
      </form>
    </AuthShell>
  );
}
