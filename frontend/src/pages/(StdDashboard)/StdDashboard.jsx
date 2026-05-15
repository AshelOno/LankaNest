import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { notification } from "antd";
import {
  Bookmark,
  CalendarRange,
  ClipboardCheck,
  Home,
  MapPinned,
  MessageSquare,
  Settings,
  Sparkles,
} from "lucide-react";
import StudentSidebar from "@/components/student_dashboard/StudentSidebar";
import PopularCard from "@/components/student_dashboard/PopularCard";
import RecommendationCard from "@/components/student_dashboard/RecommendationCard";
import UserPreference from "@/components/signup_pages/UserPreference";
import {
  DashboardShell,
  EmptyState,
  LoadingState,
  SectionCard,
  StatCard,
} from "@/components/ui/page-shell";
import { useAuthStore } from "@/store/authStore";
import { useRecommendationStore } from "@/store/recommendationStore";
import { useBookmarkStore } from "@/store/bookmarkStore";
import { useScheduleStore } from "@/store/scheduleStore";
import { fetchChatUnreadCount } from "@/services/chat";

export default function StudentDashboard() {
  const [showPreferences, setShowPreferences] = useState(false);
  const [viewMode, setViewMode] = useState("recommended");
  const [unreadChats, setUnreadChats] = useState(0);

  const { user, isAuthenticated, checkAuth, isCheckingAuth } = useAuthStore();
  const {
    recommendations,
    isLoading: recommendationsLoading,
    fetchRecommendations,
    error: recommendationError,
  } = useRecommendationStore();
  const {
    bookmarks,
    isLoading: bookmarksLoading,
    fetchBookmarks,
    error: bookmarkError,
  } = useBookmarkStore();
  const { schedules, getSchedulesByUserId } = useScheduleStore();

  useEffect(() => {
    if (!isAuthenticated) {
      checkAuth();
      return;
    }

    if (!user?._id) return;

    fetchRecommendations(user._id);
    fetchBookmarks(user._id);
    getSchedulesByUserId(user._id).catch(() => {});
    fetchChatUnreadCount("student")
      .then(setUnreadChats)
      .catch(() => setUnreadChats(0));

    if (!user.hasCompletedPreferences) {
      const timer = setTimeout(() => setShowPreferences(true), 1400);
      return () => clearTimeout(timer);
    }

    return undefined;
  }, [checkAuth, fetchBookmarks, fetchRecommendations, getSchedulesByUserId, isAuthenticated, user]);

  useEffect(() => {
    if (recommendationError) {
      notification.error({
        message: "Recommendations unavailable",
        description: recommendationError,
      });
    }
  }, [recommendationError]);

  useEffect(() => {
    if (bookmarkError) {
      notification.error({
        message: "Bookmarks unavailable",
        description: bookmarkError,
      });
    }
  }, [bookmarkError]);

  useEffect(() => {
    document.title = user?.username ? `${user.username}'s Dashboard` : "Student Dashboard";
  }, [user?.username]);

  const activeListings = useMemo(() => {
    if (viewMode === "bookmarks") {
      return bookmarks || [];
    }
    return recommendations || [];
  }, [bookmarks, recommendations, viewMode]);

  const isListingSectionLoading = viewMode === "bookmarks" ? bookmarksLoading : recommendationsLoading;

  const handlePreferenceClose = async () => {
    setShowPreferences(false);
    await checkAuth();
  };

  if (isCheckingAuth) {
    return <LoadingState label="Loading your workspace" />;
  }

  return (
    <>
      <DashboardShell
        sidebar={<StudentSidebar />}
        sidebarWidth="18rem"
        eyebrow="Student dashboard"
        title={`Welcome back, ${user?.username || "Student"}`}
        description="Track your saved places, review new matches, and keep every landlord conversation close."
        actions={
          <>
            <Link to="/listings" className="ln-secondary-btn">
              <Home className="h-4 w-4" />
              Browse listings
            </Link>
            <Link to={`/student/${user?._id}/inbox`} className="ln-primary-btn">
              <MessageSquare className="h-4 w-4" />
              Open inbox
            </Link>
          </>
        }
      >
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard
              icon={Sparkles}
              label="Recommendations"
              value={recommendations.length}
              detail="Fresh matches based on your preferences"
            />
            <StatCard
              icon={Bookmark}
              label="Saved Places"
              value={bookmarks.length}
              detail="Listings you want to revisit"
              tone="amber"
            />
            <StatCard
              icon={CalendarRange}
              label="Scheduled Visits"
              value={schedules.length}
              detail="Upcoming and past property visits"
              tone="emerald"
            />
            <StatCard
              icon={MessageSquare}
              label="Unread Chats"
              value={unreadChats}
              detail="Landlord replies waiting for you"
              tone="blue"
            />
          </div>

          <SectionCard
            title="Plan your next move"
            description="Quick actions for the work students repeat most while shortlisting accommodation."
          >
            <div className="grid gap-3 md:grid-cols-3">
              <Link
                to="/listings"
                className="group rounded-lg border border-slate-200 bg-white px-4 py-4 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50"
              >
                <MapPinned className="h-5 w-5 text-blue-700" />
                <p className="mt-3 text-sm font-bold text-slate-950">Compare areas</p>
                <p className="mt-1 text-sm leading-5 text-slate-500">Use filters and map view to scan rent, distance, and property details.</p>
              </Link>
              <button
                type="button"
                onClick={() => setViewMode("bookmarks")}
                className="group rounded-lg border border-slate-200 bg-white px-4 py-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-amber-200 hover:bg-amber-50"
              >
                <Bookmark className="h-5 w-5 text-amber-700" />
                <p className="mt-3 text-sm font-bold text-slate-950">Review saved places</p>
                <p className="mt-1 text-sm leading-5 text-slate-500">Keep your shortlist active and remove places that no longer fit.</p>
              </button>
              <Link
                to={`/student/${user?._id}/schedule`}
                className="group rounded-lg border border-slate-200 bg-white px-4 py-4 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:bg-emerald-50"
              >
                <ClipboardCheck className="h-5 w-5 text-emerald-700" />
                <p className="mt-3 text-sm font-bold text-slate-950">Check visits</p>
                <p className="mt-1 text-sm leading-5 text-slate-500">Track upcoming viewings and keep your schedule tidy.</p>
              </Link>
            </div>
          </SectionCard>

          {!user?.hasCompletedPreferences ? (
            <SectionCard
              title="Finish your housing preferences"
              description="Complete your student profile to improve recommendation quality and keep your dashboard tailored to your next move."
              action={
                <button type="button" className="ln-primary-btn" onClick={() => setShowPreferences(true)}>
                  <Settings className="h-4 w-4" />
                  Update preferences
                </button>
              }
            >
              <div className="rounded-lg border border-dashed border-blue-200 bg-blue-50/70 px-4 py-4 text-sm leading-6 text-blue-900">
                Add your preferred areas, budget, and property type so LankaNest can surface stronger matches.
              </div>
            </SectionCard>
          ) : null}

          <SectionCard
            title={viewMode === "bookmarks" ? "Your saved listings" : "Recommended for you"}
            description={
              viewMode === "bookmarks"
                ? "Keep your shortlist tidy and jump back into the places you liked most."
                : "Explore the latest places that fit your preferences and activity."
            }
            action={
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setViewMode("recommended")}
                  className={viewMode === "recommended" ? "ln-primary-btn" : "ln-secondary-btn"}
                >
                  Recommendations
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("bookmarks")}
                  className={viewMode === "bookmarks" ? "ln-primary-btn" : "ln-secondary-btn"}
                >
                  Bookmarks
                </button>
              </div>
            }
          >
            {isListingSectionLoading ? (
              <LoadingState label={`Loading ${viewMode === "bookmarks" ? "bookmarks" : "recommendations"}`} />
            ) : activeListings.length === 0 ? (
              <EmptyState
                icon={viewMode === "bookmarks" ? Bookmark : Sparkles}
                title={viewMode === "bookmarks" ? "No bookmarks yet" : "No recommendations yet"}
                description={
                  viewMode === "bookmarks"
                    ? "Save interesting places from the listing pages to build your shortlist."
                    : "Complete your preferences and browse more listings to improve your match quality."
                }
                action={
                  <Link to="/listings" className="ln-primary-btn">
                    Browse listings
                  </Link>
                }
              />
            ) : (
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                {activeListings.map((listing) => (
                  <RecommendationCard
                    key={listing._id || listing.listing?._id}
                    listing={listing}
                    isBookmarked={viewMode === "bookmarks"}
                    showMatchScore={viewMode !== "bookmarks"}
                  />
                ))}
              </div>
            )}
          </SectionCard>

          <SectionCard
            title="Most popular boarding house"
            description="A quick pulse on the places getting the most student attention right now."
          >
            <PopularCard limit={1} />
          </SectionCard>
        </div>
      </DashboardShell>

      <UserPreference
        isVisible={showPreferences}
        onClose={handlePreferenceClose}
        userId={user?._id}
        token={localStorage.getItem("token")}
      />
    </>
  );
}
