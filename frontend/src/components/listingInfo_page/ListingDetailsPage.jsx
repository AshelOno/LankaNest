import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { FiStar, FiMessageSquare, FiMapPin } from "react-icons/fi";

import ListingInfoHeroSection from "./ListingInfoHeroSection";
import ListingInfo01 from "./ListingInfo01";
import ListingInfo02 from "./ListingInfo02";
import BookingPanel from "./BookingPanel";
import {
  AddBookMark,
  ReportDialog,
  StartConversation,
  RatingDialog,
} from "./ListingActions";
import { api } from "@/services/http";
import LoadingSpinner from "@/components/include/LoadingSpinner";

const ListingMetaPill = ({ icon, label, value, iconTone = "emerald" }) => {
  const tones = {
    emerald: "bg-emerald-50 text-emerald-600 ring-emerald-100",
    amber: "bg-amber-50 text-amber-500 ring-amber-100",
    sky: "bg-sky-50 text-sky-600 ring-sky-100",
  };

  return (
    <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-3.5 py-3 shadow-sm transition hover:shadow-md">
      <div className={`flex h-9 w-9 items-center justify-center rounded-lg ring-1 ${tones[iconTone] || tones.emerald}`}>
        {icon}
      </div>
      <div>
        <p className="text-[10px] font-semibold uppercase text-slate-500">
          {label}
        </p>
        <p className="text-sm font-semibold text-slate-900">{value}</p>
      </div>
    </div>
  );
};

const ListingDetailsPage = ({ listing: listingProp }) => {
  const { listingId } = useParams();

  const [listing, setListing] = useState(listingProp || null);
  const [loading, setLoading] = useState(!listingProp);
  const [error, setError] = useState("");
  const [reviews, setReviews] = useState([]);
  const [reviewStats, setReviewStats] = useState(null);

  const fetchReviewsAndStats = async (id) => {
    try {
      const [reviewsRes, statsRes] = await Promise.all([
        api.get(`/review/listing-reviews/${id}`),
        api.get(`/review/stats/${id}`),
      ]);

      if (reviewsRes.data?.success && Array.isArray(reviewsRes.data.reviews)) {
        setReviews(reviewsRes.data.reviews);
      } else {
        setReviews([]);
      }

      if (statsRes.data?.success) {
        setReviewStats(statsRes.data.stats);
      }
    } catch (err) {
      console.error("Fetch reviews/stats error:", err);
      setReviews([]);
      setReviewStats(null);
    }
  };

  useEffect(() => {
    if (listingProp) {
      setListing(listingProp);
      setLoading(false);
      setError("");
      fetchReviewsAndStats(listingProp._id);
      return;
    }

    if (!listingId) return;

    const fetchListing = async () => {
      try {
        setLoading(true);
        setError("");

        const res = await api.get(`/listings/${listingId}`);
        const data = res.data?.data || res.data || null;

        setListing(data);

        if (data?._id) {
          fetchReviewsAndStats(data._id);
        }
      } catch (err) {
        console.error("Error loading listing:", err);
        setListing(null);
        setError("Unable to load listing details right now.");
      } finally {
        setLoading(false);
      }
    };

    fetchListing();
  }, [listingId, listingProp]);

  const reviewSummary = useMemo(() => {
    const total = reviews.length;
    const avg =
      reviewStats?.average ||
      (total
        ? (
            reviews.reduce((acc, item) => acc + (Number(item?.ratings) || 0), 0) /
            total
          ).toFixed(1)
        : "0.0");

    return {
      total,
      average: Number(avg).toFixed(1),
    };
  }, [reviews, reviewStats]);

  if (loading) {
    return (
      <LoadingSpinner
        label="Loading listing details"
        detail="Preparing photos, reviews, booking options, and property information."
      />
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="max-w-md rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Something went wrong</h2>
          <p className="mt-2 text-sm text-slate-500">{error}</p>
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="max-w-md rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Listing not found</h2>
          <p className="mt-2 text-sm text-slate-500">
            The property may have been removed or does not exist.
          </p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="ln-page-surface min-h-screen pb-10"
    >
      <div className="mx-auto mt-5 max-w-[1440px] px-4 sm:px-6 lg:px-8">
        <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
          <div className="min-w-0 space-y-6">
            <ListingInfoHeroSection listing={listing} />
            <div className="rounded-lg border border-blue-100 bg-white p-3.5 shadow-sm">
              <div className="grid gap-2.5 md:grid-cols-3">
                <ListingMetaPill
                  icon={<FiStar />}
                  iconTone="amber"
                  label="Average rating"
                  value={
                    reviewSummary.total
                      ? `${reviewSummary.average} / 5`
                      : "No ratings yet"
                  }
                />
                <ListingMetaPill
                  icon={<FiMessageSquare />}
                  iconTone="sky"
                  label="Total reviews"
                  value={`${reviewSummary.total} review${
                    reviewSummary.total !== 1 ? "s" : ""
                  }`}
                />
                <ListingMetaPill
                  icon={<FiMapPin />}
                  iconTone="emerald"
                  label="Availability"
                  value={listing?.status || "Active"}
                />
              </div>
            </div>

            <ListingInfo01 listing={listing} />
            <ListingInfo02
              listing={listing}
              reviews={reviews}
              stats={reviewStats}
              onReviewUpdated={() => fetchReviewsAndStats(listing?._id)}
            />
          </div>

          <aside className="h-fit space-y-5 xl:sticky xl:top-[88px]">
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_2px_12px_rgba(0,0,0,0.03)] transition-all hover:shadow-[0_8px_24px_rgba(0,0,0,0.04)]">
              <div className="border-b border-slate-100 bg-gradient-to-b from-slate-50 to-white px-5 py-4">
                <p className="text-[11px] font-bold uppercase tracking-wider text-sky-600">
                  Quick booking
                </p>

              </div>
              <div className="p-5">
                <BookingPanel listing={listing} />
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)] transition-all hover:shadow-[0_8px_24px_rgba(0,0,0,0.04)]">
              <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-sky-600">
                Quick actions
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Save, review, message, or report this listing.
              </p>

              <div className="mt-4 grid gap-3">
                <RatingDialog
                  listingId={listing?._id}
                  onReviewAdded={() => fetchReviewsAndStats(listing?._id)}
                />
                <StartConversation listing={listing} />
                <AddBookMark listingId={listing?._id} />
                <ReportDialog listingId={listing?._id} />
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)] transition-all hover:shadow-[0_8px_24px_rgba(0,0,0,0.04)]">
              <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-emerald-600">
                Stay safe
              </p>
              <h3 className="text-lg font-bold tracking-tight text-slate-900">
                Safety tips
              </h3>
              <div className="mt-4 space-y-3 text-sm font-medium leading-6 text-slate-700">
                <div className="rounded-xl border border-sky-100 bg-sky-50/50 px-4 py-3">
                  Never pay outside the platform.
                </div>
                <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 px-4 py-3">
                  Visit the property before confirming.
                </div>
                <div className="rounded-xl border border-amber-100 bg-amber-50/50 px-4 py-3">
                  Keep important communication in chat.
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </motion.div>
  );
};

export default ListingDetailsPage;
