import React, { useMemo, useState } from "react";
import { GoCheckCircleFill } from "react-icons/go";
import {
  FiStar,
  FiMessageSquare,
  FiHome,
  FiLayers,
  FiShield,
  FiThumbsUp,
  FiCornerDownRight,
  FiFilter,
} from "react-icons/fi";
import { api } from "@/services/http";
import { useAuthStore } from "@/store/authStore";
import { notification } from "antd";
import StarRating from "../include/StarRating";
import { SectionCard, SectionHeader, BadgeChip } from "./listing-ui";

const formatValue = (value, fallback = "N/A") => {
  if (value === null || value === undefined || value === "") return fallback;
  return value;
};

const StatPill = ({ label, value, icon }) => (
  <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-3.5 py-3 shadow-sm transition hover:shadow-md">
    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
      {icon}
    </div>
    <div className="min-w-0">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
        {label}
      </p>
      <p className="truncate text-sm font-semibold text-slate-900">{value}</p>
    </div>
  </div>
);

const DistributionBar = ({ rating, count, total }) => {
  const percentage = total > 0 ? (count / total) * 100 : 0;

  return (
    <div className="flex items-center gap-3">
      <div className="flex w-10 items-center gap-1 text-xs font-medium text-slate-600">
        <span>{rating}</span>
        <FiStar className="h-3 w-3 fill-amber-400 text-amber-400" />
      </div>

      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-amber-400 transition-all duration-500"
          style={{ width: `${Math.max(0, Math.min(100, percentage))}%` }}
        />
      </div>

      <div className="w-6 text-right text-[11px] font-medium text-slate-400">
        {count}
      </div>
    </div>
  );
};

const FilterChip = ({ active, children, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`rounded-full px-3 py-1.5 text-[11px] font-semibold transition ${
      active
        ? "bg-sky-600 text-white shadow-sm"
        : "border border-slate-200 bg-white text-slate-600 hover:border-sky-200 hover:text-sky-700"
    }`}
  >
    {children}
  </button>
);

const ReviewCard = ({
  review,
  user,
  isLandlord,
  formatDate,
  getInitial,
  onHelpful,
  onReply,
  replyingTo,
  setReplyingTo,
  replyText,
  setReplyText,
  submittingReply,
}) => {
  const helpfulCount = review.helpfulVotes?.length || 0;
  const isHelpful = review.helpfulVotes?.includes(user?._id);

  return (
    <article className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition hover:shadow-md">
      <div className="p-4">
        <div className="mb-3 flex items-start gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500 text-xs font-semibold text-white shadow-sm">
            {getInitial(review)}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate text-sm font-semibold text-slate-900">
                {review.studentId?.username || "Anonymous"}
              </h3>
              <BadgeChip tone="soft">Verified Student</BadgeChip>
            </div>
            <p className="text-[11px] text-slate-500">{formatDate(review.createdAt)}</p>
          </div>
        </div>

        <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50/50 px-3 py-2">
          <StarRating rating={review.ratings} />
        </div>

        <p className="text-sm leading-6 text-slate-700 mb-3">
          {review.review || "No written feedback provided."}
        </p>

        <div className="flex items-center justify-between">
          <button
            onClick={() => onHelpful(review._id)}
            className={`inline-flex items-center gap-1.5 text-xs font-medium transition ${
              isHelpful ? "text-amber-600" : "text-slate-500 hover:text-amber-600"
            }`}
          >
            <FiThumbsUp className={`h-3.5 w-3.5 ${isHelpful ? "fill-amber-600" : ""}`} />
            Helpful ({helpfulCount})
          </button>

          {isLandlord && !review.landlordReply && (
            <button
              onClick={() =>
                setReplyingTo(replyingTo === review._id ? null : review._id)
              }
              className="text-xs font-semibold text-sky-600 hover:underline"
            >
              {replyingTo === review._id ? "Cancel" : "Reply"}
            </button>
          )}
        </div>

        {replyingTo === review._id && (
          <div className="mt-3 space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-3.5">
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Write your response as the landlord..."
              className="min-h-[82px] w-full resize-none rounded-lg border border-slate-200 bg-white p-3 text-sm outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
              rows={3}
            />
            <div className="flex justify-end">
              <button
                disabled={submittingReply || !replyText.trim()}
                onClick={() => onReply(review._id)}
                className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submittingReply ? "Posting..." : "Post Reply"}
              </button>
            </div>
          </div>
        )}

        {review.landlordReply && (
          <div className="mt-3 rounded-lg border border-blue-100 bg-blue-50/70 p-3">
            <div className="mb-2 flex items-center gap-2 text-blue-700">
              <FiCornerDownRight className="text-sm" />
              <span className="text-xs font-bold uppercase tracking-wider">
                Landlord Reply
              </span>
            </div>
            <p className="text-sm italic leading-5 text-slate-600">
              “{review.landlordReply}”
            </p>
          </div>
        )}
      </div>
    </article>
  );
};

