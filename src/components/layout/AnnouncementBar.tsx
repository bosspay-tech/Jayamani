const announcements = [
  "Welcome to Jayamani Export",
  "Sign up & enjoy 10% off your first order",
  "Free shipping on Tamil Nadu orders ₹2,500+",
];

export function AnnouncementBar() {
  const text = announcements.join("  •  ");

  return (
    <div className="bg-primary text-primary-foreground overflow-hidden">
      <div className="animate-marquee whitespace-nowrap py-2.5 text-xs font-medium tracking-[0.2em] uppercase">
        <span>{text}</span>
        <span className="mx-12">{text}</span>
      </div>
    </div>
  );
}
