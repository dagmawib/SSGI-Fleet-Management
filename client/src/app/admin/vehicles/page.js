"use client";
import React, { useState } from "react";
import useSWR from "swr";
import Modal from "@mui/material/Modal";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import { useTranslations } from "next-intl";
const fetcher = (url) => fetch(url).then((res) => res.json());

const ROWS_PER_PAGE = 10;

export default function HistoryTable() {
  const {
    data = [],
    isLoading,
    error,
  } = useSWR("/api/vehicles_history", fetcher);
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
          <ul className="mb-4 max-h-60 overflow-y-auto">
            {selectedRow?.drivers_this_period?.length ? (
              selectedRow.drivers_this_period.map((driver, idx) => (
                <li key={idx} className="py-1 border-b last:border-b-0">
                  {driver}
                </li>
              ))
            ) : (
              <li>{t("noPreviousDrivers")}</li>
            )}
          </ul>
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
