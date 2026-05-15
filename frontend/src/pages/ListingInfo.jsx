import ListingInfoHeroSection from "@/components/listingInfo_page/ListingInfoHeroSection";
import ListingInfo01 from "@/components/listingInfo_page/ListingInfo01";
import ListingInfo02 from "@/components/listingInfo_page/ListingInfo02";
import LoadingSpinner from "@/components/include/LoadingSpinner";
import { useAuthStore } from "@/store/authStore";
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import useListingStore from "@/store/listingStore";
import {
  AddBookMark,
  ReportDialog,
  StartConversation,
  RatingDialog,
  ScheduleVisit,
} from "@/components/listingInfo_page/ListingActions";
import { SectionCard } from "@/components/listingInfo_page/listing-ui";
import { FiShield, FiCheckCircle, FiStar } from "react-icons/fi";
import { api } from "@/services/http";
import { connectChatSocket } from "@/services/chat";

const ListingInfo = () => {
  const { getListingById } = useListingStore();
  const { isAuthenticated, user } = useAuthStore();
  const { listingId } = useParams();
  const [listing, setListing] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [reviewStats, setReviewStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [socket, setSocket] = useState(null);

  // Initialize socket connection
  useEffect(() => {
    if (isAuthenticated && user) {
      const newSocket = connectChatSocket(user.role === "landlord" ? "landlord" : "student");

      setSocket(newSocket);

      return () => {
        newSocket.disconnect();
      };
    }
  }, [isAuthenticated, user]);

  // Listen for socket events
  useEffect(() => {
    if (!socket) return;

    socket.on("connect", () => {
      console.log("Socket connected");
    });

    socket.on("new_message", (data) => {
      // Notification can be handled here if needed
      console.log("New message received:", data);
    });

    socket.on("connect_error", (err) => {
      console.error("Socket connection error:", err);
    });

    return () => {
      socket.off("connect");
      socket.off("new_message");
      socket.off("connect_error");
    };
  }, [socket]);

  useEffect(() => {
    const fetchListingData = async () => {
      try {
        const [listingData, reviewsRes, statsRes] = await Promise.all([
          getListingById(listingId),
          api.get(`/review/listing-reviews/${listingId}`),
          api.get(`/review/stats/${listingId}`)
        ]);

        setListing(listingData);
        setReviews(reviewsRes.data.reviews || []);
        setReviewStats(statsRes.data.stats || null);
        document.title = `${listingData.propertyName}`;
      } catch (err) {
        setError("Failed to load listing details");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchListingData();
    window.scrollTo(0, 0);
  }, [listingId, getListingById]);

  const refreshReviews = async () => {
    try {
      const [reviewsRes, statsRes] = await Promise.all([
        api.get(`/review/listing-reviews/${listingId}`),
        api.get(`/review/stats/${listingId}`)
      ]);
      setReviews(reviewsRes.data.reviews || []);
      setReviewStats(statsRes.data.stats || null);
    } catch (err) {
      console.error("Error refreshing reviews:", err);
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <div className="text-center text-red-500 p-4">{error}</div>;
  }

  if (!listing) {
    return <div className="text-center p-4">Listing not found</div>;
  }

  return (
    <div className="">
      <ListingInfoHeroSection listing={listing} />

      {/* Trust & Conversion Section - Compact and Prominent */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Action Buttons - Primary Conversion Focus */}
          <div className="lg:col-span-2 space-y-3">
            <SectionCard className="p-5">
              <div className="mb-4 flex items-center gap-2">
                <FiCheckCircle className="text-emerald-600" />
                <span className="text-sm font-semibold text-slate-900">
                  Ready to take action?
                </span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <ScheduleVisit listing={listing} />
                <StartConversation listing={listing} />
                <AddBookMark listingId={listing._id} />
                <RatingDialog listingId={listing._id} onReviewAdded={refreshReviews} />
              </div>
              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                <ReportDialog listingId={listing._id} />
                <span className="text-[10px] text-slate-400 max-w-[150px] text-right">
                  Help us keep LankaNest safe. 
                  <span className="text-blue-500 cursor-help ml-1">How reporting works?</span>
                </span>
              </div>
            </SectionCard>
          </div>

          {/* Trust Indicators - Build Confidence */}
          <div className="space-y-4">
            <SectionCard className="p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50">
                  <FiShield className="text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">Verified Listing</p>
                  <p className="text-xs text-slate-500">Inspected & approved</p>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <FiCheckCircle className="text-emerald-600 text-sm" />
                  <span>Property verified</span>
                </div>
                <div className="flex items-center gap-2">
                  <FiCheckCircle className="text-emerald-600 text-sm" />
                  <span>Landlord verified</span>
                </div>
                <div className="flex items-center gap-2">
                  <FiCheckCircle className="text-emerald-600 text-sm" />
                  <span>Photos authentic</span>
                </div>
              </div>
            </SectionCard>

            <SectionCard className="p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50">
                  <FiStar className="text-amber-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">Student Reviews</p>
                  <p className="text-xs text-slate-500">{reviews.length} total reviews</p>
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-slate-900">
                  {reviewStats?.average ? Number(reviewStats.average).toFixed(1) : "0.0"}
                </div>
                <div className="flex items-center justify-center gap-1 mt-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <FiStar
                      key={star}
                      className={`text-sm ${
                        star <= Math.round(reviewStats?.average || 0)
                          ? "fill-amber-400 text-amber-400"
                          : "text-slate-300"
                      }`}
                    />
                  ))}
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Based on {reviews.length} student reviews
                </p>
              </div>
            </SectionCard>
          </div>
        </div>
      </div>

      <ListingInfo01 listing={listing} />
      <ListingInfo02
        listing={listing}
        reviews={reviews}
        stats={reviewStats}
        onReviewUpdated={refreshReviews}
      />
    </div>
  );
};

export default ListingInfo;
