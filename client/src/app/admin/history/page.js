"use client";
import React, { useState } from "react";
import { useTranslations } from "next-intl";
import useSWR from "swr";
import CircularProgress from "@mui/material/CircularProgress";

const fetcher = (url) => fetch(url).then((res) => res.json());

export default function HistoryTable() {
  const t = useTranslations("admin_history");
  const { data, isLoading, error } = useSWR("/api/admin_history", fetcher);
  const history = data?.history || [];

  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;
  const totalPages = Math.ceil(history.length / rowsPerPage);
  const paginatedHistory = history.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <CircularProgress />
      </div>
    );
  }
  if (error) {
    return <div className="p-8 text-center text-red-600">{t("failed")}</div>;
  }

  return (
    <div className="overflow-auto bg-white rounded-lg shadow border max-w-7xl xxl:max-w-[1600px] w-full mx-auto">
      <table className="min-w-full table-auto text-sm">
        <thead className="bg-[#043755] text-white">
          <tr>
            <th className="px-4 py-3 text-left">{t("assignedDate")}</th>
            <th className="px-4 py-3 text-left">{t("requester")}</th>
            <th className="px-4 py-3 text-left">{t("vehicle")}</th>
            <th className="px-4 py-3 text-left">{t("driver")}</th>
            <th className="px-4 py-3 text-left">{t("approver")}</th>
            <th className="px-4 py-3 text-left">{t("pickup")}</th>
            <th className="px-4 py-3 text-left">{t("destination")}</th>
            <th className="px-4 py-3 text-left">{t("totalKm")}</th>
          </tr>
        </thead>
        <tbody>
          {paginatedHistory.map((entry, idx) => (
            <tr
              key={idx}
              className="border-t hover:bg-gray-50 transition text-[#043755]"
            >
              <td className="px-4 py-3">{entry.assigned_date}</td>
              <td className="px-4 py-3">{entry.requester}</td>
              <td className="px-4 py-3">{entry.vehicle}</td>
              <td className="px-4 py-3">{entry.driver}</td>
              <td className="px-4 py-3">{entry.approver}</td>
              <td className="px-4 py-3">
                {entry.pickup && entry.pickup.length > 20
                  ? entry.pickup.slice(0, 20) + "..."
                  : entry.pickup}
              </td>
              <td className="px-4 py-3">
                {entry.destination && entry.destination.length > 20
                  ? entry.destination.slice(0, 20) + "..."
                  : entry.destination}
              </td>
              <td className="px-4 py-3">{entry.total_km}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {/* Pagination Controls */}
      <div className="flex justify-between items-center mt-4 px-4">
        <p className="text-sm text-gray-600">
          {t("showing")} {(currentPage - 1) * rowsPerPage + 1}–
          {Math.min(currentPage * rowsPerPage, history.length)} {t("of")}{" "}
          {history.length}
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
            onClick={() =>
              setCurrentPage((prev) => Math.min(prev + 1, totalPages))
            }
            disabled={currentPage === totalPages}
            className="px-3 py-1 bg-[#043755] text-white rounded hover:bg-gray-300 disabled:opacity-50"
          >
            {t("next")}
          </button>
        </div>
      </div>
    </div>
  );
}
