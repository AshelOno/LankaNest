import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { notification } from "antd";
import { FaBuilding, FaCalendarAlt, FaEnvelope, FaHome, FaPlus, FaUserFriends } from "react-icons/fa";
import { RiCalendarScheduleFill } from "react-icons/ri";
import LoadingSpinner from "@/components/include/LoadingSpinner";
import ListingCard from "@/components/landlord_dashboard/ListingCard";
import Sidebar from "@/components/landlord_dashboard/Sidebar";
import { DashboardShell, EmptyState, SectionCard, StatCard } from "@/components/ui/page-shell";
import { useLandlordAuthStore } from "@/store/landlordAuthStore";
import useListingStore from "@/store/listingStore";
import { useScheduleStore } from "@/store/scheduleStore";

const animateValue = (target, setter, ref) => {
  if (!target) {
    setter(0);
    return undefined;
  }

  let startTime;
  const duration = 900;

  const tick = (timestamp) => {
    if (!startTime) startTime = timestamp;
    const progress = Math.min((timestamp - startTime) / duration, 1);
    setter(Math.floor(progress * target));

    if (progress < 1) {
      ref.current = requestAnimationFrame(tick);
    } else {
      setter(target);
    }
  };

  ref.current = requestAnimationFrame(tick);
  return () => ref.current && cancelAnimationFrame(ref.current);
};

