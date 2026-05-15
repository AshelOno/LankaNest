import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  CalendarCheck,
  MapPinned,
  ShieldCheck,
  WalletCards,
} from "lucide-react";

const features = [
  {
    icon: ShieldCheck,
    title: "Verified first look",
    text: "Start with listings that show the practical details students need before arranging a visit.",
    tone: "bg-emerald-50 text-emerald-700 border-emerald-100",
  },
  {
    icon: WalletCards,
    title: "Budget clarity",
    text: "Compare rent, location, and property details without jumping between scattered posts and chats.",
    tone: "bg-amber-50 text-amber-700 border-amber-100",
  },
  {
    icon: MapPinned,
    title: "Campus context",
    text: "Understand the area around your university before building a shortlist.",
    tone: "bg-blue-50 text-blue-700 border-blue-100",
  },
  {
    icon: CalendarCheck,
    title: "Visit planning",
    text: "Keep saved places, schedules, and conversations connected while you narrow the choice.",
    tone: "bg-blue-50 text-blue-700 border-blue-100",
  },
];

const stats = [
  { value: "3", label: "Simple steps", detail: "Search, save, schedule" },
  { value: "Map", label: "Area view", detail: "Compare locations" },
  { value: "100+", label: "Useful reviews", detail: "Read before visits" },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.48, ease: "easeOut" } },
};

function LandingSection2() {
  return (
    <section className="border-y border-blue-100 bg-[linear-gradient(180deg,#fbfdff_0%,#eef4ff_58%,#f4fbf8_100%)] px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-12 lg:grid-cols-[0.94fr_1.06fr] lg:items-center">
          <motion.div
            className="lg:pr-6"
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.65, ease: "easeOut" }}
          >
            <span className="ln-chip bg-white">
              <span className="h-1.5 w-1.5 rounded-sm bg-lux-gold" />
              For students
            </span>

            <h2 className="mt-6 max-w-xl text-3xl font-black leading-tight text-slate-950 sm:text-4xl lg:text-5xl">
              Search first. Visit smarter. Choose with less guesswork.
            </h2>

            <p className="mt-5 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
              LankaNest brings search, comparison, shortlisting, and visit
              planning into one calm journey built around student decisions.
            </p>

            <motion.div
              whileHover={{ y: -3 }}
              className="ln-image-frame mt-9 overflow-hidden rounded-lg transition-all duration-300"
            >
              <div className="relative group">
                <img
                  src="/landingImg2.jpg"
                  alt="Student boarding house exterior"
                  className="aspect-[16/10] w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-blue-950/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              </div>

              <div className="grid gap-px overflow-hidden bg-blue-100 sm:grid-cols-3">
                {stats.map((item) => (
                  <div
                    key={item.label}
                    className="bg-white/95 p-5 transition-colors hover:bg-blue-50 sm:p-6"
                  >
                    <p className="text-2xl font-black text-blue-950">{item.value}</p>
                    <p className="mt-1 font-bold text-slate-800">{item.label}</p>
                    <p className="text-sm font-medium text-slate-500">{item.detail}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            className="grid gap-5 sm:grid-cols-2"
          >
            {features.map((item) => (
              <motion.article
                variants={itemVariants}
                key={item.title}
                className="ln-premium-surface group relative min-h-[210px] overflow-hidden p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lux"
              >
                <div
                  className={`mb-5 flex h-12 w-12 items-center justify-center rounded-lg border ${item.tone} transition-transform duration-300 group-hover:scale-105`}
                >
                  <item.icon className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-black text-slate-900">
                  {item.title}
                </h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  {item.text}
                </p>
              </motion.article>
            ))}

            <motion.div
              variants={itemVariants}
              className="relative overflow-hidden rounded-lg border border-blue-900/20 bg-blue-950 p-7 text-white shadow-lux sm:col-span-2 sm:p-9"
            >
              <div className="relative z-10 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                <div className="max-w-md">
                  <h3 className="text-2xl font-black leading-tight sm:text-3xl">
                    Ready to compare nearby places?
                  </h3>
                  <p className="mt-3 text-base font-medium leading-7 text-blue-100/85">
                    Open the listing view and start building a shortlist around
                    your campus today.
                  </p>
                </div>

                <Link
                  to="/listings"
                  className="group inline-flex min-h-[50px] shrink-0 items-center justify-center gap-2 rounded-lg bg-white px-7 py-3 text-sm font-black text-blue-950 shadow-sm transition hover:-translate-y-0.5 hover:bg-blue-50"
                >
                  Explore listings
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

export default LandingSection2;
