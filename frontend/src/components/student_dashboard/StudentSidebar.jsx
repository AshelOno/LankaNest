import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { notification } from "antd";
import { Menu, X } from "lucide-react";
import { FaBell, FaInbox } from "react-icons/fa";
import { IoMdHelpCircle } from "react-icons/io";
import { IoSettingsSharp } from "react-icons/io5";
import { MdDashboard, MdFeedback } from "react-icons/md";
import { RiCalendarScheduleFill, RiLogoutBoxLine } from "react-icons/ri";
import FeedbackForm from "@/components/include/FeedbackForm";
import { useAuthStore } from "@/store/authStore";
import { fetchChatUnreadCount } from "@/services/chat";
import { fetchStudentNotifications } from "@/services/notifications";

const NavItem = ({ item, active, onClick }) => {
  const content = (
    <>
      <span className={active ? "text-emerald-400" : "text-slate-300 group-hover:text-emerald-300"}>
        {item.icon}
      </span>
      <span className={`truncate ${active ? "text-white" : "text-slate-200 group-hover:text-white"}`}>{item.name}</span>
      {item.badge ? (
        <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-500/90 px-2 text-[10px] font-bold text-white shadow-lg">
          {item.badge}
        </span>
      ) : null}
    </>
  );

  const className = `group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition duration-200 ${
    active
      ? "bg-emerald-500/20 text-white shadow-md ring-1 ring-emerald-400/30"
      : item.danger
      ? "text-rose-300 hover:bg-rose-500/20 hover:text-rose-100"
      : "hover:bg-white/10"
  }`;

  if (onClick && !item.path) {
    return (
      <button type="button" onClick={onClick} className={className}>
        {content}
      </button>
    );
  }

  return (
    <Link to={item.path} onClick={onClick} className={className}>
      {content}
    </Link>
  );
};

NavItem.propTypes = {
  item: PropTypes.shape({
    badge: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    danger: PropTypes.bool,
    icon: PropTypes.node,
    name: PropTypes.string.isRequired,
    path: PropTypes.string,
  }).isRequired,
  active: PropTypes.bool,
  onClick: PropTypes.func,
};

