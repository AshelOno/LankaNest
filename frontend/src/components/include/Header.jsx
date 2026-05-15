import React, { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import LogoIcon from "/lankanest_logo.png";
import {
  AlertCircle,
  Building2,
  ChevronDown,
  Home,
  Info,
  LayoutDashboard,
  Loader,
  LogOut,
  Menu,
  PhoneCall,
  Search,
  ShieldCheck,
  UserCircle2,
  X,
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const headerRef = useRef(null);
  const aboutRef = useRef(null);
  const userRef = useRef(null);

  const [aboutDropdown, setAboutDropdown] = useState(false);
  const [userDropdown, setUserDropdown] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [logoutError, setLogoutError] = useState(null);
  const [isScrolled, setIsScrolled] = useState(false);

  const authStore = useAuthStore();
  const isAuthenticated = authStore?.isAuthenticated ?? false;
  const user = authStore?.user ?? null;
  const isLoading = authStore?.isLoading ?? false;

  const closeMenus = () => {
    setAboutDropdown(false);
    setUserDropdown(false);
    setMobileMenuOpen(false);
    setLogoutError(null);
  };

  const getDashboardLink = () => {
    if (!user) return "/";
    const userId = user._id;

    if (user.role === "landlord") return `/landlord/${userId}`;
    if (user.role === "admin") return `/admin/${userId}`;
    return `/student/${userId}`;
  };

  const getProfileLink = () => {
    if (!user) return "/";
    const userId = user._id;

    if (user.role === "landlord") return `/landlord/${userId}`;
    if (user.role === "admin") return `/admin/${userId}`;
    return `/student/${userId}/settings`;
  };

  const getOwnerActionLink = () =>
    user?.role === "landlord" ? getDashboardLink() : "/auth/houseowner-signin";

  const handleLogout = async () => {
    try {
      setLogoutError(null);
      await authStore.logout();
      closeMenus();
      navigate("/");
    } catch {
      setLogoutError("Failed to logout. Please try again.");
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 12);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      const clickedInsideHeader = headerRef.current?.contains(event.target);
      const clickedInsideAbout = aboutRef.current?.contains(event.target);
      const clickedInsideUser = userRef.current?.contains(event.target);

      if (!clickedInsideAbout) setAboutDropdown(false);
      if (!clickedInsideUser) setUserDropdown(false);
      if (!clickedInsideHeader) setMobileMenuOpen(false);
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") closeMenus();
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  useEffect(() => {
    closeMenus();
  }, [location.pathname]);

  const isActive = (path) => location.pathname === path;
  const isSectionActive = (path) =>
    location.pathname === path || location.pathname.startsWith(`${path}/`);

  const isListingsActive =
    location.pathname === "/listings" ||
    location.pathname.startsWith("/listing") ||
    location.pathname.startsWith("/search");

  const navText = isScrolled ? "text-slate-700 hover:text-slate-950" : "text-white/80 hover:text-white";
  const navBorder = isScrolled ? "bg-slate-950" : "bg-white";

  const navLinkClass = (active = false) =>
    `relative inline-flex h-11 items-center justify-center rounded-full px-5 text-[15px] font-semibold tracking-[-0.01em] transition-all duration-300 ${active ? (isScrolled ? "text-sky-600" : "text-emerald-300") : navText
    }`;

  const mobileLinkClass = (active = false) =>
    `flex min-h-[48px] items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-semibold transition-all duration-200 ${active
      ? "border-slate-900/10 bg-slate-900/5 text-slate-950"
      : "border-white/10 bg-white/5 text-white/85 hover:border-white/20 hover:bg-white/10 hover:text-white"
    }`;

  const mobileLinks = [
    { to: "/", label: "Home", icon: Home, active: isActive("/") },
    { to: "/listings", label: "Listings", icon: Building2, active: isListingsActive },
    {
      to: "/how-it-works",
      label: "How it works",
      icon: LayoutDashboard,
      active: isSectionActive("/how-it-works"),
    },
    {
      to: "/about-us",
      label: "About us",
      icon: Info,
      active: isSectionActive("/about-us"),
    },
    {
      to: "/contact",
      label: "Contact",
      icon: PhoneCall,
      active: isSectionActive("/contact"),
    },
  ];

  const NavItem = ({ to, label, active, onClick }) => (
    <Link to={to} onClick={onClick} className={navLinkClass(active)}>
      <span className="relative inline-flex items-center gap-1.5">
        {label}
        {active && (
          <span
            className={`absolute -bottom-[12px] left-1/2 h-[2px] w-8 -translate-x-1/2 rounded-full ${navBorder}`}
          />
        )}
      </span>
    </Link>
  );

  const headerClasses = isScrolled
    ? "border-b border-slate-200/80 bg-white/90 backdrop-blur-xl text-slate-900 shadow-[0_18px_50px_rgba(15,23,42,0.12)]"
    : "border-b border-white/10 bg-slate-950/10 backdrop-blur-md text-white";

  return (
    <motion.header
      initial={{ y: -72, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.42, ease: "easeOut" }}
      ref={headerRef}
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${headerClasses}`}
    >
      <div className="mx-auto flex h-[72px] max-w-[1380px] items-center justify-between px-4 sm:px-6 lg:px-10">
        <Link
          to="/"
          onClick={closeMenus}
          className="group flex items-center gap-3"
          aria-label="LankaNest home"
        >
          <div className="flex h-[54px] w-[54px] items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md ring-1 ring-white/10">
            <img
              src={LogoIcon}
              alt="LankaNest"
              className="h-[46px] w-[46px] object-contain transition-transform duration-300 group-hover:scale-105"
            />
          </div>

          <div className="leading-none">
            <span
              className="block text-[1.9rem] font-black tracking-[-0.04em] bg-gradient-to-r from-sky-600 to-emerald-600 bg-clip-text text-transparent"
            >
              Lankanest
            </span>
            <span
              className="mt-1 block text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500"
            >
              Student Housing
            </span>
          </div>
        </Link>

        <nav className="hidden items-center gap-3 xl:gap-4 lg:flex" aria-label="Primary navigation">
          <NavItem to="/" label="Home" active={isActive("/")} />
          <NavItem to="/listings" label="Listings" active={isListingsActive} />
          <NavItem
            to="/how-it-works"
            label="How it works"
            active={isSectionActive("/how-it-works")}
          />

          <div ref={aboutRef} className="relative">
            <button
              type="button"
              onClick={() => {
                setAboutDropdown((prev) => !prev);
                setUserDropdown(false);
              }}
              className={`${navLinkClass(
                isSectionActive("/about-us") || isSectionActive("/contact")
              )} gap-1`}
              aria-expanded={aboutDropdown}
              aria-haspopup="menu"
            >
              <span className="relative inline-flex items-center">
                About
                {(isSectionActive("/about-us") || isSectionActive("/contact")) && (
                  <span
                    className={`absolute -bottom-[12px] left-1/2 h-[2px] w-8 -translate-x-1/2 rounded-full ${navBorder}`}
                  />
                )}
              </span>

              <ChevronDown
                size={16}
                className={`transition-transform duration-200 ${aboutDropdown ? "rotate-180" : ""
                  }`}
              />
            </button>

            <AnimatePresence>
              {aboutDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.98 }}
                  transition={{ duration: 0.18 }}
                  className="absolute left-0 top-full mt-3 w-56 overflow-hidden rounded-2xl border border-white/10 bg-blue-950/95 p-2 shadow-[0_22px_50px_rgba(0,0,0,0.28)] backdrop-blur-xl"
                  role="menu"
                >
                  <Link
                    to="/about-us"
                    onClick={closeMenus}
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-white/80 transition hover:bg-white/10 hover:text-white"
                  >
                    <Info size={16} />
                    About Boardingnest
                  </Link>
                  <Link
                    to="/contact"
                    onClick={closeMenus}
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-white/80 transition hover:bg-white/10 hover:text-white"
                  >
                    <PhoneCall size={16} />
                    Contact
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <Link
            to="/listings"
            className={`inline-flex h-[52px] items-center gap-2 rounded-full border px-6 text-[15px] font-bold backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 ${isScrolled
              ? "border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100"
              : "border-white/10 bg-white/8 text-white hover:bg-white/14"
              }`}
          >
            <Search className="h-4 w-4" />
            Find stays
          </Link>

          <Link
            to={getOwnerActionLink()}
            className={`inline-flex h-[52px] items-center gap-3 rounded-full px-7 text-[15px] font-extrabold uppercase tracking-[-0.01em] shadow-[0_10px_30px_rgba(0,0,0,0.18)] transition-all duration-300 hover:-translate-y-0.5 ${isScrolled
              ? "bg-gradient-to-r from-sky-500 to-emerald-500 text-white hover:shadow-[0_8px_20px_rgba(16,185,129,0.3)]"
              : "bg-gradient-to-r from-sky-400 to-emerald-400 text-slate-950 hover:shadow-[0_8px_20px_rgba(56,189,248,0.4)]"
              }`}
          >
            <Building2 className="h-4 w-4" />
            List property
          </Link>

          {isAuthenticated ? (
            <div ref={userRef} className="relative">
              <button
                type="button"
                onClick={() => {
                  setUserDropdown((prev) => !prev);
                  setAboutDropdown(false);
                }}
                className={`flex h-[52px] items-center gap-2 rounded-full border pl-1 pr-4 shadow-sm transition ${isScrolled
                  ? "border-slate-200 bg-slate-50 text-slate-900 hover:bg-slate-100"
                  : "border-white/15 bg-white/10 text-white hover:bg-white/15"
                  }`}
                aria-expanded={userDropdown}
                aria-label="User menu"
              >
                <div
                  className={`flex h-10 w-10 items-center justify-center overflow-hidden rounded-full font-bold ring-1 transition ${isScrolled
                    ? "bg-slate-200/50 text-slate-800 ring-slate-200"
                    : "bg-white/15 text-white ring-white/10"
                    }`}
                >
                  {user?.name?.[0]?.toUpperCase() ||
                    user?.username?.[0]?.toUpperCase() ||
                    "U"}
                </div>
                <ChevronDown
                  size={16}
                  className={`transition-transform duration-200 ${userDropdown ? "rotate-180" : ""
                    } ${isScrolled ? "text-slate-700" : "text-white/70"}`}
                />
              </button>

              <AnimatePresence>
                {userDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.98 }}
                    transition={{ duration: 0.18 }}
                    className="absolute right-0 top-full mt-3 w-64 overflow-hidden rounded-2xl border border-white/10 bg-blue-950/95 p-2 shadow-[0_22px_50px_rgba(0,0,0,0.28)] backdrop-blur-xl"
                  >
                    <div className="mb-2 rounded-xl bg-white/5 px-3 py-3">
                      <p className="truncate text-sm font-bold text-white">
                        {user?.name || user?.username || "User"}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-white/60">
                        {user?.email || ""}
                      </p>
                    </div>

                    {logoutError && (
                      <div className="mb-2 flex items-start gap-2 rounded-xl bg-red-500/10 px-3 py-2">
                        <AlertCircle
                          size={14}
                          className="mt-0.5 flex-shrink-0 text-red-400"
                        />
                        <p className="text-xs text-red-300">{logoutError}</p>
                      </div>
                    )}

                    <Link
                      to={getProfileLink()}
                      onClick={closeMenus}
                      className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-white/80 transition hover:bg-white/10 hover:text-white"
                    >
                      <UserCircle2 size={16} />
                      Profile
                    </Link>

                    <Link
                      to={getDashboardLink()}
                      onClick={closeMenus}
                      className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-white/80 transition hover:bg-white/10 hover:text-white"
                    >
                      <LayoutDashboard size={16} />
                      Dashboard
                    </Link>

                    <button
                      type="button"
                      onClick={handleLogout}
                      disabled={isLoading}
                      className="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-red-300 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                      aria-label="Logout"
                    >
                      {isLoading ? (
                        <Loader size={16} className="animate-spin" />
                      ) : (
                        <LogOut size={16} />
                      )}
                      {isLoading ? "Logging out..." : "Logout"}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <Link
              to="/auth/user-signin"
              className={`inline-flex h-[52px] items-center gap-2 rounded-full border px-6 text-[15px] font-bold transition-all duration-300 hover:-translate-y-0.5 ${isScrolled
                ? "border-slate-200 bg-slate-50 text-slate-900 hover:bg-slate-100"
                : "border-white/15 bg-white/10 text-white hover:bg-white/15"
                }`}
            >
              <UserCircle2 className="h-5 w-5" />
              Sign in
            </Link>
          )}
        </div>

        <button
          type="button"
          className={`inline-flex h-11 w-11 items-center justify-center rounded-full border shadow-sm transition lg:hidden ${isScrolled
            ? "border-slate-200 bg-slate-50 text-slate-900 hover:bg-slate-100"
            : "border-white/15 bg-white/10 text-white hover:bg-white/15"
            }`}
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          aria-label="Toggle menu"
          aria-expanded={mobileMenuOpen}
        >
          {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.24, ease: "easeOut" }}
            className="overflow-hidden border-t border-white/10 bg-blue-950/95 px-4 py-4 backdrop-blur-xl lg:hidden"
          >
            <div className="mx-auto max-w-7xl space-y-4">
              <div className="grid gap-2 sm:grid-cols-2">
                <Link
                  to="/listings"
                  onClick={closeMenus}
                  className="flex min-h-[52px] items-center justify-center gap-2 rounded-2xl bg-white/10 px-4 py-3 text-sm font-bold text-white shadow-sm transition-transform active:scale-95"
                >
                  <Search className="h-4 w-4" />
                  Find stays
                </Link>

                <Link
                  to={getOwnerActionLink()}
                  onClick={closeMenus}
                  className="flex min-h-[52px] items-center justify-center gap-2 rounded-2xl border border-white/15 bg-transparent px-4 py-3 text-sm font-bold text-white"
                >
                  <ShieldCheck className="h-4 w-4" />
                  List property
                </Link>
              </div>

              <div className="grid gap-2">
                {mobileLinks.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={closeMenus}
                    className={mobileLinkClass(link.active)}
                  >
                    <link.icon size={16} />
                    {link.label}
                  </Link>
                ))}
              </div>

              <div className="pt-1">
                {isAuthenticated ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15 font-bold text-white ring-1 ring-white/10">
                        {user?.name?.[0]?.toUpperCase() ||
                          user?.username?.[0]?.toUpperCase() ||
                          "U"}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-white">
                          {user?.name || user?.username || "User"}
                        </p>
                        <p className="truncate text-xs text-white/60">
                          {user?.email || ""}
                        </p>
                      </div>
                    </div>

                    <Link
                      to={getProfileLink()}
                      onClick={closeMenus}
                      className={mobileLinkClass(false)}
                    >
                      <UserCircle2 size={16} />
                      Profile
                    </Link>

                    <Link
                      to={getDashboardLink()}
                      onClick={closeMenus}
                      className={mobileLinkClass(false)}
                    >
                      <LayoutDashboard size={16} />
                      Dashboard
                    </Link>

                    {logoutError && (
                      <div className="flex items-start gap-2 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3">
                        <AlertCircle
                          size={16}
                          className="mt-0.5 flex-shrink-0 text-red-300"
                        />
                        <p className="text-xs text-red-300">{logoutError}</p>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={handleLogout}
                      disabled={isLoading}
                      className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-300 transition hover:bg-red-500/15 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isLoading ? (
                        <>
                          <Loader size={16} className="animate-spin" />
                          Logging out...
                        </>
                      ) : (
                        <>
                          <LogOut size={16} />
                          Logout
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  <Link
                    to="/auth/user-signin"
                    onClick={closeMenus}
                    className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm font-bold text-white shadow-sm"
                  >
                    <UserCircle2 className="h-5 w-5" />
                    Sign in
                  </Link>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
};

export default Header;