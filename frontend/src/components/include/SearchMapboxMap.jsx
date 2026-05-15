import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import mapboxgl from "mapbox-gl";
import * as turf from "@turf/turf";
import "mapbox-gl/dist/mapbox-gl.css";
import { MapInlineLoader } from "./LoadingSpinner";

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

const MAP_STYLES = {
  streets: "mapbox://styles/mapbox/streets-v12",
  satellite: "mapbox://styles/mapbox/satellite-streets-v12",
};

const resolveMapStyle = (style) => MAP_STYLES[style] || MAP_STYLES.streets;

const escapeHtml = (value = "") =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const formatCurrency = (value) => {
  const amount = Number(value || 0);
  if (!amount) return "Price on request";
  return `LKR ${amount.toLocaleString("en-LK")}`;
};

const formatPinPrice = (value) => {
  const amount = Number(value || 0);
  if (!amount) return "LKR";
  if (amount >= 1000000) {
    const millions = amount / 1000000;
    return `${millions >= 10 ? Math.round(millions) : millions.toFixed(1)}M`;
  }
  return `${Math.round(amount / 1000)}K`;
};

const createMarkerEl = ({ type = "property", label = "P", active = false, muted = false, title = "" }) => {
  const el = document.createElement("button");
  el.type = "button";
  el.className = [
    "search-mapbox-marker",
    `search-mapbox-marker--${type}`,
    active ? "is-active" : "",
    muted ? "is-muted" : "",
  ]
    .filter(Boolean)
    .join(" ");
  el.setAttribute(
    "aria-label",
    title || (type === "location" ? "Selected location" : type === "university" ? "Selected university" : "Listing marker")
  );
  el.innerHTML = `
    <span class="search-mapbox-pin">
      <span class="search-mapbox-pin-label">${escapeHtml(label)}</span>
    </span>
  `;

  return el;
};

const buildPropertyPopupHtml = (property, inRadius, radiusKm) => {
  const safeName = escapeHtml(property.name || "Property");
  const safeImage = escapeHtml(property.image || "");
  const safeLink = escapeHtml(property.link || "#");
  const details = [
    property.distanceLabel || (inRadius ? `Inside ${radiusKm} km` : `Beyond ${radiusKm} km`),
    property.city,
    property.propertyType,
  ].filter(Boolean);

  return `
    <article class="search-mapbox-popup-card">
      ${
        safeImage
          ? `<img src="${safeImage}" alt="${safeName}" class="search-mapbox-popup-image" />`
          : `<div class="search-mapbox-popup-empty">No image</div>`
      }

      <div class="search-mapbox-popup-body">
        <div class="search-mapbox-popup-status ${inRadius ? "is-close" : ""}">
          ${inRadius ? "Inside radius" : "Outside radius"}
        </div>

        <h3>${safeName}</h3>
        <p class="search-mapbox-popup-price">${escapeHtml(formatCurrency(property.price))}</p>

        ${
          details.length
            ? `<div class="search-mapbox-popup-meta">
                ${details
                  .slice(0, 3)
                  .map((item) => `<span>${escapeHtml(item)}</span>`)
                  .join("")}
              </div>`
            : ""
        }

        <a href="${safeLink}" class="search-mapbox-popup-link">View details</a>
      </div>
    </article>
  `;
};

