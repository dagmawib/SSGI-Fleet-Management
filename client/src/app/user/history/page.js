"use client";

import { useTranslations } from "next-intl";

const requests = [
  {
    id: "#001",
    date: "11 Feb, 2024",
    requester: "John Doe",
    vehicle: "Sedan",
    driver: "Michael Smith",
    pickup: "Location A",
    destination: "Location B",
    reason: "Business Trip",
    status: "Accepted",
  },
  {
    id: "#002",
    date: "13 Feb, 2024",
    requester: "Alice Johnson",
    vehicle: "SUV",
    driver: "Robert Brown",
    pickup: "Location C",
    destination: "Location D",
    reason: "Conference",
    status: "Pending",
  },
  {
    id: "#003",
    date: "15 Feb, 2024",
    requester: "David Lee",
    vehicle: "Truck",
    driver: "William Davis",
    pickup: "Location E",
    destination: "Location F",
    reason: "Cargo Transport",
    status: "Declined",
  },
  {
    id: "#004",
    date: "17 Feb, 2024",
    requester: "John Doe",
    vehicle: "Sedan",
    driver: "Michael Smith",
    pickup: "Location A",
    destination: "Location B",
    reason: "Business Trip",
    status: "Accepted",
  },
  {
    id: "#005",
    date: "19 Feb, 2024",
    requester: "Alice Johnson",
    vehicle: "SUV",
    driver: "Robert Brown",
    pickup: "Location C",
    destination: "Location D",
    reason: "Conference",
    status: "Accepted",
  },
  {
    id: "#006",
    date: "21 Feb, 2024",
    requester: "David Lee",
    vehicle: "Truck",
    driver: "William Davis",
    pickup: "Location E",
    destination: "Location F",
    reason: "Cargo Transport",
    status: "Declined",
  },
];

export default function RequestTrackingPage() {
  const t = useTranslations("history");

  return (
    <div className="max-w-7xl w-full mx-auto py-6 px-4">
      <h2 className="text-2xl font-semibold text-[#043755]">{t("title")}</h2>
      <p className="text-gray-500 mb-4">{t("description")}</p>

      {/* Stats Containers */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6 md:w-2/3">
        <div className="bg-white text-[#043755] p-4 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold">{t("totalRequests")}</h3>
          <p className="text-2xl font-bold">{requests.length}</p>
        </div>
        <div className="bg-green-100 text-[#043755] p-4 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold">{t("acceptedRequests")}</h3>
          <p className="text-2xl font-bold">
            {requests.filter((r) => r.status === "Accepted").length}
          </p>
        </div>
        <div className="bg-red-100 text-[#043755] p-4 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold">{t("declinedRequests")}</h3>
          <p className="text-2xl font-bold">
            {requests.filter((r) => r.status === "Declined").length}
          </p>
        </div>
      </div>

      {/* Requests Table */}
      <div className="bg-white p-6 rounded-lg shadow-md overflow-x-auto">
        <table className="w-full min-w-[800px] border-collapse">
          <thead>
            <tr className="bg-gray-100 text-left text-[#043755]">
              <th className="p-2">{t("table.requestId")}</th>
              <th className="p-2">{t("table.date")}</th>
              <th className="p-2">{t("table.requester")}</th>
              <th className="p-2">{t("table.vehicle")}</th>
              <th className="p-2">{t("table.driver")}</th>
              <th className="p-2">{t("table.pickup")}</th>
              <th className="p-2">{t("table.destination")}</th>
              <th className="p-2">{t("table.reason")}</th>
              <th className="p-2">{t("table.status")}</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((req) => (
              <tr key={req.id} className="border-t text-[#043755]">
                <td className="p-2">{req.id}</td>
                <td className="p-2">{req.date}</td>
                <td className="p-2">{req.requester}</td>
                <td className="p-2">{req.vehicle}</td>
                <td className="p-2">{req.driver}</td>
                <td className="p-2">{req.pickup}</td>
                <td className="p-2">{req.destination}</td>
                <td className="p-2">{req.reason}</td>
                <td className="p-2 font-semibold">
                  <span
                    className={
                      req.status === "Accepted"
                        ? "text-green-600"
                        : req.status === "Declined"
                        ? "text-red-600"
                        : "text-yellow-500"
                    }
                  >
                    {t(`statuses.${req.status.toLowerCase()}`)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
