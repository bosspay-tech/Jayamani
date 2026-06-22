import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import { NewsletterForm } from "@/components/forms/NewsletterForm";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-border bg-primary text-primary-foreground">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-4 lg:px-8">
        <div className="space-y-4">
          <div>
            <p className="font-display text-2xl tracking-[0.15em]">JAYAMANI</p>
            <p className="text-xs tracking-[0.35em] text-accent uppercase">
              Export
            </p>
          </div>
          <div className="space-y-3 text-sm text-primary-foreground/80">
            <p className="flex items-start gap-2">
              <Phone className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
              <a href="tel:9384099029" className="hover:text-accent">
                9384099029
              </a>
            </p>
            <p className="flex items-start gap-2">
              <Mail className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
              <a
                href="mailto:sales@jayamanicollections.com"
                className="hover:text-accent"
              >
                sales@jayamanicollections.com
              </a>
            </p>
            <p className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
              <span>
                No. 36/37, Sri Krishna Nagar, 3rd Street Annexe, Noombal,
                Tiruvallur, Tamil Nadu 600077
              </span>
            </p>
          </div>
          <div className="space-y-1 text-xs text-primary-foreground/60">
            <p>GST REG: 33APGPA9932E1Z6</p>
            <p>UDYAM REG: UDYAM-TN-24-0176464</p>
          </div>
        </div>

        <div>
          <h3 className="mb-4 text-sm font-semibold tracking-[0.2em] uppercase">
            Navigate
          </h3>
          <ul className="space-y-2 text-sm text-primary-foreground/80">
            {[
              { href: "/", label: "Home" },
              { href: "/shop", label: "Shop" },
              { href: "/about", label: "About Us" },
              { href: "/contact", label: "Contact" },
            ].map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="transition hover:text-accent">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="mb-4 text-sm font-semibold tracking-[0.2em] uppercase">
            Information
          </h3>
          <ul className="space-y-2 text-sm text-primary-foreground/80">
            {[
              { href: "/terms", label: "Terms & Conditions" },
              { href: "/privacy", label: "Privacy Policy" },
              { href: "/refund-returns", label: "Refund & Returns Policy" },
              { href: "/shipping", label: "Shipping Policy" },
            ].map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="transition hover:text-accent">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="mb-4 text-sm font-semibold tracking-[0.2em] uppercase">
            Newsletter
          </h3>
          <p className="mb-4 text-sm text-primary-foreground/80">
            Get notified about product launches, special offers, and news.
          </p>
          <NewsletterForm variant="footer" />
        </div>
      </div>

      <div className="border-t border-white/10 py-5 text-center text-xs text-primary-foreground/60">
        JAYAMANI EXPORT © {new Date().getFullYear()}. All Rights Reserved.
      </div>
    </footer>
  );
}
