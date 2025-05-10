"use client";
import React, { useState, useEffect } from "react";
import { useTranslations } from "next-intl";

export default function EditUserModal({ isOpen, onClose, user, onSave, departments }) {
  const t = useTranslations("editModal");

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    phone_number: "",
    department: "",
    is_active: false,
  });

  useEffect(() => {
    if (user) {
      setFormData({
        first_name: user.first_name || "",
        last_name: user.last_name || "",
        phone_number: user.phone_number || "",
        department: user.department?.id || "",
        is_active: user.is_active || false,
      });
    }
  }, [user]);

  if (!isOpen || !user) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSave = () => {
    onSave(formData); // This will call the parent function with updated data
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
          <Field
            id="first_name"
            label={t("firstName")}
            value={formData.first_name}
            onChange={handleChange}
          />
          <Field
            id="last_name"
            label={t("lastName")}
            value={formData.last_name}
            onChange={handleChange}
          />
          <Field
            id="phone_number"
            label={t("phoneNumber")}
            value={formData.phone_number}
            onChange={handleChange}
          />
          <label className="text-black">Department</label>
          <select
            value={formData.department}
            onChange={(e) =>
              setFormData({ ...formData, department: parseInt(e.target.value) })
            }
            className="w-full border px-3 py-2 rounded text-black"
          >
            <option value="">Select Department</option>
            {departments.map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept.name}
              </option>
            ))}
          </select>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              name="is_active"
              checked={formData.is_active}
              onChange={handleChange}
            />
            <label className="text-sm text-[#043755]">{t("is_active")}</label>
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

// Reusable input field component
function Field({ id, label, value, onChange }) {
  return (
    <div>
      <label
        htmlFor={id}
        className="block text-sm font-medium text-[#043755] mb-1"
      >
        {label}
      </label>
      <input
        id={id}
        name={id}
        value={value}
        onChange={onChange}
        className="text-[#043755] w-full border px-3 py-2 rounded"
        placeholder={label}
      />
    </div>
  );
}
