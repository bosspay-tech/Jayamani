"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, Menu, Package, Search, Settings, ShoppingBag, User, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useCart } from "@/components/cart/CartProvider";
import type { AuthUser } from "@/lib/api/auth";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/shop", label: "Shop" },
  { href: "/about", label: "About Us" },
  { href: "/contact", label: "Contact" },
];

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { itemCount } = useCart();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      try {
        const response = await fetch("/api/auth/me");
        if (response.ok) {
          const result = await response.json();
          setUser(result.data.user);
        } else {
          setUser(null);
        }
      } catch {
        setUser(null);
      } finally {
        setAuthLoading(false);
      }
    }

    loadUser();
  }, [pathname]);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="group flex flex-col leading-none">
          <span className="font-display text-xl tracking-[0.18em] text-foreground sm:text-2xl">
            JAYAMANI
          </span>
          <span className="mt-1 text-[10px] font-medium tracking-[0.35em] text-accent uppercase">
            Export
          </span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "text-sm font-medium tracking-wide transition-colors hover:text-accent",
                pathname === link.href
                  ? "text-accent"
                  : "text-muted-foreground"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/shop"
            className="hidden rounded-full p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground sm:inline-flex"
            aria-label="Search shop"
          >
            <Search className="h-5 w-5" />
          </Link>

          {!authLoading && (
            <>
              {user ? (
                <div className="hidden items-center gap-2 sm:flex">
                  <Link
                    href="/orders"
                    className="rounded-full p-2 text-muted-foreground transition hover:bg-muted hover:text-accent"
                    aria-label="Order history"
                  >
                    <Package className="h-5 w-5" />
                  </Link>
                  {user.isAdmin && (
                    <Link
                      href="/admin"
                      className="rounded-full p-2 text-muted-foreground transition hover:bg-muted hover:text-accent"
                      aria-label="Admin panel"
                    >
                      <Settings className="h-5 w-5" />
                    </Link>
                  )}
                  <span className="max-w-[140px] truncate text-xs text-muted-foreground">
                    {user.fullName ?? user.email}
                  </span>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="rounded-full p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                    aria-label="Logout"
                  >
                    <LogOut className="h-5 w-5" />
                  </button>
                </div>
              ) : (
                <Link
                  href="/login"
                  className="hidden rounded-full p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground sm:inline-flex"
                  aria-label="Login"
                >
                  <User className="h-5 w-5" />
                </Link>
              )}
            </>
          )}

          <Link
            href="/cart"
            className="relative rounded-full p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
            aria-label="Shopping cart"
          >
            <ShoppingBag className="h-5 w-5" />
            {itemCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-accent-foreground">
                {itemCount}
              </span>
            )}
          </Link>

          <button
            type="button"
            className="rounded-full p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground md:hidden"
            onClick={() => setMobileOpen((open) => !open)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <nav className="border-t border-border/60 bg-background px-4 py-4 md:hidden">
          <div className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "rounded-lg px-3 py-2.5 text-sm font-medium",
                  pathname === link.href
                    ? "bg-muted text-accent"
                    : "text-foreground"
                )}
              >
                {link.label}
              </Link>
            ))}
            {!authLoading &&
              (user ? (
                <>
                  <Link
                    href="/orders"
                    onClick={() => setMobileOpen(false)}
                    className="rounded-lg px-3 py-2.5 text-sm font-medium text-foreground"
                  >
                    Order History
                  </Link>
                  {user.isAdmin && (
                    <Link
                      href="/admin"
                      onClick={() => setMobileOpen(false)}
                      className="rounded-lg px-3 py-2.5 text-sm font-medium text-accent"
                    >
                      Admin Panel
                    </Link>
                  )}
                  <button
                  type="button"
                  onClick={() => {
                    setMobileOpen(false);
                    handleLogout();
                  }}
                  className="rounded-lg px-3 py-2.5 text-left text-sm font-medium text-foreground"
                >
                  Logout ({user.fullName ?? user.email})
                </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    onClick={() => setMobileOpen(false)}
                    className="rounded-lg px-3 py-2.5 text-sm font-medium text-foreground"
                  >
                    Login
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setMobileOpen(false)}
                    className="rounded-lg px-3 py-2.5 text-sm font-medium text-accent"
                  >
                    Register
                  </Link>
                </>
              ))}
          </div>
        </nav>
      )}
    </header>
  );
}
