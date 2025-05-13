"use client";

import { useTranslations } from "next-intl";
import useSWR from "swr";
import { useState } from "react";
import CircularProgress from "@mui/material/CircularProgress";


const fetcher = (url) => fetch(url).then((res) => res.json());

export default function RequestTrackingPage() {
  const t = useTranslations("history");
  const { data, isLoading, error } = useSWR("/api/employe_history", fetcher);

  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <CircularProgress />
      </div>
    );
  }
  if (error) {
    return <div className="p-8 text-center text-red-600">Failed to load data</div>;
  }

  const totalRequests = data?.total_requests || 0;
  const acceptedRequests = data?.accepted_requests || 0;
  const declinedRequests = data?.declined_requests || 0;
  const requests = data?.requests || [];
  const totalPages = Math.ceil(requests.length / rowsPerPage);
  const paginatedRequests = requests.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  return (
    <div className="max-w-7xl w-full mx-auto py-6 px-4">
      <h2 className="text-2xl font-semibold text-[#043755]">{t("title")}</h2>
      <p className="text-gray-500 mb-4">{t("description")}</p>

      {/* Stats Containers */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6 md:w-2/3">
        <div className="bg-white text-[#043755] p-4 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold">{t("totalRequests")}</h3>
          <p className="text-2xl font-bold">{totalRequests}</p>
        </div>
        <div className="bg-green-100 text-[#043755] p-4 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold">{t("acceptedRequests")}</h3>
          <p className="text-2xl font-bold">{acceptedRequests}</p>
        </div>
        <div className="bg-red-100 text-[#043755] p-4 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold">{t("declinedRequests")}</h3>
          <p className="text-2xl font-bold">{declinedRequests}</p>
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
              <th className="p-2">{t("table.approver")}</th>
              <th className="p-2">{t("table.vehicle")}</th>
              <th className="p-2">{t("table.driver")}</th>
              <th className="p-2">{t("table.pickup")}</th>
              <th className="p-2">{t("table.destination")}</th>
              <th className="p-2">{t("table.reason")}</th>
              <th className="p-2">{t("table.status")}</th>
            </tr>
          </thead>
          <tbody>
            {paginatedRequests.map((req) => (
              <tr key={req.request_id} className="border-t text-[#043755]">
                <td className="p-2">{req.request_id}</td>
                <td className="p-2">{req.date}</td>
                <td className="p-2">{req.requester}</td>
                <td className="p-2">{req.approver || "-"}</td>
                <td className="p-2">{req.vehicle || "-"}</td>
                <td className="p-2">{req.driver || "-"}</td>
                <td className="p-2">{req.pickup}</td>
                <td className="p-2">{req.destination}</td>
                <td className="p-2">{req.reason}</td>
                <td className="p-2 font-semibold">
                  <span
                    className={
                      req.status === "Assigned"
                        ? "text-green-600"
                        : req.status === "Rejected"
                        ? "text-red-600"
                        : req.status === "Approved"
                        ? "text-yellow-500"
                        : "text-yellow-500"
                    }
                  >
                    {req.status === "Approved"
                      ? t("statuses.pending")
                      : t(`statuses.${req.status.toLowerCase()}`)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {/* Pagination Controls */}
        <div className="flex justify-between items-center mt-4">
          <p className="text-sm text-gray-600">
            {t("showing")} {(currentPage - 1) * rowsPerPage + 1}
            –{Math.min(currentPage * rowsPerPage, requests.length)} {t("of")} {requests.length}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 bg-[#043755] text-white rounded hover:bg-gray-300 disabled:opacity-50"
            >
              {t("previous")}
            </button>
            <button
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 bg-[#043755] text-white rounded hover:bg-gray-300 disabled:opacity-50"
            >
              {t("next")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
