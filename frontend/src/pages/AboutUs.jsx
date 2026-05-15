import React from "react";
import { motion } from "framer-motion";
import {
  FiShield,
  FiUsers,
  FiHome,
  FiMapPin,
  FiMessageSquare,
  FiStar,
} from "react-icons/fi";
import { BsGraphUpArrow } from "react-icons/bs";
import { FaCheckCircle } from "react-icons/fa";

const stats = [
  { label: "Verified landlords", value: "Built for trust" },
  { label: "Student-first discovery", value: "Faster matching" },
  { label: "Smart booking", value: "Seamless visits" },
  { label: "Safe communication", value: "In-app messaging" },
];

const principles = [
  {
    icon: <FiShield className="text-xl" />,
    title: "Trust and safety",
    text: "Verification, moderation, and reporting tools help keep the platform reliable and secure.",
  },
  {
    icon: <FiHome className="text-xl" />,
    title: "Better property discovery",
    text: "Students can find boarding houses near their university using filters, maps, and recommendations.",
  },
  {
    icon: <FiMessageSquare className="text-xl" />,
    title: "Direct communication",
    text: "Built-in chat and scheduling help students connect with landlords without friction.",
  },
  {
    icon: <BsGraphUpArrow className="text-xl" />,
    title: "Data-driven platform",
    text: "Analytics, recommendations, and ranking logic improve the experience for everyone.",
  },
];

const highlights = [
  "University-based property search",
  "Verified landlord profiles",
  "Review and rating system",
  "Visit scheduling and reminders",
  "Premium subscription features",
  "AI-powered recommendations",
];

const AboutUs = () => {
  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-sky-100/50 via-slate-50 to-white pb-10">
      <section className="mx-auto max-w-[1440px] px-4 pb-16 pt-8 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="rounded-[2.5rem] border border-white/50 bg-white/70 p-8 shadow-[0_12px_40px_rgba(15,23,42,0.06)] backdrop-blur-xl sm:p-10"
        >
          <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-sky-600">
                About LankaNest
              </p>
              <h1 className="max-w-3xl text-3xl font-bold tracking-tight text-slate-900 sm:text-5xl">
                A smarter way to find university boarding houses in Sri Lanka.
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
                LankaNest is a comprehensive accommodation platform connecting
                students with verified landlords. We focus on trust, speed,
                simplicity, and a premium search experience designed for the
                academic housing market.
              </p>

              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                {stats.map((s) => (
                  <div
                    key={s.label}
                    className="group rounded-[1.5rem] border border-slate-200/60 bg-gradient-to-br from-white to-slate-50/50 p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-sky-200 hover:shadow-md"
                  >
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-sky-600 transition-colors group-hover:bg-sky-600 group-hover:text-white">
                      <FiStar className="text-xl" />
                    </div>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{s.label}</p>
                    <p className="mt-1 text-lg font-bold tracking-tight text-slate-900">{s.value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-2 shadow-sm">
              <img
                src="/landingImg2.jpg"
                alt="Student boarding house exterior"
                className="h-52 w-full rounded-lg object-cover"
              />
              <div className="rounded-[1.5rem] border border-white bg-white p-6 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-600">
                  Our mission
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
                  Make student housing simpler and safer.
                </h2>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  We help students compare properties, contact landlords, schedule
                  visits, and make informed choices. We also help landlords manage
                  listings, verify accounts, and grow in a more transparent market.
                </p>

                <div className="mt-6 space-y-3">
                  {highlights.map((item) => (
                    <div
                      key={item}
                      className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-700"
                    >
                      <FaCheckCircle className="text-emerald-500" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {principles.map((p, idx) => (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1, duration: 0.5 }}
              key={p.title}
              className="group rounded-3xl border border-white/60 bg-white/60 p-6 shadow-sm backdrop-blur-md transition-all duration-300 hover:-translate-y-2 hover:border-white hover:bg-white hover:shadow-xl hover:shadow-sky-900/5"
            >
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-sky-700 transition-colors group-hover:bg-sky-600 group-hover:text-white">
                {p.icon}
              </div>
              <h3 className="mt-4 text-base font-semibold text-slate-900">{p.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{p.text}</p>
            </motion.div>
          ))}
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_0.9fr]">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-sky-600">
              Why LankaNest
            </p>
            <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
              Built for the full accommodation journey
            </h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl bg-sky-50 p-5">
                <FiUsers className="text-xl text-sky-700" />
                <h3 className="mt-3 text-sm font-semibold text-slate-900">
                  For students
                </h3>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  Discover nearby boarding houses, compare features, save favorites,
                  chat with landlords, and book visits quickly.
                </p>
              </div>

              <div className="rounded-2xl bg-teal-50 p-5">
                <FiMapPin className="text-xl text-teal-700" />
                <h3 className="mt-3 text-sm font-semibold text-slate-900">
                  For landlords
                </h3>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  Manage listings, handle requests, grow visibility, and use analytics
                  to improve occupancy and engagement.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-gradient-to-br from-slate-900 via-slate-800 to-sky-900 p-8 text-white shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-300">
              Platform vision
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">
              A trusted ecosystem for student housing.
            </h2>
            <p className="mt-4 text-sm leading-7 text-slate-300">
              LankaNest combines modern web technology, real-time communication, and
              smart discovery tools so students can find safe accommodation and landlords
              can manage their properties more efficiently.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {[
                "Verified listings",
                "Responsive mobile-first UI",
                "AI recommendations",
                "Secure payments",
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-slate-100 backdrop-blur"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutUs;
