import PropTypes from "prop-types";
import { useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { notification } from "antd";
import {
  BarChart3,
  Building2,
  CreditCard,
  FileText,
  LayoutDashboard,
  Mail,
  Menu,
  MessageSquare,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";
import { FaUniversity } from "react-icons/fa";
import { RiLogoutBoxLine } from "react-icons/ri";
import { useAdminAuthStore } from "@/store/adminAuthStore";

const NavItem = ({ item, active, onClick }) => {
  const className = `group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition duration-200 ${
    active
      ? "bg-emerald-500/20 text-white shadow-md ring-1 ring-emerald-400/30"
      : item.danger
      ? "text-rose-300 hover:bg-rose-500/20 hover:text-rose-100"
      : "text-slate-200 hover:bg-white/10"
  }`;

  const content = (
    <>
      <span className={active ? "text-emerald-400" : "text-slate-300 group-hover:text-emerald-300"}>
        {item.icon}
      </span>
      <span className={`truncate ${active ? "text-white" : "text-slate-200 group-hover:text-white"}`}>{item.label}</span>
    </>
  );

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
    danger: PropTypes.bool,
    icon: PropTypes.node,
    label: PropTypes.string.isRequired,
    path: PropTypes.string,
  }).isRequired,
  active: PropTypes.bool,
  onClick: PropTypes.func,
};

export default function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { adminId } = useParams();
  const { admin, adminLogout } = useAdminAuthStore();

  const handleLogout = async () => {
    try {
      await adminLogout();
      navigate("/auth/lankanest-admin");
    } catch (error) {
      notification.error({
        message: "Logout failed",
        description: "An error occurred while trying to logout.",
      });
    }
  };

  const isActive = (path) => location.pathname === path;

  const topMenuItems = [
    { icon: <LayoutDashboard />, label: "Dashboard", path: `/admin/${adminId}` },
    { icon: <Users />, label: "Users", path: `/admin/${adminId}/users` },
    { icon: <Building2 />, label: "Listings", path: `/admin/${adminId}/listings` },
    { icon: <FaUniversity />, label: "Universities", path: `/admin/${adminId}/add-university` },
    { icon: <BarChart3 />, label: "Analytics", path: `/admin/${adminId}/analytics` },
    { icon: <CreditCard />, label: "Payments", path: `/admin/${adminId}/payments` },
    { icon: <FileText />, label: "Reports", path: `/admin/${adminId}/reports` },
    { icon: <MessageSquare />, label: "Feedback", path: `/admin/${adminId}/feedbacks` },
    { icon: <Mail />, label: "Page Status", path: `/admin/${adminId}/handle-pages` },
  ];

  const renderSidebar = (mobile = false) => (
    <aside
      className={
        mobile
          ? "ln-sidebar-shell flex h-full w-[min(20rem,88vw)] flex-col bg-gradient-to-b from-[#0A4174] to-[#0A3563] p-4 text-white shadow-2xl"
          : "ln-sidebar-shell fixed inset-y-0 left-0 z-40 hidden w-[230px] flex-col bg-gradient-to-b from-[#0A4174] to-[#0A3563] p-4 text-white lg:flex"
      }
    >
      <div className="rounded-xl border border-emerald-400/30 bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 p-4 shadow-lg backdrop-blur">
        <img src="/lankanestLogo.png" alt="LankaNest" className="h-10 w-auto" />
        <p className="mt-4 text-[10px] font-bold uppercase tracking-widest text-slate-300">
          Admin console
        </p>
        <h2 className="mt-1 truncate text-base font-bold text-white">
          {admin?.username || "Administrator"}
        </h2>
        <p className="truncate text-xs text-slate-400">{admin?.email || ""}</p>
      </div>

      <nav className="mt-6 flex-1 overflow-y-auto pr-1">
        <p className="mb-3 px-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
          Navigation
        </p>
        <div className="space-y-1">
          {topMenuItems.map((item) => (
            <NavItem
              key={item.label}
              item={item}
              active={isActive(item.path)}
              onClick={mobile ? () => setMobileOpen(false) : undefined}
            />
          ))}
        </div>
      </nav>

      <div className="space-y-1 border-t border-white/10 pt-3">
        <NavItem
          item={{ icon: <RiLogoutBoxLine />, label: "Logout", danger: true }}
          onClick={handleLogout}
        />
      </div>
    </aside>
  );

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-blue-100 bg-white/94 px-4 py-3 shadow-sm backdrop-blur-xl lg:hidden">
        <div className="flex items-center justify-between gap-3">
          <Link to={`/admin/${adminId}`} className="flex min-w-0 items-center gap-3">
            <span className="ln-icon-tile text-sm font-bold">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <span className="min-w-0">
              <span className="block text-xs font-bold uppercase text-emerald-700">
                LankaNest
              </span>
              <span className="block truncate text-sm font-semibold text-slate-900">
                Admin console
              </span>
            </span>
          </Link>
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="ln-icon-button"
            aria-label="Open admin navigation"
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
            aria-label="Close admin navigation"
          />
          <div className="absolute inset-y-0 left-0">
            <div className="flex h-full flex-col">
              <div className="flex items-center justify-between border-b border-emerald-400/30 bg-gradient-to-r from-[#0A4174] to-[#0A3563] px-4 py-3 text-white">
                <span className="text-sm font-bold">LankaNest Admin</span>
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-white transition hover:bg-white/20"
                  aria-label="Close admin navigation"
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
    </>
  );
}
