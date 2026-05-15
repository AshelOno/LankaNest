import React, { useEffect, useMemo, useState } from "react";
import { api } from "@/services/http";
import { motion } from "framer-motion";
import { Input, Button } from "antd";
import { FilterOutlined } from "@ant-design/icons";
import { ArrowUpDown, BadgeCheck, Building2, SearchX, SlidersHorizontal } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import ToggleSwitch from "./ToggleSwitch";
import PropertyCard from "./PropertyCard";
import ListingMap from "./ListingMap";
import FilterDrawer from "./FilterDrawer";
import { EmptyState, LoadingState, PageShell } from "@/components/ui/page-shell";

const universities = [
  "University of Colombo",
  "University of Peradeniya",
  "University of Moratuwa",
  "University of Sri Jayewardenepura",
  "University of Kelaniya",
  "Rajarata University",
  "Sabaragamuwa University",
  "Wayamba University",
  "Uva Wellassa University",
  "South Eastern University",
  "University of Jaffna",
  "University of Ruhuna",
  "Open University of Sri Lanka",
  "SLIIT",
  "NSBM Green University",
  "CINEC Campus",
  "APIIT Sri Lanka",
  "SAITM",
];

const getPriceRangeFromParams = (searchParams) => {
  const minPrice = Number(searchParams.get("minPrice") || 0);
  const maxPrice = Number(searchParams.get("maxPrice") || 260000);

  return [
    Number.isFinite(minPrice) ? minPrice : 0,
    Number.isFinite(maxPrice) ? maxPrice : 260000,
  ];
};

const getQueryFromParams = (searchParams) =>
  searchParams.get("q") ||
  searchParams.get("city") ||
  searchParams.get("university") ||
  "";

const genderLabels = {
  boys: "Boys only",
  girls: "Girls only",
  mixed: "Mixed",
};

const ListingPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState(() => getQueryFromParams(searchParams));
  const [mapView, setMapView] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);

  const [selectedUniversity, setSelectedUniversity] = useState(null);
  const [priceRange, setPriceRange] = useState(() => getPriceRangeFromParams(searchParams));
  const [selectedDistance, setSelectedDistance] = useState(null);
  const [selectedBeds, setSelectedBeds] = useState(null);
  const [selectedGenderPreference, setSelectedGenderPreference] = useState(
    () => searchParams.get("genderPreference") || null
  );
  const [selectedPropertyType, setSelectedPropertyType] = useState(
    () => searchParams.get("propertyType") || null
  );
  const [selectedListing, setSelectedListing] = useState(null);
  const [sortBy, setSortBy] = useState("recommended");

  useEffect(() => {
    setSearchQuery(getQueryFromParams(searchParams));
    setPriceRange(getPriceRangeFromParams(searchParams));
    setSelectedGenderPreference(searchParams.get("genderPreference") || null);
    setSelectedPropertyType(searchParams.get("propertyType") || null);
    setSelectedBeds(searchParams.get("beds") || null);
  }, [searchParams]);

  useEffect(() => {
    const fetchListings = async () => {
      try {
        setLoading(true);
        const res = await api.get("/listings");
        const data = Array.isArray(res.data) ? res.data : res.data?.data || [];
        setListings(data);
        setSelectedListing(data[0] || null);
      } catch (error) {
        console.error("Error fetching listings:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchListings();
  }, []);

  const filteredListings = useMemo(() => {
    return listings.filter((listing) => {
      const q = searchQuery.trim().toLowerCase();

      const matchesSearch =
        !q ||
        [listing.propertyName, listing.address, listing.city, listing.province]
          .filter(Boolean)
          .some((field) => String(field).toLowerCase().includes(q)) ||
        String(listing.nearestUniversity?.name || "")
          .toLowerCase()
          .includes(q) ||
        [listing.propertyType, listing.genderPreference, listing.description]
          .filter(Boolean)
          .some((field) => String(field).toLowerCase().includes(q));

      const matchesUniversity =
        !selectedUniversity ||
        listing.nearestUniversity?.name === selectedUniversity;

      const rent = Number(listing.monthlyRent || 0);
      const matchesPrice = rent >= priceRange[0] && rent <= priceRange[1];

      const distanceKm = Number(listing.universityDistance || 0);
      const matchesDistance = (() => {
        if (!selectedDistance) return true;
        if (selectedDistance === "<300m") return distanceKm < 0.3;
        if (selectedDistance === "300-500m")
          return distanceKm >= 0.3 && distanceKm <= 0.5;
        if (selectedDistance === "500m-1km")
          return distanceKm > 0.5 && distanceKm <= 1;
        if (selectedDistance === "1-2km")
          return distanceKm > 1 && distanceKm <= 2;
        if (selectedDistance === "2-5km")
          return distanceKm > 2 && distanceKm <= 5;
        if (selectedDistance === "5-10km")
          return distanceKm > 5 && distanceKm <= 10;
        if (selectedDistance === ">10km") return distanceKm > 10;
        return true;
      })();

      const beds = Number(listing.bedrooms || 0);
      const matchesBeds =
        !selectedBeds ||
        (selectedBeds === "4+" ? beds >= 4 : beds === Number(selectedBeds));

      const matchesGender =
        !selectedGenderPreference ||
        listing.genderPreference === selectedGenderPreference ||
        listing.genderPreference === "mixed";

      const matchesPropertyType =
        !selectedPropertyType ||
        String(listing.propertyType || "").toLowerCase() ===
          selectedPropertyType.toLowerCase();

      return (
        matchesSearch &&
        matchesUniversity &&
        matchesPrice &&
        matchesDistance &&
        matchesBeds &&
        matchesGender &&
        matchesPropertyType
      );
    });
  }, [
    listings,
    searchQuery,
    selectedUniversity,
    priceRange,
    selectedDistance,
    selectedBeds,
    selectedGenderPreference,
    selectedPropertyType,
  ]);

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedUniversity(null);
    setPriceRange([0, 260000]);
    setSelectedDistance(null);
    setSelectedBeds(null);
    setSelectedGenderPreference(null);
    setSelectedPropertyType(null);
    setSearchParams({});
  };

  const hasActiveFilters =
    !!searchQuery ||
    !!selectedUniversity ||
    !!selectedDistance ||
    !!selectedBeds ||
    !!selectedGenderPreference ||
    !!selectedPropertyType ||
    priceRange[0] !== 0 ||
    priceRange[1] !== 260000;

  const displayedListings = useMemo(() => {
    const sorted = [...filteredListings];

    if (sortBy === "rent-low") {
      sorted.sort((a, b) => Number(a.monthlyRent || 0) - Number(b.monthlyRent || 0));
    } else if (sortBy === "rent-high") {
      sorted.sort((a, b) => Number(b.monthlyRent || 0) - Number(a.monthlyRent || 0));
    } else if (sortBy === "distance") {
      sorted.sort(
        (a, b) => Number(a.universityDistance || Infinity) - Number(b.universityDistance || Infinity)
      );
    } else if (sortBy === "newest") {
      sorted.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    } else {
      sorted.sort((a, b) => Number(b.eloRating || 0) - Number(a.eloRating || 0));
    }

    return sorted;
  }, [filteredListings, sortBy]);

  const averageRent = useMemo(() => {
    if (!displayedListings.length) return 0;
    const total = displayedListings.reduce((sum, listing) => sum + Number(listing.monthlyRent || 0), 0);
    return Math.round(total / displayedListings.length);
  }, [displayedListings]);

  const activeFilterLabels = useMemo(
    () =>
      [
        searchQuery && `Search: ${searchQuery}`,
        selectedUniversity && `University: ${selectedUniversity}`,
        selectedDistance && `Distance: ${selectedDistance}`,
        selectedBeds && `${selectedBeds} beds`,
        selectedGenderPreference && `Preference: ${genderLabels[selectedGenderPreference] || selectedGenderPreference}`,
        selectedPropertyType && `Type: ${selectedPropertyType}`,
        (priceRange[0] !== 0 || priceRange[1] !== 260000) &&
          `LKR ${priceRange[0].toLocaleString()}-${priceRange[1].toLocaleString()}`,
      ].filter(Boolean),
    [
      priceRange,
      searchQuery,
      selectedBeds,
      selectedDistance,
      selectedGenderPreference,
      selectedPropertyType,
      selectedUniversity,
    ]
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <PageShell
        contentClassName="max-w-[1440px] mx-auto px-4 py-6 sm:px-6 lg:px-8"
      >
        <header className="ln-premium-surface sticky top-20 z-30 mb-5 shadow-lux-glow rounded-xl">
          <div className="px-3 py-3 sm:px-4">
          <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-1 flex-wrap items-center gap-2.5">
              <Input
                size="large"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search property, city, address, university..."
                className="min-w-[260px] flex-1 rounded-xl shadow-sm hover:border-emerald-300 focus:border-emerald-400"
                style={{ padding: '8px 16px' }}
              />

              <Button
                icon={<FilterOutlined />}
                onClick={() => setFilterOpen(true)}
                className={`rounded-xl px-5 font-semibold transition-all duration-300 h-[44px] ${
                  hasActiveFilters
                    ? "bg-[linear-gradient(135deg,#047857,#0F8B6F)] border-transparent text-white shadow-[0_8px_16px_rgba(4,120,87,0.2)]"
                    : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:shadow-sm"
                }`}
              >
                {activeFilterLabels.length ? `Filters (${activeFilterLabels.length})` : "Filters"}
              </Button>

              <label className="flex min-h-9 items-center gap-2 rounded-lg border border-blue-100 bg-white px-3 text-sm font-semibold text-slate-600 shadow-sm">
                <ArrowUpDown className="h-4 w-4 text-blue-700" />
                <select
                  value={sortBy}
                  onChange={(event) => setSortBy(event.target.value)}
                  className="bg-transparent text-sm font-semibold text-slate-700 outline-none"
                  aria-label="Sort listings"
                >
                  <option value="recommended">Recommended</option>
                  <option value="newest">Newest</option>
                  <option value="rent-low">Lowest rent</option>
                  <option value="rent-high">Highest rent</option>
                  <option value="distance">Nearest campus</option>
                </select>
              </label>

              <div className="ml-auto flex items-center gap-2 rounded-lg border border-blue-100 bg-white px-3 py-1.5 shadow-sm">
                <span className="text-sm font-semibold text-slate-600">Map view</span>
                <ToggleSwitch checked={mapView} onChange={setMapView} />
              </div>
            </div>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-[0_2px_12px_rgba(0,0,0,0.03)] transition-all duration-300 hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 ring-1 ring-blue-100/50">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Matches</p>
                <p className="text-[15px] font-bold text-slate-900">{displayedListings.length} stays</p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-[0_2px_12px_rgba(0,0,0,0.03)] transition-all duration-300 hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100/50">
                <BadgeCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Average rent</p>
                <p className="text-[15px] font-bold text-slate-900">
                  {averageRent ? `LKR ${averageRent.toLocaleString()}` : "No data"}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-[0_2px_12px_rgba(0,0,0,0.03)] transition-all duration-300 hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-500 ring-1 ring-amber-100/50">
                  <SlidersHorizontal className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Filters</p>
                  <p className="text-[15px] font-bold text-slate-900">
                    {activeFilterLabels.length ? `${activeFilterLabels.length} active` : "None active"}
                  </p>
                </div>
              </div>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="rounded-md bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                >
                  Clear all
                </button>
              )}
            </div>
          </div>

          {activeFilterLabels.length > 0 && (
            <div className="mt-2.5 flex flex-wrap gap-2">
              {activeFilterLabels.map((label) => (
                <span
                  key={label}
                  title={label}
                  className="ln-chip max-w-full truncate border-emerald-200 bg-emerald-50 text-emerald-700"
                >
                  {label}
                </span>
              ))}
            </div>
          )}
          </div>
      </header>

      <FilterDrawer
        isOpen={filterOpen}
        onClose={() => setFilterOpen(false)}
        universities={universities}
        selectedUniversity={selectedUniversity}
        setSelectedUniversity={setSelectedUniversity}
        priceRange={priceRange}
        setPriceRange={setPriceRange}
        selectedDistance={selectedDistance}
        setSelectedDistance={setSelectedDistance}
        selectedBeds={selectedBeds}
        setSelectedBeds={setSelectedBeds}
        selectedGenderPreference={selectedGenderPreference}
        setSelectedGenderPreference={setSelectedGenderPreference}
        selectedPropertyType={selectedPropertyType}
        setSelectedPropertyType={setSelectedPropertyType}
        onClear={clearFilters}
      />

      <main>
        {loading ? (
          <LoadingState label="Loading listings..." />
        ) : (
          <div
            className={`grid gap-6 ${
              mapView ? "xl:grid-cols-[minmax(0,1fr)_460px]" : "grid-cols-1"
            }`}
          >
            <section>
              <motion.div
                layout
                className={`grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 ${
                  mapView ? "xl:grid-cols-2 2xl:grid-cols-3" : ""
                }`}
              >
                {displayedListings.length > 0 ? (
                  displayedListings.map((listing) => (
                    <motion.div
                      key={listing._id}
                      layout
                      whileHover={{ y: -6 }}
                      transition={{ type: "spring", stiffness: 220, damping: 18 }}
                    >
                      <PropertyCard
                        listing={listing}
                        active={selectedListing?._id === listing._id}
                        onHover={setSelectedListing}
                      />
                    </motion.div>
                  ))
                ) : (
                  <EmptyState
                    icon={SearchX}
                    title="No listings match your filters"
                    description="Try widening your price range, removing a filter, or searching a nearby university."
                    className="col-span-full"
                    action={<button onClick={clearFilters} className="ln-secondary-btn">Clear filters</button>}
                  />
                )}
              </motion.div>
            </section>

            {mapView && (
              <ListingMap
                listings={displayedListings}
                selectedListing={selectedListing}
                onSelect={setSelectedListing}
              />
            )}
          </div>
        )}
      </main>
      </PageShell>
    </motion.div>
  );
};

export default ListingPage;
