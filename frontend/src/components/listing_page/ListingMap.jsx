import React, { useEffect, useRef, useMemo, useState } from "react";
import { motion } from "framer-motion";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

const getMapboxCoords = (listing) => {
  const lat = Number(
    listing?.latitude ??
      listing?.coordinates?.latitude ??
      listing?.nearestUniversity?.latitude
  );
  const lng = Number(
    listing?.longitude ??
      listing?.coordinates?.longitude ??
      listing?.nearestUniversity?.longitude
  );

  if (Number.isFinite(lat) && Number.isFinite(lng)) return [lng, lat];
  return null;
};

const getListingName = (listing) =>
  listing?.propertyName || listing?.title || listing?.name || "Property";

const getListingPrice = (listing) => {
  const price = Number(listing?.monthlyRent ?? listing?.price ?? 0);
  return Number.isFinite(price) ? price : 0;
};

const escapeHtml = (str = "") =>
  String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const ListingMap = ({ listings = [], selectedListing, onSelect }) => {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markersDataRef = useRef(new Map());

  const [hoveredListingId, setHoveredListingId] = useState(null);
  const [zoom, setZoom] = useState(12);

  const validListings = useMemo(() => {
    return Array.isArray(listings)
      ? listings
          .map((listing, index) => {
            const coords = getMapboxCoords(listing);
            if (!coords) return null;

            return {
              ...listing,
              _coords: coords,
              _id: listing._id || `listing-${index}`,
            };
          })
          .filter(Boolean)
      : [];
  }, [listings]);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [79.8612, 6.9271],
      zoom: 12,
    });

    mapRef.current.addControl(new mapboxgl.NavigationControl(), "top-right");

    const updateZoom = () => {
      setZoom(mapRef.current.getZoom());
    };

    mapRef.current.on("zoom", updateZoom);
  }, []);

  // Create / remove markers
  useEffect(() => {
    if (!mapRef.current) return;

    const validIds = new Set(validListings.map((l) => l._id));

    for (const [id, data] of markersDataRef.current.entries()) {
      if (!validIds.has(id)) {
        data.marker.remove();
        markersDataRef.current.delete(id);
      }
    }

    validListings.forEach((listing) => {
      if (!markersDataRef.current.has(listing._id)) {
        const el = document.createElement("div");

        const popupNode = document.createElement("div");

        const popup = new mapboxgl.Popup({
          offset: 30,
          closeButton: false,
        }).setDOMContent(popupNode);

        const marker = new mapboxgl.Marker({
          element: el,
          anchor: "bottom",
        })
          .setLngLat(listing._coords)
          .setPopup(popup)
          .addTo(mapRef.current);

        el.addEventListener("mouseenter", () =>
          setHoveredListingId(listing._id)
        );
        el.addEventListener("mouseleave", () =>
          setHoveredListingId(null)
        );

        markersDataRef.current.set(listing._id, {
          marker,
          el,
          popupNode,
          listing,
        });
      }
    });
  }, [validListings]);

  // Update UI
  useEffect(() => {
    const showPrice = zoom >= 13;

    for (const [id, data] of markersDataRef.current.entries()) {
      const { el, popupNode, listing } = data;

      const isSelected = selectedListing?._id === id;
      const isHovered = hoveredListingId === id;

      const price = getListingPrice(listing);
      const name = getListingName(listing);

      const safeName = escapeHtml(name);

      el.onclick = (e) => {
        e.stopPropagation();
        onSelect?.(listing);
      };

      if (showPrice) {
        el.innerHTML = `
          <div class="marker-wrap ${isSelected ? "selected" : ""} ${
          isHovered ? "hovered" : ""
        }">
            <div class="marker-bubble">
              LKR ${price.toLocaleString()}
            </div>
            <div class="marker-tail"></div>
          </div>
        `;
      } else {
        el.innerHTML = `
          <div class="marker-wrap ${isSelected ? "selected" : ""} ${
          isHovered ? "hovered" : ""
        }">
            <div class="marker-bubble name">
              ${safeName}
            </div>
            <div class="marker-tail"></div>
          </div>
        `;
      }

      popupNode.innerHTML = `
        <div style="min-width:200px">
          <h4 style="font-weight:600">${safeName}</h4>
          <p style="font-size:12px;color:#666">${
            listing.city || "Unknown"
          }</p>
          <p style="font-weight:600;margin-top:6px;color:#0D5792;">
            LKR ${price.toLocaleString()}/month
          </p>
        </div>
      `;
    }
  }, [zoom, selectedListing, hoveredListingId, onSelect]);

  // Fly to selected
  useEffect(() => {
    if (!mapRef.current || !selectedListing) return;

    const coords = getMapboxCoords(selectedListing);
    if (!coords) return;

    mapRef.current.flyTo({
      center: coords,
      zoom: 14.5,
      duration: 1000,
    });
  }, [selectedListing]);

  return (
    <motion.div className="ln-premium-surface w-full h-full overflow-hidden p-2">
      <div ref={mapContainerRef} className="h-[500px] w-full rounded-xl" />

      <style>{`
        .marker-wrap {
          display: flex;
          flex-direction: column;
          align-items: center;
          transform: translateY(-6px);
          transition: transform .2s ease;
        }

        .marker-wrap.hovered {
          transform: translateY(-8px) scale(1.05);
        }

        .marker-wrap.selected {
          transform: translateY(-10px) scale(1.12);
        }

        .marker-bubble {
          background: white;
          border-radius: 12px;
          padding: 8px 12px;
          font-size: 12px;
          font-weight: 800;
          box-shadow: 0 18px 46px -16px rgba(7,26,61,0.28), 0 8px 20px rgba(15,139,111,0.08);
          border: 1px solid rgba(226,232,240,.95);
        }

        .marker-wrap.selected .marker-bubble {
          background: linear-gradient(135deg, #08345D, #0D5792);
          color: white;
          box-shadow: 0 0 0 1px rgba(215,179,90,0.24), 0 18px 44px rgba(7,26,61,0.18);
        }

        .marker-bubble.name {
          font-weight: 700;
          max-width: 160px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .marker-tail {
          width: 12px;
          height: 12px;
          background: white;
          transform: rotate(45deg);
          margin-top: -6px;
          box-shadow: 0 6px 14px rgba(15,23,42,.14);
        }

        .marker-wrap.selected .marker-tail {
          background: #0D5792;
        }

        .mapboxgl-popup-content {
          border-radius: 12px !important;
          padding: 14px !important;
          box-shadow: 0 18px 46px -16px rgba(7,26,61,0.28), 0 8px 20px rgba(15,139,111,0.08);
        }
      `}</style>
    </motion.div>
  );
};

export default ListingMap;
