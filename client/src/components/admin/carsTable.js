"use client";

import React, { useState, useEffect } from "react";
import { useTranslations } from "next-intl";

const statusColors = {
  available: "text-green-600 bg-green-100",
  on_work: "text-blue-600 bg-blue-100",
  maintenance: "text-yellow-600 bg-yellow-100",
  out_of_service: "text-red-600 bg-red-100",
};

export default function CarsTable() {
  const t = useTranslations("vehicleTable");
  const [cars, setCars] = useState([]);

  useEffect(() => {
    const fetchCars = async () => {
      try {
        const response = await fetch("/api/get_vehicles", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });
        if (!response.ok) {
          throw new Error("Failed to fetch cars");
        }
        const data = await response.json();
        setCars(data);
      } catch (error) {
        console.error("Error fetching cars:", error);
      }
    };

    fetchCars();
  }, []);

  const formatStatus = (status) => {
    switch (status) {
      case "available":
        return "Available";
      case "maintenance":
        return "In Maintenance";
      case "out_of_service":
        return "Out of Service";
      default:
        return status
          .replace(/_/g, " ") // Replace underscores with spaces
          .replace(/\b\w/g, (c) => c.toUpperCase()); // Capitalize each word
    }
  };

  return (
    <div className="overflow-auto bg-white rounded-lg shadow border mx-2 md:mx-0">
      <table className="min-w-full table-auto text-sm">
        <thead className="bg-[#043755] text-white">
          <tr>
            <th className="px-4 py-2 text-left">{t("licensePlate")}</th>
            <th className="px-4 py-2 text-left">{t("make")}</th>
            <th className="px-4 py-2 text-left">{t("model")}</th>
            <th className="px-4 py-2 text-left">{t("year")}</th>
            <th className="px-4 py-2 text-left">{t("color")}</th>
            <th className="px-4 py-2 text-left">{t("capacity")}</th>
            <th className="px-4 py-2 text-left">{t("currentMileage")}</th>
            <th className="px-4 py-2 text-left">{t("lastMaintenance")}</th>
            <th className="px-4 py-2 text-left">
              {t("nextMaintenanceMileage")}
            </th>
            <th className="px-4 py-2 text-left">{t("fuelType")}</th>
            <th className="px-4 py-2 text-left">{t("fuelEfficiency")}</th>
            <th className="px-4 py-2 text-left">{t("status")}</th>
          </tr>
        </thead>
        <tbody>
          {cars.map((car) => (
            <tr
              key={car.id}
              className="border-t hover:bg-gray-50 transition text-[#043755]"
            >
              <td className="px-4 py-2">{car.license_plate}</td>
              <td className="px-4 py-2">{car.make}</td>
              <td className="px-4 py-2">{car.model}</td>
              <td className="px-4 py-2">{car.year}</td>
              <td className="px-4 py-2">{car.color}</td>
              <td className="px-4 py-2">{car.capacity}</td>
              <td className="px-4 py-2">{car.current_mileage}</td>
              <td className="px-4 py-2">{car.last_service_date}</td>
              <td className="px-4 py-2">{car.next_service_mileage}</td>
              <td className="px-4 py-2">{t(`fuelTypes.${car.fuel_type}`)}</td>
              <td className="px-4 py-2">{car.fuel_efficiency}</td>
              <td className="px-4 py-2">
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    statusColors[car.status] || "bg-gray-100 text-gray-600"
                  }`}
                >
                  {t(`statuses.${car.status}`)}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
