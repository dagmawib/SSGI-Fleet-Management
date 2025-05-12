"use client";
import React, { useState, useEffect, useCallback } from "react";
import VehicleAssignmentModal from "@/components/admin/vehicleAssignementModal";
import { useTranslations } from "next-intl";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import CircularProgress from "@mui/material/CircularProgress";
import { Skeleton } from "@/components/ui/skeleton";
import useSWR from "swr";

const statusColors = {
  pending: "bg-yellow-100 text-yellow-800",
  assigned: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
};

// Add capitalize function
const capitalizeFirstLetters = (str) => {
  if (!str) return '';
  return str
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

const fetcher = (url) => fetch(url).then((res) => res.json());

export default function RequestTable() {
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [selectedCarId, setSelectedCarId] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [assignLoading, setAssignLoading] = useState(false);
  const [rejectLoading, setRejectLoading] = useState(false);
  const [clearLoading, setClearLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;
  const { data: requests = [], isLoading, error, mutate } = useSWR("/api/admin/requests", fetcher);

  const t = useTranslations("RequestTable");

  const closeModal = () => {
    setModalOpen(false);
    setSelectedRequest(null);
    setSelectedCarId("");
    setRejectLoading(false); // Reset reject loading state
    setAssignLoading(false); // Reset assign loading state
  };

  const openModal = (request, action) => {
    setSelectedRequest({ ...request, action });
    setModalOpen(true);
    setRejectLoading(false); // Reset reject loading state on open
    setAssignLoading(false); // Reset assign loading state on open
  };

  const resetFilters = async () => {
    setClearLoading(true);
    try {
      setSearchTerm("");
      setSelectedStatus("");
    } finally {
      setClearLoading(false);
    }
  };

  // Filter requests based on search term and selected status
  const filteredRequests = requests.filter(request => {
    const matchesSearch = Object.values(request).some(value =>
      String(value).toLowerCase().includes(searchTerm.toLowerCase())
    );
    const matchesStatus = !selectedStatus || request.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredRequests.length / rowsPerPage);
  const paginatedRequests = filteredRequests.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );



  if (isLoading) {
    return (
      <div className="space-y-4 p-4">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="grid grid-cols-6 gap-4 animate-pulse bg-white p-4 rounded-lg shadow"
          >
            {[...Array(6)].map((_, j) => (
              <Skeleton key={j} className="h-6 w-16 rounded-full bg-gray-300" />
            ))}
          </div>
        ))}
      </div>
    );
  }



  return (
    <div className="space-y-4">
      <ToastContainer />
      <div className="flex flex-col md:flex-row gap-4 p-4 md:px-0 md:w-3/5">
        <div className="flex-1">
          <input
            type="text"
            placeholder={t("searchPlaceholder")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-[#043755] px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#043755]"
          />
        </div>
        <div className="flex gap-2">

          <button
            onClick={resetFilters}
            disabled={clearLoading}
            className="px-4 py-2 bg-[#043755] text-white rounded-lg hover:bg-[#032b42] transition-colors flex items-center justify-center min-w-[100px]"
          >
            {clearLoading ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              t("clear")
            )}
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg shadow mx-2 md:mx-0">
        <table className="min-w-full bg-white border border-gray-200 rounded-lg shadow-md">
          <thead className="bg-[#043755] text-white text-left">
            <tr>
              <th className="py-3 px-4">{t("requester")}</th>
              <th className="py-3 px-4">{t("approver")}</th>
              <th className="py-3 px-4">{t("pickup")}</th>
              <th className="py-3 px-4">{t("destination")}</th>
              <th className="py-3 px-4">{t("date")}</th>
              <th className="py-3 px-4">{t("status")}</th>
            </tr>
          </thead>
          <tbody>
            {paginatedRequests.map((request) => (
              <tr
                key={request.request_id}
                className={`border-t text-[#043755] border-gray-100 hover:bg-gray-50 ${request.status === "pending" ? "cursor-pointer" : "cursor-default"
                  }`}
              >
                <td className="py-3 px-4">{capitalizeFirstLetters(request.requester_name)}</td>
                <td className="py-3 px-4">{capitalizeFirstLetters(request.approver_name)}</td>
                <td className="py-3 px-4">{capitalizeFirstLetters(request.pickup_location)}</td>
                <td className="py-3 px-4">{capitalizeFirstLetters(request.destination)}</td>
                <td className="py-3 px-4">{new Date(request.created_at).toLocaleDateString()}</td>
                <td className="py-3 px-4">
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-sm px-3 py-1 rounded-full font-medium ${statusColors[request.status.toLowerCase()] || "bg-gray-200 text-gray-800"
                        }`}
                    >
                      {t(`statusLabels.${request.status.toLowerCase()}`)}
                    </span>
                    {request.status.toLowerCase() === "approved" && (
                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => openModal(request, 'assign')}
                          disabled={assignLoading}
                          className="px-3 py-1 bg-[#043755] text-white rounded-lg hover:bg-[#032b42] transition-colors text-sm flex items-center gap-1 min-w-[100px] justify-center"
                        >
                          {assignLoading ? (
                            <CircularProgress size={16} color="inherit" />
                          ) : (
                            <>
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
                              </svg>
                              {t("assign")}
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => openModal(request, 'reject')}
                          disabled={rejectLoading}
                          className="px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm flex items-center gap-1 min-w-[100px] justify-center"
                        >
                          {rejectLoading ? (
                            <CircularProgress size={16} color="inherit" />
                          ) : (
                            <>
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                              </svg>
                              {t("reject")}
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex justify-between items-center mt-4 px-4">
        <p className="text-sm text-gray-600">
          {t("showing")} {(currentPage - 1) * rowsPerPage + 1}–{Math.min(currentPage * rowsPerPage, filteredRequests.length)} {t("of")} {filteredRequests.length}
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 bg-[#043755] rounded hover:bg-gray-300 disabled:opacity-50"
          >
            {t("previous")}
          </button>
          <button
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-3 py-1 bg-[#043755] rounded hover:bg-gray-300 disabled:opacity-50"
          >
            {t("next")}
          </button>
        </div>
      </div>

      <VehicleAssignmentModal
        open={modalOpen}
        selectedRequest={selectedRequest}
        onClose={closeModal}
        mutate={mutate}
      />
    </div>
  );
}
