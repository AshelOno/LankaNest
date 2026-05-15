import { useAuthStore } from "@/store/authStore";
import { useBookmarkStore } from "@/store/bookmarkStore";
import { notification } from "antd";
import {
  Bath,
  BedDouble,
  Bookmark,
  ExternalLink,
  Home,
  MapPin,
  Sparkles,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

const formatPrice = (price) =>
  price != null ? Number(price).toLocaleString() : "Price unavailable";

const PROPERTY_FALLBACK_IMAGE = "/bording.jpg";

const DetailPill = ({ icon: Icon, children }) => (
  <span className="inline-flex min-w-0 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-2 text-sm font-semibold text-slate-600 shadow-sm transition-all duration-200 hover:bg-white">
    <Icon className="h-4 w-4 shrink-0 text-slate-400" />
    <span className="truncate">{children}</span>
  </span>
);

const RecommendationCard = ({
  listing,
  isBookmarked: initialIsBookmarked,
  showMatchScore = true,
}) => {
  const [loading, setLoading] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(initialIsBookmarked || false);

  const { isAuthenticated, user } = useAuthStore();
  const {
    addBookmark,
    removeBookmark,
    isListingBookmarked,
    bookmarks,
  } = useBookmarkStore();

  const actualListing = listing?.listing || listing || {};
  const listingId = actualListing?._id;
  const imageUrl = actualListing?.images?.[0] || PROPERTY_FALLBACK_IMAGE;

  useEffect(() => {
    if (isAuthenticated && user?._id && !initialIsBookmarked && listingId) {
      setIsBookmarked(isListingBookmarked(listingId));
    }
  }, [isAuthenticated, user, listingId, isListingBookmarked, initialIsBookmarked]);

  const matchScoreText = useMemo(() => {
    const score = actualListing?.score;
    if (score === undefined || score === null) return null;
    return `${Math.round(Number(score) * 100)}% match`;
  }, [actualListing?.score]);

  const genderLabel =
    actualListing?.genderPreference === "mixed"
      ? "Mixed"
      : actualListing?.genderPreference === "girls"
      ? "Girls only"
      : actualListing?.genderPreference === "boys"
      ? "Boys only"
      : actualListing?.genderPreference;

  const toggleBookmark = async (event) => {
    event.preventDefault();
    event.stopPropagation();

    if (!isAuthenticated) {
      notification.info({
        message: "Authentication required",
        description: "Please sign in to bookmark listings.",
      });
      return;
    }

    if (!listingId) return;

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
    } catch {
      notification.error({
        message: "Action failed",
        description: `Failed to ${isBookmarked ? "remove" : "add"} bookmark.`,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <article className="group overflow-hidden rounded-lg border border-slate-200 bg-white/96 shadow-[0_12px_34px_rgba(15,23,42,0.07)] transition-all duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-[0_18px_46px_rgba(15,23,42,0.1)]">
      <Link to={`/listing/${listingId || "#"}`} className="block">
        <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
          <img
            src={imageUrl}
            alt={actualListing?.propertyName || "Property listing"}
            className="h-full w-full object-cover transition-all duration-500 group-hover:scale-[1.03]"
            onError={(event) => {
              event.currentTarget.onerror = null;
              event.currentTarget.src = PROPERTY_FALLBACK_IMAGE;
            }}
          />

          <div className="absolute left-3 top-3 flex flex-wrap gap-2">
            {showMatchScore && matchScoreText ? (
              <span className="inline-flex items-center gap-2 rounded-lg bg-white/95 px-3 py-2 text-sm font-bold text-slate-900 shadow-sm backdrop-blur-sm">
                <Sparkles className="h-4 w-4 text-blue-600" />
                {matchScoreText}
              </span>
            ) : null}
            {actualListing?.propertyType ? (
              <span className="rounded-lg bg-slate-950/80 px-3 py-2 text-sm font-semibold text-white shadow-sm backdrop-blur-sm">
                {actualListing.propertyType}
              </span>
            ) : null}
          </div>

          <button
            type="button"
            className={`absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-lg border border-white/70 bg-white/95 text-slate-700 shadow-sm backdrop-blur-sm transition-all duration-200 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 ${
              isBookmarked ? "text-amber-600" : ""
            }`}
            onClick={toggleBookmark}
            disabled={loading}
            aria-label="Toggle bookmark"
          >
            <Bookmark className={isBookmarked ? "h-4.5 w-4.5 fill-current" : "h-4.5 w-4.5"} />
          </button>
        </div>

        <div className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h2 className="truncate text-lg font-semibold text-slate-950">
                {actualListing?.propertyName || "Property Title"}
              </h2>
              <div className="mt-2 flex items-center gap-2 text-sm text-slate-500">
                <MapPin className="h-5 w-5 shrink-0 text-blue-600" />
                <span className="truncate">
                  {actualListing?.city || actualListing?.address || "Location not specified"}
                </span>
              </div>
            </div>

            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-700 shadow-sm transition-all duration-200 group-hover:border-blue-200 group-hover:bg-white group-hover:text-blue-700">
              <ExternalLink className="h-4.5 w-4.5" />
            </span>
          </div>

          <p className="mt-4 text-xl font-bold tracking-tight text-slate-950">
            LKR {formatPrice(actualListing?.monthlyRent)}
            <span className="text-base font-semibold text-slate-500"> / month</span>
          </p>

          <div className="mt-4 flex flex-wrap gap-2.5">
            {actualListing?.bedrooms != null ? (
              <DetailPill icon={BedDouble}>{actualListing.bedrooms} bed</DetailPill>
            ) : null}
            {actualListing?.bathrooms != null ? (
              <DetailPill icon={Bath}>{actualListing.bathrooms} bath</DetailPill>
            ) : null}
            {actualListing?.propertyType ? (
              <DetailPill icon={Home}>{actualListing.propertyType}</DetailPill>
            ) : null}
            {genderLabel ? <DetailPill icon={Users}>{genderLabel}</DetailPill> : null}
          </div>

          {actualListing?.matchReasons?.length > 0 ? (
            <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50/80 px-4 py-3 shadow-sm">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
                Why this matches
              </p>
              <p className="mt-1 line-clamp-2 text-sm leading-5 text-slate-600">
                {actualListing.matchReasons.slice(0, 2).join(" · ")}
              </p>
            </div>
          ) : null}
        </div>
      </Link>
    </article>
  );
};

export default RecommendationCard;
