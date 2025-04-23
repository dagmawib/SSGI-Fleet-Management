"use client";
import { useState  , useEffect} from "react";
import { useTranslations } from "next-intl";
import emailjs from "@emailjs/browser";

export default function ContactUsPage() {
  const t = useTranslations("contact");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(false)
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

  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess(false);
        setError(false);
      }, 3000); 
      return () => clearTimeout(timer); 
    }
  }, [success, error]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);
    setError(false);

    if (!formData.firstName || !formData.lastName || !formData.email || !formData.message) {
      alert("Please fill in all required fields.");
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      await emailjs.send(
        process.env.EMIAL_JS_SERVICE_ID,
        process.env.EMIAL_JS_TEMPLATE_ID,
        {
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          message: formData.message,
          services: formData.services.join(", "),
        },
        process.env.EMIAL_JS_PUBLICK_KEY
      );

      setSuccess(true);
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        message: "",
        services: [],
      });
    } catch (err) {
      console.error("EmailJS Error:", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl xxl:max-w-[1600px] w-full mx-auto p-6 bg-white shadow-md rounded-lg mt-10">
      <h2 className="text-3xl font-semibold text-gray-800 text-center">
        {t("title")}
      </h2>
      <p className="text-gray-500 text-center">{t("description")}</p>

      <form
      onSubmit={(e) => handleSubmit(e)}
      className="mt-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-[#043755]">{t("firstName")} *</label>
            <input
              type="text"
              name="firstName"
              value={formData.firstName}
              className="border text-[#043755] p-2 rounded w-full"
              onChange={handleChange}
            />
          </div>
          <div>
            <label className="text-[#043755]">{t("lastName")} *</label>
            <input
              type="text"
              name="lastName"
              value={formData.lastName}
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
            value={formData.email}
            className="border text-[#043755] p-2 rounded w-full"
            onChange={handleChange}
          />
        </div>
        <div>
          <label className="text-[#043755]">{t("phone")}</label>
          <input
            type="text"
            name="phone"
            value={formData.phone}
            className="border text-[#043755] p-2 rounded w-full"
            onChange={handleChange}
          />
        </div>
        <div>
          <label className="text-[#043755]">{t("message")} *</label>
          <textarea
            name="message"
            value={formData.message}
            className="border text-[#043755] p-2 rounded w-full"
            rows="4"
            onChange={handleChange}
          ></textarea>
        </div>

        {success && <p className="text-green-600">Your message has been sent successfully!</p>}
        {error && <p className="text-red-600">Something went wrong. Please try again.</p>}

        <button className="w-full bg-[#043755] text-white py-2 rounded mt-4 hover:bg-blue-900">
           {loading ? "Sending..." : "Send"}
        </button>
      </form>
    </div>
  );
}
