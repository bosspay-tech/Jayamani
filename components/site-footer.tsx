import Link from "next/link";
import Image from "next/image";
import brandLogo from "../Logo-navbar.png";

const address = [
  "JAYAMANI EXPORT",
  "Mobile : 9384099029",
  "sales@jayamanicollections.com",
  "NO36/37, SRI KRISHNA NAGAR, 3RD STREET ANNEXE,",
  "NOOMBAL, Tiruvallur, Tamil Nadu, 600077",
];

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-grid container">
        <div>
          <Link className="footer-logo brand-logo footer-image-logo" href="/" aria-label="JAYAMANI EXPORT home">
            <Image className="footer-logo-image" src={brandLogo} alt="JAYAMANI EXPORT" />
          </Link>
          <address>
            {address.map((line) => (
              <span key={line}>{line}</span>
            ))}
          </address>
          <small>GST REG : 33APGPA9932E1Z6</small>
          <small>UDAYAM REG : UDYAM-TN-24-0176464</small>
        </div>
        <div>
          <h3>Navigate</h3>
          <Link href="/">Home</Link>
          <Link href="/shop">Shop</Link>
          <Link href="/about-us">About Us</Link>
          <Link href="/contact">Contact</Link>
        </div>
        <div>
          <h3>Informations</h3>
          <a href="#">Terms & Conditions</a>
          <a href="#">Privacy Policy</a>
          <a href="#">Refund and Returns Policy</a>
          <a href="#">Shipping Policy</a>
        </div>
        <div className="newsletter">
          <h3>Newsletter</h3>
          <p>Subscribe to get notified about product launches, special offers and news.</p>
          <input placeholder="sales@jayamanicollections.com" />
          <button>Subscribe</button>
        </div>
      </div>
      <div className="copyright container">JAYAMANI EXPORT © 2026. All Rights Reserved.</div>
    </footer>
  );
}
