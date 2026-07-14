import { PolicyPage } from "@/components/layout/PolicyPage";
import { CONTACT_EMAIL } from "@/lib/contact";

export const metadata = {
  title: "Privacy Policy",
};

export default function PrivacyPage() {
  return (
    <PolicyPage
      title="Privacy Policy"
      eyebrow="Your Data"
      lastUpdated="22 June 2026"
      sections={[
        {
          title: "1. Overview",
          content: (
            <p>
              Jayamani Export (&quot;Jayamani Collections&quot;) respects your
              privacy. This policy explains what personal information we
              collect, how we use it, and the choices you have regarding your
              data when you visit our website or make a purchase.
            </p>
          ),
        },
        {
          title: "2. Information We Collect",
          content: (
            <>
              <p>We may collect the following types of information:</p>
              <ul className="list-disc space-y-2 pl-5">
                <li>
                  <strong className="text-foreground">Account details:</strong>{" "}
                  name, email address, and password when you register.
                </li>
                <li>
                  <strong className="text-foreground">Order information:</strong>{" "}
                  shipping address, phone number, billing details, and purchase
                  history.
                </li>
                <li>
                  <strong className="text-foreground">Communications:</strong>{" "}
                  messages you send via our contact form or customer support
                  channels.
                </li>
                <li>
                  <strong className="text-foreground">Newsletter:</strong> email
                  address if you subscribe to updates and offers.
                </li>
                <li>
                  <strong className="text-foreground">Technical data:</strong>{" "}
                  browser type, device information, and usage data collected
                  through cookies and similar technologies.
                </li>
              </ul>
            </>
          ),
        },
        {
          title: "3. How We Use Your Information",
          content: (
            <>
              <p>We use your information to:</p>
              <ul className="list-disc space-y-2 pl-5">
                <li>Process and fulfil your orders</li>
                <li>Provide customer support and respond to enquiries</li>
                <li>Send order confirmations and service-related updates</li>
                <li>Send promotional emails if you have opted in to our newsletter</li>
                <li>Improve our website, products, and user experience</li>
                <li>Prevent fraud and maintain the security of our platform</li>
                <li>Comply with legal and regulatory obligations</li>
              </ul>
            </>
          ),
        },
        {
          title: "4. Data Sharing",
          content: (
            <>
              <p>
                We do not sell your personal information. We may share data with
                trusted third parties only when necessary, such as:
              </p>
              <ul className="list-disc space-y-2 pl-5">
                <li>Logistics partners to complete your order</li>
                <li>Technology providers that host and operate our website</li>
              </ul>
              <p>
                All third-party partners are expected to handle your data
                securely and only for the purposes we specify.
              </p>
            </>
          ),
        },
        {
          title: "5. Data Retention",
          content: (
            <p>
              We retain your personal information only for as long as necessary
              to fulfil the purposes outlined in this policy, including order
              records, tax compliance, and dispute resolution. When data is no
              longer needed, we take reasonable steps to delete or anonymize it.
            </p>
          ),
        },
        {
          title: "6. Cookies",
          content: (
            <p>
              Our website uses cookies and similar technologies to remember your
              preferences, keep you signed in, and analyze site traffic. You can
              control cookies through your browser settings, though disabling
              them may affect certain features such as cart persistence and
              login sessions.
            </p>
          ),
        },
        {
          title: "7. Your Rights",
          content: (
            <>
              <p>Depending on applicable law, you may have the right to:</p>
              <ul className="list-disc space-y-2 pl-5">
                <li>Access the personal data we hold about you</li>
                <li>Request correction of inaccurate information</li>
                <li>Request deletion of your data, subject to legal requirements</li>
                <li>Withdraw consent for marketing communications at any time</li>
              </ul>
              <p>
                To exercise these rights, contact us using the details below.
              </p>
            </>
          ),
        },
        {
          title: "8. Security",
          content: (
            <p>
              We implement appropriate technical and organizational measures to
              protect your personal information. However, no method of
              transmission over the internet is completely secure, and we cannot
              guarantee absolute security.
            </p>
          ),
        },
        {
          title: "9. Contact Us",
          content: (
            <p>
              For privacy-related questions or requests, email{" "}
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="text-accent hover:underline"
              >
                {CONTACT_EMAIL}
              </a>{" "}
              or write to us at No. 36/37, Sri Krishna Nagar, 3rd Street
              Annexe, Noombal, Tiruvallur, Tamil Nadu 600077.
            </p>
          ),
        },
      ]}
    />
  );
}
