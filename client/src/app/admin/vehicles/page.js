"use client";
import React, { useState } from "react";
import useSWR from "swr";
import Modal from "@mui/material/Modal";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import TextField from "@mui/material/TextField";
import { useTranslations } from "next-intl";
const fetcher = (url) => fetch(url).then((res) => res.json());

const ROWS_PER_PAGE = 10;

export default function HistoryTable() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Build API URL with date filters
  const buildApiUrl = () => {
    let url = "/api/vehicles_history";
    const params = [];
    if (startDate) params.push(`start=${startDate}`);
    if (endDate) params.push(`end=${endDate}`);
    if (params.length) url += `?${params.join("&")}`;
    return url;
  };

  const {
    data = [],
    isLoading,
    error,
    mutate,
  } = useSWR(buildApiUrl(), fetcher);

  const t = useTranslations("vehciles_history");
  const tableHeaders = [
    t("vehicle"),
    t("license_plate"),
    t("department"),
    t("category"),
    t("status"),
    t("current_driver"),
    t("trip_count"),
    t("total_km"),
    t("maintenance_due"),
  ];
  const [open, setOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch report data with a simple async handler
  const [reportUrl, setReportUrl] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState(null);

  const handleGetReport = async () => {
    setReportLoading(true);
    setReportError(null);
    setReportUrl(null);
    try {
      // Build report URL with date filters
      let url = "/api/get_report?export=excel";
      if (startDate) url += `&start=${startDate}`;
      if (endDate) url += `&end=${endDate}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch report");
      const blob = await res.blob();
      const urlObj = URL.createObjectURL(blob);
      setReportUrl(urlObj);
    } catch (e) {
      console.error("Report fetch error:", e);
      setReportError("Error loading report");
    } finally {
      setReportLoading(false);
    }
  };

  const totalPages = Math.ceil(data.length / ROWS_PER_PAGE);
  const paginatedData = data.slice(
    (currentPage - 1) * ROWS_PER_PAGE,
    currentPage * ROWS_PER_PAGE
  );

  const handleRowClick = (row) => {
    setSelectedRow(row);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedRow(null);
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  if (isLoading)
    return (
      <div className="flex justify-center items-center h-32">
        <CircularProgress />
      </div>
    );
  if (error)
    return <div className="text-center text-red-600">{t("error")}</div>;

  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-0 py-4">
      {/* Get Report Button */}
      <div className="flex flex-col sm:flex-row sm:justify-end px-4 pt-4 mb-4 gap-4">
        {/* Date Filter Controls */}
        <div className="flex flex-col sm:flex-row flex-wrap gap-4 items-center sm:mb-0 mb-2 w-full sm:w-auto">
          <TextField
            label={t("startDate", { defaultValue: "Start Date" })}
            type="date"
            size="small"
            InputLabelProps={{ shrink: true }}
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              setCurrentPage(1);
              mutate();
            }}
            className="w-full sm:w-auto"
          />
          <TextField
            label={t("endDate", { defaultValue: "End Date" })}
            type="date"
            size="small"
            InputLabelProps={{ shrink: true }}
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value);
              setCurrentPage(1);
              mutate();
            }}
            className="w-full sm:w-auto"
          />
        </div>

        {/* Report Button */}
        <button
          className="bg-[#043755] text-white px-4 py-2 rounded hover:bg-[#03294a] transition w-full sm:w-auto"
          onClick={handleGetReport}
          disabled={reportLoading}
        >
          {reportLoading ? (
            <CircularProgress size={18} className="inline-block align-middle" />
          ) : (
            t("getReport", { defaultValue: "Get Report" })
          )}
        </button>
      </div>
      {reportUrl && (
        <div className="px-4 pb-2 text-green-700 flex justify-end items-center gap-2 my-4">
          {t("reportReady", { defaultValue: "Report ready!" })}
          <a
            href={reportUrl}
            download="vehicles_report.xlsx"
            className="ml-2 px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition"
            target="_blank"
            rel="noopener noreferrer"
          >
            Download
          </a>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm sm:text-base text-black">
          <thead className="bg-[#043755] text-white">
            <tr>
              {tableHeaders.map((header) => (
                <th
                  key={header}
                  className="px-4 py-2 border-b text-left whitespace-nowrap"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((row) => (
              <tr
                key={row.id}
                className="hover:bg-gray-100 cursor-pointer"
                onClick={() => handleRowClick(row)}
              >
                <td className="px-4 py-2 border-b">{row.vehicle}</td>
                <td className="px-4 py-2 border-b">{row.license_plate}</td>
                <td className="px-4 py-2 border-b">{row.department}</td>
                <td className="px-4 py-2 border-b">{row.category}</td>
                <td className="px-4 py-2 border-b">{row.status}</td>
                <td className="px-4 py-2 border-b">{row.current_driver}</td>
                <td className="px-4 py-2 border-b">{row.trip_count}</td>
                <td className="px-4 py-2 border-b">{row.total_km}</td>
                <td className="px-4 py-2 border-b">
                  {row.maintenance_due ? "Yes" : "No"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination controls */}
      <div className="flex flex-wrap justify-center items-center gap-2 mt-4">
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded disabled:opacity-50"
          disabled={currentPage === 1}
        >
          {t("previous")}
        </button>

        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
          <button
            key={page}
            onClick={() => handlePageChange(page)}
            className={`px-3 py-1 rounded ${
              currentPage === page
                ? "bg-[#043755] text-white"
                : "bg-gray-200 hover:bg-gray-300"
            }`}
          >
            {page}
          </button>
        ))}

        <button
          onClick={() => handlePageChange(currentPage + 1)}
          className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded disabled:opacity-50"
          disabled={currentPage === totalPages}
        >
          {t("next")}
        </button>
      </div>

      {/* Modal for previous drivers */}
      <Modal open={open} onClose={handleClose}>
        <Box
          className="absolute top-1/2 left-1/2 bg-white text-black p-4 sm:p-6 rounded-lg shadow-lg w-[90%] sm:max-w-md"
          style={{ transform: "translate(-50%, -50%)" }}
        >
          <h2 className="text-lg font-semibold mb-4">{t("previousDrivers")}</h2>

          {selectedRow?.assigned_drivers_this_period?.length ? (
            <div className="mb-4 max-h-60 overflow-y-auto">
              {/* Table Header */}
              <div className="grid grid-cols-3 font-semibold border-b pb-2 mb-2">
                <span>{t("driverName")}</span>
                <span>{t("assignedAt")}</span>
                <span>{t("unassignedAt")}</span>
              </div>

              {/* Table Rows */}
              {selectedRow.assigned_drivers_this_period.map(
                (driverObj, idx) => {
                  const formatDate = (dateStr) => {
                    const date = new Date(dateStr);
                    const day = date.getDate().toString().padStart(2, "0");
                    const month = date.toLocaleString("en-US", {
                      month: "long",
                    });
                    const year = date.getFullYear();
                    return `${day} - ${month} - ${year}`;
                  };

                  return (
                    <div
                      key={idx}
                      className="grid grid-cols-3 py-1 border-b last:border-b-0 text-sm"
                    >
                      <span>{driverObj.driver}</span>
                      <span>
                        {driverObj.assigned_at
                          ? formatDate(driverObj.assigned_at)
                          : "-"}
                      </span>
                      <span>
                        {driverObj.unassigned_at
                          ? formatDate(driverObj.unassigned_at)
                          : "-"}
                      </span>
                    </div>
                  );
                }
              )}
            </div>
          ) : (
            <p>{t("noPreviousDrivers")}</p>
          )}

          <button
            onClick={handleClose}
            className="w-full sm:w-auto px-4 py-2 bg-[#043755] text-white rounded hover:bg-blue-700"
          >
            {t("close")}
          </button>
        </Box>
      </Modal>
    </div>
  );
}
