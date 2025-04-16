"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";

export default function AddCarForm() {
    const t = useTranslations("car");
  const [formData, setFormData] = useState({
    licensePlate: "",
    make: "",
    model: "",
    year: "",
    color: "",
    type: "",
    capacity: "",
    currentMileage: "",
    lastMaintenance: "",
    nextMaintenanceMileage: "",
    fuelType: "",
    fuelEfficiency: "",
    status: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Car submitted:", formData);
    // Send formData to API here
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
            name="licensePlate"
            value={formData.licensePlate}
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
            name="currentMileage"
            value={formData.currentMileage}
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
            name="lastMaintenance"
            value={formData.lastMaintenance}
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
            name="nextMaintenanceMileage"
            value={formData.nextMaintenanceMileage}
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
            name="fuelType"
            value={formData.fuelType}
            onChange={handleChange}
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md text-[#043755]"
          >
            <option value="">Select</option>
            <option value="Gasoline">
                {t("fuelOptions.gasoline")}
            </option>
            <option value="Diesel">
                {t("fuelOptions.diesel")}
            </option>
            <option value="Electric">
                {t("fuelOptions.electric")}
            </option>
            <option value="Hybrid">
                {t("fuelOptions.hybrid")}
            </option>
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
            name="fuelEfficiency"
            value={formData.fuelEfficiency}
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
            <option value="Available">
                {t("statusOptions.available")}
            </option>
            <option value="In Maintenance">
                {t("statusOptions.inMaintenance")}
            </option>
            <option value="Out of Service"> 
                {t("statusOptions.outOfService")}
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
