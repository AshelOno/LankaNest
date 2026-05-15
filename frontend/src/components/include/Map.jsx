import React, { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapInlineLoader } from "./LoadingSpinner";

const defaultCenter = [6.9271, 79.8612];

const Map = ({
  initialCenter = defaultCenter,
  initialZoom = 13,
  onLocationSelect,
  selectedLocations = [],
}) => {
  const mapRef = useRef(null);
  const mapContainerRef = useRef(null);
  const markersRef = useRef([]);
  const clickHandlerRef = useRef(null);
  const [isMapReady, setIsMapReady] = useState(false);

  const pinIcon = useMemo(
    () =>
      L.divIcon({
        className: "",
        html: `
          <div style="
            position: relative;
            width: 22px;
            height: 22px;
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            <div style="
              width: 22px;
              height: 22px;
              background: #2563eb;
              border: 3px solid white;
              border-radius: 9999px;
              box-shadow: 0 8px 18px rgba(37, 99, 235, 0.35);
              transform: translateY(-2px);
            "></div>
            <div style="
              position: absolute;
              bottom: -7px;
              width: 10px;
              height: 10px;
              background: #2563eb;
              transform: rotate(45deg);
              border-radius: 0 0 10px 0;
            "></div>
          </div>
        `,
        iconSize: [22, 30],
        iconAnchor: [11, 30],
      }),
    []
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!mapContainerRef.current || mapRef.current) return;

      const map = L.map(mapContainerRef.current, {
        zoomControl: true,
        scrollWheelZoom: true,
      }).setView(initialCenter, initialZoom);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "&copy; OpenStreetMap contributors",
      }).addTo(map);

      mapRef.current = map;
      setIsMapReady(true);

      setTimeout(() => {
        map.invalidateSize();
      }, 150);
    }, 50);

    return () => {
      clearTimeout(timer);

      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }

      markersRef.current = [];
      setIsMapReady(false);
    };
  }, [initialCenter, initialZoom]);

  useEffect(() => {
    if (!mapRef.current || !isMapReady) return;

    const map = mapRef.current;

    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    selectedLocations.forEach((location) => {
      const lat = Number(location?.latitude);
      const lng = Number(location?.longitude);

      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

      const marker = L.marker([lat, lng], { icon: pinIcon })
        .addTo(map)
        .bindPopup(
          `
          <div style="min-width:160px">
            <div style="font-weight:600; margin-bottom:4px;">
              ${location?.name || "Selected location"}
            </div>
            <div style="font-size:12px; color:#4b5563;">
              ${lat.toFixed(5)}, ${lng.toFixed(5)}
            </div>
          </div>
        `
        );

      markersRef.current.push(marker);
    });

    if (selectedLocations.length === 1) {
      const only = selectedLocations[0];
      const lat = Number(only?.latitude);
      const lng = Number(only?.longitude);
      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        map.flyTo([lat, lng], 15, { duration: 0.8 });
      }
    } else if (selectedLocations.length > 1) {
      const bounds = L.latLngBounds(
        selectedLocations
          .map((location) => [Number(location.latitude), Number(location.longitude)])
          .filter(([lat, lng]) => Number.isFinite(lat) && Number.isFinite(lng))
      );

      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [40, 40] });
      }
    }

    const handleMapClick = (e) => {
      onLocationSelect?.({
        latitude: e.latlng.lat,
        longitude: e.latlng.lng,
      });
    };

    map.on("click", handleMapClick);
    clickHandlerRef.current = handleMapClick;

    return () => {
      if (mapRef.current && clickHandlerRef.current) {
        mapRef.current.off("click", clickHandlerRef.current);
      }
    };
  }, [isMapReady, selectedLocations, onLocationSelect, pinIcon]);

  useEffect(() => {
    if (!mapRef.current || !isMapReady) return;
    setTimeout(() => {
      mapRef.current?.invalidateSize();
    }, 100);
  }, [isMapReady]);

  return (
    <div className="w-full">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Map</h3>
          <p className="text-xs text-gray-500">
            Click anywhere to select a location
          </p>
        </div>

        <div className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
          {selectedLocations.length} selected
        </div>
      </div>

      <div className="relative overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
        {!isMapReady && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/80 backdrop-blur-sm">
            <MapInlineLoader
              label="Preparing map"
              detail="Loading location tools and selected pins."
            />
          </div>
        )}

        <div
          ref={mapContainerRef}
          className="h-[420px] w-full md:h-[480px] lg:h-[520px]"
        />
      </div>
    </div>
  );
};

export default Map;