const StudentSidebar = () => {
  const [notificationCount, setNotificationCount] = useState(0);
  const [chatUnreadCount, setChatUnreadCount] = useState(0);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const { userId } = useParams();
  const { user, logout } = useAuthStore();

  const resolvedStudentId = user?._id || userId;

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/auth/user-signin");
    } catch {
      notification.error({
        message: "Logout failed",
        description: "An error occurred while trying to logout.",
      });
    }
  };

  const isActive = (path) => location.pathname === path;

  useEffect(() => {
    if (!user?._id) return;

    let active = true;

    const loadBadges = async () => {
      try {
        const [notifications, unreadChats] = await Promise.all([
          fetchStudentNotifications(user._id),
          fetchChatUnreadCount("student"),
        ]);

        if (!active) return;

        setNotificationCount(notifications.filter((item) => !item.read).length);
        setChatUnreadCount(unreadChats);
      } catch {
        // Badge counts can fail quietly without blocking navigation.
      }
    };

    loadBadges();
    const intervalId = setInterval(loadBadges, 60000);

    return () => {
      active = false;
      clearInterval(intervalId);
    };
  }, [user?._id, location.pathname]);

  const topLinks = [
    { name: "Dashboard", path: `/student/${resolvedStudentId}`, icon: <MdDashboard /> },
    {
      name: "Inbox",
      path: `/student/${resolvedStudentId}/inbox`,
      icon: <FaInbox />,
      badge: chatUnreadCount > 9 ? "9+" : chatUnreadCount || null,
    },
    {
      name: "Schedule",
      path: `/student/${resolvedStudentId}/schedule`,
      icon: <RiCalendarScheduleFill />,
    },
    {
      name: "Notifications",
      path: `/student/${resolvedStudentId}/notifications`,
      icon: <FaBell />,
      badge: notificationCount > 9 ? "9+" : notificationCount || null,
    },
    {
      name: "Settings",
      path: `/student/${resolvedStudentId}/settings`,
      icon: <IoSettingsSharp />,
    },
  ];

  const renderSidebar = (mobile = false) => (
    <aside
      className={
        mobile
          ? "ln-sidebar-shell flex h-full w-[min(20rem,88vw)] flex-col bg-gradient-to-b from-[#0A4174] to-[#0A3563] p-4 text-white shadow-2xl"
          : "ln-sidebar-shell fixed inset-y-0 left-0 z-40 hidden w-72 flex-col bg-gradient-to-b from-[#0A4174] to-[#0A3563] p-4 text-white lg:flex"
      }
    >
      <div className="rounded-xl border border-emerald-400/30 bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 p-4 shadow-lg backdrop-blur">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400 via-emerald-500 to-teal-600 text-lg font-bold text-white shadow-lg">
          {(user?.email || "S").charAt(0).toUpperCase()}
        </div>
        <p className="mt-4 text-[10px] font-bold uppercase tracking-widest text-slate-300">
          Student account
        </p>
        <h2 className="mt-1 truncate text-base font-bold text-white">
          {user?.username || "Student"}
        </h2>
        <p className="truncate text-xs text-slate-400">{user?.email || ""}</p>
      </div>

      <nav className="mt-6 flex-1 overflow-y-auto pr-1">
        <p className="mb-3 px-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
          Navigation
        </p>
        <div className="space-y-1">
          {topLinks.map((item) => (
            <NavItem
              key={item.name}
              item={item}
              active={isActive(item.path)}
              onClick={mobile ? () => setMobileOpen(false) : undefined}
            />
          ))}
        </div>
      </nav>

      <div className="space-y-1 border-t border-white/10 pt-3">
        <NavItem
          item={{ name: "Give Feedback", icon: <MdFeedback /> }}
          onClick={() => {
            setShowFeedbackForm(true);
            setMobileOpen(false);
          }}
        />
        <NavItem
          item={{ name: "Help & Support", icon: <IoMdHelpCircle />, path: "/contact" }}
          active={isActive("/contact")}
          onClick={mobile ? () => setMobileOpen(false) : undefined}
        />
        <NavItem
          item={{ name: "Logout", icon: <RiLogoutBoxLine />, danger: true }}
          onClick={handleLogout}
        />
      </div>
    </aside>
  );

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-blue-100 bg-white/94 px-4 py-3 shadow-sm backdrop-blur-xl lg:hidden">
        <div className="flex items-center justify-between gap-3">
          <Link to={`/student/${resolvedStudentId}`} className="flex min-w-0 items-center gap-3">
            <span className="ln-icon-tile text-sm font-bold">LN</span>
            <span className="min-w-0">
                <span className="block text-xs font-bold uppercase text-emerald-700">
                LankaNest
              </span>
              <span className="block truncate text-sm font-semibold text-slate-900">
                Student workspace
              </span>
            </span>
          </Link>
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="ln-icon-button"
            aria-label="Open student navigation"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </header>

      {mobileOpen ? (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
            aria-label="Close student navigation"
          />
          <div className="absolute inset-y-0 left-0">
            <div className="flex h-full flex-col">
              <div className="flex items-center justify-between border-b border-emerald-400/30 bg-gradient-to-r from-[#0A4174] to-[#0A3563] px-4 py-3 text-white">
                <span className="text-sm font-bold">LankaNest Student</span>
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-white transition hover:bg-white/20"
                  aria-label="Close student navigation"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              {renderSidebar(true)}
            </div>
          </div>
        </div>
      ) : null}

      {renderSidebar()}

      <FeedbackForm
        isOpen={showFeedbackForm}
        onClose={() => setShowFeedbackForm(false)}
        userType="student"
        userId={user?._id}
      />
    </>
  );
};

export default StudentSidebar;
