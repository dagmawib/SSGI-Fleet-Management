"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";

export default function AddCarForm() {
  const t = useTranslations("car");
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [formData, setFormData] = useState({
    license_plate: "",
    make: "",
    model: "",
    year: "",
    color: "",
    capacity: "",
    current_mileage: "",
    last_service_date: "",
    next_service_mileage: "",
    fuel_type: "",
    fuel_efficiency: "",
    status: "",
    department: "",
  });

  const [dateError, setDateError] = useState("");
  const [licensePlateError, setLicensePlateError] = useState("");

  const validateLicensePlate = (plate) => {
    // Remove any spaces and convert to uppercase
    const cleanPlate = plate.replace(/\s/g, '').toUpperCase();
    
    // Check if the plate matches the pattern: 0-1 letter followed by 5 digits
    const platePattern = /^[A-Z]{0,1}\d{5}$/;
    
    if (!platePattern.test(cleanPlate)) {
      setLicensePlateError(t("licensePlateValidationError"));
      return false;
    }
    
    setLicensePlateError("");
    return true;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === "last_service_date") {
      const selectedDate = new Date(value);
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      if (selectedDate > yesterday) {
        setDateError(t("dateValidationError"));
        return;
      } else {
        setDateError("");
      }
    }

    if (name === "license_plate") {
      validateLicensePlate(value);
    }
    
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate license plate before submission
    if (!validateLicensePlate(formData.license_plate)) {
      return;
    }

    // Validate last service date before submission
    if (formData.last_service_date) {
      const selectedDate = new Date(formData.last_service_date);
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      if (selectedDate > yesterday) {
        setDateError(t("dateValidationError"));
        return;
      }
    }

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
      } else {
        setSuccessMessage("Vehicle added successfully!");
        // Optionally reset the form
        setFormData({
          license_plate: "",
          make: "",
          model: "",
          year: "",
          color: "",
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
      setErrorMessage("Something went wrong!");
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
        {successMessage && (
          <div className="col-span-2 text-green-500 text-center">
            {successMessage}
          </div>
        )}
        {errorMessage && (
          <div className="col-span-2 text-red-500 text-center">
            {errorMessage}
          </div>
        )}
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
            className={`mt-1 block w-full p-2 border rounded-md text-[#043755] ${
              licensePlateError ? "border-red-500" : "border-gray-300"
            }`}
            required
          />
          {licensePlateError && (
            <p className="mt-1 text-sm text-red-500">{licensePlateError}</p>
          )}
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
            max={new Date(new Date().setDate(new Date().getDate() - 1)).toISOString().split('T')[0]}
            className={`mt-1 block w-full p-2 border rounded-md text-[#043755] ${
              dateError ? "border-red-500" : "border-gray-300"
            }`}
          />
          {dateError && (
            <p className="mt-1 text-sm text-red-500">{dateError}</p>
          )}
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
            <option value="petrol">{t("fuelOptions.Petrol")}</option>
            <option value="diesel">{t("fuelOptions.diesel")}</option>
            <option value="electric">{t("fuelOptions.electric")}</option>
            <option value="hybrid">{t("fuelOptions.hybrid")}</option>
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
            <option value="available">{t("statusOptions.available")}</option>
            <option value="maintenance">
              {t("statusOptions.inMaintenance")}
            </option>
            <option value="out_of_service">
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
            <option value="engineering">Engineering</option>
            <option value="finance">Finance</option>
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
