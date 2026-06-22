"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export function NewsletterForm({
  variant = "default",
}: {
  variant?: "default" | "footer";
}) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
    "idle"
  );

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setStatus("loading");

    const supabase = createClient();
    const { error } = await supabase
      .from("newsletter_subscribers")
      .insert({ email });

    if (error) {
      setStatus(error.code === "23505" ? "success" : "error");
      return;
    }

    setEmail("");
    setStatus("success");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div
        className={cn(
          "flex overflow-hidden rounded-full border",
          variant === "footer"
            ? "border-white/20 bg-white/5"
            : "border-border bg-surface"
        )}
      >
        <input
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="Your email address"
          className={cn(
            "min-w-0 flex-1 bg-transparent px-4 py-3 text-sm outline-none",
            variant === "footer"
              ? "text-primary-foreground placeholder:text-primary-foreground/50"
              : "text-foreground placeholder:text-muted-foreground"
          )}
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="bg-accent px-5 py-3 text-sm font-semibold text-accent-foreground transition hover:brightness-110 disabled:opacity-60"
        >
          {status === "loading" ? "..." : "Subscribe"}
        </button>
      </div>
      {status === "success" && (
        <p className="text-xs text-accent">Thanks for subscribing!</p>
      )}
      {status === "error" && (
        <p className="text-xs text-rose-300">
          Something went wrong. Please try again.
        </p>
      )}
    </form>
  );
}
