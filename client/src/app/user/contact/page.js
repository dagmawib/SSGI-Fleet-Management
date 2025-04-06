"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";

export default function ContactUsPage() {
  const t = useTranslations("contact");
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    message: "",
    services: [],
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === "checkbox") {
      setFormData((prev) => ({
        ...prev,
        services: checked
          ? [...prev.services, value]
          : prev.services.filter((service) => service !== value),
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  return (
    <div className="max-w-7xl xxl:max-w-[1600px] w-full mx-auto p-6 bg-white shadow-md rounded-lg mt-10">
      <h2 className="text-3xl font-semibold text-gray-800 text-center">
        {t("title")}
      </h2>
      <p className="text-gray-500 text-center">{t("description")}</p>

      <form className="mt-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-[#043755]">{t("firstName")} *</label>
            <input
              type="text"
              name="firstName"
              className="border text-[#043755] p-2 rounded w-full"
              onChange={handleChange}
            />
          </div>
          <div>
            <label className="text-[#043755]">{t("lastName")} *</label>
            <input
              type="text"
              name="lastName"
              className="border text-[#043755] p-2 rounded w-full"
              onChange={handleChange}
            />
          </div>
        </div>
        <div>
          <label className="text-[#043755]">{t("email")} *</label>
          <input
            type="email"
            name="email"
            className="border text-[#043755] p-2 rounded w-full"
            onChange={handleChange}
          />
        </div>
        <div>
          <label className="text-[#043755]">{t("phone")}</label>
          <input
            type="text"
            name="phone"
            className="border text-[#043755] p-2 rounded w-full"
            onChange={handleChange}
          />
        </div>
        <div>
          <label className="text-[#043755]">{t("message")} *</label>
          <textarea
            name="message"
            className="border text-[#043755] p-2 rounded w-full"
            rows="4"
            onChange={handleChange}
          ></textarea>
        </div>
        <button className="w-full bg-[#043755] text-white py-2 rounded mt-4 hover:bg-blue-900">
          {t("send")}
        </button>
      </form>
    </div>
  );
}
