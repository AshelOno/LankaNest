import React, { useEffect } from "react";
import { Card, Tooltip } from "antd";
import { FaBed, FaCalendarAlt, FaRulerCombined, FaEye, FaBath } from "react-icons/fa";
import { FaHouseChimney } from "react-icons/fa6";
import { IoMdPin } from "react-icons/io";
import { PiGarageFill } from "react-icons/pi";
import { MdArrowOutward } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import useListingStore from "@/store/listingStore";
import { InlineLoader } from "../include/LoadingSpinner";

const StatChip = ({ icon, label, value }) => (
  <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-2">
    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
      {icon}
    </span>
    <div className="min-w-0">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
        {label}
      </p>
      <p className="truncate text-sm font-semibold text-slate-900">{value}</p>
    </div>
  </div>
);

const PopularCard = ({ limit = 1 }) => {
  const { popularListings, loading, fetchPopularListings, trackListingClick } =
    useListingStore();
  const navigate = useNavigate();

  useEffect(() => {
    fetchPopularListings(limit);
  }, [fetchPopularListings, limit]);

  // Optimistically update the local view count so the badge reflects the
  // click immediately, then fire the real API call in the background.
  const handleViewListing = (listingId) => {
    useListingStore.setState((state) => ({
      popularListings: state.popularListings.map((l) =>
        l._id === listingId ? { ...l, views: (l.views || 0) + 1 } : l
      ),
    }));
    trackListingClick(listingId).catch(() => {});
    navigate(`/listing/${listingId}`);
  };

  if (loading && popularListings.length === 0) {
    return (
      <InlineLoader
        label="Loading popular listings"
        detail="Finding homes students are viewing most."
      />
    );
  }

  if (popularListings.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 py-10 text-center">
        <p className="text-sm font-medium text-slate-500">No popular listings found</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {popularListings.map((listing) => (
        <Card
          key={listing._id}
          className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
          styles={{ body: { padding: 0 } }}
        >
          <div className="grid gap-0 lg:grid-cols-[1.05fr_1fr]">
            <div className="relative">
              <img
                src={listing.images?.[0] || "https://via.placeholder.com/150"}
                alt={listing.propertyName}
                className="h-56 w-full object-cover lg:h-full"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "https://via.placeholder.com/150";
                }}
              />
              <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full bg-black/55 px-3 py-1 text-xs font-medium text-white backdrop-blur">
                <FaEye />
                {listing.views || 0} views
              </div>
            </div>

            <div className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="truncate text-lg font-semibold text-slate-900">
                    {listing.propertyName}
                  </h3>
                  <p className="mt-1 text-xl font-bold tracking-tight text-blue-700">
                    LKR {listing.monthlyRent?.toLocaleString()}/month
                  </p>
                </div>

                <Tooltip title="View listing">
                  <button
                    onClick={() => handleViewListing(listing._id)}
                    className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm transition hover:bg-blue-700"
                    aria-label="View Listing"
                  >
                    <MdArrowOutward className="text-lg" />
                  </button>
                </Tooltip>
              </div>

              <div className="mt-3 flex items-start gap-2 text-slate-500">
                <IoMdPin className="mt-0.5 text-lg text-blue-600" />
                <p className="line-clamp-2 text-sm leading-6">
                  {listing.address}
                </p>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2.5">
                <StatChip
                  icon={<FaHouseChimney className="text-sm" />}
                  label="Type"
                  value={listing.propertyType || "N/A"}
                />
                <StatChip
                  icon={<FaBed className="text-sm" />}
                  label="Beds"
                  value={listing.bedrooms || "N/A"}
                />
                <StatChip
                  icon={<FaCalendarAlt className="text-sm" />}
                  label="Built"
                  value={listing.builtYear || "N/A"}
                />
                <StatChip
                  icon={<FaBath className="text-sm" />}
                  label="Baths"
                  value={listing.bathrooms || "N/A"}
                />
                <StatChip
                  icon={<FaRulerCombined className="text-sm" />}
                  label="Size"
                  value={listing.size ? `${listing.size} m²` : "N/A"}
                />
                <StatChip
                  icon={<PiGarageFill className="text-sm" />}
                  label="Garage"
                  value={listing.garage || "N/A"}
                />
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default PopularCard;
