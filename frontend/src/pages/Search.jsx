import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { notification } from "antd";
import {
  ArrowRight,
  ArrowUpDown,
  Banknote,
  BadgeCheck,
  BedDouble,
  Building2,
  Home,
  Layers,
  LocateFixed,
  Loader2,
  Map as MapIcon,
  MapPin,
  MapPinned,
  Route,
  Satellite,
  Search as SearchIcon,
  ShieldCheck,
  Star,
} from "lucide-react";
import SearchMapboxMap from "../components/include/SearchMapboxMap";
import { API_BASE_URL } from "@/services/http";

const quickSearches = ["University of Colombo", "SLIIT", "NSBM Green University"];

const sortOptions = [
  { value: "nearest", label: "Nearest campus" },
  { value: "rent-low", label: "Lowest rent" },
  { value: "rent-high", label: "Highest rent" },
  { value: "rating", label: "Top rated" },
  { value: "newest", label: "Newest" },
];

const formatCurrency = (value, fallback = "No data") => {
  const amount = Number(value || 0);
  if (!amount) return fallback;
  return `LKR ${amount.toLocaleString("en-LK")}`;
};

const getDistanceValue = (listing, centerLocation) => {
  const directDistance = Number(listing?.universityDistance);
  if (Number.isFinite(directDistance) && directDistance > 0) {
    return directDistance;
  }

  if (!centerLocation || !listing?.coordinates) return Infinity;

  return getCoordinateDistanceKm(centerLocation, listing.coordinates);
};

const getListingDistance = (listing, centerLocation) => {
  const distance = getDistanceValue(listing, centerLocation);
  if (distance === Infinity) return "Distance not set";
  const label = centerLocation?.name ? `from ${centerLocation.name}` : "from selected location";
  return `${distance.toFixed(distance < 1 ? 1 : 0)} km ${label}`;
};

