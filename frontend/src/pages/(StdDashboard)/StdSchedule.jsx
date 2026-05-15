import { useEffect, useMemo, useState } from "react";
import StudentSidebar from "@/components/student_dashboard/StudentSidebar";
import ScheduleCard from "@/components/student_dashboard/ScheduleCard";
import { DashboardShell, EmptyState, LoadingState, SectionCard } from "@/components/ui/page-shell";
import { useScheduleStore } from "@/store/scheduleStore";
import { useAuthStore } from "@/store/authStore";
import { CalendarClock } from "lucide-react";

const StdSchedule = () => {
  const [activeTab, setActiveTab] = useState("upcoming");
  const { schedules, loading, getSchedulesByUserId } = useScheduleStore();
  const { user } = useAuthStore();

  useEffect(() => {
    if (user?._id) {
      getSchedulesByUserId(user._id).catch(() => {});
    }
    document.title = "My Schedules";
  }, [getSchedulesByUserId, user?._id]);

  const isUpcoming = (dateStr, timeStr) => {
    try {
      const now = new Date();
      const scheduleDate = new Date(dateStr);
      const [hours, minutes] = timeStr.split(":").map(Number);
      scheduleDate.setHours(hours, minutes, 0, 0);
      return scheduleDate > now;
    } catch {
      return false;
    }
  };

  const groups = useMemo(() => {
    const upcoming = schedules.filter(
      (schedule) => isUpcoming(schedule.date, schedule.time) && schedule.status !== "rejected"
    );
    const rejected = schedules.filter((schedule) => schedule.status === "rejected");
    const past = schedules.filter(
      (schedule) => !isUpcoming(schedule.date, schedule.time) && schedule.status !== "rejected"
    );

    return { upcoming, rejected, past };
  }, [schedules]);

  const currentItems = groups[activeTab] || [];

  return (
    <DashboardShell
      sidebar={<StudentSidebar />}
      sidebarWidth="18rem"
      eyebrow="Visits"
      title="My schedules"
      description="Track confirmed tours, pending visits, and past property appointments in one tidy timeline."
    >
      <SectionCard
        title="Visit timeline"
        description="Switch between upcoming, rejected, and past appointments without losing context."
        action={
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("upcoming")}
              className={activeTab === "upcoming" ? "ln-primary-btn" : "ln-secondary-btn"}
            >
              Upcoming ({groups.upcoming.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("rejected")}
              className={activeTab === "rejected" ? "ln-primary-btn" : "ln-secondary-btn"}
            >
              Rejected ({groups.rejected.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("past")}
              className={activeTab === "past" ? "ln-primary-btn" : "ln-secondary-btn"}
            >
              Past ({groups.past.length})
            </button>
          </div>
        }
      >
        {loading ? (
          <LoadingState label="Loading schedules" />
        ) : schedules.length === 0 ? (
          <EmptyState
            icon={CalendarClock}
            title="No scheduled visits"
            description="Once you book a tour with a landlord, the visit details will appear here."
          />
        ) : currentItems.length === 0 ? (
          <EmptyState
            icon={CalendarClock}
            title={`No ${activeTab} visits`}
            description="This part of your visit timeline is currently empty."
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {currentItems.map((schedule) => (
              <ScheduleCard
                key={schedule._id}
                schedule={schedule}
                isUpcoming={activeTab === "upcoming"}
                statusLabel={
                  activeTab === "rejected"
                    ? "Rejected"
                    : activeTab === "past"
                    ? schedule.status === "pending"
                      ? "Expired"
                      : "Past"
                    : schedule.status === "confirmed"
                    ? "Confirmed"
                    : "Pending"
                }
                statusClassName={
                  activeTab === "rejected"
                    ? "bg-orange-100 text-orange-800"
                    : activeTab === "past"
                    ? "bg-slate-100 text-slate-700"
                    : schedule.status === "confirmed"
                    ? "bg-blue-100 text-blue-800"
                    : "bg-yellow-100 text-yellow-800"
                }
              />
            ))}
          </div>
        )}
      </SectionCard>
    </DashboardShell>
  );
};

export default StdSchedule;
