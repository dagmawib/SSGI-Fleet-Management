"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

export default function Page() {
  const t = useTranslations("register"); // For localization
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    phoneNumber: "",
    departmentId: "",
    role: "",
  });

  const departments = [
    { id: 1, name: "Finance" },
    { id: 2, name: "HR" },
    { id: 3, name: "Engineering" },
    // Add more or fetch from backend
  ];

  const roles = ["employee", "driver", "admin", "director"];

  const generateTempPassword = () => {
    const tempPassword = Math.random().toString(36).slice(-10);
    setFormData({ ...formData, password: tempPassword });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Connect to backend API here
    console.log("Submitting user:", formData);
  };

  return (
    <div className="max-w-7xl mx-auto p-6 bg-white rounded-lg shadow mt-8">
      <h1 className="text-2xl font-bold text-[#043755] mb-6">{t("title")}</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block mb-1 font-medium text-[#043755]">
              {t("username")}
            </label>
            <input
              type="text"
              name="username"
              className="w-full border border-gray-300 rounded px-3 py-2  text-black"
              value={formData.username}
              onChange={handleChange}
              placeholder={t("usernamePlaceholder")}
              required
            />
          </div>

          <div>
            <label className="block mb-1 font-medium text-[#043755]">
              {t("email")}
            </label>
            <input
              type="email"
              name="email"
              className="w-full border border-gray-300 rounded px-3 py-2  text-black"
              value={formData.email}
              onChange={handleChange}
              placeholder={t("emailPlaceholder")}
              required
            />
          </div>

          <div>
            <label className="block mb-1 font-medium text-[#043755]">
              {t("firstName")}
            </label>
            <input
              type="text"
              name="firstName"
              className="w-full border border-gray-300 rounded px-3 py-2  text-black"
              value={formData.firstName}
              onChange={handleChange}
              placeholder={t("firstNamePlaceholder")}
              required
            />
          </div>

          <div>
            <label className="block mb-1 font-medium text-[#043755]">
              {t("lastName")}
            </label>
            <input
              type="text"
              name="lastName"
              className="w-full border border-gray-300 rounded px-3 py-2  text-black"
              value={formData.lastName}
              onChange={handleChange}
              placeholder={t("lastNamePlaceholder")}
              required
            />
          </div>

          <div>
            <label className="block mb-1 font-medium text-[#043755]">
              {t("phoneNumber")}
            </label>
            <input
              type="text"
              name="phoneNumber"
              className="w-full border border-gray-300 rounded px-3 py-2  text-black"
              value={formData.phoneNumber}
              onChange={handleChange}
              placeholder={t("phoneNumberPlaceholder")}
            />
          </div>

          <div>
            <label className="block mb-1 font-medium text-[#043755]">
              {t("department")}
            </label>
            <select
              name="departmentId"
              className="w-full border border-gray-300 rounded px-3 py-2 text-[#043755]"
              value={formData.departmentId}
              onChange={handleChange}
              required
            >
              <option value="" className="text-[#043755]">
                {t("selectDepartment")}
              </option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block mb-1 font-medium text-[#043755]">
              {t("role")}
            </label>
            <select
              name="role"
              className="w-full border border-gray-300 rounded px-3 py-2 text-[#043755]"
              value={formData.role}
              onChange={handleChange}
              required
            >
              <option value="" className="text-[#043755]">
                {t("selectRole")}
              </option>
              {roles.map((role) => (
                <option key={role} value={role}>
                  {role.charAt(0).toUpperCase() + role.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="block mb-1 font-medium text-[#043755]">
              {t("tempPassword")}
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                name="password"
                className="w-full border border-gray-300 rounded px-3 py-2 text-black"
                value={formData.password}
                readOnly
                placeholder={t("passwordPlaceholder")}
              />
              <button
                type="button"
                onClick={generateTempPassword}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
              >
                {t("generate")}
              </button>
            </div>
          </div>
        </div>

        <div className="pt-4">
          <button
            type="submit"
            className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded"
          >
            {t("submit")}
          </button>
        </div>
      </form>
    </div>
  );
}
