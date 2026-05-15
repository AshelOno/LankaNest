import React from "react";
import { motion } from "framer-motion";
import {
  FiSearch,
  FiMapPin,
  FiMessageSquare,
  FiCalendar,
  FiBookmark,
  FiShield,
  FiStar,
} from "react-icons/fi";
import { FaCheckCircle } from "react-icons/fa";
import { Link } from "react-router-dom";

const studentSteps = [
  {
    icon: <FiSearch className="text-xl" />,
    title: "Search properties",
    text: "Browse boarding houses by university, location, rent, property type, and other preferences.",
  },
  {
    icon: <FiMapPin className="text-xl" />,
    title: "Compare and review",
    text: "View property details, location, features, ratings, and photos to shortlist the right place.",
  },
  {
    icon: <FiMessageSquare className="text-xl" />,
    title: "Chat with landlords",
    text: "Use built-in messaging to ask questions and confirm details before making a decision.",
  },
  {
    icon: <FiCalendar className="text-xl" />,
    title: "Schedule a visit",
    text: "Pick an available time slot and request a property viewing directly from the listing page.",
  },
  {
    icon: <FiBookmark className="text-xl" />,
    title: "Save favorites",
    text: "Bookmark listings you like so you can review them later without searching again.",
  },
  {
    icon: <FiStar className="text-xl" />,
    title: "Leave feedback",
    text: "After your experience, submit a review to help other students make better choices.",
  },
];

const landlordSteps = [
  "Create and verify your account",
  "Upload NIC and property information",
  "Add images and set your monthly rent",
  "Manage booking and chat requests",
  "Upgrade to premium for more visibility",
];

const safetyPoints = [
  "Verify the landlord profile before booking.",
  "Use the platform chat for important communication.",
  "Visit the property before making payments.",
  "Report suspicious listings to the moderation team.",
];

const HowItWorks = () => {
  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-teal-50/50 via-slate-50 to-white pb-10">
      <section className="mx-auto max-w-[1440px] px-4 pb-16 pt-8 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="rounded-[2.5rem] border border-white/50 bg-white/70 p-8 shadow-[0_12px_40px_rgba(15,23,42,0.06)] backdrop-blur-xl sm:p-10"
        >
          <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr]">
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-sky-600">
                How it works
              </p>
              <h1 className="max-w-3xl text-3xl font-bold tracking-tight text-slate-900 sm:text-5xl">
                Simple steps for students and landlords.
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
                LankaNest is designed to be easy from the first search to the final booking.
                Here is how the platform works for each type of user.
              </p>

              <div className="mt-8 rounded-[1.75rem] border border-slate-200 bg-gradient-to-br from-sky-50 via-white to-teal-50 p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-600">
                  For students
                </p>
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  {studentSteps.slice(0, 2).map((step) => (
                    <div
                      key={step.title}
                      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                    >
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
                        {step.icon}
                      </div>
                      <h3 className="mt-4 text-base font-semibold text-slate-900">
                        {step.title}
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-slate-600">{step.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-gradient-to-br from-slate-900 via-slate-800 to-sky-900 p-6 text-white shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-300">
                Core flow
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                Find, chat, visit, and book with confidence.
              </h2>
              <p className="mt-4 text-sm leading-7 text-slate-300">
                The platform keeps the process clean and transparent so users can move
                from discovery to action without confusion.
              </p>

              <div className="mt-6 space-y-3">
                {[
                  "Search by university and map radius",
                  "Compare listings and save favorites",
                  "Communicate directly with landlords",
                  "Request viewing appointments",
                ].map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-slate-100 backdrop-blur"
                  >
                    <FaCheckCircle className="text-emerald-400" />
                    {item}
                  </div>
                ))}
              </div>

              <div className="mt-8 rounded-2xl border border-white/10 bg-white/10 p-5 backdrop-blur">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-300">
                  Need help?
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-200">
                  Visit our contact page for support or account-related questions.
                </p>
                <Link
                  to="/contact"
                  className="mt-4 inline-flex rounded-2xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
                >
                  Contact support
                </Link>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {studentSteps.slice(2).map((step) => (
            <div
              key={step.title}
              className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-sky-700">
                {step.icon}
              </div>
              <h3 className="mt-4 text-base font-semibold text-slate-900">{step.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{step.text}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-600">
              For landlords
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
              Manage listings and grow visibility.
            </h2>
            <p className="mt-4 text-sm leading-7 text-slate-600">
              Landlords can create verified profiles, upload photos, manage bookings,
              and use analytics to improve engagement and occupancy.
            </p>

            <div className="mt-6 space-y-3">
              {landlordSteps.map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-700"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white text-sky-700 shadow-sm">
                    <FaCheckCircle className="text-emerald-500" />
                  </span>
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-600">
              Safety and trust
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
              A secure platform for the housing journey.
            </h2>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {safetyPoints.map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-slate-200 bg-gradient-to-br from-sky-50 via-white to-teal-50 p-4 text-sm leading-6 text-slate-700"
                >
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-white text-sky-700 shadow-sm ring-1 ring-sky-100">
                    <FiShield className="text-lg" />
                  </div>
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

export default HowItWorks;