const SearchMapboxMap = forwardRef(
  (
    {
      initialCenter = [79.8612, 6.9271],
      initialZoom = 13,
      properties = [],
      centerLocation = null,
      radiusKm = 5,
      mapStyle = "streets",
      showRadius = true,
      activePropertyId = null,
    },
    ref
  ) => {
    const mapContainerRef = useRef(null);
    const mapRef = useRef(null);
    const markersRef = useRef([]);
    const popupsRef = useRef([]);
    const centerMarkerRef = useRef(null);
    const centerPopupRef = useRef(null);
    const currentStyleRef = useRef(resolveMapStyle(mapStyle));
    const initialStyleRef = useRef(resolveMapStyle(mapStyle));
    const radiusLayerIdsRef = useRef({
      source: "search-radius-source",
      fill: "search-radius-fill",
      outline: "search-radius-outline",
    });
    const [mapReady, setMapReady] = useState(false);
    const [selectedPropertyId, setSelectedPropertyId] = useState(null);

    const initialCenterKey = Array.isArray(initialCenter)
      ? `${Number(initialCenter[0]) || 79.8612}:${Number(initialCenter[1]) || 6.9271}`
      : "79.8612:6.9271";
    const normalizedInitialCenter = useMemo(() => {
      const [lng, lat] = initialCenterKey.split(":").map(Number);
      return [lng, lat];
    }, [initialCenterKey]);
    const normalizedInitialZoom = Number(initialZoom) || 13;
    const initialCenterRef = useRef(normalizedInitialCenter);
    const initialZoomRef = useRef(normalizedInitialZoom);

    const centerCoords = useMemo(() => {
      const lat = Number(centerLocation?.latitude);
      const lng = Number(centerLocation?.longitude);
      if (Number.isFinite(lat) && Number.isFinite(lng)) return [lng, lat];
      return null;
    }, [centerLocation]);

    const validProperties = useMemo(() => {
      return Array.isArray(properties)
        ? properties
            .map((property, index) => {
              const lat = Number(property?.latitude);
              const lng = Number(property?.longitude);

              if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

              return {
                ...property,
                id: property?.id || property?._id || `${lng}-${lat}-${index}`,
                latitude: lat,
                longitude: lng,
                price: Number(property?.price || 0),
              };
            })
            .filter(Boolean)
        : [];
    }, [properties]);

    const focusedPropertyId = activePropertyId || selectedPropertyId;
    const focusedPropertyKey = focusedPropertyId ? String(focusedPropertyId) : "";

    const fitToResults = useCallback(() => {
      const map = mapRef.current;
      if (!map) return;

      const bounds = new mapboxgl.LngLatBounds();
      let hasBounds = false;

      if (centerCoords) {
        bounds.extend(centerCoords);
        hasBounds = true;
      }

      validProperties.forEach((property) => {
        bounds.extend([property.longitude, property.latitude]);
        hasBounds = true;
      });

      if (!hasBounds) {
        map.flyTo({
          center: normalizedInitialCenter,
          zoom: normalizedInitialZoom,
          essential: true,
          duration: 700,
        });
        return;
      }

      const isWide = window.innerWidth >= 1024;

      map.fitBounds(bounds, {
        padding: isWide
          ? { top: 150, bottom: 120, left: 84, right: 470 }
          : { top: 240, bottom: 250, left: 38, right: 38 },
        maxZoom: validProperties.length ? 15 : 13.4,
        duration: 850,
      });
    }, [normalizedInitialCenter, normalizedInitialZoom, centerCoords, validProperties]);

    useImperativeHandle(
      ref,
      () => ({
        getMap: () => mapRef.current,
        panTo: (coords) => {
          if (!mapRef.current || !coords) return;
          mapRef.current.flyTo({
            center: [coords.longitude, coords.latitude],
            zoom: 14.4,
            essential: true,
          });
        },
        fitToResults,
        resize: () => {
          mapRef.current?.resize();
        },
      }),
      [fitToResults]
    );

    useEffect(() => {
      if (!mapContainerRef.current || mapRef.current) return undefined;

      const map = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: initialStyleRef.current,
        center: initialCenterRef.current,
        zoom: initialZoomRef.current,
        attributionControl: false,
        pitch: 18,
      });

      mapRef.current = map;
      map.addControl(new mapboxgl.ScaleControl({ maxWidth: 120, unit: "metric" }), "bottom-left");

      const handleMapLoad = () => {
        setMapReady(true);
        window.setTimeout(() => {
          map.resize();
        }, 100);
      };

      map.on("load", handleMapLoad);

      return () => {
        map.off("load", handleMapLoad);
        popupsRef.current.forEach((popup) => popup.remove());
        popupsRef.current = [];

        markersRef.current.forEach(({ marker }) => marker.remove());
        markersRef.current = [];

        centerPopupRef.current?.remove();
        centerPopupRef.current = null;

        centerMarkerRef.current?.remove();
        centerMarkerRef.current = null;

        if (mapRef.current) {
          mapRef.current.remove();
          mapRef.current = null;
        }

        setMapReady(false);
      };
    }, []);

    useEffect(() => {
      const map = mapRef.current;
      const nextStyle = resolveMapStyle(mapStyle);

      if (!map || currentStyleRef.current === nextStyle) return undefined;

      currentStyleRef.current = nextStyle;
      setMapReady(false);

      const handleStyleLoad = () => {
        setMapReady(true);
        window.setTimeout(() => {
          map.resize();
          fitToResults();
        }, 80);
      };

      map.once("style.load", handleStyleLoad);
      map.setStyle(nextStyle);

      return () => {
        map.off("style.load", handleStyleLoad);
      };
    }, [fitToResults, mapStyle]);

    useEffect(() => {
      if (!mapRef.current || !mapReady) return undefined;

      const map = mapRef.current;
      const sourceId = radiusLayerIdsRef.current.source;
      const fillId = radiusLayerIdsRef.current.fill;
      const outlineId = radiusLayerIdsRef.current.outline;

      const addCenterLayers = () => {
        centerMarkerRef.current?.remove();
        centerMarkerRef.current = null;

        centerPopupRef.current?.remove();
        centerPopupRef.current = null;

        if (map.getLayer(fillId)) map.removeLayer(fillId);
        if (map.getLayer(outlineId)) map.removeLayer(outlineId);
        if (map.getSource(sourceId)) map.removeSource(sourceId);

        if (!centerCoords) return;

        if (showRadius) {
          const point = turf.point(centerCoords);
          const circle = turf.circle(point, radiusKm, { steps: 128, units: "kilometers" });

          map.addSource(sourceId, {
            type: "geojson",
            data: circle,
          });

          map.addLayer({
            id: fillId,
            type: "fill",
            source: sourceId,
            paint: {
              "fill-color": "#0A4174",
              "fill-opacity": mapStyle === "satellite" ? 0.18 : 0.12,
            },
          });

          map.addLayer({
            id: outlineId,
            type: "line",
            source: sourceId,
            paint: {
              "line-color": "#0A4174",
              "line-width": 2.5,
              "line-opacity": 0.9,
            },
          });
        }

        const centerEl = createMarkerEl({
          type: "location",
          label: centerLocation?.name?.charAt(0)?.toUpperCase() || "L",
          active: true,
          title: centerLocation?.name || "Selected location",
        });

        centerMarkerRef.current = new mapboxgl.Marker({ element: centerEl, anchor: "bottom" })
          .setLngLat(centerCoords)
          .addTo(map);

        centerPopupRef.current = new mapboxgl.Popup({
          closeButton: false,
          closeOnClick: false,
          offset: 22,
          className: "search-mapbox-center-popup",
        })
          .setLngLat(centerCoords)
          .setHTML(`
            <div class="search-mapbox-campus-popup">
              <p>${escapeHtml(centerLocation?.name || "Selected location")}</p>
              <span>${showRadius ? `${radiusKm} km search radius` : "Radius hidden"}</span>
            </div>
          `)
          .addTo(map);
      };

      if (map.isStyleLoaded()) {
        addCenterLayers();
      } else {
        map.once("style.load", addCenterLayers);
      }

      return undefined;
    }, [mapReady, mapStyle, radiusKm, showRadius, centerCoords, centerLocation]);

    useEffect(() => {
      if (!mapRef.current || !mapReady) return undefined;

      const map = mapRef.current;

      markersRef.current.forEach(({ marker }) => marker.remove());
      markersRef.current = [];

      popupsRef.current.forEach((popup) => popup.remove());
      popupsRef.current = [];

      if (validProperties.length === 0) return undefined;

      validProperties.forEach((property) => {
        const distanceKm = centerCoords
          ? turf.distance(centerCoords, [property.longitude, property.latitude], { units: "kilometers" })
          : null;
        const inRadius = Number.isFinite(distanceKm) ? distanceKm <= radiusKm : false;
        const isFocused = focusedPropertyKey === String(property.id);

        const markerEl = createMarkerEl({
          type: "property",
          label: formatPinPrice(property.price),
          active: isFocused || inRadius,
          muted: !isFocused && !inRadius,
          title: property.name || "Listing",
        });

        const marker = new mapboxgl.Marker({ element: markerEl, anchor: "bottom" })
          .setLngLat([property.longitude, property.latitude])
          .addTo(map);

        const popup = new mapboxgl.Popup({
          closeButton: false,
          closeOnClick: false,
          offset: 18,
          maxWidth: "250px",
          className: "search-mapbox-property-popup",
        })
          .setLngLat([property.longitude, property.latitude])
          .setHTML(buildPropertyPopupHtml(property, inRadius, radiusKm));

        const openPopup = () => {
          popupsRef.current.forEach((openPopupItem) => {
            if (openPopupItem !== popup) openPopupItem.remove();
          });
          popupsRef.current = popupsRef.current.filter((openPopupItem) => openPopupItem === popup);
          popup.addTo(map);
          if (!popupsRef.current.includes(popup)) {
            popupsRef.current.push(popup);
          }
        };

        const closePopup = () => {
          window.setTimeout(() => {
            const popupEl = popup.getElement();
            if (focusedPropertyKey === String(property.id)) return;
            if (!popupEl || !popupEl.matches(":hover")) {
              popup.remove();
              popupsRef.current = popupsRef.current.filter((openPopupItem) => openPopupItem !== popup);
            }
          }, 180);
        };

        const selectMarker = () => {
          setSelectedPropertyId(property.id);
          openPopup();
          map.easeTo({
            center: [property.longitude, property.latitude],
            zoom: Math.max(map.getZoom(), 14),
            duration: 450,
            essential: true,
          });
        };

        markerEl.addEventListener("mouseenter", openPopup);
        markerEl.addEventListener("mouseleave", closePopup);
        markerEl.addEventListener("click", selectMarker);
        markerEl.addEventListener("keydown", (event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            selectMarker();
          }
        });

        popup.on("close", () => {
          popupsRef.current = popupsRef.current.filter((openPopupItem) => openPopupItem !== popup);
        });

        markersRef.current.push({ marker, popup });

        if (isFocused) {
          openPopup();
        }
      });

      return undefined;
    }, [focusedPropertyKey, mapReady, radiusKm, centerCoords, validProperties]);

    useEffect(() => {
      if (!mapRef.current || !mapReady) return undefined;
      const timer = window.setTimeout(() => {
        mapRef.current?.resize();
        fitToResults();
      }, 120);
      return () => window.clearTimeout(timer);
    }, [fitToResults, mapReady]);

    return (
      <>
        <style>{`
          .search-mapbox-shell .mapboxgl-canvas {
            border-radius: 0;
          }

          .search-mapbox-shell .mapboxgl-ctrl-bottom-left {
            bottom: 1rem;
            left: 1rem;
          }

          .search-mapbox-shell .mapboxgl-ctrl-scale {
            border-color: rgba(15, 23, 42, 0.32);
            color: #0f172a;
            background: rgba(255, 255, 255, 0.78);
            backdrop-filter: blur(14px);
          }

          .search-mapbox-shell .mapboxgl-popup-content {
            padding: 0 !important;
            border-radius: 12px !important;
            overflow: hidden;
            border: 1px solid rgba(255, 255, 255, 0.95);
            box-shadow: 0 0 0 1px rgba(215,179,90,0.24), 0 18px 44px rgba(7,26,61,0.18);
            font-family: Inter, ui-sans-serif, system-ui, sans-serif;
          }

          .search-mapbox-shell .mapboxgl-popup-tip {
            border-top-color: white !important;
            border-bottom-color: white !important;
          }

          .search-mapbox-marker {
            border: 0;
            background: transparent;
            cursor: pointer;
            padding: 0;
            user-select: none;
            filter: drop-shadow(0 8px 14px rgba(15, 23, 42, 0.24));
            transform: translateY(-1px);
          }

          .search-mapbox-pin {
            position: relative;
            display: inline-flex;
            min-width: 54px;
            height: 32px;
            align-items: center;
            justify-content: center;
            border-radius: 8px;
            border: 2px solid rgba(255, 255, 255, 0.96);
            background: linear-gradient(135deg, #08345D, #0D5792);
            color: white;
            font-size: 12px;
            font-weight: 800;
            line-height: 1;
            padding: 0 10px;
            transition: transform 160ms ease, box-shadow 160ms ease, opacity 160ms ease;
            white-space: nowrap;
          }

          .search-mapbox-pin::after {
            position: absolute;
            left: 50%;
            bottom: -7px;
            width: 12px;
            height: 12px;
            content: "";
            background: inherit;
            border-bottom: 2px solid rgba(255, 255, 255, 0.96);
            border-right: 2px solid rgba(255, 255, 255, 0.96);
            transform: translateX(-50%) rotate(45deg);
          }

          .search-mapbox-marker:hover .search-mapbox-pin,
          .search-mapbox-marker:focus-visible .search-mapbox-pin,
          .search-mapbox-marker.is-active .search-mapbox-pin {
            transform: translateY(-3px) scale(1.04);
            box-shadow: 0 0 0 5px rgba(215, 179, 90, 0.28);
          }

          .search-mapbox-marker.is-muted .search-mapbox-pin {
            background: #64748b;
            opacity: 0.86;
          }

          .search-mapbox-marker--university .search-mapbox-pin,
          .search-mapbox-marker--location .search-mapbox-pin {
            min-width: 42px;
            height: 42px;
            border-radius: 8px;
            background: linear-gradient(135deg, #0F8B6F, #12a685);
            font-size: 15px;
          }

          .search-mapbox-marker--university .search-mapbox-pin::after,
          .search-mapbox-marker--location .search-mapbox-pin::after {
            bottom: -7px;
          }

          .search-mapbox-campus-popup {
            min-width: 192px;
            padding: 12px 14px;
            background: white;
          }

          .search-mapbox-campus-popup p {
            margin: 0;
            color: #0f172a;
            font-size: 14px;
            font-weight: 800;
            line-height: 1.35;
          }

          .search-mapbox-campus-popup span {
            display: inline-flex;
            margin-top: 7px;
            color: #2563eb;
            font-size: 12px;
            font-weight: 800;
          }

          .search-mapbox-popup-card {
            width: 100%;
            overflow: hidden;
            background: white;
          }

          .search-mapbox-popup-image,
          .search-mapbox-popup-empty {
            display: flex;
            width: 100%;
            height: 78px;
            align-items: center;
            justify-content: center;
            object-fit: cover;
            background: #f1f5f9;
            color: #64748b;
            font-size: 13px;
            font-weight: 700;
          }

          .search-mapbox-popup-body {
            padding: 8px 10px 10px;
          }

          .search-mapbox-popup-status {
            display: inline-flex;
            margin-bottom: 6px;
            border-radius: 6px;
            background: #f1f5f9;
            color: #475569;
            padding: 3px 7px;
            font-size: 10px;
            font-weight: 800;
          }

          .search-mapbox-popup-status.is-close {
            background: #ecfdf5;
            color: #047857;
          }

          .search-mapbox-popup-body h3 {
            margin: 0 0 4px;
            color: #0f172a;
            font-size: 13px;
            font-weight: 800;
            line-height: 1.28;
          }

          .search-mapbox-popup-price {
            margin: 0 0 7px;
            color: #1d4ed8;
            font-size: 12px;
            font-weight: 800;
          }

          .search-mapbox-popup-meta {
            display: flex;
            flex-wrap: wrap;
            gap: 4px;
            margin-bottom: 8px;
          }

          .search-mapbox-popup-meta span {
            border: 1px solid #e2e8f0;
            border-radius: 5px;
            color: #475569;
            font-size: 10px;
            font-weight: 700;
            padding: 3px 6px;
          }

          .search-mapbox-popup-link {
            display: flex;
            min-height: 30px;
            align-items: center;
            justify-content: center;
            border-radius: 7px;
            background: linear-gradient(135deg, #08345D, #0D5792);
            color: white;
            font-size: 12px;
            font-weight: 800;
            text-decoration: none;
          }
        `}</style>

        <div className="search-mapbox-shell relative h-full w-full">
          {!mapReady && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/72 backdrop-blur-sm">
              <MapInlineLoader />
            </div>
          )}

          <div ref={mapContainerRef} className="h-full min-h-[500px] w-full" />
        </div>
      </>
    );
  }
);

SearchMapboxMap.displayName = "SearchMapboxMap";
export default SearchMapboxMap;
