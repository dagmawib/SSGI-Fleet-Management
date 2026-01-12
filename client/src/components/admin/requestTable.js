"use client";
import React, { useState } from "react";
import VehicleAssignmentModal from "@/components/admin/vehicleAssignementModal";
import TripManagementModal from "@/components/admin/tripManagementModal";
import { useTranslations } from "next-intl";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import CircularProgress from "@mui/material/CircularProgress";

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
  const [tripModalOpen, setTripModalOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [assignLoading, setAssignLoading] = useState(false);
  const [rejectLoading, setRejectLoading] = useState(false);
  const [clearLoading, setClearLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;
  const { data: requests = [], isLoading, error, mutate } = useSWR("/api/admin/requests", fetcher);
  const { data: activeAssignments = [], isLoading: assignmentsLoading, mutate: mutateAssignments } = useSWR("/api/admin/active_assignments", fetcher);

  const t = useTranslations("RequestTable");

  const closeModal = () => {
    setModalOpen(false);
    setSelectedRequest(null);
    setSelectedCarId("");
    setRejectLoading(false); 
    setAssignLoading(false); 
  };

  const openModal = (request, action) => {
    setSelectedRequest({ ...request, action });
    setModalOpen(true);
    setRejectLoading(false); 
    setAssignLoading(false); 
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
          <div className="flex justify-center items-center h-32">
            <CircularProgress />
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
                <td className="py-3 px-4">{capitalizeFirstLetters(request.pickup_location.length > 20 ? request.pickup_location.slice(0, 20) + "..." : request.pickup_location)}</td>
                <td className="py-3 px-4">{capitalizeFirstLetters(request.destination.length > 20 ? request.destination.slice(0, 20) + "..." : request.destination)}</td>
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

      {/* Active Assignments Section */}
      <div className="mt-8">
        <h3 className="text-xl font-semibold text-[#043755] mb-4">
          Active Assignments & Trips
        </h3>
        {assignmentsLoading ? (
          <div className="flex justify-center items-center h-32">
            <CircularProgress />
          </div>
        ) : activeAssignments.length > 0 ? (
          <div className="overflow-x-auto rounded-lg shadow mx-2 md:mx-0">
            <table className="min-w-full bg-white border border-gray-200 rounded-lg shadow-md">
              <thead className="bg-[#043755] text-white text-left">
                <tr>
                  <th className="py-3 px-4">Requester</th>
                  <th className="py-3 px-4">Driver</th>
                  <th className="py-3 px-4">Vehicle</th>
                  <th className="py-3 px-4">Pickup</th>
                  <th className="py-3 px-4">Destination</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Action</th>
                </tr>
              </thead>
              <tbody>
                {activeAssignments.map((assignment) => (
                  <tr
                    key={assignment.assignment_id || assignment.trip_id}
                    className="border-t text-[#043755] border-gray-100 hover:bg-gray-50"
                  >
                    <td className="py-3 px-4">
                      {assignment.requester?.name || assignment.requester_name || "-"}
                    </td>
                    <td className="py-3 px-4">
                      {assignment.driver?.first_name && assignment.driver?.last_name
                        ? `${assignment.driver.first_name} ${assignment.driver.last_name}`
                        : "-"}
                    </td>
                    <td className="py-3 px-4">
                      {assignment.vehicle?.license_plate || assignment.vehicle_plate || "-"}
                    </td>
                    <td className="py-3 px-4">
                      {assignment.pickup || assignment.pickup_location || "-"}
                    </td>
                    <td className="py-3 px-4">{assignment.destination || "-"}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-sm px-3 py-1 rounded-full font-medium ${
                          assignment.assignment_status === "Pending" ||
                          assignment.driver_status === "pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : assignment.assignment_status === "Accepted by Driver" ||
                              assignment.trip_id
                            ? "bg-blue-100 text-blue-800"
                            : "bg-gray-200 text-gray-800"
                        }`}
                      >
                        {assignment.assignment_status || assignment.driver_status || "Active"}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => {
                          setSelectedAssignment(assignment);
                          setTripModalOpen(true);
                        }}
                        className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                      >
                        {assignment.assignment_status === "Pending" ||
                        assignment.driver_status === "pending"
                          ? "Accept"
                          : "Complete"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-gray-50 p-4 rounded-lg shadow-sm">
            <p className="text-[#043755]">No active assignments or trips</p>
          </div>
        )}
      </div>

      <TripManagementModal
        open={tripModalOpen}
        assignment={selectedAssignment}
        onClose={() => {
          setTripModalOpen(false);
          setSelectedAssignment(null);
        }}
        mutate={() => {
          mutate();
          mutateAssignments();
        }}
      />
    </div>
  );
}
