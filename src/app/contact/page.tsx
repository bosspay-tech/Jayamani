"use client";

import { useState } from "react";
import { Mail, MapPin, Phone } from "lucide-react";
import { SiteShell } from "@/components/layout/SiteShell";
import { CONTACT_EMAIL, CONTACT_PHONE } from "@/lib/contact";
import { createClient } from "@/lib/supabase/client";

export default function ContactPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
    "idle"
  );

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setStatus("loading");

    const supabase = createClient();
    const { error } = await supabase.from("contact_messages").insert(form);

    if (error) {
      setStatus("error");
      return;
    }

    setForm({ name: "", email: "", phone: "", message: "" });
    setStatus("success");
  }

  return (
    <SiteShell>
      <section className="border-b border-border bg-primary py-14 text-primary-foreground sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-xs font-semibold tracking-[0.3em] text-accent uppercase">
            Get in Touch
          </p>
          <h1 className="mt-2 font-display text-4xl sm:text-5xl">Contact Us</h1>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:px-8">
        <div className="space-y-6">
          <h2 className="font-display text-3xl text-foreground">
            We&apos;d love to hear from you
          </h2>
          <p className="text-muted-foreground">
            Questions about orders, products, or wholesale? Reach out and our team
            will respond as soon as possible.
          </p>

          <div className="space-y-4">
            <ContactItem
              icon={Phone}
              label="Phone"
              value={CONTACT_PHONE}
              href={`tel:${CONTACT_PHONE}`}
            />
            <ContactItem
              icon={Mail}
              label="Email"
              value={CONTACT_EMAIL}
              href={`mailto:${CONTACT_EMAIL}`}
            />
            <ContactItem
              icon={MapPin}
              label="Address"
              value="No. 36/37, Sri Krishna Nagar, 3rd Street Annexe, Noombal, Tiruvallur, Tamil Nadu 600077"
            />
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-3xl border border-border bg-surface p-6 sm:p-8"
        >
          <div className="space-y-4">
            <Field
              label="Name"
              value={form.name}
              onChange={(value) => setForm((current) => ({ ...current, name: value }))}
              required
            />
            <Field
              label="Email"
              type="email"
              value={form.email}
              onChange={(value) => setForm((current) => ({ ...current, email: value }))}
              required
            />
            <Field
              label="Phone"
              value={form.phone}
              onChange={(value) => setForm((current) => ({ ...current, phone: value }))}
            />
            <div>
              <label className="mb-2 block text-sm font-medium">Message</label>
              <textarea
                required
                rows={5}
                value={form.message}
                onChange={(event) =>
                  setForm((current) => ({ ...current, message: event.target.value }))
                }
                className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-accent"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={status === "loading"}
            className="mt-6 w-full rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground uppercase transition hover:bg-primary/90 disabled:opacity-60"
          >
            {status === "loading" ? "Sending..." : "Send Message"}
          </button>

          {status === "success" && (
            <p className="mt-3 text-sm text-accent">
              Thank you! Your message has been sent.
            </p>
          )}
          {status === "error" && (
            <p className="mt-3 text-sm text-rose-600">
              Failed to send message. Please try again.
            </p>
          )}
        </form>
      </section>
    </SiteShell>
  );
}

function ContactItem({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: typeof Phone;
  label: string;
  value: string;
  href?: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-border bg-surface p-4">
      <div className="rounded-xl bg-muted p-2 text-accent">
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          {label}
        </p>
        {href ? (
          <a href={href} className="mt-1 text-sm hover:text-accent">
            {value}
          </a>
        ) : (
          <p className="mt-1 text-sm">{value}</p>
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium">{label}</label>
      <input
        type={type}
        required={required}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-accent"
      />
    </div>
  );
}
