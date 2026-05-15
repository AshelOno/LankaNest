import { useState } from "react";
import { notification } from "antd";
import { motion } from "framer-motion";
import {
  Headphones,
  Loader2,
  Mail,
  MessageSquareText,
  PhoneCall,
  Send,
  User,
} from "lucide-react";
import { api } from "@/services/http";

const contactOptions = [
  {
    icon: Headphones,
    title: "Student support",
    text: "Get help with search, saved listings, schedules, or account access.",
  },
  {
    icon: Mail,
    title: "Owner support",
    text: "Ask about listing setup, verification, dashboard access, or inquiries.",
  },
  {
    icon: PhoneCall,
    title: "General inquiries",
    text: "Send questions about partnerships, feedback, or platform improvements.",
  },
];

const initialFormData = {
  inquiryType: "",
  name: "",
  email: "",
  phone: "",
  message: "",
};

export default function HomeContactSection() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState(initialFormData);

  const validate = () => {
    const isEmpty =
      !formData.inquiryType ||
      !formData.name.trim() ||
      !formData.email.trim() ||
      !formData.message.trim();

    if (isEmpty) {
      notification.error({
        message: "Validation Error",
        description: "Please fill in all required fields.",
        duration: 3,
      });
      return false;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      notification.error({
        message: "Validation Error",
        description: "Please enter a valid email address.",
        duration: 3,
      });
      return false;
    }

    if (formData.phone && !/^[+0-9()\s-]{7,20}$/.test(formData.phone.trim())) {
      notification.error({
        message: "Validation Error",
        description: "Please enter a valid phone number.",
        duration: 3,
      });
      return false;
    }

    return true;
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const response = await api.post("/send-email/add-inquiry", formData);

      if (response.status >= 200 && response.status < 300) {
        notification.success({
          message: "Success",
          description: "Your inquiry has been sent successfully.",
          duration: 3,
        });

        setFormData(initialFormData);
      } else {
        notification.error({
          message: "Error",
          description: "Failed to send inquiry. Please try again.",
          duration: 3,
        });
      }
    } catch {
      notification.error({
        message: "Error",
        description: "An error occurred. Please try again later.",
        duration: 3,
      });
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full rounded-lg border border-blue-100 bg-white px-4 py-3.5 text-sm text-slate-900 outline-none shadow-sm transition-all placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-100/50 hover:border-blue-200";

  return (
    <section
      className="relative isolate overflow-hidden bg-blue-950 bg-cover bg-center bg-no-repeat px-4 py-20 text-white sm:px-6 lg:px-8 lg:py-24 selection:bg-emerald-500/30"
      style={{ backgroundImage: "url('/landingContactImage.png')" }}
    >
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(3,10,26,0.94)_0%,rgba(7,26,61,0.86)_48%,rgba(7,26,61,0.72)_100%)]" />

      <div className="relative z-10 mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        >
          <div className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-4 py-1.5 text-sm font-bold text-blue-50 backdrop-blur-md">
            <MessageSquareText className="h-4 w-4" />
            Contact LankaNest
          </div>

          <h2 className="mt-6 max-w-xl text-3xl font-black leading-tight sm:text-4xl lg:text-5xl">
            Need help finding, listing, or managing a boarding place?
          </h2>

          <p className="mt-5 max-w-xl text-base leading-8 text-blue-100/85 sm:text-lg">
            Tell us what you need and our support team will guide you to the
            right next step.
          </p>

          <div className="mt-9 grid gap-4">
            {contactOptions.map((item, index) => (
              <motion.article
                key={item.title}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 + index * 0.1, duration: 0.5 }}
                className="group relative overflow-hidden rounded-lg border border-white/15 bg-white/10 p-5 backdrop-blur-md transition-all hover:border-white/30 hover:bg-white/20"
              >
                <div className="relative z-10 flex gap-5">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-white/20 bg-white/10 text-lux-gold transition-transform duration-300 group-hover:scale-105">
                    <item.icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">{item.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-blue-100/80">
                      {item.text}
                    </p>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
          className="relative overflow-hidden rounded-xl border border-white/60 bg-white/95 p-6 text-slate-900 shadow-lux-glow backdrop-blur-2xl sm:p-8"
        >
          <div className="relative z-10 mb-8">
            <span className="ln-chip">Send an inquiry</span>
            <h3 className="mt-3 text-2xl font-black text-slate-950">
              A specialist will reply with the next step.
            </h3>
            <p className="mt-2 text-base leading-relaxed text-slate-500">
              Required fields help us route your message correctly.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="relative z-10 grid gap-5">
            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">
                Inquiry Type <span className="text-rose-500">*</span>
              </label>
              <select
                name="inquiryType"
                value={formData.inquiryType}
                onChange={handleChange}
                className={inputClass}
              >
                <option value="" disabled>
                  Select inquiry type
                </option>
                <option value="renting">Renting Property</option>
                <option value="listing">Listing Property</option>
                <option value="support">General Support</option>
              </select>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">
                  Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative group">
                  <User className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-blue-700" />
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Your name"
                    className={`${inputClass} pl-12`}
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">
                  Email <span className="text-rose-500">*</span>
                </label>
                <div className="relative group">
                  <Mail className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-blue-700" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    className={`${inputClass} pl-12`}
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">
                Phone
              </label>
              <div className="relative group">
                <PhoneCall className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-blue-700" />
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+94 77 123 4567"
                  className={`${inputClass} pl-12`}
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">
                Message <span className="text-rose-500">*</span>
              </label>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleChange}
                placeholder="Write your message here"
                rows={4}
                className={`${inputClass} min-h-[120px] resize-y`}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="ln-primary-btn group min-h-[52px] w-full px-6 disabled:cursor-not-allowed disabled:opacity-70"
            >
              <span className="relative z-10 flex items-center gap-2">
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                )}
                {loading ? "Sending..." : "Submit inquiry"}
              </span>
            </button>
          </form>
        </motion.div>
      </div>
    </section>
  );
}
