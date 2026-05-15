import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { notification } from "antd";
import {
  FaEnvelope,
  FaPhone,
  FaLocationDot,
  FaFacebookF,
  FaInstagram,
  FaLinkedinIn,
  FaXTwitter,
} from "react-icons/fa6";
import {
  FiSend,
  FiBriefcase,
  FiUser,
  FiTag,
  FiMessageSquare,
  FiClock,
  FiShield,
  FiHeadphones,
  FiCheckCircle,
  FiLoader,
  FiPlus,
  FiMinus,
} from "react-icons/fi";
import { api } from "@/services/http";

const contactMethods = [
  {
    icon: <FaEnvelope className="text-xl" />,
    title: "Email Support",
    value: "support@lankanest.lk",
    description: "General help, listings, and account issues.",
  },
  {
    icon: <FaPhone className="text-xl" />,
    title: "Phone",
    value: "+94 77 123 4567",
    description: "Mon–Fri, 9:00 AM to 5:00 PM",
  },
  {
    icon: <FaLocationDot className="text-xl" />,
    title: "Office",
    value: "Colombo, Sri Lanka",
    description: "Remote-first support operations.",
  },
];

const faqs = [
  {
    q: "How long does it take to get a response?",
    a: "We usually reply within 24 hours on working days. Urgent account or payment issues are prioritized in our queue.",
  },
  {
    q: "Can landlords request onboarding help?",
    a: "Absolutely. We offer dedicated assistance with listing setup, document verification, plan upgrades, and profile optimization to get your property noticed.",
  },
  {
    q: "Do you support student accommodation issues?",
    a: "Yes. We have specialized agents who handle student booking issues, verification questions, and report-related concerns.",
  },
];

const socials = [
  { icon: <FaFacebookF />, label: "Facebook", link: "https://www.lankanest.lk" },
  { icon: <FaInstagram />, label: "Instagram", link: "https://www.lankanest.lk" },
  { icon: <FaLinkedinIn />, label: "LinkedIn", link: "https://www.lankanest.lk" },
  { icon: <FaXTwitter />, label: "X", link: "https://www.lankanest.lk" },
];

const inquiryOptions = [
  { value: "", label: "Select inquiry type", icon: <FiTag className="text-base" /> },
  { value: "renting", label: "Renting Property", icon: <FiUser className="text-base" /> },
  { value: "listing", label: "Listing Property", icon: <FiBriefcase className="text-base" /> },
  { value: "support", label: "General Support", icon: <FiMessageSquare className="text-base" /> },
];

// Reusable animated container for form fields
const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

const InputField = ({ label, icon, className = "", ...props }) => (
  <motion.div variants={itemVariants} className="space-y-2">
    <label className="text-sm font-semibold text-slate-700">{label}</label>
    <div className="relative group">
      {icon && (
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition-all duration-300 group-focus-within:text-blue-600 group-focus-within:scale-110">
          {icon}
        </span>
      )}
      <input
        {...props}
        className={`w-full rounded-lg border border-slate-200 bg-slate-50/80 px-4 py-3.5 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 hover:border-blue-200 hover:bg-white focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:shadow-sm ${icon ? "pl-11" : ""
          } ${className}`}
      />
    </div>
  </motion.div>
);

const SelectField = ({ label, icon, className = "", children, ...props }) => (
  <motion.div variants={itemVariants} className="space-y-2">
    <label className="text-sm font-semibold text-slate-700">{label}</label>
    <div className="relative group">
      {icon && (
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition-all duration-300 group-focus-within:text-blue-600 group-focus-within:scale-110">
          {icon}
        </span>
      )}
      <select
        {...props}
        className={`w-full appearance-none rounded-lg border border-slate-200 bg-slate-50/80 px-4 py-3.5 text-sm text-slate-900 outline-none transition-all hover:border-blue-200 hover:bg-white focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:shadow-sm ${icon ? "pl-11" : ""
          } ${className}`}
      >
        {children}
      </select>
      <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
        ▾
      </span>
    </div>
  </motion.div>
);

