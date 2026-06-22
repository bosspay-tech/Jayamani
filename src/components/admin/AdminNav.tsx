import Link from "next/link";
import { LayoutDashboard, Package, Store } from "lucide-react";

const adminLinks = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/products", label: "Products", icon: Package },
];

export function AdminNav() {
  return (
    <aside className="w-full border-b border-border bg-surface lg:w-64 lg:border-r lg:border-b-0 lg:min-h-screen">
      <div className="flex h-16 items-center justify-between px-4 lg:px-6">
        <div>
          <p className="font-display text-lg tracking-[0.12em]">ADMIN</p>
          <p className="text-[10px] tracking-[0.3em] text-accent uppercase">
            Jayamani
          </p>
        </div>
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-accent"
        >
          <Store className="h-3.5 w-3.5" />
          Store
        </Link>
      </div>
      <nav className="flex gap-1 overflow-x-auto px-3 pb-4 lg:flex-col lg:px-4">
        {adminLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="inline-flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            <link.icon className="h-4 w-4" />
            {link.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
