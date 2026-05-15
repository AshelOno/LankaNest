import React, { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, MapPin } from "lucide-react";
import { BadgeChip } from "./listing-ui";

const FALLBACK_IMAGES = [
  "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?q=80&w=1770&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?q=80&w=1780&auto=format&fit=crop",
];

const ListingInfoHeroSection = ({ listing }) => {
  const [index, setIndex] = useState(0);
  const [loaded, setLoaded] = useState(false);

  const images = useMemo(() => {
    const raw = Array.isArray(listing?.images)
      ? listing.images.filter(Boolean)
      : listing?.images
      ? [listing.images]
      : [];

    return raw.length ? raw : FALLBACK_IMAGES;
  }, [listing?.images]);

  useEffect(() => {
    if (images.length <= 1) return;

    const interval = setInterval(() => {
      setIndex((i) => (i + 1) % images.length);
      setLoaded(false);
    }, 3800);

    return () => clearInterval(interval);
  }, [images.length]);

  useEffect(() => {
    setIndex(0);
    setLoaded(false);
  }, [listing?._id]);

  const next = () => {
    setIndex((i) => (i + 1) % images.length);
    setLoaded(false);
  };

  const prev = () => {
    setIndex((i) => (i - 1 + images.length) % images.length);
    setLoaded(false);
  };

  const rent = Number(listing?.monthlyRent || 0).toLocaleString();

  return (
    <div className="w-full">
      <div className="space-y-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1 space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center rounded-md border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase text-emerald-700 shadow-sm">
                Property overview
              </span>

              <BadgeChip tone="primary">{listing?.status || "Available"}</BadgeChip>
              <BadgeChip tone="soft">
                {listing?.featured ? "Featured" : "Standard"}
              </BadgeChip>
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl lg:text-4xl">
                {listing?.propertyName || "Property"}
              </h1>

              <div className="flex items-start gap-2 text-slate-600">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
                <span className="max-w-3xl text-sm leading-6 sm:text-base">
                  {listing?.address || "No address available"}
                </span>
              </div>
            </div>
          </div>

          <div className="shrink-0 rounded-lg border border-blue-100 bg-white px-5 py-4 shadow-sm">
            <p className="text-[11px] font-semibold uppercase text-emerald-700">
              Monthly rent
            </p>
            <p className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
              LKR {rent}
            </p>
            <p className="mt-1 text-xs text-slate-500">Shown before utilities</p>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-lg border border-blue-100 bg-slate-100 shadow-lux">
          <div className="absolute left-4 top-4 z-20 rounded-md bg-black/55 px-3 py-1 text-xs font-medium text-white backdrop-blur">
            {index + 1} / {images.length}
          </div>

          <div className="absolute right-4 top-4 z-20 rounded-md border border-emerald-100 bg-white/90 px-4 py-2 text-sm font-semibold text-slate-900 shadow-sm backdrop-blur-xl">
            LKR {rent}
          </div>

          <img
            src={images[index]}
            alt={`${listing?.propertyName || "Property"} - ${index + 1}`}
            onLoad={() => setLoaded(true)}
            className={`h-[300px] w-full object-cover transition-all duration-700 sm:h-[400px] lg:h-[480px] xl:h-[540px] ${
              loaded ? "scale-100 opacity-100" : "scale-105 opacity-85"
            }`}
          />

          {images.length > 1 ? (
            <>
              <button
                type="button"
                onClick={prev}
                aria-label="Previous image"
              className="absolute left-4 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-lg border border-white/20 bg-slate-950/45 text-white backdrop-blur-md transition hover:bg-slate-950/65"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={next}
                aria-label="Next image"
                className="absolute right-4 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-lg border border-white/20 bg-slate-950/45 text-white backdrop-blur-md transition hover:bg-slate-950/65"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </>
          ) : null}

          <div className="absolute bottom-4 left-4 z-20 rounded-lg border border-white/15 bg-black/45 px-4 py-3 text-white backdrop-blur-md">
            <p className="text-[11px] font-semibold uppercase text-white/70">
              Gallery
            </p>
            <p className="mt-1 text-sm font-medium">
              {images.length} photo{images.length !== 1 ? "s" : ""}
            </p>
          </div>

          <div className="absolute bottom-4 right-4 z-20 flex max-w-[70%] gap-2 overflow-x-auto rounded-lg border border-white/15 bg-black/45 p-2 backdrop-blur-md">
            {images.map((img, i) => (
              <button
                type="button"
                key={`${img}-${i}`}
                onClick={() => {
                  setIndex(i);
                  setLoaded(false);
                }}
                aria-label={`Go to image ${i + 1}`}
                className={`relative h-14 w-20 flex-shrink-0 overflow-hidden rounded-md border transition ${
                  index === i
                    ? "border-white ring-2 ring-sky-300/80"
                    : "border-white/15 opacity-80 hover:opacity-100 hover:border-white/40"
                }`}
              >
                <img
                  src={img}
                  alt={`Thumbnail ${i + 1}`}
                  className="h-full w-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ListingInfoHeroSection;
