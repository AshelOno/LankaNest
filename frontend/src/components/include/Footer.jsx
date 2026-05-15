import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FaFacebook,
  FaInstagram,
  FaLinkedin,
  FaXTwitter,
} from "react-icons/fa6";
import {
  ArrowRight,
  Building2,
  Headphones,
  Home,
  Mail,
  MapPin,
  MessageCircle,
  ShieldCheck,
  Users,
} from "lucide-react";

const footerColumns = [
  {
    title: "Find stays",
    links: [
      { label: "Explore listings", to: "/listings" },
      { label: "Search by area", to: "/search" },
      { label: "How it works", to: "/how-it-works" },
      { label: "Contact support", to: "/contact" },
    ],
  },
  {
    title: "Students",
    links: [
      { label: "Student login", to: "/auth/user-signin" },
      { label: "Create account", to: "/auth/user-signup" },
      { label: "Browse student stays", to: "/listings" },
      { label: "Privacy policy", to: "/privacy-policy#privacy-policy" },
    ],
  },
  {
    title: "Owners",
    links: [
      { label: "Owner login", to: "/auth/houseowner-signin" },
      { label: "List a property", to: "/auth/houseowner-signup" },
      { label: "Owner onboarding", to: "/how-it-works" },
      { label: "Owner support", to: "/contact" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About LankaNest", to: "/about-us" },
      { label: "Contact", to: "/contact" },
      { label: "Terms of service", to: "/privacy-policy#terms-of-service" },
      { label: "Trust and safety", to: "/privacy-policy#trust-safety" },
    ],
  },
];

const socialLinks = [
  { icon: FaFacebook, label: "Facebook", href: "https://www.facebook.com/" },
  { icon: FaInstagram, label: "Instagram", href: "https://www.instagram.com/" },
  { icon: FaXTwitter, label: "X", href: "https://x.com/" },
  { icon: FaLinkedin, label: "LinkedIn", href: "https://www.linkedin.com/" },
];

const trustPoints = [
  { icon: ShieldCheck, label: "Verified listing details" },
  { icon: MapPin, label: "Campus-aware discovery" },
  { icon: MessageCircle, label: "Direct student-owner messaging" },
];

const footerHighlights = [
  { icon: Home, value: "Student stays", label: "Rooms, hostels, and boarding" },
  { icon: Building2, value: "Owner tools", label: "Listings, schedules, inbox" },
  { icon: Users, value: "Sri Lanka", label: "Local housing marketplace" },
];

const contactItems = [
  { icon: Mail, label: "support@lankanest.lk" },
  { icon: Headphones, label: "Student and owner support" },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.42, ease: "easeOut" } },
};

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const footerLinkClass =
    "text-sm font-semibold text-slate-500 transition-colors hover:text-blue-700";

  return (
    <footer className="ln-premium-footer border-t border-blue-100 bg-white text-slate-800">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-40px" }}
      >
        <div className="bg-blue-950 text-white">
          <div className="mx-auto grid max-w-7xl gap-6 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_auto] lg:items-center lg:px-8">
            <motion.div variants={itemVariants}>
              <p className="inline-block bg-gradient-to-r from-lux-gold to-amber-200 bg-clip-text text-sm font-black text-transparent">
                Lankanest
              </p>
              <h2 className="mt-2 max-w-2xl text-2xl font-black leading-tight sm:text-3xl">
                Housing that is easier to compare and safer to trust.
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-blue-100/85">
                Search verified stays, compare useful details, and keep student
                inquiries and owner responses in one clear place.
              </p>
            </motion.div>

            <motion.div
              variants={itemVariants}
              className="flex flex-col gap-3 sm:flex-row lg:justify-end"
            >
              <Link
                to="/listings"
                className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-lg bg-white px-5 py-3 text-sm font-black text-blue-950 shadow-[0_8px_16px_rgba(7,26,61,0.16)] transition hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-[0_12px_24px_rgba(7,26,61,0.24)]"
              >
                Explore listings
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/auth/houseowner-signup"
                className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-lg border border-white/25 bg-white/10 px-5 py-3 text-sm font-black text-white backdrop-blur-md transition hover:-translate-y-0.5 hover:bg-white/20 hover:shadow-lux"
              >
                List a property
              </Link>
            </motion.div>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <motion.div
            variants={itemVariants}
            className="grid gap-4 border-b border-blue-100 pb-10 md:grid-cols-3"
          >
            {footerHighlights.map((item) => (
              <div key={item.value} className="flex items-center gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                  <item.icon className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-black text-blue-950">{item.value}</p>
                  <p className="truncate text-xs font-semibold text-slate-500">
                    {item.label}
                  </p>
                </div>
              </div>
            ))}
          </motion.div>

          <div className="mt-12 grid gap-10 xl:grid-cols-[1.35fr_3fr]">
            <motion.div variants={itemVariants} className="max-w-md">
              <Link to="/" className="inline-flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-[linear-gradient(135deg,var(--ln-sapphire-800),var(--ln-sapphire-600))] p-2 shadow-lux">
                  <img
                    src="/lankanestLogo.png"
                    alt="LankaNest"
                    className="h-full w-full object-contain brightness-0 invert"
                  />
                </span>
                <span className="text-xl font-black text-blue-950">Lankanest</span>
              </Link>

              <p className="mt-5 text-sm leading-7 text-slate-600">
                A Sri Lankan student housing marketplace for boarding places,
                hostels, rentals, schedules, and owner communication.
              </p>

              <div className="mt-6 grid gap-2">
                {trustPoints.map((point) => (
                  <div
                    key={point.label}
                    className="flex items-center gap-3 text-sm font-semibold text-slate-600"
                  >
                    <point.icon className="h-5 w-5 text-emerald-600" />
                    {point.label}
                  </div>
                ))}
              </div>

              <div className="mt-6 grid gap-2">
                {contactItems.map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center gap-3 text-sm font-semibold text-slate-500"
                  >
                    <item.icon className="h-4 w-4 text-blue-700" />
                    {item.label}
                  </div>
                ))}
              </div>
            </motion.div>

            <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
              {footerColumns.map((column) => (
                <motion.div key={column.title} variants={itemVariants}>
                  <h3 className="text-sm font-black text-blue-950">
                    {column.title}
                  </h3>
                  <ul className="mt-4 space-y-3">
                    {column.links.map((link) => (
                      <li key={link.to}>
                        <Link to={link.to} className={footerLinkClass}>
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </div>
          </div>

          <motion.div
            variants={itemVariants}
            className="mt-12 flex flex-col items-center justify-between gap-6 border-t border-blue-100 pt-8 sm:flex-row"
          >
            <div className="flex flex-col items-center gap-3 sm:flex-row sm:gap-6">
              <p className="text-sm font-semibold text-slate-500">
                &copy; {currentYear} LankaNest. All rights reserved.
              </p>
              <div className="flex items-center gap-4 text-sm font-bold text-slate-500">
                <Link
                  to="/privacy-policy#privacy-policy"
                  className="transition-colors hover:text-blue-800"
                >
                  Privacy
                </Link>
                <Link
                  to="/privacy-policy#terms-of-service"
                  className="transition-colors hover:text-blue-800"
                >
                  Terms
                </Link>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {socialLinks.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`LankaNest on ${item.label}`}
                  className="flex h-10 w-10 items-center justify-center rounded-lg border border-blue-100 bg-white text-blue-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-blue-50"
                >
                  <item.icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </motion.div>
        </div>
      </motion.div>
    </footer>
  );
};

export default Footer;