const getCoordinateDistanceKm = (origin, destination) => {
  if (!origin || !destination) return Infinity;

  const originLat = Number(origin.latitude);
  const originLng = Number(origin.longitude);
  const destinationLat = Number(destination.latitude);
  const destinationLng = Number(destination.longitude);

  if (
    !Number.isFinite(originLat) ||
    !Number.isFinite(originLng) ||
    !Number.isFinite(destinationLat) ||
    !Number.isFinite(destinationLng)
  ) {
    return Infinity;
  }

  const toRadians = (value) => (value * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const latDistance = toRadians(destinationLat - originLat);
  const lngDistance = toRadians(destinationLng - originLng);
  const a =
    Math.sin(latDistance / 2) * Math.sin(latDistance / 2) +
    Math.cos(toRadians(originLat)) *
      Math.cos(toRadians(destinationLat)) *
      Math.sin(lngDistance / 2) *
      Math.sin(lngDistance / 2);

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const Search = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const query = searchParams.get("q") || "";

  const [loading, setLoading] = useState(true);
  const [searchLocation, setSearchLocation] = useState(null);
  const [listings, setListings] = useState([]);
  const [searchInput, setSearchInput] = useState(query);
  const [sortBy, setSortBy] = useState("nearest");
  const [radiusKm] = useState(5);
  const [mapStyle, setMapStyle] = useState("streets");
  const [showRadius, setShowRadius] = useState(true);
  const [activeListingId, setActiveListingId] = useState(null);
  const mapRef = useRef(null);

  useEffect(() => {
    document.title = query ? `Search results for ${query}` : "LankaNest | Search";
  }, [query]);

  useEffect(() => {
    setSearchInput(query);
  }, [query]);

  useEffect(() => {
    const fetchSearchResults = async () => {
      if (!query.trim()) {
        setSearchLocation(null);
        setListings([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      let location = null;
      let newListings = [];

      try {
        const universityResponse = await fetch(
          `${API_BASE_URL}/api/search/university?query=${encodeURIComponent(query)}`
        );
        const universityData = await universityResponse.json();

        if (universityResponse.ok && universityData?.success && universityData?.data?.university) {
          location = universityData.data.university;
          newListings = Array.isArray(universityData.data.listings)
            ? universityData.data.listings
            : [];
        } else {
          const geocodeResponse = await fetch(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${import.meta.env.VITE_MAPBOX_ACCESS_TOKEN}&limit=1&country=LK`
          );
          const geocodeData = await geocodeResponse.json();
          const place = geocodeData?.features?.[0];

          if (place && Array.isArray(place.center) && place.center.length >= 2) {
            location = {
              latitude: Number(place.center[1]),
              longitude: Number(place.center[0]),
              displayName: place.place_name,
              name: place.text,
            };

            const locationResponse = await fetch(
              `${API_BASE_URL}/api/search/location?lat=${location.latitude}&lng=${location.longitude}&radius=${radiusKm}`
            );
            const locationData = await locationResponse.json();

            if (locationResponse.ok && locationData?.success) {
              newListings = Array.isArray(locationData.data) ? locationData.data : [];
            } else {
              newListings = [];
            }
          } else {
            notification.error({
              message: "Location not found",
              description: `Could not find results for "${query}". Try a different university or area.`,
              placement: "bottomRight",
            });
          }
        }
      } catch (error) {
        console.error("Error fetching search results:", error);
        notification.error({
          message: "Connection error",
          description: "Failed to load search results. Please check your network.",
        });
      } finally {
        setSearchLocation(location);
        setListings(newListings);
        setLoading(false);
      }
    };

    fetchSearchResults();
  }, [query, radiusKm]);

  useEffect(() => {
    if (mapRef.current && searchLocation) {
      const resizeTimer = setTimeout(() => {
        mapRef.current?.resize?.();
        mapRef.current?.invalidateSize?.();
      }, 260);

      return () => clearTimeout(resizeTimer);
    }

    return undefined;
  }, [searchLocation, listings.length]);

  const centerLocation = useMemo(() => {
    const lat = Number(searchLocation?.latitude);
    const lng = Number(searchLocation?.longitude);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

    return {
      latitude: lat,
      longitude: lng,
      name: searchLocation?.displayName || searchLocation?.name,
    };
  }, [searchLocation]);

  const properties = useMemo(() => {
    if (!Array.isArray(listings) || listings.length === 0) return [];

    return listings
      .map((listing) => {
        const lat = Number(listing?.coordinates?.latitude);
        const lng = Number(listing?.coordinates?.longitude);

        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

        return {
          id: listing._id,
          latitude: lat,
          longitude: lng,
          name: listing.propertyName || "Unnamed Property",
          price: listing.monthlyRent || 0,
          image: Array.isArray(listing.images) && listing.images.length > 0 ? listing.images[0] : "",
          link: `/listing/${listing._id}`,
          city: listing.city || listing.address || "",
          distanceLabel: getListingDistance(listing, centerLocation),
          bedrooms: listing.bedrooms,
          propertyType: listing.propertyType,
          rating: listing.eloRating ? Math.round(Number(listing.eloRating)) : "New",
          status: listing.status || "Available",
        };
      })
      .filter(Boolean);
  }, [listings]);

  const mappedListingsCount = properties.length;

  const withinRadiusCount = useMemo(() => {
    if (!centerLocation) return 0;

    return listings.filter((listing) => {
      const coordinateDistance = getCoordinateDistanceKm(centerLocation, listing?.coordinates);
      if (coordinateDistance !== Infinity) return coordinateDistance <= radiusKm;
      return getDistanceValue(listing, centerLocation) <= radiusKm;
    }).length;
  }, [listings, radiusKm, centerLocation]);

  const sortedListings = useMemo(() => {
    const sorted = [...listings];

    if (sortBy === "rent-low") {
      sorted.sort((a, b) => Number(a.monthlyRent || Infinity) - Number(b.monthlyRent || Infinity));
    } else if (sortBy === "rent-high") {
      sorted.sort((a, b) => Number(b.monthlyRent || 0) - Number(a.monthlyRent || 0));
    } else if (sortBy === "rating") {
      sorted.sort((a, b) => Number(b.eloRating || 0) - Number(a.eloRating || 0));
    } else if (sortBy === "newest") {
      sorted.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    } else {
      sorted.sort((a, b) => getDistanceValue(a, centerLocation) - getDistanceValue(b, centerLocation));
    }

    return sorted;
  }, [listings, sortBy, centerLocation]);

  const averageRent = useMemo(() => {
    const values = listings
      .map((listing) => Number(listing?.monthlyRent || 0))
      .filter((value) => Number.isFinite(value) && value > 0);

    if (!values.length) return 0;
    return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
  }, [listings]);

  const nearestDistance = useMemo(() => {
    const nearest = sortedListings.find((listing) => getDistanceValue(listing, centerLocation) !== Infinity);
    return nearest ? getListingDistance(nearest, centerLocation) : "Around selected location";
  }, [sortedListings, centerLocation]);

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    const value = searchInput.trim();

    if (!value) {
      navigate("/listings");
      return;
    }

    navigate(`/search?q=${encodeURIComponent(value)}`);
  };

  const handleResetMap = () => {
    mapRef.current?.fitToResults?.();
  };

  return (
    <main className="relative h-[calc(100svh-72px)] min-h-[720px] overflow-hidden bg-slate-950 text-slate-950">
      <div className="absolute inset-0 bg-slate-100">
        <SearchMapboxMap
          ref={mapRef}
          initialCenter={
            centerLocation
              ? [centerLocation.longitude, centerLocation.latitude]
              : [80.7718, 7.8731]
          }
          initialZoom={centerLocation ? 13 : 7}
          centerLocation={centerLocation}
          properties={searchLocation ? properties : []}
          radiusKm={centerLocation ? radiusKm : 0}
          mapStyle={mapStyle}
          showRadius={showRadius && Boolean(centerLocation)}
          activePropertyId={activeListingId}
          key={`search-map-${searchLocation?._id || searchLocation?.name || "default"}-${listings.length}`}
        />
      </div>

      <div className="pointer-events-none absolute inset-0 bg-slate-950/[0.03]" />

      {loading && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-white/70 backdrop-blur-sm">
          <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-5 py-4 text-sm font-bold text-slate-700 shadow-[0_18px_54px_rgba(16,24,40,0.12)]">
            <Loader2 className="h-5 w-5 animate-spin text-blue-700" />
            Loading map results...
          </div>
        </div>
      )}

      <section className="pointer-events-auto absolute left-3 right-3 top-3 z-20 rounded-xl border border-white/80 bg-white/95 p-3 shadow-lux-glow backdrop-blur-2xl sm:left-4 sm:right-4 sm:top-4 lg:left-6 lg:right-auto lg:top-6 lg:w-[min(720px,calc(100%-460px))]">
        <div className="grid gap-2.5 xl:grid-cols-[minmax(0,1fr)_17rem] xl:items-center">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase text-blue-700">Map search</p>
            <h1 className="mt-0.5 truncate text-lg font-bold text-slate-950 sm:text-xl">
              {searchLocation ? searchLocation.displayName || searchLocation.name : "Sri Lanka student housing map"}
            </h1>
            <p className="mt-0.5 text-xs leading-5 text-slate-500 sm:text-sm">
              {searchLocation
                ? `${mappedListingsCount} mapped stays near ${searchLocation.displayName || searchLocation.name}, with rent pins and a ${radiusKm} km search radius.`
                : "Search a university or area to zoom into nearby boarding places and verified stays."}
            </p>
          </div>

          <form onSubmit={handleSearchSubmit} className="flex w-full flex-col gap-2 sm:flex-row">
            <label className="flex min-h-10 flex-1 items-center gap-2.5 rounded-lg border border-slate-200 bg-slate-50 px-3 text-slate-900 transition focus-within:border-blue-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-100">
              <SearchIcon className="h-4 w-4 shrink-0 text-blue-700" />
              <span className="sr-only">Search university or area</span>
              <input
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Search university or area"
                className="w-full bg-transparent text-sm font-semibold outline-none placeholder:text-slate-400"
              />
            </label>
            <button type="submit" className="ln-primary-btn min-h-10 px-4 text-sm">
              Search
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        </div>

        <div className="mt-2.5 grid gap-2.5 border-t border-slate-100 pt-2.5 xl:grid-cols-[1fr_auto] xl:items-center">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <span className="text-xs font-bold uppercase text-slate-400">Popular</span>
            {quickSearches.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => navigate(`/search?q=${encodeURIComponent(item)}`)}
                className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
              >
                {item}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex min-h-8 overflow-hidden rounded-lg border border-slate-200 bg-slate-50 p-1">
              <button
                type="button"
                title="Street map"
                aria-pressed={mapStyle === "streets"}
                onClick={() => setMapStyle("streets")}
                className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-bold transition ${
                  mapStyle === "streets"
                    ? "bg-white text-blue-700 shadow-sm"
                    : "text-slate-500 hover:bg-white hover:text-slate-800"
                }`}
              >
                <MapIcon className="h-4 w-4" />
                Streets
              </button>
              <button
                type="button"
                title="Satellite map"
                aria-pressed={mapStyle === "satellite"}
                onClick={() => setMapStyle("satellite")}
                className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-bold transition ${
                  mapStyle === "satellite"
                    ? "bg-white text-blue-700 shadow-sm"
                    : "text-slate-500 hover:bg-white hover:text-slate-800"
                }`}
              >
                <Satellite className="h-4 w-4" />
                Satellite
              </button>
            </div>

            <button
              type="button"
              title="Toggle search radius"
              aria-pressed={showRadius}
              disabled={!centerLocation}
              onClick={() => setShowRadius((value) => !value)}
              className={`inline-flex min-h-8 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-bold transition ${
                !centerLocation
                  ? "cursor-not-allowed border-slate-200 bg-slate-50 text-slate-300"
                  : showRadius
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-slate-200 bg-slate-50 text-slate-500 hover:bg-white"
              }`}
            >
              <MapPinned className="h-4 w-4" />
              {radiusKm} km
            </button>

            <button
              type="button"
              title="Recenter map"
              onClick={handleResetMap}
              className="inline-flex min-h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-bold text-slate-600 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
            >
              <LocateFixed className="h-4 w-4" />
              Recenter
            </button>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2 lg:hidden">
          <div className="rounded-lg border border-slate-200 bg-white/95 px-3 py-2 shadow-sm">
            <p className="text-[11px] font-bold uppercase text-slate-400">Listings</p>
            <p className="mt-0.5 text-base font-bold text-slate-950">{listings.length}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white/95 px-3 py-2 shadow-sm">
            <p className="text-[11px] font-bold uppercase text-slate-400">Mapped</p>
            <p className="mt-0.5 text-base font-bold text-slate-950">{mappedListingsCount}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white/95 px-3 py-2 shadow-sm">
            <p className="text-[11px] font-bold uppercase text-slate-400">Inside</p>
            <p className="mt-0.5 text-base font-bold text-slate-950">{withinRadiusCount}</p>
          </div>
        </div>
      </section>

      <section className="pointer-events-auto absolute bottom-5 left-6 z-20 hidden w-[min(620px,calc(100%-420px))] grid-cols-4 gap-2 lg:grid">
        <div className="rounded-xl border border-white/80 bg-white/95 px-3 py-2 shadow-lux backdrop-blur-2xl transition hover:-translate-y-0.5">
          <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase text-slate-400">
            <Building2 className="h-4 w-4 text-blue-700" />
            Listings
          </div>
          <p className="mt-0.5 text-base font-bold text-slate-950">{listings.length}</p>
        </div>
        <div className="rounded-xl border border-white/80 bg-white/95 px-3 py-2 shadow-lux backdrop-blur-2xl transition hover:-translate-y-0.5">
          <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase text-slate-400">
            <Layers className="h-4 w-4 text-emerald-700" />
            Mapped
          </div>
          <p className="mt-0.5 truncate text-base font-bold text-slate-950">
            {mappedListingsCount}
          </p>
        </div>
        <div className="rounded-xl border border-white/80 bg-white/95 px-3 py-2 shadow-lux backdrop-blur-2xl transition hover:-translate-y-0.5">
          <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase text-slate-400">
            <MapPinned className="h-4 w-4 text-amber-700" />
            In radius
          </div>
          <p className="mt-0.5 truncate text-base font-bold text-slate-950">{withinRadiusCount}</p>
        </div>
        <div className="rounded-xl border border-white/80 bg-white/95 px-3 py-2 shadow-lux backdrop-blur-2xl transition hover:-translate-y-0.5">
          <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase text-slate-400">
            <Banknote className="h-4 w-4 text-slate-700" />
            Avg. rent
          </div>
          <p className="mt-0.5 truncate text-xs font-bold text-slate-950">
            {formatCurrency(averageRent)}
          </p>
        </div>
      </section>

      {searchLocation && !loading && (
        <aside className="pointer-events-auto absolute bottom-0 left-0 right-0 z-30 max-h-[46svh] overflow-hidden rounded-t-xl border border-white/80 bg-white/95 shadow-lux-glow backdrop-blur-2xl lg:bottom-6 lg:left-auto lg:right-6 lg:top-6 lg:flex lg:w-[380px] lg:max-h-none lg:flex-col lg:rounded-xl">
          <div className="flex justify-center pt-2 lg:hidden">
            <span className="h-1 w-10 rounded-full bg-slate-300" />
          </div>
          <div className="border-b border-slate-200 px-3 py-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="ln-eyebrow">Map results</p>
                <h2 className="mt-1 text-base font-bold text-slate-950">Nearby listings</h2>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Sorted places around {searchLocation.displayName || searchLocation.name}.
                </p>
              </div>
              <span className="rounded-md bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">
                {sortedListings.length}
              </span>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-1.5">
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5">
                <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase text-slate-400">
                  <Layers className="h-3.5 w-3.5 text-emerald-700" />
                  Mapped
                </div>
                <p className="mt-0.5 text-sm font-bold text-slate-950">{mappedListingsCount}</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5">
                <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase text-slate-400">
                  <MapPinned className="h-3.5 w-3.5 text-amber-700" />
                  Inside
                </div>
                <p className="mt-0.5 text-sm font-bold text-slate-950">{withinRadiusCount}</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5">
                <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase text-slate-400">
                  <Route className="h-3.5 w-3.5 text-blue-700" />
                  Nearest
                </div>
                <p className="mt-0.5 truncate text-sm font-bold text-slate-950">{nearestDistance}</p>
              </div>
            </div>

            <label className="mt-3 flex min-h-9 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-600">
              <ArrowUpDown className="h-4 w-4 text-blue-700" />
              <select
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value)}
                className="w-full bg-transparent text-sm font-semibold text-slate-700 outline-none"
                aria-label="Sort search results"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="ln-scrollbar flex-1 overflow-y-auto px-3 py-3">
            {sortedListings.length ? (
              <div className="space-y-2.5">
                {sortedListings.map((listing) => {
                  const isActive = activeListingId === listing._id;

                  return (
                    <Link
                      key={listing._id}
                      to={`/listing/${listing._id}`}
                      onMouseEnter={() => setActiveListingId(listing._id)}
                      onMouseLeave={() => setActiveListingId(null)}
                      onFocus={() => setActiveListingId(listing._id)}
                      onBlur={() => setActiveListingId(null)}
                        className={`group block rounded-xl border bg-white p-2 shadow-sm transition-all duration-300 hover:border-blue-200 hover:bg-slate-50 hover:shadow-lux ${
                        isActive ? "border-blue-400 bg-blue-50/70 shadow-md ring-2 ring-blue-100" : "border-slate-200"
                      }`}
                    >
                      <div className="flex gap-2.5">
                        <div className="relative h-20 w-24 shrink-0 overflow-hidden rounded-md bg-slate-100">
                          <img
                            src={listing.images?.[0] || "/landingImg2.jpg"}
                            alt={listing.propertyName || "Property"}
                            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                            onError={(event) => {
                              event.currentTarget.src = "/landingImg2.jpg";
                            }}
                          />
                          <span className="absolute left-1.5 top-1.5 inline-flex items-center gap-1 rounded-md bg-white/95 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 shadow-sm">
                            <BadgeCheck className="h-3 w-3" />
                            {listing.status || "Available"}
                          </span>
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="line-clamp-1 text-sm font-bold leading-5 text-slate-950 group-hover:text-blue-700">
                              {listing.propertyName || "Untitled property"}
                            </h3>
                            <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">
                              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                              {listing.eloRating ? Math.round(Number(listing.eloRating)) : "New"}
                            </span>
                          </div>

                          <p className="mt-1 flex items-center gap-1 text-xs font-medium text-slate-500">
                            <MapPin className="h-3.5 w-3.5 shrink-0 text-blue-700" />
                            <span className="truncate">
                              {listing.city || listing.address || "Location unavailable"}
                            </span>
                          </p>

                          <div className="mt-1.5 flex flex-wrap gap-1">
                            <span className="rounded-md border border-blue-100 bg-blue-50 px-1.5 py-0.5 text-[11px] font-bold text-blue-700">
                              {formatCurrency(listing.monthlyRent, "Price on request")}
                            </span>
                            <span className="rounded-md bg-white px-1.5 py-0.5 text-[11px] font-semibold text-slate-500 ring-1 ring-slate-200">
                              {getListingDistance(listing)}
                            </span>
                            <span className="inline-flex items-center gap-1 rounded-md bg-white px-1.5 py-0.5 text-[11px] font-semibold text-slate-500 ring-1 ring-slate-200">
                              <BedDouble className="h-3 w-3 text-blue-700" />
                              {listing.bedrooms || "N/A"}
                            </span>
                            <span className="inline-flex items-center gap-1 rounded-md bg-white px-1.5 py-0.5 text-[11px] font-semibold text-slate-500 ring-1 ring-slate-200">
                              <Home className="h-3 w-3 text-blue-700" />
                              {listing.propertyType || "Property"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-slate-200 bg-white px-4 py-8 text-center">
                <ShieldCheck className="mx-auto h-8 w-8 text-slate-300" />
                <p className="mt-3 text-sm font-semibold text-slate-700">No nearby listings yet</p>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Try another campus or browse the full listings page.
                </p>
              </div>
            )}
          </div>

          <div className="border-t border-slate-200 px-3 py-3">
            <Link to="/listings" className="ln-secondary-btn min-h-10 w-full text-sm">
              Browse all listings
            </Link>
          </div>
        </aside>
      )}
    </main>
  );
};

export default Search;