const LandlordDashboard = () => {
  const { landlord, isLandlordAuthenticated, checkLandlordAuth, isCheckingLandlordAuth } =
    useLandlordAuthStore();
  const { fetchLandlordListings, landlordListings, loading: listingsLoading } = useListingStore();
  const { updateScheduleStatus } = useScheduleStore();
  const { landlordId } = useParams();

  const [totalListingsCount, setTotalListingsCount] = useState(0);
  const [dashboardSchedules, setDashboardSchedules] = useState([]);
  const [animatedListingCount, setAnimatedListingCount] = useState(0);
  const [animatedScheduleCount, setAnimatedScheduleCount] = useState(0);
  const [animatedInquiryCount, setAnimatedInquiryCount] = useState(0);

  const listingCountRef = useRef(null);
  const scheduleCountRef = useRef(null);
  const inquiryCountRef = useRef(null);

  useEffect(() => {
    if (!isLandlordAuthenticated) checkLandlordAuth();
  }, [checkLandlordAuth, isLandlordAuthenticated]);

  useEffect(() => {
    if (!landlord?._id) return;

    fetchLandlordListings(landlord._id, 3)
      .then(() => fetchLandlordListings(landlord._id, 0, false))
      .then((allListings) => {
        if (Array.isArray(allListings)) setTotalListingsCount(allListings.length);
      })
      .catch(() => {
        notification.error({
          message: "Listings unavailable",
          description: "We could not refresh your listing summary.",
        });
      });
  }, [landlord, fetchLandlordListings]);

  useEffect(() => {
    if (landlord?.username) document.title = `${landlord.username}'s Dashboard`;
  }, [landlord?.username]);

  useEffect(() => {
    const fetchDashboardSchedules = async () => {
      if (!landlord?._id) return;

      try {
        const { getSchedulesByLandlordId } = useScheduleStore.getState();
        const schedules = await getSchedulesByLandlordId(landlord._id);
        const upcoming = schedules
          .filter(
            (schedule) =>
              new Date(`${schedule.date}T${schedule.time}`) > new Date() &&
              schedule.status !== "cancelled"
          )
          .slice(0, 3);

        setDashboardSchedules(upcoming);
      } catch {
        notification.error({
          message: "Schedules unavailable",
          description: "We could not refresh upcoming visits.",
        });
      }
    };

    fetchDashboardSchedules();
  }, [landlord]);

  useEffect(
    () => animateValue(totalListingsCount, setAnimatedListingCount, listingCountRef),
    [totalListingsCount]
  );
  useEffect(
    () => animateValue(dashboardSchedules.length, setAnimatedScheduleCount, scheduleCountRef),
    [dashboardSchedules.length]
  );
  useEffect(
    () => animateValue(3, setAnimatedInquiryCount, inquiryCountRef),
    []
  );

  const handleUpdateStatus = async (scheduleId, status) => {
    try {
      await updateScheduleStatus(scheduleId, status);
      setDashboardSchedules((prev) =>
        prev.map((schedule) => (schedule._id === scheduleId ? { ...schedule, status } : schedule))
      );

      notification.success({
        message: `Schedule ${status === "confirmed" ? "confirmed" : "rejected"}`,
        description: `The schedule has been ${status} successfully.`,
      });
    } catch {
      notification.error({
        message: "Update failed",
        description: "Failed to update the schedule status.",
      });
    }
  };

  if (isCheckingLandlordAuth || listingsLoading) return <LoadingSpinner />;
  if (!isLandlordAuthenticated || !landlord) return null;

  return (
    <DashboardShell
      sidebar={<Sidebar />}
      sidebarWidth="230px"
      eyebrow="Owner dashboard"
      title={`Welcome back, ${landlord.username}`}
      description="Track listings, review visits, and keep your property workflow tidy."
      actions={
        <>
          <Link to="/" className="ln-secondary-btn">
            <FaHome /> Home
          </Link>
          <Link to="/listings" className="ln-secondary-btn">
            <FaBuilding /> All Listings
          </Link>
          <Link to={`/landlord/${landlordId}/add-listings`} className="ln-secondary-btn">
            <FaPlus /> Add Listing
          </Link>
              <Link to={`/landlord/${landlordId}/schedule`} className="ln-primary-btn">
            <RiCalendarScheduleFill /> Schedules
          </Link>
        </>
      }
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <StatCard
            icon={FaBuilding}
            label="Total Properties"
            value={animatedListingCount}
            detail="Active and archived listings"
          />
          <StatCard
            icon={FaCalendarAlt}
            label="Scheduled Visits"
            value={animatedScheduleCount}
            detail="Upcoming student visits"
            tone="emerald"
          />
          <StatCard
            icon={FaEnvelope}
            label="Action Items"
            value={animatedInquiryCount}
            detail="Inbox, schedules, and listing checks"
            tone="amber"
          />
        </div>

        <SectionCard
          title="My Listings"
          description="A quick view of the latest places students can discover."
          action={
              <Link to={`/landlord/${landlordId}/my-listings`} className="ln-secondary-btn">
              View all listings
            </Link>
          }
        >
          {landlordListings.length > 0 ? (
            <ListingCard
              listings={landlordListings.map((listing) => ({
                id: listing._id,
                title: listing.propertyName,
                location: listing.address,
                price: `LKR ${Number(listing.monthlyRent || 0).toLocaleString()}/month`,
                image: listing.images?.[0] || "https://via.placeholder.com/150",
                views: listing.views || 0,
              }))}
            />
          ) : (
            <EmptyState
              icon={FaHome}
              title="No listings yet"
              description="Add your first property so students can start finding it."
              action={
              <Link to={`/landlord/${landlordId}/add-listings`} className="ln-primary-btn">
                  <FaPlus /> Add listing
                </Link>
              }
            />
          )}
        </SectionCard>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <SectionCard
            title="Latest Scheduled Visits"
            description="Review upcoming visits and confirm pending requests."
            action={
              <Link
                        to={`/landlord/${landlordId}/schedule`}
                className="text-sm font-semibold text-blue-700 hover:text-blue-900"
              >
                View all visits
              </Link>
            }
          >
            {dashboardSchedules.length > 0 ? (
              <div className="space-y-4">
                {dashboardSchedules.map((schedule) => {
                  const scheduleDate = new Date(`${schedule.date}T${schedule.time}`);
                  const formattedDate = scheduleDate.toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  });
                  const formattedTime = scheduleDate.toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                  });

                  return (
                    <div
                      key={schedule._id}
                      className={`rounded-lg border p-4 shadow-sm transition hover:shadow-md ${
                        schedule.status === "confirmed"
                          ? "border-blue-100 bg-blue-50/40"
                          : "border-amber-100 bg-amber-50/50"
                      }`}
                    >
                      <div className="flex gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-white text-blue-700 ring-1 ring-slate-200">
                          <FaUserFriends />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="font-semibold text-slate-950">
                              {schedule.userId?.username || "Anonymous User"}
                            </p>
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                schedule.status === "confirmed"
                                  ? "bg-blue-100 text-blue-700"
                                  : "bg-amber-100 text-amber-700"
                              }`}
                            >
                              {schedule.status === "confirmed" ? "Confirmed" : "Pending"}
                            </span>
                          </div>
                          <p className="mt-1 text-sm text-slate-600">
                            {schedule.listingId?.propertyName || "Property Visit"}
                          </p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600 ring-1 ring-slate-200">
                              {formattedDate}
                            </span>
                            <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600 ring-1 ring-slate-200">
                              {formattedTime}
                            </span>
                          </div>
                        </div>
                      </div>

                      {schedule.status === "pending" && (
                        <div className="mt-4 flex justify-end gap-2">
                          <button
                            className="ln-primary-btn px-3 py-2 text-xs"
                            onClick={() => handleUpdateStatus(schedule._id, "confirmed")}
                          >
                            Confirm
                          </button>
                          <button
                            className="ln-danger-btn px-3 py-2 text-xs"
                            onClick={() => handleUpdateStatus(schedule._id, "rejected")}
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <EmptyState
                icon={FaCalendarAlt}
                title="No scheduled visits"
                description="New visit requests will appear here."
              />
            )}
          </SectionCard>

          <SectionCard
            title="Owner action center"
            description="The next useful tasks for keeping listings active and student-ready."
            action={
              <Link
                to={`/landlord/${landlordId}/inbox`}
                className="text-sm font-semibold text-blue-700 hover:text-blue-900"
              >
                Open inbox
              </Link>
            }
          >
            <div className="grid gap-3">
              {[
                {
                  title: "Reply to student inquiries",
                  text: "Keep conversations moving so students can make decisions quickly.",
                  to: `/landlord/${landlordId}/inbox`,
                  icon: FaEnvelope,
                },
                {
                  title: "Confirm upcoming visits",
                  text: "Review pending schedule requests and avoid missed viewings.",
                  to: `/landlord/${landlordId}/schedule`,
                  icon: FaCalendarAlt,
                },
                {
                  title: "Improve listing quality",
                  text: "Check photos, pricing, and amenities for your latest properties.",
                  to: `/landlord/${landlordId}/my-listings`,
                  icon: FaBuilding,
                },
              ].map((item) => (
                <Link
                  key={item.title}
                  to={item.to}
                  className="group flex gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4 transition hover:border-blue-200 hover:bg-blue-50"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-blue-700 ring-1 ring-slate-200 transition group-hover:ring-blue-200">
                    <item.icon />
                  </span>
                  <span>
                    <span className="block text-sm font-bold text-slate-950">{item.title}</span>
                    <span className="mt-1 block text-sm leading-5 text-slate-500">{item.text}</span>
                  </span>
                </Link>
              ))}
            </div>
          </SectionCard>
        </div>

        <p className="text-center text-sm font-medium text-slate-500">
          LankaNest © {new Date().getFullYear()}
        </p>
      </div>
    </DashboardShell>
  );
};

export default LandlordDashboard;
