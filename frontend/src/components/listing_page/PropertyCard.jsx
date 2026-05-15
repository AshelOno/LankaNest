import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import { BadgeCheck, Bath, BedDouble, MapPin, Maximize2, Star, Users } from "lucide-react";

const genderLabels = {
  boys: "Boys only",
  girls: "Girls only",
  mixed: "Mixed",
};

const PropertyCard = ({ listing, active = false, onHover }) => {
  const rentValue = Number(listing.monthlyRent || 0);
  const rent = rentValue ? rentValue.toLocaleString() : null;
  const distance = Number(listing.universityDistance || 0);
  const distanceLabel = distance ? `${distance.toFixed(distance < 1 ? 1 : 0)} km` : "Campus nearby";
  const genderLabel = genderLabels[listing.genderPreference] || listing.genderPreference || "Mixed";
  const sizeLabel = listing.size ? `${listing.size} sq m` : "N/A";

  return (
    <Link
      to={`/listing/${listing._id}`}
      onMouseEnter={() => onHover?.(listing)}
      onMouseLeave={() => onHover?.(null)}
      className="block h-full"
    >
      <article
        className={`group flex h-full flex-col overflow-hidden rounded-xl border bg-white/96 shadow-sm transition-all duration-300 ${
          active
            ? "border-emerald-400 ring-2 ring-emerald-200/70 shadow-md"
            : "border-blue-100 hover:border-emerald-200 hover:shadow-lux"
        }`}
      >
        <div className="relative aspect-[16/11] w-full overflow-hidden bg-slate-100">
          <img
            src={listing.images?.[0] || "/landingImg2.jpg"}
            alt={listing.propertyName || "Property"}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
            onError={(event) => {
              event.currentTarget.src = "/landingImg2.jpg";
            }}
          />

          <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-slate-950/30 to-transparent opacity-0 transition group-hover:opacity-100" />

          <div className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-md bg-white/95 px-2.5 py-1 text-xs font-bold text-emerald-700 shadow-sm backdrop-blur">
            <BadgeCheck className="h-3.5 w-3.5 text-emerald-600" />
            {listing.status || "Available"}
          </div>

          <div className="absolute bottom-3 right-3 rounded-md bg-blue-50/95 px-2.5 py-1 text-xs font-bold text-blue-700 shadow-sm backdrop-blur">
            {listing.propertyType || "Property"}
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-3 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="truncate text-base font-semibold text-slate-950">
                {listing.propertyName || "Untitled property"}
              </h2>
              <div className="mt-1 flex items-center gap-1 text-sm text-slate-500">
                <MapPin className="h-3.5 w-3.5 shrink-0 text-emerald-700" />
                <span className="truncate">{listing.city || listing.address || "Location unavailable"}</span>
              </div>
            </div>

            <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              {listing.eloRating ? Math.round(Number(listing.eloRating)) : "New"}
            </span>
          </div>

          <div className="text-lg font-bold text-slate-950">
            {rent ? `LKR ${rent}` : "Price on request"}
            {rent && <span className="text-xs font-medium text-slate-500"> / month</span>}
          </div>

          <div className="grid grid-cols-3 gap-1.5 text-xs font-semibold text-slate-600">
            <div className="flex min-h-9 items-center gap-1 rounded-md border border-blue-100 bg-blue-50/70 px-2 py-1.5">
              <BedDouble className="h-3.5 w-3.5 text-blue-700" />
              <span>{listing.bedrooms ?? "N/A"}</span>
            </div>
            <div className="flex min-h-9 items-center gap-1 rounded-md border border-blue-100 bg-blue-50/70 px-2 py-1.5">
              <Bath className="h-3.5 w-3.5 text-blue-700" />
              <span>{listing.bathrooms ?? "N/A"}</span>
            </div>
            <div className="flex min-h-9 items-center gap-1 rounded-md border border-blue-100 bg-blue-50/70 px-2 py-1.5">
              <Maximize2 className="h-3.5 w-3.5 text-blue-700" />
              <span>{sizeLabel}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-1.5 text-xs font-semibold">
            <div className="flex min-h-9 items-center gap-1 rounded-md border border-blue-100 bg-blue-50 px-2 py-1.5 text-blue-700">
              <MapPin className="h-3.5 w-3.5" />
              <span>{distanceLabel}</span>
            </div>
            <div className="flex min-h-9 items-center gap-1 rounded-md border border-emerald-100 bg-emerald-50 px-2 py-1.5 text-emerald-700">
              <Users className="h-3.5 w-3.5" />
              <span>{genderLabel}</span>
            </div>
          </div>

          <div className="mt-auto flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
            <span className="truncate text-sm text-slate-500">
              {listing.nearestUniversity?.name || "Near university"}
            </span>
            <span className="shrink-0 rounded-md bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">
              View
            </span>
          </div>
          <span className="inline-flex min-h-10 items-center justify-center rounded-lg border border-blue-100 bg-white px-3 py-2 text-sm font-bold text-slate-700 transition-all duration-300 group-hover:bg-[linear-gradient(135deg,#047857,#0F8B6F)] group-hover:border-transparent group-hover:text-white group-hover:shadow-[0_8px_16px_rgba(4,120,87,0.2)]">
            View details
          </span>
        </div>
      </article>
    </Link>
  );
};

PropertyCard.propTypes = {
  listing: PropTypes.shape({
    _id: PropTypes.string,
    address: PropTypes.string,
    bathrooms: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    bedrooms: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    city: PropTypes.string,
    images: PropTypes.arrayOf(PropTypes.string),
    monthlyRent: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    nearestUniversity: PropTypes.shape({ name: PropTypes.string }),
    propertyName: PropTypes.string,
    propertyType: PropTypes.string,
    genderPreference: PropTypes.string,
    universityDistance: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    eloRating: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    size: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    status: PropTypes.string,
  }).isRequired,
  active: PropTypes.bool,
  onHover: PropTypes.func,
};

export default PropertyCard;
