import { PolicyPage } from "@/components/layout/PolicyPage";
import { CONTACT_EMAIL } from "@/lib/contact";

export const metadata = {
  title: "Refund & Returns Policy",
};

export default function RefundReturnsPage() {
  return (
    <PolicyPage
      title="Refund & Returns Policy"
      eyebrow="Customer Care"
      lastUpdated="22 June 2026"
      sections={[
        {
          title: "1. Our Commitment",
          content: (
            <p>
              At Jayamani Export, we want you to be satisfied with your purchase.
              If you receive a defective, damaged, or incorrect item, we will
              work with you to resolve the issue through a return, exchange, or
              refund as described below.
            </p>
          ),
        },
        {
          title: "2. Return Eligibility",
          content: (
            <>
              <p>Returns may be accepted under the following conditions:</p>
              <ul className="list-disc space-y-2 pl-5">
                <li>
                  The item is unused, unworn, unwashed, and in its original
                  condition with tags attached.
                </li>
                <li>
                  You notify us within <strong className="text-foreground">7 days</strong> of
                  delivery for eligible products.
                </li>
                <li>
                  The product is not listed as non-returnable (e.g. innerwear,
                  customized items, or sale items marked as final sale).
                </li>
                <li>
                  You provide proof of purchase (order number or confirmation
                  email).
                </li>
              </ul>
            </>
          ),
        },
        {
          title: "3. Non-Returnable Items",
          content: (
            <>
              <p>The following items generally cannot be returned or exchanged:</p>
              <ul className="list-disc space-y-2 pl-5">
                <li>Innerwear, socks, and intimate apparel</li>
                <li>Products marked as final sale or clearance</li>
                <li>Customized or altered garments</li>
                <li>Items damaged due to misuse or normal wear after use</li>
              </ul>
            </>
          ),
        },
        {
          title: "4. How to Request a Return",
          content: (
            <>
              <p>To initiate a return or exchange:</p>
              <ol className="list-decimal space-y-2 pl-5">
                <li>
                  Contact us at{" "}
                  <a
                    href={`mailto:${CONTACT_EMAIL}`}
                    className="text-accent hover:underline"
                  >
                    {CONTACT_EMAIL}
                  </a>{" "}
                  or call{" "}
                  <a href="tel:9384099029" className="text-accent hover:underline">
                    9384099029
                  </a>{" "}
                  with your order number and reason for return.
                </li>
                <li>
                  Our team will review your request and provide return
                  instructions if approved.
                </li>
                <li>
                  Pack the item securely in its original packaging where
                  possible and ship it as instructed.
                </li>
              </ol>
            </>
          ),
        },
        {
          title: "5. Refunds",
          content: (
            <>
              <p>
                Once we receive and inspect the returned item, eligible refunds
                will be processed to your original payment method within{" "}
                <strong className="text-foreground">7–10 business days</strong>.
              </p>
              <p>
                Original shipping charges are non-refundable unless the return
                is due to our error (wrong item, defective product, etc.). Return
                shipping costs are the customer&apos;s responsibility unless
                otherwise stated at the time of approval.
              </p>
            </>
          ),
        },
        {
          title: "6. Exchanges",
          content: (
            <p>
              If you wish to exchange an item for a different size or colour,
              contact us within 7 days of delivery. Exchanges are subject to
              stock availability. If the requested replacement is unavailable, we
              will offer a refund or store credit as an alternative.
            </p>
          ),
        },
        {
          title: "7. Damaged or Incorrect Orders",
          content: (
            <p>
              If your order arrives damaged or you received the wrong item,
              please contact us within 48 hours of delivery with photos of the
              product and packaging. We will arrange a replacement or full
              refund at no additional cost to you.
            </p>
          ),
        },
        {
          title: "8. Cancellations",
          content: (
            <p>
              Orders may be cancelled before they are shipped. Once dispatched,
              the order cannot be cancelled and will be subject to our standard
              return policy upon delivery. Contact us as soon as possible if you
              need to cancel an order.
            </p>
          ),
        },
      ]}
    />
  );
}
