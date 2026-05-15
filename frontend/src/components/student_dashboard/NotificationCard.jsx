import { format } from "date-fns";
import {
  Bell,
  Building2,
  CalendarCheck,
  Info,
  MessageCircle,
  Star,
} from "lucide-react";
import React from "react";

const notificationTypes = {
  property_update: {
    icon: CalendarCheck,
    tone: "bg-blue-50 text-blue-700 ring-blue-100",
  },
  message: {
    icon: MessageCircle,
    tone: "bg-sky-50 text-sky-700 ring-sky-100",
  },
  review: {
    icon: Star,
    tone: "bg-amber-50 text-amber-700 ring-amber-100",
  },
  system: {
    icon: Info,
    tone: "bg-violet-50 text-violet-700 ring-violet-100",
  },
  account: {
    icon: Building2,
    tone: "bg-orange-50 text-orange-700 ring-orange-100",
  },
};

const NotificationCard = ({ notification, onClick }) => {
  const { type, title, message, createdAt, read } = notification;
  const config = notificationTypes[type] || {
    icon: Bell,
    tone: "bg-slate-100 text-slate-700 ring-slate-200",
  };
  const Icon = config.icon;

  const formattedDate = createdAt
    ? format(new Date(createdAt), "MMM dd, yyyy - h:mm a")
    : "Just now";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group w-full rounded-lg border p-5 text-left shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300/50 ${
        read
          ? "border-slate-200/60 bg-gradient-to-r from-white to-slate-50/50 shadow-slate-200/20"
          : "border-blue-200/60 bg-gradient-to-r from-blue-50/80 to-indigo-50/60 shadow-blue-200/30 ring-1 ring-blue-200/40"
      }`}
    >
      <div className="flex gap-4">
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg ring-1 shadow-sm ${config.tone}`}
        >
          <Icon className="h-5.5 w-5.5" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <h2 className="min-w-0 text-base font-bold leading-6 text-slate-950">
              {title || "Notification"}
            </h2>

            {!read ? (
                <span className="shrink-0 rounded-md bg-blue-700 px-3 py-1.5 text-[11px] font-bold text-white shadow-sm">
                New
              </span>
            ) : null}
          </div>

          <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">
            {message || "No details available."}
          </p>

          <p className="mt-4 text-sm font-semibold text-slate-400">{formattedDate}</p>
        </div>
      </div>
    </button>
  );
};

export default NotificationCard;
