import React, {
  useEffect,
  useRef,
  forwardRef,
  useImperativeHandle,
} from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

// Set your Mapbox access token
mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

const MapboxMap = forwardRef(
  (
    {
      initialCenter = [79.8612, 6.9271], // Note: Mapbox uses [lng, lat] order
      initialZoom = 13,
      onLocationSelect,
      markers = {},
      distance = null,
      disabled = false, // Add disabled prop with default value
    },
    ref
  ) => {
    const mapContainerRef = useRef(null);
    const mapRef = useRef(null);
    const markersRef = useRef({
      university: null,
      property: null,
    });
    const routeRef = useRef(null);
    const distanceMarkerRef = useRef(null);
    const clickHandlerRef = useRef(null);
    const mapInitializedRef = useRef(false);

    // Expose map methods to parent component
    useImperativeHandle(ref, () => ({
      panTo: (coords) => {
        if (mapRef.current) {
          mapRef.current.flyTo({
            center: [coords.longitude, coords.latitude],
            zoom: 14,
            essential: true,
          });
        }
      },
      getMap: () => mapRef.current,
      showRoute: (routeGeometry) => {
        if (!mapRef.current || !mapRef.current.loaded()) return;

        // Clean up previous route
        if (routeRef.current) {
          if (mapRef.current.getLayer("route")) {
            mapRef.current.removeLayer("route");
          }
          if (mapRef.current.getSource("route")) {
            mapRef.current.removeSource("route");
          }
          routeRef.current = null;
        }

        // Add new route using the geometry from the Directions API
        if (mapRef.current.loaded()) {
          // If map already has the source, update it
          if (mapRef.current.getSource("route")) {
            mapRef.current.getSource("route").setData({
              type: "Feature",
              properties: {},
              geometry: routeGeometry,
            });
          } else {
            // Add new source and layer
            mapRef.current.addSource("route", {
              type: "geojson",
              data: {
                type: "Feature",
                properties: {},
                geometry: routeGeometry,
              },
            });

            mapRef.current.addLayer({
              id: "route",
              type: "line",
              source: "route",
              layout: {
                "line-join": "round",
                "line-cap": "round",
              },
              paint: {
                "line-color": "#4A90E2",
                "line-width": 4,
                "line-opacity": 0.8,
              },
            });
          }

          routeRef.current = true;
        }
      },
    }));

    // Initialize map with extra controls
    useEffect(() => {
      if (!mapContainerRef.current || mapRef.current) return;

      mapRef.current = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: "mapbox://styles/mapbox/streets-v11",
        center: initialCenter,
        zoom: initialZoom,
      });

      // Add navigation, scale, and geolocate controls
      mapRef.current.addControl(new mapboxgl.NavigationControl(), "top-right");
      mapRef.current.addControl(
        new mapboxgl.ScaleControl({ position: "bottom-right" })
      );
      mapRef.current.addControl(
        new mapboxgl.GeolocateControl({
          positionOptions: { enableHighAccuracy: true },
        }),
        "bottom-right"
      );

      // Wait for the map to load before adding event listeners
      mapRef.current.on('load', () => {
        mapInitializedRef.current = true;
        setupClickHandler();
      });

      // Clean up on unmount
      return () => {
        if (mapRef.current) {
          mapRef.current.remove();
          mapRef.current = null;
        }
      };
    }, []);

    // Setup click handler function
    const setupClickHandler = () => {
      if (!mapRef.current || !mapInitializedRef.current) return;
      
      // Remove any existing click handler
      if (clickHandlerRef.current) {
        mapRef.current.off('click', clickHandlerRef.current);
        clickHandlerRef.current = null;
      }

      // Only add click handler if not disabled and we have an onLocationSelect function
      if (!disabled && onLocationSelect) {
        clickHandlerRef.current = (e) => {
          onLocationSelect({
            latitude: e.lngLat.lat,
            longitude: e.lngLat.lng,
          });
        };
        
        mapRef.current.on("click", clickHandlerRef.current);
      }
      
      // Update cursor style
      if (mapRef.current.getCanvas()) {
        mapRef.current.getCanvas().style.cursor = disabled ? 'not-allowed' : 'pointer';
      }
    };

    // Re-setup click handler when disabled state changes
    useEffect(() => {
      setupClickHandler();
    }, [disabled, onLocationSelect]);

    // Handle university marker
    useEffect(() => {
      if (!mapRef.current || !mapRef.current.loaded()) return;

      // Clean up previous university marker
      if (markersRef.current.university) {
        markersRef.current.university.remove();
        markersRef.current.university = null;
      }

      // Add university marker if coordinates exist
      if (markers.university) {
        // Create custom university marker element
        const universityEl = document.createElement("div");
        universityEl.className = "university-marker";
        universityEl.innerHTML = `
        <div style="background-color: #4A90E2; width: 30px; height: 30px; border-radius: 50%; 
                    border: 2px solid white; display: flex; align-items: center; justify-content: center;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.3);">
          <span style="color: white; font-weight: bold; font-size: 14px;">U</span>
        </div>
      `;

        // Add marker to map
        markersRef.current.university = new mapboxgl.Marker({
          element: universityEl,
        })
          .setLngLat([
            markers.university.longitude,
            markers.university.latitude,
          ])
          .addTo(mapRef.current);

        // Add popup for university
        new mapboxgl.Popup({
          closeButton: false,
          closeOnClick: false,
          offset: 25,
          className: "university-popup",
        })
          .setLngLat([
            markers.university.longitude,
            markers.university.latitude,
          ])
          .setHTML('<p style="font-weight: bold; margin: 0;">University</p>')
          .addTo(mapRef.current);
      }
    }, [markers.university]);

    // Handle property marker
    useEffect(() => {
      if (!mapRef.current || !mapRef.current.loaded()) return;

      // Clean up previous property marker
      if (markersRef.current.property) {
        markersRef.current.property.remove();
        markersRef.current.property = null;
      }

      // Add property marker if coordinates exist
      if (markers.property) {
        // Create custom property marker element
        const propertyEl = document.createElement("div");
        propertyEl.className = "property-marker";
        propertyEl.innerHTML = `
        <div style="background-color: #FF5A5F; width: 30px; height: 30px; border-radius: 50%; 
                    border: 2px solid white; display: flex; align-items: center; justify-content: center;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.3);">
          <span style="color: white; font-weight: bold; font-size: 14px;">P</span>
        </div>
      `;

        // Add marker to map
        markersRef.current.property = new mapboxgl.Marker({
          element: propertyEl,
        })
          .setLngLat([markers.property.longitude, markers.property.latitude])
          .addTo(mapRef.current);

        // Add popup for property
        new mapboxgl.Popup({
          closeButton: false,
          closeOnClick: false,
          offset: 25,
          className: "property-popup",
        })
          .setLngLat([markers.property.longitude, markers.property.latitude])
          .setHTML('<p style="font-weight: bold; margin: 0;">Your Property</p>')
          .addTo(mapRef.current);
      }
    }, [markers.property]);

    // Draw route between university and property
    useEffect(() => {
      if (!mapRef.current || !mapRef.current.loaded()) return;

      // Clean up previous route if no distance is available (no route to show)
      if (!distance && routeRef.current) {
        if (mapRef.current.getLayer("route")) {
          mapRef.current.removeLayer("route");
        }
        if (mapRef.current.getSource("route")) {
          mapRef.current.removeSource("route");
        }
        routeRef.current = null;
      }

      // Clean up previous distance marker
      if (distanceMarkerRef.current) {
        distanceMarkerRef.current.remove();
        distanceMarkerRef.current = null;
      }

      // Only proceed if both markers exist and we have a distance value
      if (markers.university && markers.property && distance) {
        // If no route has been drawn by the showRoute method, draw a simple line
        if (!routeRef.current) {
          // Add a simple straight line (fallback if route geometry is not available)
          if (mapRef.current.loaded()) {
            // Add new source and layer
            mapRef.current.addSource("route", {
              type: "geojson",
              data: {
                type: "Feature",
                properties: {},
                geometry: {
                  type: "LineString",
                  coordinates: [
                    [markers.university.longitude, markers.university.latitude],
                    [markers.property.longitude, markers.property.latitude],
                  ],
                },
              },
            });

            mapRef.current.addLayer({
              id: "route",
              type: "line",
              source: "route",
              layout: {
                "line-join": "round",
                "line-cap": "round",
              },
              paint: {
                "line-color": "#4A90E2",
                "line-width": 3,
                "line-dasharray": [2, 2],
              },
            });

            routeRef.current = true;
          }
        }

        // Add distance marker regardless of route source
        // Calculate midpoint for distance marker
        const midpoint = [
          (markers.university.longitude + markers.property.longitude) / 2,
          (markers.university.latitude + markers.property.latitude) / 2,
        ];

        // Create distance marker element
        const distanceEl = document.createElement("div");
        distanceEl.className = "distance-marker";
        distanceEl.innerHTML = `
          <div style="background-color: white; padding: 5px 10px; border-radius: 20px; 
                      border: 2px solid #4A90E2; font-weight: bold; min-width: 80px; text-align: center;">
            ${distance} km
          </div>
        `;

        // Add distance marker
        distanceMarkerRef.current = new mapboxgl.Marker({
          element: distanceEl,
          anchor: "center",
        })
          .setLngLat(midpoint)
          .addTo(mapRef.current);

        // Fit bounds to include both markers
        const bounds = new mapboxgl.LngLatBounds()
          .extend([markers.university.longitude, markers.university.latitude])
          .extend([markers.property.longitude, markers.property.latitude]);

        mapRef.current.fitBounds(bounds, {
          padding: 100,
          maxZoom: 15,
        });
      }
    }, [markers.university, markers.property, distance]);

    return (
      <div
        ref={mapContainerRef}
        style={{ height: "100%", width: "100%", minHeight: "420px" }}
        className="rounded-lg border border-gray-300 md:h-[420px] w-full"
      />
    );
  }
);

MapboxMap.displayName = "MapboxMap";
export default MapboxMap;
