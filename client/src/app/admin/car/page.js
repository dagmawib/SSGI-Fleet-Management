"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";

export default function AddCarForm() {
  const t = useTranslations("car");
  const [formData, setFormData] = useState({
    license_plate: "",
    make: "",
    model: "",
    year: "",
    color: "",
    type: "",
    capacity: "",
    current_mileage: "",
    last_service_date: "",
    next_service_mileage: "",
    fuel_type: "",
    fuel_efficiency: "",
    status: "",
    department: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    try {
      const res = await fetch("/api/add_vehicle", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });
  
      const data = await res.json();
  
      if (!res.ok) {
        console.error("Error:", data.error);
        alert("Error: " + data.error);
      } else {
        console.log("Success:", data);
        alert("Vehicle added successfully!");
        // Optionally reset the form
        setFormData({
          license_plate: "",
          make: "",
          model: "",
          year: "",
          color: "",
          type: "",
          capacity: "",
          current_mileage: "",
          last_service_date: "",
          next_service_mileage: "",
          fuel_type: "",
          fuel_efficiency: "",
          status: "",
          department: "",
        });
      }
    } catch (error) {
      console.error("Submission failed:", error);
      alert("Something went wrong!");
    }
  };
  

  return (
    <div className="max-w-7xl xxl:max-w-[1600px] w-full mx-auto mt-10 p-6 bg-white shadow-lg rounded-lg">
      <h2 className="text-2xl font-bold mb-6 text-center text-[#043755]">
        {t("title")}
      </h2>
      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
      >
        {/* License Plate */}
        <div>
          <label className="block text-sm font-medium text-[#043755]">
            {t("licensePlate")}
          </label>
          <input
            type="text"
            name="license_plate"
            value={formData.license_plate}
            onChange={handleChange}
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md text-[#043755]"
            required
          />
        </div>

        {/* Make */}
        <div>
          <label className="block text-sm font-medium text-[#043755]">
            {t("make")}
          </label>
          <input
            type="text"
            name="make"
            value={formData.make}
            onChange={handleChange}
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md text-[#043755]"
            required
          />
        </div>

        {/* Model */}
        <div>
          <label className="block text-sm font-medium text-[#043755]">
            {t("model")}
          </label>
          <input
            type="text"
            name="model"
            value={formData.model}
            onChange={handleChange}
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md text-[#043755]"
            required
          />
        </div>

        {/* Year */}
        <div>
          <label className="block text-sm font-medium text-[#043755]">
            {t("year")}
          </label>
          <input
            type="number"
            name="year"
            value={formData.year}
            onChange={handleChange}
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md text-[#043755]"
            required
          />
        </div>

        {/* Color */}
        <div>
          <label className="block text-sm font-medium text-[#043755]">
            {t("color")}
          </label>
          <input
            type="text"
            name="color"
            value={formData.color}
            onChange={handleChange}
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md text-[#043755]"
          />
        </div>

        {/* Type */}
        <div>
          <label className="block text-sm font-medium text-[#043755]">
            {t("type")}
          </label>
          <input
            type="text"
            name="type"
            value={formData.type}
            onChange={handleChange}
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md text-[#043755]"
          />
        </div>

        {/* Capacity */}
        <div>
          <label className="block text-sm font-medium text-[#043755]">
            {t("capacity")}
          </label>
          <input
            type="number"
            name="capacity"
            value={formData.capacity}
            onChange={handleChange}
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md text-[#043755]"
          />
        </div>

        {/* Current Mileage */}
        <div>
          <label className="block text-sm font-medium text-[#043755]">
            {t("currentMileage")}
          </label>
          <input
            type="number"
            name="current_mileage"
            value={formData.current_mileage}
            onChange={handleChange}
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md text-[#043755]"
          />
        </div>

        {/* Last Maintenance */}
        <div>
          <label className="block text-sm font-medium text-[#043755]">
            {t("lastMaintenance")}
          </label>
          <input
            type="date"
            name="last_service_date"
            value={formData.last_service_date}
            onChange={handleChange}
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md text-[#043755]"
          />
        </div>

        {/* Next Maintenance Mileage */}
        <div>
          <label className="block text-sm font-medium text-[#043755]">
            {t("nextMaintenanceMileage")}
          </label>
          <input
            type="number"
            name="next_service_mileage"
            value={formData.next_service_mileage}
            onChange={handleChange}
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md text-[#043755]"
          />
        </div>

        {/* Fuel Type */}
        <div>
          <label className="block text-sm font-medium text-[#043755]">
            {t("fuelType")}
          </label>
          <select
            name="fuel_type"
            value={formData.fuel_type}
            onChange={handleChange}
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md text-[#043755]"
          >
            <option value="">Select</option>
            <option value="Gasoline">{t("fuelOptions.gasoline")}</option>
            <option value="Diesel">{t("fuelOptions.diesel")}</option>
            <option value="Electric">{t("fuelOptions.electric")}</option>
            <option value="Hybrid">{t("fuelOptions.hybrid")}</option>
          </select>
        </div>

        {/* Fuel Efficiency */}
        <div>
          <label className="block text-sm font-medium text-[#043755]">
            {t("fuelEfficiency")}
          </label>
          <input
            type="number"
            step="0.1"
            name="fuel_efficiency"
            value={formData.fuel_efficiency}
            onChange={handleChange}
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md text-[#043755]"
          />
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-[#043755]">
            {t("status")}
          </label>
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md text-[#043755]"
          >
            <option value="">Select</option>
            <option value="Available">{t("statusOptions.available")}</option>
            <option value="In Maintenance">
              {t("statusOptions.inMaintenance")}
            </option>
            <option value="Out of Service">
              {t("statusOptions.outOfService")}
            </option>
          </select>
        </div>

         {/* Department */}
         <div>
          <label className="block text-sm font-medium text-[#043755]">
            {t("department")}
          </label>
          <select
            name="department"
            value={formData.department}
            onChange={handleChange}
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md text-[#043755]"
          >
            <option value="">Select</option>
            <option value="hr">HR</option>
            <option value="engineering">
              Engineering
            </option>
            <option value="finance">
              Finance
            </option>
          </select>
        </div>

        {/* Submit Button */}
        <div className="md:col-span-2 text-end mt-4">
          <button
            type="submit"
            className="bg-[#043755] text-white px-6 py-2 rounded hover:bg-blue-700 transition"
          >
            {t("submitButton")}
          </button>
        </div>
      </form>
    </div>
  );
}
