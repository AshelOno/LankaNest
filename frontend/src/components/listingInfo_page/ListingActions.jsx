import React, { useEffect, useState } from "react";
import { Form, Input, Rate, Select, notification } from "antd";
import { MdRateReview, MdReport } from "react-icons/md";
import { FaBookmark } from "react-icons/fa6";
import { BiSolidConversation } from "react-icons/bi";
import { RiCalendarScheduleFill } from "react-icons/ri";
import { useAuthStore } from "@/store/authStore";
import { useLocation, useNavigate } from "react-router-dom";
import { api } from "@/services/http";
import { useBookmarkStore } from "@/store/bookmarkStore";
import ChatDialog from "./ChatDialog";
import { ModalShell } from "./listing-ui";
import BookingPanel from "./BookingPanel";

const ActionCardButton = ({
  icon,
  title,
  subtitle,
  variant = "default",
  onClick,
  disabled,
}) => {
  const toneByVariant = {
    default: "bg-white hover:border-slate-300",
    review: "bg-white hover:border-indigo-200 hover:bg-indigo-50/50",
    message: "bg-white hover:border-sky-200 hover:bg-sky-50/50",
    save_idle: "bg-white hover:border-amber-200 hover:bg-amber-50/50",
    saved: "bg-amber-50 border-amber-200 hover:border-amber-300",
    danger: "bg-white hover:border-rose-200 hover:bg-rose-50/50",
    schedule: "bg-white hover:border-teal-200 hover:bg-teal-50/50",
  };

  const iconStyles = {
    default: "bg-slate-50 text-slate-600 ring-slate-200",
    review: "bg-indigo-50 text-indigo-600 ring-indigo-100",
    message: "bg-sky-50 text-sky-600 ring-sky-100",
    save_idle: "bg-amber-50 text-amber-500 ring-amber-100",
    saved: "bg-amber-500 text-white ring-amber-200",
    danger: "bg-rose-50 text-rose-500 ring-rose-100",
    schedule: "bg-teal-50 text-teal-600 ring-teal-100",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`group w-full overflow-hidden rounded-lg border border-slate-200 ${toneByVariant[variant] || toneByVariant.default} p-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-70`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-lg shadow-sm ring-1 ${iconStyles[variant] || iconStyles.default}`}
        >
          {icon}
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-900">{title}</p>
          <p className="mt-0.5 text-[11px] leading-5 text-slate-500">{subtitle}</p>
        </div>

        <div className="text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-slate-500">
          →
        </div>
      </div>
    </button>
  );
};

export function RatingDialog({ listingId, onReviewAdded }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const { isAuthenticated, user } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleOpen = () => {
    if (!isAuthenticated) {
      localStorage.setItem("redirectAfterLogin", location.pathname);
      navigate("/auth/user-signin");
      return;
    }
    setOpen(true);
  };

  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      const response = await api.post(
        "/review/add-review",
        {
          propertyId: listingId,
          studentId: user._id,
          ratings: values.rating,
          review: values.review,
        }
      );

      if (response.data.success) {
        notification.success({
          message: "Review submitted",
          description: "Your review was submitted successfully.",
        });
        form.resetFields();
        setOpen(false);
        onReviewAdded?.();
      } else {
        notification.warning({
          message: "Review not accepted",
          description: response.data.message || "Your review could not be submitted.",
        });
      }
    } catch (error) {
      notification.error({
        message: "Submission failed",
        description: error.response?.data?.message || "Failed to submit review.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <ActionCardButton
        onClick={handleOpen}
        icon={<MdRateReview className="text-lg" />}
        title="Write a review"
        subtitle="Share your experience and help other students choose confidently."
        variant="review"
      />

      <ModalShell
        open={open}
        onClose={() => setOpen(false)}
        title="Write a review"
        subtitle="Share your experience to help other students."
        width={500}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="rating"
            label={<span className="text-sm font-medium text-slate-700">Your rating</span>}
            rules={[{ required: true, message: "Please give a rating" }]}
            className="mb-4"
          >
            <Rate allowHalf style={{ fontSize: 28 }} />
          </Form.Item>

          <Form.Item
            name="review"
            label={<span className="text-sm font-medium text-slate-700">Your review</span>}
            rules={[{ required: true, message: "Please write a review" }]}
            className="mb-2"
          >
            <Input.TextArea
              rows={5}
              placeholder="Write your review here..."
              className="resize-none rounded-xl"
              maxLength={500}
              showCount
            />
          </Form.Item>

          <div className="mt-5 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-xl bg-slate-100 px-4 py-2.5 text-slate-800 hover:bg-slate-200"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-blue-700 px-4 py-2.5 text-white hover:bg-blue-800"
              disabled={loading}
            >
              {loading ? "Submitting..." : "Submit review"}
            </button>
          </div>
        </Form>
      </ModalShell>
    </>
  );
}

export function ReportDialog({ listingId }) {
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const { isAuthenticated, user } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const reportReasons = [
    { value: "inappropriate_content", label: "Inappropriate content" },
    { value: "fraudulent_listing", label: "Fraudulent listing" },
    { value: "scam", label: "Scam" },
    { value: "harassment", label: "Harassment" },
    { value: "misleading_info", label: "Misleading information" },
    { value: "terms_violation", label: "Terms violation" },
    { value: "duplicate_listing", label: "Duplicate listing" },
    { value: "technical_issue", label: "Technical issue" },
  ];

  const handleOpen = () => {
    if (!isAuthenticated) {
      localStorage.setItem("redirectAfterLogin", location.pathname);
      navigate("/auth/user-signin");
      return;
    }
    setOpen(true);
  };

  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      const response = await api.post(
        "/report/addReport",
        {
          reporterId: user._id,
          listingId,
          type: values.reason,
          description: values.report,
        }
      );

      if (response.data.success) {
        notification.success({
          message: "Report submitted",
          description: "Thank you. We will review this listing.",
        });
        form.resetFields();
        setOpen(false);
      }
    } catch (error) {
      notification.error({
        message: "Submission failed",
        description: error.response?.data?.message || "Failed to submit report.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <ActionCardButton
        onClick={handleOpen}
        icon={<MdReport className="text-lg" />}
        title="Report listing"
        subtitle="Flag inappropriate, misleading, or suspicious content."
        variant="danger"
      />

      <ModalShell
        open={open}
        onClose={() => setOpen(false)}
        title="Report this listing"
        subtitle="Tell us what is wrong so we can review it properly."
        width={520}
      >
        <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-xl text-xs text-rose-800 leading-relaxed">
          <p className="font-bold mb-1">When should you report?</p>
          <ul className="list-disc pl-4 space-y-1">
            <li>The property information is misleading or completely false.</li>
            <li>The photos do not match the actual property described.</li>
            <li>The landlord is asking for payments outside the platform before viewing.</li>
            <li>The listing contains offensive, inappropriate, or illegal content.</li>
          </ul>
        </div>

        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="reason"
            label={<span className="text-sm font-medium text-slate-700">Reason</span>}
            rules={[{ required: true, message: "Please select a reason" }]}
            className="mb-4"
          >
            <Select
              placeholder="Select a reason"
              options={reportReasons}
              className="w-full"
            />
          </Form.Item>

          <Form.Item
            name="report"
            label={<span className="text-sm font-medium text-slate-700">Details</span>}
            rules={[{ required: true, message: "Please explain clearly" }]}
          >
            <Input.TextArea
              rows={5}
              placeholder="Add details about what happened..."
              className="resize-none rounded-xl"
              maxLength={500}
              showCount
            />
          </Form.Item>

          <div className="mt-5 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-xl bg-slate-100 px-4 py-2.5 text-slate-800 hover:bg-slate-200"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-xl bg-rose-500 px-4 py-2.5 text-white hover:bg-rose-600"
              disabled={loading}
            >
              {loading ? "Submitting..." : "Submit report"}
            </button>
          </div>
        </Form>
      </ModalShell>
    </>
  );
}

export function AddBookMark({ listingId }) {
  const { isAuthenticated, user } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    addBookmark,
    removeBookmark,
    isListingBookmarked,
    fetchBookmarks,
    bookmarks,
  } = useBookmarkStore();

  useEffect(() => {
    const load = async () => {
      if (!isAuthenticated || !user?._id || !listingId) return;
      try {
        await fetchBookmarks(user._id);
        setIsBookmarked(isListingBookmarked(listingId));
      } catch (error) {
        console.error("Error checking bookmark status:", error);
      }
    };

    load();
  }, [isAuthenticated, user, listingId, fetchBookmarks, isListingBookmarked]);

  const toggleBookmark = async () => {
    if (!isAuthenticated) {
      localStorage.setItem("redirectAfterLogin", location.pathname);
      navigate("/auth/user-signin");
      return;
    }

    setLoading(true);
    try {
      if (isBookmarked) {
        const bookmarkToRemove = bookmarks.find(
          (bookmark) =>
            bookmark.listing?._id === listingId || bookmark.listing === listingId
        );

        if (bookmarkToRemove) {
          await removeBookmark(bookmarkToRemove._id, user._id);
          setIsBookmarked(false);
          notification.success({
            message: "Saved items updated",
            description: "Bookmark removed successfully.",
          });
        }
      } else {
        await addBookmark(listingId, user._id);
        setIsBookmarked(true);
        notification.success({
          message: "Saved items updated",
          description: "Bookmark added successfully.",
        });
      }
    } catch (error) {
      notification.error({
        message: "Action failed",
        description:
          error.response?.data?.message ||
          `Failed to ${isBookmarked ? "remove" : "add"} bookmark.`,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ActionCardButton
      onClick={toggleBookmark}
      icon={<FaBookmark className="text-lg" />}
      title={isBookmarked ? "Saved listing" : "Save listing"}
      subtitle={
        isBookmarked
          ? "This property is in your saved list."
          : "Keep this property for later."
      }
      variant={isBookmarked ? "saved" : "save_idle"}
      disabled={loading}
    />
  );
}

export function StartConversation({ listing }) {
  const [isOpen, setIsOpen] = useState(false);
  const { isAuthenticated, user } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleClick = () => {
    if (!isAuthenticated) {
      localStorage.setItem("redirectAfterLogin", location.pathname);
      navigate("/auth/user-signin");
      return;
    }

    if (user?.role !== "user") {
      notification.info({
        message: "Student access only",
        description: "Only students can start conversations with landlords.",
      });
      return;
    }

    setIsOpen(true);
  };

  return (
    <>
      <ActionCardButton
        onClick={handleClick}
        icon={<BiSolidConversation className="text-lg" />}
        title="Message landlord"
        subtitle="Ask questions before you book a visit."
        variant="message"
      />

      <ChatDialog isOpen={isOpen} setIsOpen={setIsOpen} listing={listing} />
    </>
  );
}

export function ScheduleVisit({ listing }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <ActionCardButton
        onClick={() => setOpen(true)}
        icon={<RiCalendarScheduleFill className="text-lg" />}
        title="Schedule visit"
        subtitle="Pick a suitable time and request a visit."
        variant="schedule"
      />

      <ModalShell
        open={open}
        onClose={() => setOpen(false)}
        title="Schedule a visit"
        subtitle="Choose a date and time for your visit."
        width={560}
      >
        <BookingPanel listing={listing} />
      </ModalShell>
    </>
  );
}