const TextAreaField = ({ label, className = "", ...props }) => (
  <motion.div variants={itemVariants} className="space-y-2">
    <label className="text-sm font-semibold text-slate-700">{label}</label>
    <textarea
      {...props}
      className={`min-h-[140px] w-full resize-y rounded-lg border border-slate-200 bg-slate-50/80 px-4 py-3.5 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 hover:border-blue-200 hover:bg-white focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:shadow-sm ${className}`}
    />
  </motion.div>
);

// Custom FAQ Accordion Component for better UI than native <details>
const FAQItem = ({ faq }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div
      className={`group rounded-lg border transition-all duration-300 ${isOpen ? "border-blue-200 bg-blue-50/30 shadow-md shadow-blue-900/5" : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm"
        }`}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between gap-4 p-6 text-left outline-none"
      >
        <span className="text-base font-semibold text-slate-900">{faq.q}</span>
        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors duration-300 ${isOpen ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500 group-hover:bg-slate-200"}`}>
          {isOpen ? <FiMinus className="text-sm" /> : <FiPlus className="text-sm" />}
        </span>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <p className="px-6 pb-6 text-sm leading-relaxed text-slate-600 border-t border-slate-100 pt-4">
              {faq.a}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const Contact = () => {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    inquiryType: "",
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    const requiredMissing =
      !form.inquiryType ||
      !form.name.trim() ||
      !form.email.trim() ||
      !form.subject.trim() ||
      !form.message.trim();

    if (requiredMissing) {
      notification.error({
        message: "Missing Information",
        description: "Please fill in all required fields marked with an asterisk (*).",
        placement: "bottomRight",
      });
      return false;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      notification.error({
        message: "Invalid Email",
        description: "Please enter a valid email address.",
        placement: "bottomRight",
      });
      return false;
    }

    if (form.phone && !/^[+0-9()\-\s]{7,20}$/.test(form.phone.trim())) {
      notification.error({
        message: "Invalid Phone",
        description: "Please enter a valid phone number.",
        placement: "bottomRight",
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const response = await api.post("/send-email/add-inquiry", form);

      if (response.status >= 200 && response.status < 300) {
        setSubmitted(true);
        setForm({
          inquiryType: "",
          name: "",
          email: "",
          phone: "",
          subject: "",
          message: "",
        });
      }
    } catch (error) {
      notification.error({
        message: "Delivery Failed",
        description: error?.userMessage || "We couldn't send your message right now. Please try again.",
        placement: "bottomRight",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-50/50 via-white to-slate-50 selection:bg-blue-200 selection:text-blue-900">
      <div className="relative z-10 mx-auto max-w-[1440px] px-4 pb-16 pt-8 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="overflow-hidden rounded-[2.5rem] border border-white/50 bg-white/70 shadow-[0_32px_120px_rgba(15,23,42,0.08)] backdrop-blur-3xl lg:flex"
        >
          {/* Left Side: Form Section */}
          <div className="relative w-full p-8 sm:p-12 lg:w-[58%] lg:p-16">
            <div className="relative z-10">
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
                <span className="ln-chip border-blue-100 bg-blue-50 text-blue-700">
                  Contact LankaNest
                </span>

                <h1 className="mt-6 text-4xl font-bold text-slate-950 sm:text-5xl lg:text-[3.25rem] lg:leading-[1.1]">
                  Let's build the right <span className="text-blue-700">connection.</span>
                </h1>

                <p className="mt-5 max-w-lg text-base leading-relaxed text-slate-600">
                  Reach out for support, verification help, booking issues, or technical assistance.
                  We respond with clarity, care, and the next best step.
                </p>
              </motion.div>

              {/* Highlights */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="mt-10 grid gap-4 sm:grid-cols-3"
              >
                <div className="group rounded-lg border border-slate-200 bg-slate-50/80 p-4 transition-all duration-300 hover:-translate-y-1 hover:border-blue-200 hover:bg-white hover:shadow-sm">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-700 transition-colors group-hover:bg-blue-600 group-hover:text-white">
                    <FiClock className="text-lg" />
                  </div>
                  <p className="mt-4 text-sm font-bold text-slate-900">Fast replies</p>
                  <p className="mt-1 text-xs font-medium text-slate-500">Usually within 24 hours</p>
                </div>
                <div className="group rounded-lg border border-slate-200 bg-slate-50/80 p-4 transition-all duration-300 hover:-translate-y-1 hover:border-emerald-200 hover:bg-white hover:shadow-sm">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 transition-colors group-hover:bg-emerald-600 group-hover:text-white">
                    <FiShield className="text-lg" />
                  </div>
                  <p className="mt-4 text-sm font-bold text-slate-900">Secure handling</p>
                  <p className="mt-1 text-xs font-medium text-slate-500">Private & protected</p>
                </div>
                <div className="group rounded-lg border border-slate-200 bg-slate-50/80 p-4 transition-all duration-300 hover:-translate-y-1 hover:border-amber-200 hover:bg-white hover:shadow-sm">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-700 transition-colors group-hover:bg-amber-600 group-hover:text-white">
                    <FiHeadphones className="text-lg" />
                  </div>
                  <p className="mt-4 text-sm font-bold text-slate-900">Human support</p>
                  <p className="mt-1 text-xs font-medium text-slate-500">Real agents, real help</p>
                </div>
              </motion.div>

              {/* Form / Success State */}
              <div className="mt-12 relative">
                {submitted ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ type: "spring", stiffness: 200, damping: 20 }}
                    className="flex flex-col items-center justify-center rounded-lg border border-emerald-100 bg-emerald-50/70 px-8 py-16 text-center shadow-sm"
                  >
                    <motion.div
                      initial={{ scale: 0, rotate: -45 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
                      className="flex h-20 w-20 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-lg shadow-emerald-600/20"
                    >
                      <FiCheckCircle className="text-5xl" />
                    </motion.div>
                    <h3 className="mt-8 text-3xl font-black text-slate-900">Message sent!</h3>
                    <p className="mt-4 max-w-sm text-base leading-relaxed text-slate-600">
                      Your inquiry is in our system. We will get back to you within 24 hours on working days.
                    </p>
                    <button
                      type="button"
                      onClick={() => setSubmitted(false)}
                      className="ln-secondary-btn mt-8 px-8 py-3.5"
                    >
                      Send another message
                    </button>
                  </motion.div>
                ) : (
                  <motion.form
                    initial="hidden"
                    animate="visible"
                    variants={{
                      visible: { transition: { staggerChildren: 0.08 } },
                    }}
                    onSubmit={handleSubmit}
                    className="space-y-6"
                  >
                    <SelectField
                      label="What can we help you with? *"
                      name="inquiryType"
                      value={form.inquiryType}
                      onChange={handleChange}
                      icon={<FiTag className="text-base" />}
                    >
                      {inquiryOptions.map((opt) => (
                        <option
                          key={opt.value || "placeholder"}
                          value={opt.value}
                          disabled={!opt.value}
                        >
                          {opt.label}
                        </option>
                      ))}
                    </SelectField>

                    <div className="grid gap-6 sm:grid-cols-2">
                      <InputField
                        label="Full name *"
                        name="name"
                        value={form.name}
                        onChange={handleChange}
                        placeholder="e.g. Jane Doe"
                        icon={<FiUser className="text-base" />}
                      />
                      <InputField
                        label="Email address *"
                        name="email"
                        type="email"
                        value={form.email}
                        onChange={handleChange}
                        placeholder="you@example.com"
                        icon={<FaEnvelope className="text-base" />}
                      />
                    </div>

                    <div className="grid gap-6 sm:grid-cols-2">
                      <InputField
                        label="Phone number (optional)"
                        name="phone"
                        value={form.phone}
                        onChange={handleChange}
                        placeholder="+94 77 123 4567"
                        icon={<FaPhone className="text-base" />}
                      />
                      <InputField
                        label="Subject *"
                        name="subject"
                        value={form.subject}
                        onChange={handleChange}
                        placeholder="Brief overview..."
                        icon={<FiMessageSquare className="text-base" />}
                      />
                    </div>

                    <TextAreaField
                      label="Message *"
                      name="message"
                      value={form.message}
                      onChange={handleChange}
                      placeholder="Please provide as much detail as possible so we can best assist you..."
                    />

                    <motion.div variants={itemVariants} className="pt-2">
                      <button
                        type="submit"
                        disabled={loading}
                        className="ln-primary-btn group relative flex w-full items-center justify-center gap-2 overflow-hidden px-8 py-4 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto sm:min-w-[200px]"
                      >
                        {loading ? (
                          <FiLoader className="text-xl animate-spin" />
                        ) : (
                          <>
                            <span className="relative z-10 flex items-center gap-2">
                              Send message
                              <FiSend className="text-lg transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1" />
                            </span>
                            <span className="absolute inset-0 -translate-x-full bg-white/10 transition-transform duration-700 group-hover:translate-x-full" />
                          </>
                        )}
                      </button>
                    </motion.div>
                  </motion.form>
                )}
              </div>
            </div>
          </div>

          {/* Right Side: Image & Info Panel */}
          <div className="relative flex w-full flex-col justify-end overflow-hidden min-h-[600px] lg:w-[42%]">
            <div className="absolute inset-0 bg-slate-900">
              <img
                src="/contact.png"
                alt="Contact Support"
                className="h-full w-full object-cover object-center opacity-80 mix-blend-overlay transition-transform duration-1000 hover:scale-105"
              />
            </div>

            {/* Elegant Gradients for Text Readability */}
            <div className="absolute inset-0 bg-slate-950/60" />

            <div className="relative z-10 p-8 sm:p-12">
              <div className="mb-10">
                <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-blue-300">
                  Direct Channels
                </p>
                <h2 className="mt-3 text-3xl font-black text-white sm:text-4xl">
                  We are here <br />to help.
                </h2>
                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="rounded-lg border border-white/10 bg-white/10 px-4 py-3 backdrop-blur">
                    <p className="text-xl font-black text-white">24h</p>
                    <p className="text-xs font-semibold text-slate-300">usual response</p>
                  </div>
                  <div className="rounded-lg border border-white/10 bg-white/10 px-4 py-3 backdrop-blur">
                    <p className="text-xl font-black text-white">3</p>
                    <p className="text-xs font-semibold text-slate-300">support routes</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {contactMethods.map((item, idx) => (
                  <motion.div
                    key={item.title}
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 + idx * 0.1, duration: 0.5 }}
                    className="group flex gap-5 rounded-lg border border-white/10 bg-white/10 p-5 backdrop-blur-xl transition-all duration-300 hover:border-white/30 hover:bg-white/20"
                  >
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-white/10 text-white shadow-inner shadow-white/20 transition-transform duration-300 group-hover:scale-105 group-hover:bg-blue-600 group-hover:text-white">
                      {item.icon}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">{item.title}</h3>
                      <p className="mt-1 text-sm font-medium text-slate-200">{item.value}</p>
                      <p className="mt-1.5 text-xs text-slate-400">{item.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.6, duration: 0.5 }}
                className="mt-10 flex gap-4"
              >
                {socials.map((s) => (
                  <a
                    key={s.label}
                    href={s.link}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={s.label}
                    className="flex h-12 w-12 items-center justify-center rounded-lg border border-white/20 bg-white/10 text-white backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-blue-400 hover:bg-blue-600"
                  >
                    {s.icon}
                  </a>
                ))}
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* FAQ Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          className="mt-24 text-center"
        >
          <span className="ln-chip bg-white">
            Knowledge Base
          </span>
          <h2 className="mt-6 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
            Frequently asked questions
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-slate-600">
            Find quick answers to common questions about response times, verification, and support topics.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ delay: 0.2 }}
          className="mx-auto mt-12 max-w-4xl space-y-4"
        >
          {faqs.map((item, idx) => (
            <FAQItem key={idx} faq={item} />
          ))}
        </motion.div>
      </div>
    </div>
  );
};

export default Contact;
