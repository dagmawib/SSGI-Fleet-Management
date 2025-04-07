"use client";
import React, { useState, useEffect } from "react";
import { useTranslations } from "next-intl";

export default function EditUserModal({ isOpen, onClose, user, onSave }) {
  const t = useTranslations("editModal");
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    firstName: "",
    lastName: "",
    role: "",
  });

  // Sync state with selected user
  useEffect(() => {
    if (user) {
      setFormData(user);
    }
  }, [user]);

  if (!isOpen || !user) return null;

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSave = () => {
    onSave(formData);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 px-2"
      onClick={onClose}
    >
      <div
        className="bg-white p-6 rounded-lg w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-semibold mb-4 text-[#043755]">
          {t("editUser")}
        </h2>
        <div className="space-y-4">
          <div>
            <label
              htmlFor="username"
              className="block text-sm font-medium text-[#043755] mb-1"
            >
              {t("username")}
            </label>
            <input
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className="text-[#043755] w-full border px-3 py-2 rounded"
              placeholder={t("username")}
            />
          </div>

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-[#043755] mb-1"
            >
              {t("email")}
            </label>
            <input
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="text-[#043755] w-full border px-3 py-2 rounded"
              placeholder={t("email")}
            />
          </div>

          <div>
            <label
              htmlFor="firstName"
              className="block text-sm font-medium text-[#043755] mb-1"
            >
              {t("firstName")}
            </label>
            <input
              id="firstName"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              className="text-[#043755] w-full border px-3 py-2 rounded"
              placeholder={t("firstName")}
            />
          </div>

          <div>
            <label
              htmlFor="lastName"
              className="block text-sm font-medium text-[#043755] mb-1"
            >
              {t("lastName")}
            </label>
            <input
              id="lastName"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              className="text-[#043755] w-full border px-3 py-2 rounded"
              placeholder={t("lastName")}
            />
          </div>

          <div>
            <label
              htmlFor="role"
              className="block text-sm font-medium text-[#043755] mb-1"
            >
              {t("role")}
            </label>
            <input
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="text-[#043755] w-full border px-3 py-2 rounded"
              placeholder={t("role")}
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 text-[#043755]"
          >
            {t("cancel")}
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-[#043755] text-white rounded hover:bg-blue-700"
          >
            {t("save")}
          </button>
        </div>
      </div>
    </div>
  );
}
