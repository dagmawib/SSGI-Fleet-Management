"use client";

import { useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import "leaflet/dist/leaflet.css";
import axios from "axios";
import polyline from "@mapbox/polyline";

const L = dynamic(() => import("leaflet"), { ssr: false });

export default function MapComponent({
  pickupCoords,
  destinationCoords,
  pickupLocation,
  destination,
}) {
  const mapRef = useRef(null);
  const mapInitialized = useRef(false);
  const polylineRef = useRef(null);
  const pickupMarkerRef = useRef(null);
  const destinationMarkerRef = useRef(null);
  const distanceControlRef = useRef(null);

  // Custom icons configuration
  const iconConfig = useRef({
    pickupIcon: null,
    destinationIcon: null,
  });

  useEffect(() => {
    const initializeMap = async () => {
      if (typeof window === "undefined") return;

      const leaflet = await import("leaflet");

      // Create custom icons
      iconConfig.current.pickupIcon = leaflet.icon({
        iconUrl: '/leaflet/pickup-icon.png',
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32],
      });

      iconConfig.current.destinationIcon = leaflet.icon({
        iconUrl: '/leaflet/destination-icon.png',
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32],
      });

      // Fix default marker icon paths
      delete leaflet.Icon.Default.prototype._getIconUrl;
      leaflet.Icon.Default.mergeOptions({
        iconRetinaUrl: "/leaflet/marker-icon-2x.png",
        iconUrl: "/leaflet/marker-icon.png",
        shadowUrl: "/leaflet/marker-shadow.png",
      });

      const container = document.getElementById("map");
      if (!container) {
        console.error("Map container not found");
        return;
      }

      // Remove previous map instance
      if (mapRef.current) {
        mapRef.current.remove();
      }

      mapRef.current = leaflet.map("map").setView([9.005401, 38.763611], 13);

      leaflet
        .tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution:
            '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        })
        .addTo(mapRef.current);

      mapInitialized.current = true;
    };

    initializeMap();

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        mapInitialized.current = false;
      }
    };
  }, []);

  useEffect(() => {
    const abortController = new AbortController();
    
    const debounceTimer = setTimeout(async () => {
      if (!mapRef.current || !mapInitialized.current) return;
  
      const leaflet = await import("leaflet");
  
      try {
        // Cleanup previous elements - IMPORTANT FIX HERE
        if (distanceControlRef.current) {
          mapRef.current.removeControl(distanceControlRef.current);
          distanceControlRef.current = null;
        }
        
        if (polylineRef.current) {
          mapRef.current.removeLayer(polylineRef.current);
          polylineRef.current = null;
        }
        
        if (pickupMarkerRef.current) {
          mapRef.current.removeLayer(pickupMarkerRef.current);
          pickupMarkerRef.current = null;
        }
        
        if (destinationMarkerRef.current) {
          mapRef.current.removeLayer(destinationMarkerRef.current);
          destinationMarkerRef.current = null;
        }
  
        // Add pickup marker with custom icon
        if (pickupCoords) {
          pickupMarkerRef.current = leaflet
            .marker([pickupCoords.lat, pickupCoords.lng], {
              icon: iconConfig.current.pickupIcon
            })
            .addTo(mapRef.current)
            .bindPopup("Pickup Location")
            .bindTooltip(pickupLocation || "Pickup", {
              direction: "top",
              offset: [0, -30],
              className: "custom-tooltip pickup-tooltip",
            });
        }
  
        // Add destination marker with custom icon
        if (destinationCoords) {
          destinationMarkerRef.current = leaflet
            .marker([destinationCoords.lat, destinationCoords.lng], {
              icon: iconConfig.current.destinationIcon
            })
            .addTo(mapRef.current)
            .bindPopup("Destination Location")
            .bindTooltip(destination || "Destination", {
              direction: "top",
              offset: [0, -30],
              className: "custom-tooltip destination-tooltip",
            });
        }
  
        // Draw route if both exist
        if (pickupCoords && destinationCoords) {
          const res = await axios.get(
            `https://router.project-osrm.org/route/v1/driving/${pickupCoords.lng},${pickupCoords.lat};${destinationCoords.lng},${destinationCoords.lat}`,
            {
              params: {
                overview: "full",
                geometries: "polyline",
              },
              signal: abortController.signal,
            }
          );
  
          // Verify coordinates haven't changed during request
          if (!pickupCoords || !destinationCoords) return;
  
          const route = res.data.routes[0];
          const distance = (route.distance / 1000).toFixed(2);
          const coords = polyline.decode(route.geometry).map(([lat, lng]) => [lat, lng]);
  
          polylineRef.current = leaflet
            .polyline(coords, { color: "#3b82f6", weight: 4, opacity: 0.8 })
            .addTo(mapRef.current);
  
          // Add distance control - ensure only one exists
          if (distanceControlRef.current) {
            mapRef.current.removeControl(distanceControlRef.current);
          }
          
          const DistanceControl = leaflet.Control.extend({
            options: { position: "topright" },
            onAdd: () => {
              const div = leaflet.DomUtil.create("div", "leaflet-control-distance");
              div.innerHTML = `
                <div style="
                  background: #043755;
                  color: white;
                  padding: 6px 10px;
                  border-radius: 4px;
                  font-size: 14px;
                  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                ">
                  Distance: ${distance} km
                </div>
              `;
              return div;
            },
          });
  
          distanceControlRef.current = new DistanceControl().addTo(mapRef.current);
  
          // Fit bounds to include both markers and route
          const group = leaflet.featureGroup([
            ...(pickupMarkerRef.current ? [pickupMarkerRef.current] : []),
            ...(destinationMarkerRef.current ? [destinationMarkerRef.current] : []),
            polylineRef.current,
          ]);
          mapRef.current.fitBounds(group.getBounds(), { padding: [50, 50] });
        } else {
          // Center to the visible marker(s)
          const markers = [];
          if (pickupMarkerRef.current) markers.push(pickupMarkerRef.current);
          if (destinationMarkerRef.current) markers.push(destinationMarkerRef.current);
          
          if (markers.length > 0) {
            const group = leaflet.featureGroup(markers);
            mapRef.current.fitBounds(group.getBounds(), { padding: [50, 50], maxZoom: 13 });
          }
        }
      } catch (error) {
        if (axios.isCancel(error)) {
          // Request was canceled - expected behavior
        } else if (error.response?.status === 429) {
          console.warn("Rate limit exceeded - please try again later");
        } else {
          console.error("Route fetch failed:", error);
        }
      }
    }, 300); // 300ms debounce delay
  
    return () => {
      abortController.abort();
      clearTimeout(debounceTimer);
    };
  }, [pickupCoords, destinationCoords, pickupLocation, destination]);

  return (
    <>
      <style jsx global>{`
        .custom-tooltip {
          background: #043755;
          color: white;
          border: none;
          border-radius: 4px;
          padding: 4px 8px;
          font-size: 12px;
          font-weight: 500;
        }
        .pickup-tooltip {
          background: #10b981; /* Green for pickup */
        }
        .destination-tooltip {
          background: #ef4444; /* Red for destination */
        }
        .custom-tooltip:before {
          border-top-color: inherit !important;
        }
        .leaflet-control-distance div {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
        }
      `}</style>
      <div
        id="map"
        className="relative z-0 w-full sm:w-1/2 h-64 sm:h-[690px] border border-gray-300 rounded-lg"
      ></div>
    </>
  );
}