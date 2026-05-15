import { useEffect, useMemo, useState } from "react";
import { Bell, Inbox } from "lucide-react";
import { notification } from "antd";
import StudentSidebar from "@/components/student_dashboard/StudentSidebar";
import {
  DashboardShell,
  EmptyState,
  LoadingState,
  SectionCard,
} from "@/components/ui/page-shell";
import { useAuthStore } from "@/store/authStore";
import {
  fetchStudentNotifications,
  markStudentNotificationRead,
} from "@/services/notifications";

const StdNotifications = () => {
  const { user } = useAuthStore();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("unread");

  useEffect(() => {
    const loadNotifications = async () => {
      if (!user?._id) return;

      try {
        setLoading(true);
        setItems(await fetchStudentNotifications(user._id));
      } catch (error) {
        notification.error({
          message: "Failed to load notifications",
          description: error?.response?.data?.message || "Please try again later.",
        });
      } finally {
        setLoading(false);
      }
    };

    loadNotifications();
  }, [user?._id]);

  useEffect(() => {
    const unreadCount = items.filter((item) => !item.read).length;
    document.title = unreadCount > 0 ? `(${unreadCount}) Notifications` : "Notifications";
  }, [items]);

  const filteredNotifications = useMemo(() => {
    if (activeTab === "all") return items;
    return items.filter((item) => !item.read);
  }, [activeTab, items]);

  const unreadCount = items.filter((item) => !item.read).length;

  const handleNotificationClick = async (item) => {
    if (item.read) return;

    try {
      await markStudentNotificationRead(item._id);
      setItems((prev) =>
        prev.map((notificationItem) =>
          notificationItem._id === item._id ? { ...notificationItem, read: true } : notificationItem
        )
      );
    } catch {
      // Leave the item unread locally if the update request fails.
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
  };

  return (
    <DashboardShell
      sidebar={<StudentSidebar />}
      sidebarWidth="18rem"
      eyebrow="Updates"
      title="Notifications"
      description="Review account updates, schedule changes, and message alerts in one calm stream."
      actions={
        <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700 shadow-sm">
          {unreadCount} unread
        </div>
      }
    >
      <SectionCard
        title="Recent updates"
        description="Unread items stay at the top so you can clear the important updates first."
        action={
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("unread")}
              className={activeTab === "unread" ? "ln-primary-btn" : "ln-secondary-btn"}
            >
              Unread ({unreadCount})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("all")}
              className={activeTab === "all" ? "ln-primary-btn" : "ln-secondary-btn"}
            >
              All
            </button>
          </div>
        }
      >
        {loading ? (
          <LoadingState label="Loading notifications" />
        ) : filteredNotifications.length === 0 ? (
          <EmptyState
            icon={activeTab === "unread" ? Bell : Inbox}
            title={activeTab === "unread" ? "No unread notifications" : "No notifications yet"}
            description={
              activeTab === "unread"
                ? "You are all caught up for now."
                : "You will see message alerts, schedule changes, and account updates here."
            }
          />
        ) : (
          <div className="space-y-4">
            {filteredNotifications.map((item) => (
              <button
                type="button"
                key={item._id}
                onClick={() => handleNotificationClick(item)}
                className={`w-full rounded-lg border px-4 py-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
                  item.read
                    ? "border-slate-200 bg-white"
                    : "border-blue-200 bg-blue-50/70 shadow-sm"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-semibold text-slate-900">{item.title}</h3>
                      {!item.read ? (
                        <span className="rounded-md bg-blue-700 px-2 py-0.5 text-[11px] font-semibold text-white">
                          New
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-2 text-sm font-medium text-slate-700">{item.message}</p>
                    <p className="mt-3 text-xs text-slate-400">{formatDate(item.createdAt)}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </SectionCard>
    </DashboardShell>
  );
};

export default StdNotifications;
