import { PolicyPage } from "@/components/layout/PolicyPage";
import { CONTACT_EMAIL } from "@/lib/contact";

export const metadata = {
  title: "Shipping Policy",
};

export default function ShippingPage() {
  return (
    <PolicyPage
      title="Shipping Policy"
      eyebrow="Delivery"
      lastUpdated="22 June 2026"
      sections={[
        {
          title: "1. Shipping Coverage",
          content: (
            <p>
              Jayamani Export ships across India. We deliver to most pin codes
              through our courier partners. During checkout, enter your
              delivery address to confirm serviceability for your location.
            </p>
          ),
        },
        {
          title: "2. Shipping Charges",
          content: (
            <>
              <ul className="list-disc space-y-2 pl-5">
                <li>
                  <strong className="text-foreground">Free shipping</strong> on
                  orders of ₹2,500 and above.
                </li>
                <li>
                  A flat shipping fee of{" "}
                  <strong className="text-foreground">₹99</strong> applies to
                  orders below ₹2,500.
                </li>
              </ul>
              <p>
                Shipping charges are calculated automatically at checkout based
                on your cart subtotal before any discounts are applied.
              </p>
            </>
          ),
        },
        {
          title: "3. Order Processing",
          content: (
            <>
              <p>
                Orders are typically processed within{" "}
                <strong className="text-foreground">1–2 business days</strong>{" "}
                after confirmation. You will receive an email or notification
                once your order has been shipped with tracking details where
                available.
              </p>
              <p>
                Orders placed on weekends or public holidays are processed on
                the next business day.
              </p>
            </>
          ),
        },
        {
          title: "4. Estimated Delivery Times",
          content: (
            <>
              <p>Estimated delivery timelines after dispatch:</p>
              <ul className="list-disc space-y-2 pl-5">
                <li>
                  <strong className="text-foreground">Tamil Nadu & nearby states:</strong>{" "}
                  2–5 business days
                </li>
                <li>
                  <strong className="text-foreground">Metro cities:</strong> 3–7
                  business days
                </li>
                <li>
                  <strong className="text-foreground">Other locations:</strong> 5–10
                  business days
                </li>
              </ul>
              <p>
                Delivery times are estimates and may vary due to weather,
                festivals, courier delays, or remote locations. We are not
                responsible for delays caused by factors outside our control.
              </p>
            </>
          ),
        },
        {
          title: "5. Order Tracking",
          content: (
            <p>
              Once your order is shipped, tracking information will be shared
              via email or SMS when available. Logged-in customers can also view
              order status from the Order History section on our website.
            </p>
          ),
        },
        {
          title: "6. Delivery Attempts",
          content: (
            <p>
              Our courier partners typically make up to two delivery attempts.
              If delivery cannot be completed, the package may be returned to us.
              In such cases, please contact us to arrange re-delivery. Additional
              shipping charges may apply for re-shipment.
            </p>
          ),
        },
        {
          title: "7. Incorrect Address",
          content: (
            <p>
              Please ensure your shipping address and phone number are accurate
              at checkout. We are not responsible for delays or failed deliveries
              caused by incorrect or incomplete address details provided by the
              customer. Contact us immediately if you need to update your address
              before the order is dispatched.
            </p>
          ),
        },
        {
          title: "8. Contact",
          content: (
            <p>
              For shipping enquiries, email{" "}
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="text-accent hover:underline"
              >
                {CONTACT_EMAIL}
              </a>{" "}
              or call{" "}
              <a href="tel:9384099029" className="text-accent hover:underline">
                9384099029
              </a>
              . Please include your order number for faster assistance.
            </p>
          ),
        },
      ]}
    />
  );
}
