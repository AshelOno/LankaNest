import React from "react";
import { IoMdPin } from "react-icons/io";
import { FaBed, FaBath, FaRulerCombined } from "react-icons/fa";
import { FaHeart } from "react-icons/fa6";
import { Link } from "react-router-dom";
import useListingStore from "@/store/listingStore";

const PropertyCard = ({ listing }) => {
  const { trackListingClick } = useListingStore();

  const handleClick = () => {
    trackListingClick(listing._id);
  };

  return (
    <Link to={`/listing/${listing._id}`} onClick={handleClick}>
      <div className="group rounded-2xl overflow-hidden bg-white shadow-sm hover:shadow-lg transition duration-300">

        {/* Image */}
        <div className="relative h-56 w-full overflow-hidden">
          <img
            src={listing.images?.[0]}
            alt={listing.propertyName}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
          />

          {/* Favorite Button */}
          <button className="absolute top-3 right-3 bg-white/80 backdrop-blur-md p-2 rounded-full shadow hover:bg-white">
            <FaHeart className="text-gray-600 hover:text-red-500 transition" />
          </button>

          {/* Price Badge */}
          <div className="absolute bottom-3 left-3 bg-white px-3 py-1 rounded-full text-sm font-semibold shadow">
            LKR {listing.monthlyRent?.toLocaleString()}
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-2">

          {/* Title */}
          <h2 className="text-lg font-semibold text-gray-800 line-clamp-1">
            {listing.propertyName}
          </h2>

          {/* Location */}
          <div className="flex items-center text-gray-500 text-sm">
            <IoMdPin className="mr-1" />
            <span className="truncate">{listing.city || listing.address}</span>
          </div>

          {/* Features */}
          <div className="flex items-center justify-between text-sm text-gray-600 mt-2">
            <span className="flex items-center gap-1">
              <FaBed /> {listing.bedrooms || 0}
            </span>
            <span className="flex items-center gap-1">
              <FaBath /> {listing.bathrooms || 0}
            </span>
            <span className="flex items-center gap-1">
              <FaRulerCombined /> {listing.size || 0} m²
            </span>
          </div>

          {/* Footer */}
          <div className="flex justify-between items-center mt-3">
            <p className="text-primaryBgColor font-bold text-lg">
              LKR {listing.monthlyRent?.toLocaleString()}
              <span className="text-gray-500 text-sm font-normal">
                {" "}
                /month
              </span>
            </p>

            <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">
              {listing.propertyType}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default PropertyCard;