"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import "react-toastify/dist/ReactToastify.css";
import CircularProgress from "@mui/material/CircularProgress";
import useSWR from "swr";
import CarEditModal from "./CarEditModal";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const fetcher = (url) => fetch(url).then((res) => res.json());

const statusColors = {
  available: "text-green-600 font-semibold text-xl",
  on_work: "text-blue-600 font-semibold text-xl",
  maintenance: "text-yellow-600 font-semibold text-xl",
  out_of_service: "text-red-600 font-semibold text-xl",
};

const capitalizeFirstLetters = (str) => {
  if (!str) return "";
  return str
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};

export default function CarsTable() {
  const t = useTranslations("vehicleTable");
  const {
    data: cars = [],
    isLoading,
    error,
    mutate,
  } = useSWR("/api/get_vehicles", fetcher);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMake, setSelectedMake] = useState("");
  const [clearLoading, setClearLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCar, setSelectedCar] = useState(null);
  const [modalLoading, setModalLoading] = useState(null);

  const handleRowClick = (car) => {
    setSelectedCar(car);
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setSelectedCar(null);
  };

  const handleEdit = async (updatedCar) => {
    setModalLoading("edit");
    try {
      const updatedFields = {};

      for (const key in updatedCar) {
        if (
          updatedCar.hasOwnProperty(key) &&
          updatedCar[key] !== selectedCar[key]
        ) {
          updatedFields[key] = updatedCar[key];
        }
      }

      if (Object.keys(updatedFields).length === 0) {
        toast.info("No changes detected.");
        setModalLoading(false);
        return;
      }

      const res = await fetch("/api/update_vehicle", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedCar.id,
          ...updatedFields,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        console.error("Error:", errorData.error);
        throw new Error(errorData.error || "Failed to update vehicle");
      }

      toast.success("Vehicle updated successfully");
      setModalOpen(false);
      await mutate(); 
    } catch (err) {
      toast.error(err.message || "Failed to update vehicle");
    } finally {
      setModalLoading(false);
    }
  };

  const handleDelete = async (carId) => {
    setModalLoading("delete");
    try {
      const res = await fetch("/api/delete_vehicle", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vehicle_id: carId }),
      });
      if (!res.ok) throw new Error("Failed to delete vehicle");
      toast.success("Vehicle deleted successfully");
      await mutate(); 
    } catch (err) {
      toast.error(err.message || "Failed to delete vehicle");
    } finally {
      setModalLoading(false);
      setModalOpen(false);
    }
  };

  const resetFilters = async () => {
    setClearLoading(true);
    try {
      setSearchTerm("");
      setSelectedMake("");
      setCurrentPage(1); 
    } finally {
      setClearLoading(false);
    }
  };

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
          .replace(/_/g, " ") 
          .replace(/\b\w/g, (c) => c.toUpperCase()); 
    }
  };

  const uniqueMakes = [...new Set(cars.map((car) => car.make))].sort();

  const filteredCars = cars.filter((car) => {
    const matchesSearch = Object.values(car).some((value) =>
      String(value).toLowerCase().includes(searchTerm.toLowerCase())
    );
    const matchesMake = !selectedMake || car.make === selectedMake;
    return matchesSearch && matchesMake;
  });

  const totalPages = Math.ceil(filteredCars.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentCars = filteredCars.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#043755]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4 p-4 md:px-0 md:w-3/5">
        <div className="flex-1">
          <input
            type="text"
            placeholder={t("searchPlaceholder")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-[#043755] px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#043755]"
          />
        </div>
        <div className="flex gap-2 w-full md:w-1/2">
          <select
            value={selectedMake}
            onChange={(e) => setSelectedMake(e.target.value)}
            className="w-full text-[#043755] px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#043755]"
          >
            <option value="">{t("make")}</option>
            {uniqueMakes.map((make) => (
              <option key={make} value={make}>
                {make}
              </option>
            ))}
          </select>
          <button
            onClick={resetFilters}
            disabled={clearLoading}
            className="px-4 py-2 bg-[#043755] text-white rounded-lg hover:bg-[#032b42] transition-colors flex items-center justify-center min-w-[100px]"
          >
            {clearLoading ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              t("clear")
            )}
          </button>
        </div>
      </div>

      <div className="overflow-auto bg-white rounded-lg mx-2 md:mx-0">
        <table className="min-w-full table-auto text-sm">
          <thead className="bg-[#043755] text-white">
            <tr>
              <th className="px-4 py-2 text-left w-12">#</th>
              <th className="px-4 py-2 text-left">{t("licensePlate")}</th>
              <th className="px-4 py-2 text-left">{t("make")}</th>
              <th className="px-4 py-2 text-left">{t("model")}</th>
              <th className="px-4 py-2 text-left">{t("year")}</th>
              <th className="px-4 py-2 text-left">{t("category")}</th>
              <th className="px-4 py-2 text-left">{t("capacity")}</th>
              <th className="px-4 py-2 text-left">{t("currentMileage")}</th>
              <th className="px-4 py-2 text-left">{t("lastMaintenance")}</th>
              <th className="px-4 py-2 text-left">
                {t("nextMaintenanceMileage")}
              </th>
              <th className="px-4 py-2 text-left">{t("fuelType")}</th>
              <th className="px-4 py-2 text-left">{t("fuelEfficiency")}</th>
              <th className="px-4 py-2 text-left">{t("driver")}</th>
              <th className="px-4 py-2 text-left">{t("status")}</th>
            </tr>
          </thead>
          <tbody>
            {currentCars.map((car, index) => (
              <tr
                key={car.id}
                className="border-t hover:bg-gray-50 transition text-[#043755] cursor-pointer"
                onClick={() => handleRowClick(car)}
              >
                <td className="px-4 py-2">{startIndex + index + 1}</td>
                <td className="px-4 py-2">{car.license_plate}</td>
                <td className="px-4 py-2">
                  {capitalizeFirstLetters(car.make)}
                </td>
                <td className="px-4 py-2">
                  {capitalizeFirstLetters(car.model)}
                </td>
                <td className="px-4 py-2">{car.year}</td>
                <td className="px-4 py-2">
                  {capitalizeFirstLetters(car.category)}
                </td>
                <td className="px-4 py-2">{car.capacity}</td>
                <td className="px-4 py-2">{car.current_mileage}</td>
                <td className="px-4 py-2">{car.last_service_date}</td>
                <td className="px-4 py-2">{car.next_service_mileage}</td>
                <td className="px-4 py-2">
                  {capitalizeFirstLetters(t(`fuelTypes.${car.fuel_type}`))}
                </td>
                <td className="px-4 py-2">{car.fuel_efficiency}</td>
                <td className="px-4 py-2">
                  <span
                    className={`${
                      !car.assigned_driver?.first_name ? "text-gray-500" : ""
                    }`}
                  >
                    {capitalizeFirstLetters(car.assigned_driver?.first_name) ||
                      t("notAssigned")}
                  </span>
                </td>
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

      <CarEditModal
        open={modalOpen}
        onClose={handleModalClose}
        car={selectedCar}
        onEdit={handleEdit}
        onDelete={handleDelete}
        loading={modalLoading}
      />

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center mt-4 space-x-2">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1 || isLoading}
            className={`px-3 py-1 rounded flex items-center justify-center min-w-[100px] ${
              currentPage === 1 || isLoading
                ? "bg-gray-200 cursor-not-allowed"
                : "bg-[#043755] text-white hover:bg-blue-700"
            }`}
          >
            {isLoading ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              t("previous")
            )}
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => handlePageChange(page)}
              disabled={isLoading}
              className={`px-3 py-1 rounded flex items-center justify-center min-w-[32px] ${
                currentPage === page
                  ? "bg-[#043755] text-white"
                  : "bg-gray-200 hover:bg-gray-300"
              }`}
            >
              {isLoading ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                page
              )}
            </button>
          ))}

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages || isLoading}
            className={`px-3 py-1 rounded flex items-center justify-center min-w-[100px] ${
              currentPage === totalPages || isLoading
                ? "bg-gray-200 cursor-not-allowed"
                : "bg-[#043755] text-white hover:bg-blue-700"
            }`}
          >
            {isLoading ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              t("next")
            )}
          </button>
        </div>
      )}
    </div>
  );
}
