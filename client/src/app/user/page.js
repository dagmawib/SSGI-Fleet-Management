"use client";
import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import "leaflet/dist/leaflet.css";
import DirectorDashboard from "@/components/user/director";
import { useTranslations } from "next-intl";
// Dynamically import Leaflet only on the client side
const L = dynamic(() => import("leaflet"), { ssr: false });

// Zod validation schema
const formSchema = z.object({
  pickupLocation: z.string().min(1, "Pickup Location is required"),
  destination: z.string().min(1, "Destination is required"),
  duration: z.string().min(1, "Duration is required"),
  passengers: z.string().min(1, "Passenger names are required"),
  reason: z.string().min(1, "Reason is required"),
  urgency: z.string().min(1, "Urgency Level is required"),
});

export default function Page() {
  const mapRef = useRef(null); // Store map instance
  const [isDirector, setIsDirector] = useState(true); // State to check if user is a director
  const t = useTranslations("vehicleRequest"); // i18n translations

  const sampleRequests = [
    {
      id: 1,
      pickupLocation: "Addis Ababa University",
      destination: "Bole International Airport",
      duration: "45 minutes",
      passengers: "John Doe, Jane Smith",
      reason: "Official government meeting",
      urgency: "Priority",
    },
    {
      id: 2,
      pickupLocation: "Megenagna",
      destination: "Sarbet",
      duration: "30 minutes",
      passengers: "Alex Johnson",
      reason: "Site inspection",
      urgency: "Regular",
    },
  ];

  const handleApprove = (id) => {
    console.log("Approved request:", id);
  };

  const handleReject = (id) => {
    console.log("Rejected request:", id);
  };

  useEffect(() => {
    const initializeMap = async () => {
      if (typeof window !== "undefined" && document.getElementById("map")) {
        const leaflet = await import("leaflet"); // Import inside useEffect

        // Prevent duplicate map initialization
        if (mapRef.current) return;

        // Initialize the map and store it in the ref
        mapRef.current = leaflet.map("map").setView([9.005401, 38.763611], 13);

        // Add OpenStreetMap tiles
        leaflet
          .tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution:
              '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          })
          .addTo(mapRef.current);

        // Add a marker
        leaflet
          .marker([9.005401, 38.763611], { draggable: false })
          .addTo(mapRef.current)
          .bindPopup("A pretty CSS popup.<br> Easily customizable.")
          .openPopup();
      }
    };

    initializeMap();

    return () => {
      if (mapRef.current) {
        mapRef.current.remove(); // Cleanup to prevent duplicate maps
        mapRef.current = null;
      }
    };
  }, []); // Run only once

  // Form handling with react-hook-form
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      passengers: [{ name: "" }, { name: "" }, { name: "" }, { name: "" }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "passengers",
  });

  const onSubmit = (data) => {
    console.log("Form Data:", data);
    alert("Request submitted successfully!");
  };

  return (
    <div className="max-w-7xl xxl:max-w-[1600px] w-full py-4 mx-auto">
      {/* Director Check */}
      {isDirector && (
        <DirectorDashboard
          isDirector={isDirector}
          requests={sampleRequests}
          handleApprove={handleApprove}
          handleReject={handleReject}
        />
      )}
      <div className="justify-between flex flex-col sm:flex-row bg-white px-4 md:px-0 space-y-6 sm:space-y-0 sm:space-x-8">
        {/* Form Section */}
        <div className="w-full sm:w-1/2 px-6 py-2 ring-1 ring-[#043755] rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold text-[#043755] mb-2 text-center">
            {t("title")}
          </h2>
          <p className="text-[#043755] text-center mb-2">{t("description")}</p>
          <form onSubmit={handleSubmit(onSubmit)}>
            {/* Pickup Location */}
            <div className="mb-2">
              <label className="block text-[#043755] mb-2">
                {t("pickupLocation")}
                <span className="text-red-500">*</span>
              </label>
              <input
                {...register("pickupLocation")}
                type="text"
                className="w-full px-4 py-2 border rounded-lg text-[#043755] focus:ring-2 focus:ring-[#043755]"
                placeholder="Enter pickup location"
              />
              {errors.pickupLocation && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.pickupLocation.message}
                </p>
              )}
            </div>

            {/* Destination */}
            <div className="mb-2">
              <label className="block text-[#043755] mb-2">
                {t("dropoffLocation")}
                <span className="text-red-500">*</span>
              </label>
              <input
                {...register("destination")}
                type="text"
                className="w-full px-4 py-2 border rounded-lg text-[#043755] focus:ring-2 focus:ring-[#043755]"
                placeholder="Enter destination"
              />
              {errors.destination && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.destination.message}
                </p>
              )}
            </div>

            {/* Duration */}
            <div className="mb-2">
              <label className="block text-[#043755] mb-2">
                {t("Duration")}
                <span className="text-red-500">*</span>
              </label>
              <input
                {...register("duration")}
                type="text"
                className="w-full px-4 py-2 border rounded-lg text-[#043755] focus:ring-2 focus:ring-[#043755]"
                placeholder="Enter duration"
              />
              {errors.duration && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.duration.message}
                </p>
              )}
            </div>

            {/* Name of Passengers */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-[#043755] text-base font-medium">
                  {t("passangers")}
                  <span className="text-red-500">*</span>
                </label>

                <button
                  type="button"
                  onClick={() => append({ name: "" })}
                  className="w-8 h-8 rounded-full bg-[#043755] text-white flex items-center justify-center hover:bg-opacity-90"
                >
                  +
                </button>
              </div>

              <div className="space-y-2">
                {fields.map(
                  (field, index) =>
                    index % 2 === 0 && (
                      <div key={field.id} className="flex gap-2">
                        <input
                          {...register(`passengers.${index}.name`)}
                          type="text"
                          placeholder={`${t("passanger")} ${index + 1}`}
                          className="w-1/2 px-4 py-2 border rounded-lg text-[#043755] focus:ring-2 focus:ring-[#043755]"
                        />
                        {fields[index + 1] ? (
                          <input
                            {...register(`passengers.${index + 1}.name`)}
                            type="text"
                            placeholder={`${t("passanger")} ${index + 2}`}
                            className="w-1/2 px-4 py-2 border rounded-lg text-[#043755] focus:ring-2 focus:ring-[#043755]"
                          />
                        ) : (
                          <div className="w-1/2" />
                        )}
                      </div>
                    )
                )}
              </div>
              {errors.passengers && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.passengers.message}
                </p>
              )}
            </div>

            {/* Reason */}
            <div className="mb-2">
              <label className="block text-[#043755] mb-2">
                {t("Reason")}
                <span className="text-red-500">*</span>
              </label>
              <input
                {...register("reason")}
                type="text"
                className="w-full px-4 py-2 border rounded-lg text-[#043755] focus:ring-2"
                placeholder="Enter reason"
              />
              {errors.reason && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.reason.message}
                </p>
              )}
            </div>

            {/* Urgency Level */}
            <div className="mb-4">
              <label className="block text-[#043755] mb-2">
                {t("urgency")}
                <span className="text-red-500">*</span>
              </label>
              <select
                {...register("urgency")}
                className="w-full px-4 py-2 border rounded-lg text-[#043755] focus:ring-2"
              >
                <option value="">{t("selectUrgency")}</option>
                <option value="Regular">{t("regular")}</option>
                <option value="Priority">{t("priority")}</option>
                <option value="Emergency">{t("emergency")}</option>
              </select>
              {errors.urgency && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.urgency.message}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full bg-[#043755] text-white py-2 rounded-lg hover:bg-opacity-90 transition"
            >
              {t("submit")}
            </button>
          </form>
        </div>

        {/* Map Section */}
        <div
          id="map"
          className="relative z-0 w-full sm:w-1/2 h-64 sm:h-[690px] border border-gray-300 rounded-lg"
        ></div>
      </div>
    </div>
  );
}
