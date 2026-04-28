"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Search, ShoppingCart, UserRound, X } from "lucide-react";
import { useMemo, useState } from "react";
import navbarLogo from "../Logo-navbar.png";

const links = [
  { href: "/", label: "Home" },
  { href: "/shop", label: "Shop" },
  { href: "/about-us", label: "About Us" },
  { href: "/contact", label: "Contact" },
];

const marqueeItems = [
  "WELCOME TO JAYAMANI EXPORT",
  "SIGN UP & ENJOY 10% OFF",
  "FREE SHIPPING ON ALL TAMIL NADU ORDERS RS. 2500+",
  "SIGN UP & ENJOY 10% OFF",
];

export function SiteHeader() {
  const pathname = usePathname();
  const [searchOpen, setSearchOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);

  const activePath = useMemo(() => (pathname === "/" ? "/" : `/${pathname.split("/")[1]}`), [pathname]);

  return (
    <>
      <header className="site-header">
        <div className="top-marquee" aria-label="Store announcements">
          <div className="marquee-track">
            {[...marqueeItems, ...marqueeItems].map((item, index) => (
              <span key={`${item}-${index}`}>{item}</span>
            ))}
          </div>
        </div>
        <div className="shipping-bar">FREE SHIPPING ON ALL ORDERS OVER 2500. LEARN MORE!</div>
        <div className="main-header">
          <div className="container nav-row">
            <Link className="brand-logo navbar-logo" href="/" aria-label="JAYAMANI EXPORT home">
              <Image className="navbar-logo-image" src={navbarLogo} alt="JAYAMANI EXPORT" priority />
            </Link>
            <nav className="primary-nav" aria-label="Primary navigation">
              {links.map((link) => (
                <Link className={activePath === link.href ? "active" : ""} href={link.href} key={link.href}>
                  {link.label}
                </Link>
              ))}
            </nav>
            <div className="nav-tools">
              <button aria-label="Open search" onClick={() => setSearchOpen(true)} type="button">
                <Search />
              </button>
              <button
                aria-label="Open account menu"
                className={accountOpen ? "active" : ""}
                onClick={() => setAccountOpen((value) => !value)}
                type="button"
              >
                <UserRound />
              </button>
              <button aria-label="Open cart" className="cart-button" onClick={() => setCartOpen(true)} type="button">
                <ShoppingCart />
                <span>0</span>
              </button>
              {accountOpen && (
                <div className="account-dropdown">
                  <Link href="/my-account">Dashboard</Link>
                  <a href="#">Logout</a>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {searchOpen && (
        <div className="modal-backdrop" onClick={() => setSearchOpen(false)}>
          <div className="search-modal" onClick={(event) => event.stopPropagation()}>
            <div>
              <strong>TYPE TO SEARCH</strong>
              <button aria-label="Close search" onClick={() => setSearchOpen(false)} type="button">
                <X />
              </button>
            </div>
            <label>
              <input autoFocus placeholder="Search products..." />
              <Search />
            </label>
          </div>
        </div>
      )}

      {cartOpen && (
        <div className="cart-overlay">
          <button className="cart-shade" aria-label="Close cart" onClick={() => setCartOpen(false)} type="button" />
          <aside className="cart-drawer">
            <div className="cart-title">
              <strong>SHOPPING CART</strong>
              <span>0</span>
              <button aria-label="Close cart" onClick={() => setCartOpen(false)} type="button">
                <X />
              </button>
            </div>
            <div className="empty-cart-icon">
              <ShoppingCart />
            </div>
            <p>No products in the cart.</p>
            <Link href="/shop" onClick={() => setCartOpen(false)}>
              Continue Shopping
            </Link>
          </aside>
        </div>
      )}
    </>
  );
}
