import { PolicyPage } from "@/components/layout/PolicyPage";
import { CONTACT_EMAIL, CONTACT_PHONE } from "@/lib/contact";

export const metadata = {
  title: "Terms & Conditions",
};

export default function TermsPage() {
  return (
    <PolicyPage
      title="Terms & Conditions"
      eyebrow="Legal"
      lastUpdated="22 June 2026"
      sections={[
        {
          title: "1. Introduction",
          content: (
            <>
              <p>
                Welcome to Jayamani Export (&quot;Jayamani Collections&quot;,
                &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;). By accessing
                or using our website and placing an order, you agree to be bound
                by these Terms & Conditions. Please read them carefully before
                using our services.
              </p>
              <p>
                If you do not agree with any part of these terms, you should not
                use our website or purchase our products.
              </p>
            </>
          ),
        },
        {
          title: "2. Use of the Website",
          content: (
            <>
              <p>
                You agree to use this website only for lawful purposes. You must
                not misuse the site, attempt unauthorized access, or interfere
                with its operation. Product listings, prices, and availability
                may change without prior notice.
              </p>
              <p>
                We reserve the right to refuse service, cancel orders, or limit
                quantities at our discretion, including in cases of suspected
                fraud, pricing errors, or stock unavailability.
              </p>
            </>
          ),
        },
        {
          title: "3. Account Registration",
          content: (
            <p>
              Creating an account is optional for browsing, but may be required
              for certain features such as order history. You are responsible
              for maintaining the confidentiality of your login credentials and
              for all activity under your account. Please provide accurate
              information during registration and checkout.
            </p>
          ),
        },
        {
          title: "4. Products & Pricing",
          content: (
            <>
              <p>
                We strive to display product images and descriptions as
                accurately as possible. Minor variations in colour, fabric
                texture, or finish may occur due to screen settings or
                manufacturing batches.
              </p>
              <p>
                All prices are listed in Indian Rupees (INR) and are inclusive
                of applicable taxes unless stated otherwise. Shipping charges,
                if any, are calculated at checkout.
              </p>
            </>
          ),
        },
        {
          title: "5. Orders & Payment",
          content: (
            <p>
              Placing an order constitutes an offer to purchase. An order is
              confirmed only after we accept it and send an order confirmation.
              We currently process orders placed through our checkout flow;
              payment terms and methods available at checkout apply to your
              purchase.
            </p>
          ),
        },
        {
          title: "6. Intellectual Property",
          content: (
            <p>
              All content on this website — including logos, text, images,
              graphics, and design — is the property of Jayamani Export or its
              licensors and is protected by applicable intellectual property
              laws. You may not reproduce, distribute, or use our content
              without prior written permission.
            </p>
          ),
        },
        {
          title: "7. Limitation of Liability",
          content: (
            <p>
              To the fullest extent permitted by law, Jayamani Export shall not
              be liable for any indirect, incidental, or consequential damages
              arising from the use of our website or products. Our total
              liability for any claim related to a product or order shall not
              exceed the amount you paid for that order.
            </p>
          ),
        },
        {
          title: "8. Governing Law",
          content: (
            <p>
              These Terms & Conditions are governed by the laws of India. Any
              disputes shall be subject to the exclusive jurisdiction of the
              courts in Tiruvallur, Tamil Nadu.
            </p>
          ),
        },
        {
          title: "9. Contact",
          content: (
            <p>
              For questions about these terms, contact us at{" "}
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="text-accent hover:underline"
              >
                {CONTACT_EMAIL}
              </a>{" "}
              or call{" "}
              <a href={`tel:${CONTACT_PHONE}`} className="text-accent hover:underline">
                {CONTACT_PHONE}
              </a>
              .
            </p>
          ),
        },
      ]}
    />
  );
}
