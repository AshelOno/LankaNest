import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  MapPin,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
  WalletCards,
} from "lucide-react";

const backgroundImages = [
  "/bording.jpg",
  "/hero/hero-2.jpeg",
  "/hero/hero-3.jpeg",
  "/hero/hero-4.jpeg",
];

const trustItems = [
  { icon: BadgeCheck, label: "Verified listings", color: "text-emerald-300" },
  { icon: MapPin, label: "Near universities", color: "text-sky-300" },
  { icon: WalletCards, label: "Budget clarity", color: "text-cyan-300" },
];

const stats = [
  { icon: Users, value: "12k+", label: "Active students" },
  { icon: Building2, value: "2.5k+", label: "Verified places" },
  { icon: MapPin, value: "15+", label: "Locations" },
];

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.08 },
  },
};

const fadeInUp = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] },
  },
};

const imageVariants = {
  enter: { opacity: 0, scale: 1.06 },
  center: {
    opacity: 1,
    scale: 1,
    transition: { duration: 1.1, ease: "easeOut" },
  },
  exit: {
    opacity: 0,
    scale: 1.02,
    transition: { duration: 1.1, ease: "easeInOut" },
  },
};



const HeroSection = () => {
  const [query, setQuery] = useState("");
  const [bgIndex, setBgIndex] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setInterval(() => {
      setBgIndex((prev) => (prev + 1) % backgroundImages.length);
    }, 6000);

    return () => clearInterval(timer);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    const value = query.trim();

    navigate(value ? `/search?q=${encodeURIComponent(value)}` : "/listings");
  };

  return (
    <section className="relative min-h-[100svh] w-full overflow-hidden bg-blue-950 text-white">
      <div className="absolute inset-0 z-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={bgIndex}
            variants={imageVariants}
            initial="enter"
            animate="center"
            exit="exit"
            className="absolute inset-0"
          >
            <img
              src={backgroundImages[bgIndex]}
              alt="Student housing background"
              className="h-full w-full object-cover object-center brightness-[0.42]"
            />
          </motion.div>
        </AnimatePresence>

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.16)_0%,transparent_35%),linear-gradient(180deg,rgba(2,6,23,0.70)_0%,rgba(2,6,23,0.42)_42%,rgba(2,6,23,0.92)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(34,211,238,0.08)_0%,transparent_65%)]" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-[100svh] max-w-7xl items-center px-4 pb-16 pt-[104px] sm:px-6 lg:px-8">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="mx-auto w-full max-w-5xl text-center"
        >
          <motion.div variants={fadeInUp} className="flex justify-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/8 px-4 py-2 text-sm font-medium text-slate-100 backdrop-blur-xl shadow-[0_18px_40px_rgba(0,0,0,0.18)]">
              <span className="inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_18px_rgba(52,211,153,0.75)]" />
              <Sparkles size={14} className="text-sky-300" />
              Sri Lanka&apos;s #1 Student Housing Platform
            </div>
          </motion.div>

          <motion.h1
            variants={fadeInUp}
            className="mt-8 text-4xl font-black tracking-[-0.05em] sm:text-6xl lg:text-[5.4rem] lg:leading-[0.95]"
          >
            Find the perfect place <br />
            near your{" "}
            <span className="relative inline-block">
              <span className="relative z-10 bg-gradient-to-r from-sky-400 via-cyan-300 to-emerald-300 bg-clip-text text-transparent">
                University.
              </span>
              <svg
                className="absolute -bottom-2 left-0 z-0 h-3 w-full fill-sky-500/25"
                viewBox="0 0 100 10"
                preserveAspectRatio="none"
              >
                <path d="M0 5 Q 25 0 50 5 T 100 5 L 100 10 L 0 10 Z" />
              </svg>
            </span>
          </motion.h1>

          <motion.p
            variants={fadeInUp}
            className="mx-auto mt-6 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg"
          >
            Compare verified boarding rooms, annexes, and houses near your faculty.
            Filter by budget, distance, and amenities — all in one clean, trusted search.
          </motion.p>

          <motion.form
            variants={fadeInUp}
            onSubmit={handleSearch}
            className="mx-auto mt-10 w-full max-w-3xl"
          >
            <div className="group flex flex-col gap-3 rounded-[1.75rem] border border-white/14 bg-white/10 p-2 shadow-[0_28px_70px_rgba(0,0,0,0.24)] backdrop-blur-2xl transition-all focus-within:border-sky-400/40 focus-within:ring-4 focus-within:ring-sky-400/10 sm:flex-row sm:items-center">
              <div className="flex flex-1 items-center gap-3 px-4">
                <Search
                  className="shrink-0 text-slate-400 transition-colors group-focus-within:text-sky-300"
                  size={22}
                />
                <input
                  type="text"
                  placeholder="Search university or city (e.g. Moratuwa, Colombo...)"
                  className="w-full bg-transparent py-3.5 text-base font-medium text-white outline-none placeholder:text-slate-400"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>

              <button
                type="submit"
                className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-sky-500 to-emerald-500 px-8 font-bold text-white transition-all duration-200 hover:-translate-y-0.5 hover:from-sky-400 hover:to-emerald-400 hover:shadow-[0_0_24px_rgba(16,185,129,0.35)] active:scale-95"
              >
                <span>Search</span>
                <ArrowRight size={18} />
              </button>
            </div>
          </motion.form>

          <motion.div
            variants={fadeInUp}
            className="mt-6 flex flex-wrap items-center justify-center gap-3"
          >
            {trustItems.map(({ icon: Icon, label, color }) => (
              <div
                key={label}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/8 px-4 py-2 text-sm font-medium text-slate-200 backdrop-blur-md"
              >
                <Icon size={15} className={color} />
                {label}
              </div>
            ))}
          </motion.div>



          <motion.div
            variants={fadeInUp}
            className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row"
          >
            <button
              type="button"
              onClick={() => navigate("/listings")}
              className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/8 px-5 py-3 font-semibold text-slate-200 transition hover:-translate-y-0.5 hover:bg-white/12 hover:text-white"
            >
              <Building2 size={18} className="text-sky-300" />
              Browse all areas
            </button>

            <button
              type="button"
              onClick={() => navigate("/auth/houseowner-signin")}
              className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/8 px-5 py-3 font-semibold text-slate-200 transition hover:-translate-y-0.5 hover:bg-white/12 hover:text-white"
            >
              <ShieldCheck size={18} className="text-emerald-300" />
              List your property
            </button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;