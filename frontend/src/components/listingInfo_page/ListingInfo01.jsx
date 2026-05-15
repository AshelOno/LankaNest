import React from "react";
import { Home, MapPin } from "lucide-react";
import { SectionCard, InfoRow, BadgeChip } from "./listing-ui";

const formatValue = (value, fallback = "N/A") => {
  if (value === null || value === undefined || value === "") return fallback;
  return value;
};

const MiniInfo = ({ label, value }) => (
  <div className="rounded-lg border border-slate-200 bg-slate-50/60 px-4 py-3 transition hover:border-blue-200 hover:bg-white hover:shadow-sm">
    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
      {label}
    </p>
    <p className="mt-1 text-sm font-semibold text-slate-900">{value}</p>
  </div>
);

const ListingInfo01 = ({ listing }) => {
  return (
    <div className="w-full space-y-4 pb-6">
      <SectionCard>
        <div className="border-b border-slate-100 bg-white px-5 py-4 sm:px-6">
          <div className="flex items-center justify-between">
            <div>
              <BadgeChip tone="primary">Property details</BadgeChip>
              <h2 className="text-lg font-semibold text-slate-900 mt-2">
                Key specifications
              </h2>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 shadow-sm ring-1 ring-blue-100">
              <Home className="h-5 w-5 text-blue-700" />
            </div>
          </div>
        </div>

        {/* Compact Key Specs Grid */}
        <div className="p-5 sm:p-6">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <MiniInfo label="Type" value={formatValue(listing?.propertyType)} />
            <MiniInfo label="Built" value={formatValue(listing?.builtYear)} />
            <MiniInfo label="Size" value={listing?.size ? `${listing.size} sq m` : "N/A"} />
            <MiniInfo label="Status" value={formatValue(listing?.status, "Available")} />
          </div>
        </div>
      </SectionCard>

      <SectionCard>
        <div className="border-b border-slate-100 bg-white px-5 py-4 sm:px-6">
          <div className="flex items-center justify-between">
            <div>
              <BadgeChip tone="soft">Living spaces</BadgeChip>
              <h3 className="text-lg font-semibold text-slate-900 mt-2">
                Room configuration
              </h3>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-100">
              <Home className="h-5 w-5 text-blue-700" />
            </div>
          </div>
        </div>

        <div className="p-5 sm:p-6">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <MiniInfo label="Bedrooms" value={formatValue(listing?.bedrooms)} />
            <MiniInfo label="Bathrooms" value={formatValue(listing?.bathrooms)} />
            <MiniInfo label="Garage" value={formatValue(listing?.garage)} />
            <MiniInfo label="Parking" value={formatValue(listing?.parking, "N/A")} />
          </div>
        </div>
      </SectionCard>

      <SectionCard>
        <div className="border-b border-slate-100 bg-white px-5 py-4 sm:px-6">
          <div className="flex items-center justify-between">
            <div>
              <BadgeChip tone="success">Location</BadgeChip>
              <h3 className="text-lg font-semibold text-slate-900 mt-2">
                Address & proximity
              </h3>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 shadow-sm ring-1 ring-emerald-100">
              <MapPin className="h-5 w-5 text-emerald-700" />
            </div>
          </div>
        </div>

        <div className="p-5 sm:p-6">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <InfoRow label="Address" value={listing?.address} />
            <InfoRow label="City" value={listing?.city} />
            <InfoRow label="Province" value={listing?.province} />
            <InfoRow label="Postal Code" value={listing?.postalCode} />
            <InfoRow label="Nearest University" value={listing?.nearestUniversity?.name} />
            <InfoRow
              label="Distance to Campus"
              value={listing?.universityDistance ? `${listing.universityDistance} km` : "N/A"}
            />
          </div>
        </div>
      </SectionCard>
    </div>
  );
};

export default ListingInfo01;