const ListingInfo02 = ({ listing, reviews = [], stats, onReviewUpdated }) => {
  const { user, isAuthenticated } = useAuthStore();
  const [sortBy, setSortBy] = useState("newest");
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [submittingReply, setSubmittingReply] = useState(false);

  const isLandlord = useMemo(() => {
    if (!user || !listing?.landlord) return false;
    const landlordId = listing.landlord._id || listing.landlord;
    return user._id === landlordId;
  }, [user, listing]);

  const sortedReviews = useMemo(() => {
    const items = [...reviews];
    switch (sortBy) {
      case "highest":
        return items.sort((a, b) => (b.ratings || 0) - (a.ratings || 0));
      case "lowest":
        return items.sort((a, b) => (a.ratings || 0) - (b.ratings || 0));
      case "helpful":
        return items.sort(
          (a, b) => (b.helpfulVotes?.length || 0) - (a.helpfulVotes?.length || 0)
        );
      case "newest":
      default:
        return items.sort(
          (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
        );
    }
  }, [reviews, sortBy]);

  const getInitial = (review) =>
    review?.studentId?.email?.charAt(0)?.toUpperCase() ||
    review?.studentId?.username?.charAt(0)?.toUpperCase() ||
    "U";

  const formatDate = (dateString) => {
    if (!dateString) return "Recently";
    const diff = Date.now() - new Date(dateString).getTime();
    const mins = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(mins / 60);
    const days = Math.floor(hours / 24);

    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins} min ago`;
    if (hours < 24) return `${hours} hr${hours > 1 ? "s" : ""} ago`;
    return `${days} day${days > 1 ? "s" : ""} ago`;
  };

  const handleHelpful = async (reviewId) => {
    if (!isAuthenticated) {
      notification.info({
        message: "Login required",
        description: "Please log in to vote on reviews.",
      });
      return;
    }

    try {
      await api.post(
        `/review/toggle-helpful/${reviewId}`,
        { userId: user._id }
      );
      onReviewUpdated?.();
    } catch (error) {
      console.error("Error toggling helpful vote:", error);
      notification.error({ message: "Unable to update helpful vote" });
    }
  };

  const handleReplySubmit = async (reviewId) => {
    if (!replyText.trim()) return;

    try {
      setSubmittingReply(true);
      await api.patch(`/review/landlord-reply/${reviewId}`, {
        reply: replyText,
      });
      notification.success({ message: "Reply posted" });
      setReplyingTo(null);
      setReplyText("");
      onReviewUpdated?.();
    } catch (error) {
      console.error("Error posting reply:", error);
      notification.error({ message: "Failed to post reply" });
    } finally {
      setSubmittingReply(false);
    }
  };

  const features =
    Array.isArray(listing?.features) && listing.features.length > 0
      ? listing.features
      : ["Air Conditioning", "Washer", "Laundry"];

  const averageRating = useMemo(() => {
    if (stats?.average) return Number(stats.average).toFixed(1);
    if (!reviews.length) return "0.0";
    const sum = reviews.reduce(
      (acc, review) => acc + (Number(review?.ratings) || 0),
      0
    );
    return (sum / reviews.length).toFixed(1);
  }, [reviews, stats]);

  const totalReviews = reviews.length;
  const reviewCountLabel = `${totalReviews} review${totalReviews !== 1 ? "s" : ""}`;

  return (
    <div className="w-full space-y-4 pb-10">
      <SectionCard className="p-4 sm:p-5">
        <SectionHeader
          eyebrow="About this property"
          title="Description & Overview"
          subtitle="What makes this place special"
          badge="Property story"
          badgeIcon={<FiHome className="text-sky-600" />}
        />

        <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-5">
          <p className="text-sm leading-6 text-slate-700">
            {listing?.description?.trim() || "No description available for this property."}
          </p>
        </div>

        {/* Quick Stats Row */}
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <StatPill
            label="Property Status"
            value={formatValue(listing?.status, "Available")}
            icon={<FiShield className="text-lg" />}
          />
          <StatPill
            label="Category"
            value={formatValue(listing?.category, "Residential")}
            icon={<FiLayers className="text-lg" />}
          />
          <StatPill
            label="Student Reviews"
            value={reviewCountLabel}
            icon={<FiMessageSquare className="text-lg" />}
          />
        </div>
      </SectionCard>

      <SectionCard className="p-4 sm:p-5">
        <SectionHeader
          eyebrow="What you get"
          title="Features"
          subtitle="Amenities included with this property."
          badge={`${features.length} amenities`}
          badgeIcon={<GoCheckCircleFill className="text-teal-600" />}
        />

        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
          {features.map((feature, i) => (
            <div
              key={`${feature}-${i}`}
              className="flex items-center gap-2.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:border-emerald-200 hover:bg-emerald-50/50"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-white text-teal-600 shadow-sm ring-1 ring-slate-100">
                <GoCheckCircleFill className="text-sm" />
              </span>
              <span className="truncate">{feature}</span>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard className="p-4 sm:p-5">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-amber-50 ring-1 ring-amber-100">
              <FiStar className="text-xl text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">Student Reviews</p>
              <p className="text-sm text-slate-500">
                {totalReviews} verified review{totalReviews !== 1 ? "s" : ""}
              </p>
            </div>
          </div>

          {/* Trust Score Display */}
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-slate-900">
                {reviews.length > 0 ? `${averageRating}` : "0.0"}
              </div>
              <div className="flex items-center justify-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <FiStar
                    key={star}
                    className={`text-lg ${
                      star <= Math.round(Number(averageRating) || 0)
                        ? "fill-amber-400 text-amber-400"
                        : "text-slate-300"
                    }`}
                  />
                ))}
              </div>
              <p className="text-xs text-slate-500 mt-1">Average rating</p>
            </div>
          </div>
        </div>

        <div className="mb-5 flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-500">
            <FiFilter className="text-sm" />
            Sort by
          </div>

          <FilterChip active={sortBy === "newest"} onClick={() => setSortBy("newest")}>
            Newest
          </FilterChip>
          <FilterChip active={sortBy === "helpful"} onClick={() => setSortBy("helpful")}>
            Helpful
          </FilterChip>
          <FilterChip active={sortBy === "highest"} onClick={() => setSortBy("highest")}>
            Highest
          </FilterChip>
          <FilterChip active={sortBy === "lowest"} onClick={() => setSortBy("lowest")}>
            Lowest
          </FilterChip>
        </div>

        <div className="mb-6 grid gap-5 lg:grid-cols-2">
          <div className="rounded-lg border border-slate-100 bg-slate-50/70 p-5">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Rating distribution
              </p>
              <BadgeChip tone="default">{stats?.total ?? totalReviews} total</BadgeChip>
            </div>
            <div className="space-y-2.5">
              {[5, 4, 3, 2, 1].map((rating) => (
                <DistributionBar
                  key={rating}
                  rating={rating}
                  count={stats?.distribution?.[rating] || 0}
                  total={stats?.total || totalReviews}
                />
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-slate-100 bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                <FiStar />
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-blue-700">
                  Quick rating
                </p>
                <h3 className="text-lg font-semibold text-slate-900">
                  {reviews.length > 0 ? `${averageRating} out of 5` : "No ratings yet"}
                </h3>
              </div>
            </div>

            <div className="rounded-lg bg-slate-50 p-3.5">
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="font-medium text-slate-600">Overall satisfaction</span>
                <span className="font-semibold text-slate-900">
                  {reviews.length > 0
                    ? `${Math.round((Number(averageRating) / 5) * 100)}%`
                    : "0%"}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-blue-600"
                  style={{
                    width: `${
                      reviews.length > 0
                        ? Math.round((Number(averageRating) / 5) * 100)
                        : 0
                    }%`,
                  }}
                />
              </div>
              <p className="mt-2.5 text-sm leading-6 text-slate-500">
                Students can use reviews, ratings, and replies to make more informed
                accommodation decisions.
              </p>
            </div>
          </div>
        </div>

        {sortedReviews.length > 0 ? (
          <div className="grid gap-3.5 md:grid-cols-2 xl:grid-cols-3">
            {sortedReviews.map((review) => (
              <ReviewCard
                key={review._id}
                review={review}
                user={user}
                isLandlord={isLandlord}
                formatDate={formatDate}
                getInitial={getInitial}
                onHelpful={handleHelpful}
                onReply={handleReplySubmit}
                replyingTo={replyingTo}
                setReplyingTo={setReplyingTo}
                replyText={replyText}
                setReplyText={setReplyText}
                submittingReply={submittingReply}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 py-12 text-center">
            <FiMessageSquare className="mx-auto mb-3 text-4xl text-slate-400" />
            <p className="text-base font-semibold text-slate-900">No reviews yet</p>
            <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-slate-500">
              Approved reviews will appear here once students share feedback.
            </p>
          </div>
        )}
      </SectionCard>
    </div>
  );
};

export default ListingInfo02;
