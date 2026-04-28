import { Mail, MapPin, Phone, Timer } from "lucide-react";
import { PageHero } from "@/components/page-hero";

export default function ContactPage() {
  return (
    <main>
      <PageHero title="Contact Us" plain />
      <section className="contact-map container">
        <iframe
          title="JAYAMANI EXPORT map"
          src="https://www.google.com/maps?q=NO36%2F37%2C%20SRI%20KRISHNA%20NAGAR%2C%203RD%20STREET%20ANNEXE%2C%20NOOMBAL%2C%20Tiruvallur%2C%20Tamil%20Nadu%2C%20600077&output=embed"
          loading="lazy"
        />
      </section>
      <section className="contact-section container">
        <h2>Get in touch with us</h2>
        <p className="contact-kicker">
          FOR MORE INFORMATION ABOUT OUR PRODUCT & SERVICES, PLEASE FEEL FREE TO DROP US AN EMAIL.
          OUR STAFF ALWAYS BE THERE TO HELP YOU OUT. DO NOT HESITATE!
        </p>
        <div className="contact-grid">
          <aside className="contact-details">
            <div>
              <MapPin />
              <span>
                <h3>Address</h3>
                <p>JAYAMANI EXPORT</p>
                <p>NO36/37, SRI KRISHNA NAGAR, 3RD STREET ANNEXE, NOOMBAL</p>
                <p>Tiruvallur, Tamil Nadu, 600077</p>
                <p>GST REG : 33APGPA9932E1Z6</p>
                <p>UDAYAM REG : UDYAM-TN-24-0176464</p>
              </span>
            </div>
            <div>
              <Phone />
              <span>
                <h3>Phone</h3>
                <p>Mobile : 9384099029</p>
                <p>E-mail: sales@jayamanicollections.com</p>
              </span>
            </div>
            <div>
              <Timer />
              <span>
                <h3>Working Time</h3>
                <p>Monday - Friday: 10:00 - 18:00</p>
                <p>Saturday : 12:00 - 17:00</p>
              </span>
            </div>
            <div>
              <Mail />
              <span>
                <h3>Mail</h3>
                <p>sales@jayamanicollections.com</p>
              </span>
            </div>
          </aside>
          <form className="contact-form">
            <h3>Drop us a line</h3>
            <div className="form-row">
              <label>
                Name*
                <input placeholder="John Doe" />
              </label>
              <label>
                Email*
                <input placeholder="your@email.com" />
              </label>
            </div>
            <label>
              Subject
              <input placeholder="This is an optional" />
            </label>
            <label>
              Message*
              <textarea placeholder="Hi! I'd like to ask about..." />
            </label>
            <button type="button">Submit</button>
          </form>
        </div>
      </section>
    </main>
  );
}
