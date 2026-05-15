import React, { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// Set your Mapbox access token
mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

const ListingsMap = ({
    listings = [],
    initialCenter = [79.8612, 6.9271],
    initialZoom = 12
}) => {
    const mapContainerRef = useRef(null);
    const mapRef = useRef(null);
    const markersRef = useRef([]);
    const popupsRef = useRef([]);

    // Initialize map
    useEffect(() => {
        if (!mapContainerRef.current || mapRef.current) return;

        mapRef.current = new mapboxgl.Map({
            container: mapContainerRef.current,
            style: 'mapbox://styles/mapbox/streets-v11',
            center: initialCenter,
            zoom: initialZoom,
        });

        // Add navigation and scale controls
        mapRef.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
        mapRef.current.addControl(
            new mapboxgl.ScaleControl({ position: 'bottom-right' })
        );
        mapRef.current.addControl(
            new mapboxgl.GeolocateControl({
                positionOptions: { enableHighAccuracy: true },
            }),
            'bottom-right'
        );

        // Clean up on unmount
        return () => {
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
            }
        };
    }, []);

    // Add property markers
    useEffect(() => {
        if (!mapRef.current || !listings.length) return;

        // Wait for map to load before adding markers
        if (!mapRef.current.loaded()) {
            mapRef.current.on('load', () => {
                addPropertyMarkers();
            });
            return;
        }

        addPropertyMarkers();

        function addPropertyMarkers() {
            // Clean up previous markers
            markersRef.current.forEach(marker => marker.remove());
            markersRef.current = [];

            popupsRef.current.forEach(popup => popup.remove());
            popupsRef.current = [];

            console.log('Adding markers for', listings.length, 'properties');

            const validListings = listings.filter(listing =>
                listing.coordinates && listing.coordinates.latitude && listing.coordinates.longitude
            );

            if (validListings.length === 0) {
                console.warn('No valid coordinates found in listings');
                return;
            }

            // Add markers for each property
            validListings.forEach(listing => {
                try {
                    // Create property marker element
                    const el = document.createElement('div');
                    el.className = 'property-marker';
                    el.innerHTML = `
             <div style="background-color: #FF5A5F; width: 32px; height: 32px; border-radius: 50%; 
                         border: 3px solid white; display: flex; align-items: center; justify-content: center;
                         box-shadow: 0 3px 6px rgba(0,0,0,0.5); z-index: 1;">
               <span style="color: white; font-weight: bold; font-size: 14px;">P</span>
             </div>
           `;

                    // Make marker element clickable
                    el.style.cursor = 'pointer';
                    el.addEventListener('click', () => {
                        window.location.href = `/listing/${listing._id}`;
                    });

                    // Add marker to map
                    const marker = new mapboxgl.Marker({
                        element: el,
                    })
                        .setLngLat([listing.coordinates.longitude, listing.coordinates.latitude])
                        .addTo(mapRef.current);

                    markersRef.current.push(marker);

                    // Create popup with property info
                    const popup = new mapboxgl.Popup({
                        closeButton: true,
                        closeOnClick: false,
                        offset: 25,
                        maxWidth: '300px',
                    })
                        .setLngLat([listing.coordinates.longitude, listing.coordinates.latitude])
                        .setHTML(`
               <div style="width: 100%;">
                 ${listing.images && listing.images.length > 0 ?
                                `<img src="${listing.images[0]}" style="width: 100%; height: 120px; object-fit: cover; border-radius: 4px 4px 0 0;">` :
                                '<div style="width: 100%; height: 80px; background-color: #eee; display: flex; align-items: center; justify-content: center; border-radius: 4px 4px 0 0;">No image</div>'
                            }
                 <h3 style="margin: 8px 0 4px; font-size: 16px; font-weight: bold;">${listing.propertyName || listing.title || "Listing"}</h3>
                 <p style="margin: 0 0 8px; font-size: 14px;">LKR ${(listing.monthlyRent || listing.price).toLocaleString()}/month</p>
                 <a href="/listing/${listing._id}" style="display: block; text-align: center; background-color: #0F65D8; color: white; padding: 6px; border-radius: 4px; text-decoration: none; font-size: 14px;">View Details</a>
               </div>
             `);

                    // Show popup on marker hover
                    marker.getElement().addEventListener('mouseenter', () => {
                        popup.addTo(mapRef.current);
                        popupsRef.current.push(popup);
                    });

                    marker.getElement().addEventListener('mouseleave', () => {
                        setTimeout(() => {
                            if (!popup.getElement().matches(':hover')) {
                                popup.remove();
                                popupsRef.current = popupsRef.current.filter(p => p !== popup);
                            }
                        }, 300);
                    });
                } catch (error) {
                    console.error('Error adding property marker:', error, listing);
                }
            });

            // Fit bounds to include all markers
            if (validListings.length > 0) {
                try {
                    const bounds = new mapboxgl.LngLatBounds();

                    validListings.forEach(listing => {
                        bounds.extend([listing.coordinates.longitude, listing.coordinates.latitude]);
                    });

                    mapRef.current.fitBounds(bounds, {
                        padding: 70,
                        maxZoom: 15,
                    });
                } catch (error) {
                    console.error('Error fitting bounds:', error);
                }
            }
        }
    }, [listings]);

    return (
        <div
            ref={mapContainerRef}
            style={{ height: "100%", width: "100%", minHeight: "420px" }}
            className="rounded-lg border border-gray-300 w-full"
        />
    );
};

export default ListingsMap;