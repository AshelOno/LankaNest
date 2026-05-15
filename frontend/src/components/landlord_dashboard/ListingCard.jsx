import PropTypes from "prop-types";
import { FaBath, FaBed, FaEye, FaMapMarkerAlt, FaRulerCombined } from "react-icons/fa";

const ListingCard = ({ listings }) => {
  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
      {listings.map((listing) => (
        <article
          key={listing.id}
          className="group overflow-hidden rounded-[1.25rem] border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-slate-200/70"
        >
          <div className="relative h-52 overflow-hidden bg-slate-100">
            <img
              src={listing.image}
              alt={listing.title}
              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            />
            <div className="absolute bottom-3 right-3 rounded-full bg-white px-3 py-1.5 text-sm font-bold text-slate-950 shadow-sm">
              {listing.price}
            </div>
          </div>

          <div className="p-5">
            <h3 className="truncate text-lg font-bold text-slate-950 transition group-hover:text-blue-700">
              {listing.title}
            </h3>
            <p className="mt-2 flex items-center gap-2 text-sm text-slate-500">
              <FaMapMarkerAlt className="shrink-0 text-blue-700" />
              <span className="truncate">{listing.location || "Location unavailable"}</span>
            </p>

            <div className="mt-4 grid grid-cols-3 gap-2 border-y border-slate-100 py-3 text-xs text-slate-600">
              <span className="flex items-center gap-1 rounded-xl bg-slate-50 px-2 py-2">
                <FaBed className="text-blue-700" />
                {listing.bedrooms || "2"} beds
              </span>
              <span className="flex items-center gap-1 rounded-xl bg-slate-50 px-2 py-2">
                <FaBath className="text-blue-700" />
                {listing.bathrooms || "1"} bath
              </span>
              <span className="flex items-center gap-1 rounded-xl bg-slate-50 px-2 py-2">
                <FaRulerCombined className="text-blue-700" />
                {listing.size || "800"} sqft
              </span>
            </div>

            <div className="mt-4 flex items-center justify-between gap-3">
              <span className="flex items-center gap-1 text-sm text-slate-500">
                <FaEye className="text-slate-400" />
                {listing.views} views
              </span>
              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                Listed
              </span>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
};

ListingCard.propTypes = {
  listings: PropTypes.arrayOf(
    PropTypes.shape({
      bathrooms: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      bedrooms: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      id: PropTypes.string,
      image: PropTypes.string,
      location: PropTypes.string,
      price: PropTypes.string,
      size: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      title: PropTypes.string,
      views: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    })
  ).isRequired,
};

export default ListingCard;
