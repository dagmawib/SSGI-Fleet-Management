"use client";
import React, { useState } from "react";
import { useTranslations } from "next-intl";
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuContent,
} from "@/components/ui/dropdown-menu";
import { Globe } from "lucide-react";
import WorldFlag from "react-world-flags";
import { setCookie } from "cookies-next"; 

export default function Page() {
  const [hasUpcomingRequest, setHasUpcomingRequest] = useState(true);
  const [accepted, setAccepted] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [kmBefore, setKmBefore] = useState("");
  const [kmAfter, setKmAfter] = useState("");
  const t = useTranslations("driverDashboard");

  const upcomingRequest = {
    pickupLocation: "Addis Ababa",
    destination: "Adama",
    requester: {
      name: "John Doe",
      department: "IT",
      phone: "+251912345678",
    },
    passengers: 3,
  };

  const handleLanguageChange = (lang) => {
    setCookie("NEXT_LOCALE", lang);
    window.location.reload();
  };

  const handleAccept = () => {
    if (!kmBefore) {
      alert("Please enter the kilometer before start.");
      return;
    }
    setAccepted(true);
  };

  const handleDecline = () => {
    setHasUpcomingRequest(false);
    setAccepted(false);
    setKmBefore("");
    setKmAfter("");
  };

  const handleSubmit = () => {
    if (!kmAfter) {
      alert("Please enter the kilometer after trip.");
      return;
    }

    // Do something with the data
    console.log("Trip submitted:", {
      kmBefore,
      kmAfter,
      request: upcomingRequest,
    });

    // Reset states or navigate
    setSubmitted(true);
  };

  return (
    <div className="max-w-7xl xxl:max-w-[1600px] w-full mx-auto p-6 bg-white shadow-md rounded-lg my-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-[#043755]">
            {t("title")}
          </h2>
          <p className="text-[#043755]">{t("description")}</p>
        </div>
        {/* Globe Icon with Language Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="p-2 rounded-full text-[#043755] hover:bg-gray-100 hidden lg:block">
              <Globe className="w-5 h-5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-36">
            <DropdownMenuItem onClick={() => handleLanguageChange("en")}>
              <div className="flex items-center space-x-2">
                <WorldFlag code="GB" className="h-6 w-6" alt="UK Flag" />
                <span>English</span>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleLanguageChange("am")}>
              <div className="flex items-center space-x-2">
                <WorldFlag code="ET" className="h-6 w-6" alt="Ethiopian Flag" />
                <span>አማርኛ</span>
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {hasUpcomingRequest && !submitted ? (
        <div className="mt-6 bg-blue-50 p-4 rounded-lg shadow-sm border border-blue-200">
          <h3 className="text-xl font-medium text-[#043755] mb-4">
            {t("upcomingRequest")}
          </h3>
          <div className="space-y-2 text-[#043755]">
            <p>
              <strong>{t("pickup")}:</strong> {upcomingRequest.pickupLocation}
            </p>
            <p>
              <strong>{t("destination")}:</strong> {upcomingRequest.destination}
            </p>
            <p>
              <strong>{t("requester")}:</strong>{" "}
              {upcomingRequest.requester.name}
            </p>
            <p>
              <strong>{t("department")}:</strong>{" "}
              {upcomingRequest.requester.department}
            </p>
            <p>
              <strong>{t("phone")}:</strong> {upcomingRequest.requester.phone}
            </p>
            <p>
              <strong>{t("passengers")}:</strong> {upcomingRequest.passengers}
            </p>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block mb-1 text-sm font-medium">
                  {t("kmBefore")}
                </label>
                <input
                  type="number"
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  value={kmBefore}
                  onChange={(e) => setKmBefore(e.target.value)}
                  disabled={accepted}
                />
              </div>
              <div>
                <label className="block mb-1 text-sm font-medium">
                  {t("kmAfter")}
                </label>
                <input
                  type="number"
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  value={kmAfter}
                  onChange={(e) => setKmAfter(e.target.value)}
                  disabled={!accepted}
                />
              </div>
            </div>

            <div className="mt-4 flex gap-3">
              {!accepted ? (
                <>
                  <button
                    onClick={handleAccept}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
                  >
                    {t("accept")}
                  </button>
                  <button
                    onClick={handleDecline}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
                  >
                    {t("decline")}
                  </button>
                </>
              ) : (
                <button
                  onClick={handleSubmit}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
                >
                  {t("submit")}
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-6">
          <h3 className="text-xl font-medium text-[#043755] mb-4">
            {t("upcomingTrips")}
          </h3>
          <div className="bg-gray-50 p-4 rounded-lg shadow-sm mb-4">
            <p className="text-[#043755]">{t("noUpcomingTrips")}</p>
          </div>
        </div>
      )}

      <div className="mt-6">
        <h3 className="text-xl font-medium text-[#043755] mb-4">
          {t("completedTrips")}
        </h3>
        <div className="bg-gray-50 p-4 rounded-lg shadow-sm mb-4">
          <p className="text-[#043755]">{t("noCompletedTrips")}</p>
        </div>
      </div>
    </div>
  );
}
