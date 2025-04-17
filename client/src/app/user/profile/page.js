"use client";
import { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import { useTranslations } from "next-intl";

// const userData = {
//   user_id: 1,
//   username: "johndoe",
//   email: "johndoe@example.com",
//   first_name: "John",
//   last_name: "Doe",
//   phone_number: "+1234567890",
//   department: "IT",
//   role: "admin",
//   is_active: true,
//   password: "johndoe123",
// };

export default function ProfilePage() {
  const [passwordVisible, setPasswordVisible] = useState(false);
  const t = useTranslations("profile");
  const [userData, setUserData] = useState({
    first_name: "",
    last_name: "",
    phone_number: "",
    email: "",
  });

  useEffect(() => {
    const fetchUserData = async () => {
      const res = await fetch("/api/getProfile", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      const data = await res.json();
      setUserData(data);
    };
    fetchUserData();
  }, []);

  return (
    <div className="max-w-7xl xxl:max-w-[1600px] w-full mx-auto p-6 bg-white shadow-md rounded-lg my-4">
      <h2 className="text-2xl font-semibold text-[#043755]">{t("title")}</h2>
      <p className="text-[#043755]">{t("description")}</p>

      {/* <div className="mt-4 flex items-center space-x-4">
        <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center">
          <Image
            src="/images/profile2.jpg"
            alt="User profile"
            width={80}
            height={80}
            className="object-cover rounded-full"
          />
        </div>
        <div>
          <button className="text-[#043755]">{t("upload")}</button>
          <button className="text-red-500 ml-4">{t("delete")}</button>
        </div>
      </div> */}

      <div className="mt-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-1">
          <div>
            <label className="text-[#043755]">{t("firstName")}</label>
            <input
              type="text"
              value={userData.first_name || ""}
              className="border text-[#043755] p-2 rounded w-full"
              onChange={(e) =>
                setUserData((prev) => ({ ...prev, first_name: e.target.value }))
              }
            />
          </div>
          <div>
            <label className="text-[#043755]">{t("lastName")}</label>
            <input
              type="text"
              value={userData.last_name || ""}
              className="border text-[#043755] p-2 rounded w-full"
              onChange={(e) =>
                setUserData((prev) => ({ ...prev, last_name: e.target.value }))
              }
            />
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-[#043755]">{t("phone")}</label>
          <input
            type="text"
            value={userData.phone_number || ""}
            className="border text-[#043755] p-2 rounded w-full mt-1"
            onChange={(e) =>
              setUserData((prev) => ({
                ...prev,
                phone_number: e.target.value,
              }))
            }
          />
        </div>
        <div>
          <label className="text-[#043755]">{t("email")}</label>
          <div className="flex items-center border text-[#043755] p-2 rounded mt-1">
            <Icon icon="mdi:email-outline" className="text-[#043755] mr-2" />
            <input
              type="email"
              value={userData.email || ""}
              className="w-full text-[#043755]"
              onChange={(e) =>
                setUserData((prev) => ({ ...prev, email: e.target.value }))
              }
            />
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-[#043755]">{t("role")}</label>
          <input
            type="text"
            value={userData.role || ""}
            className="border text-[#043755] p-2 rounded w-full mt-1 bg-gray-100 cursor-not-allowed"
            readOnly
            disabled
          />
        </div>
        <div>
          <label className="text-[#043755]">{t("department")}</label>
          <input
            type="text"
            value={userData.department || ""}
            className="border text-[#043755] p-2 rounded w-full mt-1 bg-gray-100 cursor-not-allowed"
            readOnly
            disabled
          />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-[#043755]">{t("password")}</label>
          <div className="flex items-center border text-[#043755] p-2 rounded mt-1">
            <input
              type={passwordVisible ? "text" : "password"}
              value={userData.password || ""}
              className="w-full text-[#043755]"
              readOnly
            />
            <button onClick={() => setPasswordVisible(!passwordVisible)}>
              <Icon
                icon={
                  passwordVisible ? "mdi:eye-off-outline" : "mdi:eye-outline"
                }
                className="text-[#043755] ml-2"
              />
            </button>
          </div>
        </div>

        <div>
          <label className="text-[#043755]">{t("status")}</label>
          <input
            type="text"
            value={userData.is_active ? t("active") : t("inactive") || ""}
            className="border text-[#043755] p-2 rounded w-full mt-1 bg-gray-100 cursor-not-allowed"
            readOnly
            disabled
          />
        </div>
      </div>

      <div className="mt-6 flex justify-end space-x-4">
        <button
          type="submit"
          className="w-full bg-[#043755] text-white py-2 rounded-lg hover:bg-opacity-90 transition"
        >
          {t("update")}
        </button>
      </div>
    </div>
  );
}
