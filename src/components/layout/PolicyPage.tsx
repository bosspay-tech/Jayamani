import Link from "next/link";
import { SiteShell } from "@/components/layout/SiteShell";

export interface PolicySection {
  title: string;
  content: React.ReactNode;
}

interface PolicyPageProps {
  title: string;
  eyebrow: string;
  lastUpdated: string;
  sections: PolicySection[];
}

export function PolicyPage({
  title,
  eyebrow,
  lastUpdated,
  sections,
}: PolicyPageProps) {
  return (
    <SiteShell>
      <section className="border-b border-border bg-primary py-14 text-primary-foreground sm:py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <p className="text-xs font-semibold tracking-[0.3em] text-accent uppercase">
            {eyebrow}
          </p>
          <h1 className="mt-2 font-display text-4xl sm:text-5xl">{title}</h1>
          <p className="mt-3 text-sm text-primary-foreground/70">
            Last updated: {lastUpdated}
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-14 sm:px-6 lg:px-8">
        <article className="space-y-10 rounded-3xl border border-border bg-surface p-6 sm:p-10">
          {sections.map((section) => (
            <section key={section.title}>
              <h2 className="font-display text-2xl text-foreground">
                {section.title}
              </h2>
              <div className="mt-4 space-y-4 text-sm leading-relaxed text-muted-foreground">
                {section.content}
              </div>
            </section>
          ))}
        </article>

        <div className="mt-8 flex flex-wrap gap-3 text-sm">
          <PolicyLink href="/terms" label="Terms & Conditions" />
          <PolicyLink href="/privacy" label="Privacy Policy" />
          <PolicyLink href="/refund-returns" label="Refund & Returns" />
          <PolicyLink href="/shipping" label="Shipping Policy" />
        </div>
      </section>
    </SiteShell>
  );
}

function PolicyLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="rounded-full border border-border px-4 py-2 text-muted-foreground transition hover:border-accent hover:text-accent"
    >
      {label}
    </Link>
  );
}
