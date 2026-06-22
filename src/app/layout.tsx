import type { Metadata } from "next";
import { DM_Sans, Playfair_Display } from "next/font/google";
import { CartProvider } from "@/components/cart/CartProvider";
import { Toaster } from "@/components/ui/Toaster";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Jayamani Export | Modern Indian Fashion",
    template: "%s | Jayamani Export",
  },
  description:
    "Shop sarees, ethnic wear, t-shirts, and denim at Jayamani Export. Premium quality fashion with free shipping on orders over ₹2,500.",
  keywords: [
    "Jayamani",
    "sarees",
    "ethnic wear",
    "fashion",
    "online shopping",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${dmSans.variable} ${playfair.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <CartProvider>
          {children}
          <Toaster />
        </CartProvider>
      </body>
    </html>
  );
}
