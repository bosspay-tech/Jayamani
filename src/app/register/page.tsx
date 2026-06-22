"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  AuthField,
  AuthMessage,
  AuthShell,
  AuthSubmitButton,
} from "@/components/auth/AuthForm";

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
    "idle"
  );
  const [message, setMessage] = useState("");

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setStatus("loading");
    setMessage("");

    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fullName, email, password, phone }),
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      setStatus("error");
      setMessage(result.error ?? "Registration failed. Please try again.");
      return;
    }

    setStatus("success");
    setMessage(result.data.message);

    if (result.data.message.includes("confirm")) {
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <AuthShell
      title="Create account"
      subtitle="Join Jayamani Export and get 10% off your first order"
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-accent hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <AuthField
          id="fullName"
          label="Full Name"
          value={fullName}
          onChange={setFullName}
          required
          autoComplete="name"
          placeholder="Your full name"
        />
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
          id="phone"
          label="Phone (optional)"
          type="tel"
          value={phone}
          onChange={setPhone}
          autoComplete="tel"
          placeholder="9384099029"
        />
        <AuthField
          id="password"
          label="Password"
          type="password"
          value={password}
          onChange={setPassword}
          required
          autoComplete="new-password"
          placeholder="At least 6 characters"
        />

        {message && (
          <AuthMessage type={status === "success" ? "success" : "error"} message={message} />
        )}

        <AuthSubmitButton label="Create Account" loading={status === "loading"} />
      </form>
    </AuthShell>
  );
}
