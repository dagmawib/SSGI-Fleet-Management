"use client";
import { useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import "leaflet/dist/leaflet.css";

const L = dynamic(() => import("leaflet"), { ssr: false });

export default function MapComponent() {
    const mapRef = useRef(null);
    const mapInitialized = useRef(false);

    useEffect(() => {
        if (mapInitialized.current) return;

        const initializeMap = async () => {
            try {
                if (typeof window === "undefined") return;

                const mapContainer = document.getElementById("map");
                if (!mapContainer) return;

                const leaflet = await import("leaflet");

                // Check if map already exists
                if (mapRef.current) {
                    mapRef.current.remove();
                }

                // Initialize the map
                mapRef.current = leaflet.map("map").setView([9.005401, 38.763611], 13);

                // Add tile layer
                leaflet
                    .tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
                        attribution:
                            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
                    })
                    .addTo(mapRef.current);

                // Add marker
                leaflet
                    .marker([9.005401, 38.763611], { draggable: false })
                    .addTo(mapRef.current)
                    .bindPopup("A pretty CSS popup.<br> Easily customizable.")
                    .openPopup();

                mapInitialized.current = true;
            } catch (error) {
                console.error("Error initializing map:", error);
            }
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

    return (
        <div
            id="map"
            className="relative z-0 w-full sm:w-1/2 h-64 sm:h-[690px] border border-gray-300 rounded-lg"
        ></div>
    );
} 