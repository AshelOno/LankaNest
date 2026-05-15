import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  Home,
  MessageCircle,
} from "lucide-react";
import { useLandlordAuthStore } from "@/store/landlordAuthStore";

const ownerBenefits = [
  {
    icon: Home,
    title: "Create sharper listings",
    text: "Present rooms, pricing, amenities, photos, and campus distance in a format students can scan quickly.",
  },
  {
    icon: MessageCircle,
    title: "Respond from one place",
    text: "Keep student inquiries and visit conversations connected to the property they asked about.",
  },
  {
    icon: BarChart3,
    title: "Understand demand",
    text: "Track how your property performs and improve the information students care about most.",
  },
];

const ownerStats = [
  { title: "Fast", desc: "Listing setup", color: "text-emerald-600" },
  { title: "Direct", desc: "Student inquiries", color: "text-blue-600" },
  { title: "Clear", desc: "Visit planning", color: "text-blue-700" },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.48, ease: "easeOut" } },
};

const LandingSection3 = () => {
  const navigate = useNavigate();
  const { landlord } = useLandlordAuthStore();

  const handleButton = () => {
    if (!landlord) {
      navigate("/auth/houseowner-signin");
      return;
    }

    navigate(`/landlord/${landlord._id}`);
  };

  return (
    <section className="border-y border-blue-100 bg-white px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-14 lg:grid-cols-[1.04fr_0.96fr] lg:items-center">
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.65, ease: "easeOut" }}
            className="order-2 lg:order-1"
          >
            <div className="ln-image-frame relative overflow-hidden rounded-lg">
              <img
                src="/Image.avif"
                alt="Boarding house room and living space"
                className="aspect-[5/4] w-full object-cover transition-transform duration-700 hover:scale-105"
              />
              <div className="absolute bottom-4 left-4 right-4 rounded-lg border border-white/70 bg-white/95 p-4 shadow-[0_18px_42px_rgba(7,26,61,0.14)] backdrop-blur">
                <p className="text-sm font-black text-slate-950">
                  Built for better first impressions
                </p>
                <p className="mt-1 text-xs font-semibold text-slate-500">
                  Give students the details they need before they message.
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              {ownerStats.map((item) => (
                <motion.div
                  key={item.title}
                  whileHover={{ y: -3 }}
                  className="ln-card p-5 transition-all hover:border-blue-200 hover:shadow-lux"
                >
                  <p className={`text-2xl font-black ${item.color}`}>{item.title}</p>
                  <p className="mt-1 text-sm font-semibold text-slate-500">
                    {item.desc}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            className="order-1 lg:order-2"
          >
            <motion.div variants={itemVariants}>
              <span className="ln-chip bg-blue-50">
                <span className="h-1.5 w-1.5 rounded-sm bg-emerald-600" />
                For property owners
              </span>
              <h2 className="mt-6 max-w-xl text-3xl font-black leading-tight text-slate-950 sm:text-4xl lg:text-5xl">
                Turn available rooms into trusted listings students can compare.
              </h2>
              <p className="mt-5 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
                Build a better first impression, manage inquiries with less
                back and forth, and reach students who are already comparing
                nearby places.
              </p>
            </motion.div>

            <div className="mt-9 space-y-4">
              {ownerBenefits.map((item) => (
                <motion.article
                  variants={itemVariants}
                  key={item.title}
                  className="ln-premium-surface group flex gap-5 p-5 transition-all duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-lux"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-blue-100 bg-blue-950 text-white shadow-sm transition-transform duration-300 group-hover:scale-105">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-sm leading-7 text-slate-600">
                      {item.text}
                    </p>
                  </div>
                </motion.article>
              ))}
            </div>

            <motion.div
              variants={itemVariants}
              className="mt-9 flex flex-col gap-3 sm:flex-row"
            >
              <button
                type="button"
                onClick={handleButton}
                className="ln-primary-btn min-h-[50px] rounded-lg px-8 font-black"
              >
                <BadgeCheck className="h-5 w-5 transition-transform group-hover:scale-110" />
                Start listing
              </button>

              <Link
                to="/contact"
                className="ln-secondary-btn min-h-[50px] rounded-lg px-8 font-black"
              >
                Talk to support
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default LandingSection3;
