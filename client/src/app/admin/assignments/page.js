"use client";
import React, { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import CircularProgress from "@mui/material/CircularProgress";
import useSWR from "swr";

const fetcher = (url) => fetch(url).then((res) => res.json());

export default function Page() {
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [tripId, setTripId] = useState(null);
  const [acceptLoading, setAcceptLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [declineLoading, setDeclineLoading] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [kmBeforeMap, setKmBeforeMap] = useState({}); // Track kmBefore for each assignment
  const [kmAfterMap, setKmAfterMap] = useState({}); // Track kmAfter for each assignment
  const t = useTranslations("driverDashboard"); // Using same translations

  // Using admin API endpoints - gets ALL drivers' assignments
  const {
    data: allAssignments = [],
    error: requestError,
    isLoading: loading,
    mutate: refetchAssignments,
  } = useSWR("/api/admin/active_assignments", fetcher, {
    refreshInterval: 1000, // Poll every 1 second
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
  });

  const {
    data: completedTripsData,
    error: completedTripsError,
    isLoading: completedTripsLoading,
    mutate: refetchCompletedTrips,
  } = useSWR("/api/admin/completed_trips", fetcher);
  const completedTrips = completedTripsData?.trips || [];

  // Update tripId when assignments change
  useEffect(() => {
    const acceptedAssignment = allAssignments.find(
      (assignment) =>
        assignment.assignment_status === "Accepted by Driver" &&
        assignment.trip_id
    );
    if (acceptedAssignment) {
      setTripId(acceptedAssignment.trip_id);
    }
  }, [allAssignments]);

  const handleAccept = async (assignment) => {
    const kmBeforeValue = kmBeforeMap[assignment.assignment_id] || "";
    if (!kmBeforeValue) {
      toast.error("Please enter the kilometer before start.");
      return;
    }

    setAcceptLoading(true);
    try {
      const response = await fetch("/api/admin/accept_requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          assignment_id: assignment.assignment_id,
          start_mileage: parseFloat(kmBeforeValue),
        }),
      });

      if (!response.ok) {
        let errorMsg = "Failed to accept request";
        try {
          const errorData = await response.json();
          // Check for nested error structure
          if (errorData.details?.errors?.error?.[0]) {
            const errorString = errorData.details.errors.error[0];
            // Extract the readable error message
            if (errorString.includes("Mileage must be")) {
              // Extract: "Mileage must be ≥ vehicle's current mileage (5221223 km)"
              const match = errorString.match(/Mileage must be[^)]*\)/);
              errorMsg = match ? match[0] : errorString;
            } else {
              errorMsg = errorString;
            }
          } else if (errorData.details?.errors?.start_mileage) {
            errorMsg = Array.isArray(errorData.details.errors.start_mileage)
              ? errorData.details.errors.start_mileage[0]
              : errorData.details.errors.start_mileage;
          } else if (errorData.error) {
            errorMsg = errorData.error;
          } else if (errorData.message) {
            errorMsg = errorData.message;
          }
        } catch (parseError) {
          console.error("Error parsing error response:", parseError);
        }
        toast.error(errorMsg, { autoClose: 15000 });
        return;
      }

      const data = await response.json();
      setKmBeforeMap((prev) => {
        const newMap = { ...prev };
        delete newMap[assignment.assignment_id];
        return newMap;
      });
      toast.success(data.message || "Request accepted successfully!");
      await refetchAssignments();
    } catch (error) {
      console.error("Error accepting request:", error);
      toast.error(error.message || "Failed to accept request");
    } finally {
      setAcceptLoading(false);
    }
  };

  const handleDecline = async (assignment) => {
    if (!rejectionReason.trim()) {
      toast.error("Please enter a reason for declining the request");
      return;
    }

    setDeclineLoading(true);
    try {
      const response = await fetch("/api/admin/decline_request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          assignment_id: assignment.assignment_id,
          rejection_reason: rejectionReason,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to decline request");
      }
      setShowDeclineModal(false);
      setRejectionReason("");
      setSelectedAssignment(null);
      toast.success("Request declined successfully!");
      await refetchAssignments();
    } catch (error) {
      console.error("Error declining request:", error);
      toast.error(error.message || "Failed to decline request");
    } finally {
      setDeclineLoading(false);
    }
  };

  const handleSubmit = async (assignment) => {
    const kmAfterValue = kmAfterMap[assignment.assignment_id] || "";
    if (!kmAfterValue) {
      toast.error("Please enter the kilometer after trip.");
      return;
    }

    const tripIdToUse = assignment.trip_id || tripId;
    if (!tripIdToUse) {
      toast.error("No active trip found. Please try again.");
      return;
    }

    setSubmitLoading(true);
    try {
      const response = await fetch("/api/admin/complete_trip", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          trip_id: tripIdToUse,
          end_mileage: parseFloat(kmAfterValue),
        }),
      });

      if (!response.ok) {
        let errorMsg = "Failed to submit trip";
        try {
          const errorData = await response.json();
          // Check for nested error structure
          if (errorData.details?.errors?.error?.[0]) {
            const errorString = errorData.details.errors.error[0];
            // Extract the readable error message
            if (errorString.includes("Mileage must be")) {
              // Extract: "Mileage must be ≥ vehicle's current mileage (5221223 km)"
              const match = errorString.match(/Mileage must be[^)]*\)/);
              errorMsg = match ? match[0] : errorString;
            } else {
              errorMsg = errorString;
            }
          } else if (errorData.details?.errors?.end_mileage) {
            errorMsg = Array.isArray(errorData.details.errors.end_mileage)
              ? errorData.details.errors.end_mileage[0]
              : errorData.details.errors.end_mileage;
          } else if (errorData.details?.errors?.start_mileage) {
            errorMsg = Array.isArray(errorData.details.errors.start_mileage)
              ? errorData.details.errors.start_mileage[0]
              : errorData.details.errors.start_mileage;
          } else if (errorData.error) {
            errorMsg = errorData.error;
          } else if (errorData.message) {
            errorMsg = errorData.message;
          }
        } catch (parseError) {
          console.error("Error parsing error response:", parseError);
        }
        toast.error(errorMsg, { autoClose: 15000 });
        return;
      }

      const result = await response.json();
      setKmAfterMap((prev) => {
        const newMap = { ...prev };
        delete newMap[assignment.assignment_id];
        return newMap;
      });
      toast.success(result.message || "Trip completed successfully!");

      await Promise.all([
        refetchAssignments(),
        refetchCompletedTrips()
      ]);
    } catch (error) {
      console.error("Error submitting trip:", error);
      toast.error(error.message || "Failed to submit trip");
    } finally {
      setSubmitLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#043755]"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl xxl:max-w-[1600px] w-full mx-auto p-6 bg-white shadow-md rounded-lg my-4">
      <ToastContainer
        position="top-right"
        autoClose={10000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-[#043755]">
            Admin Dashboard - All Active Assignments
          </h2>
          <p className="text-[#043755]">Manage all drivers' assignments</p>
        </div>
      </div>

      {/* Show all active assignments count */}
      {allAssignments.length > 0 && (
        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-[#043755] font-medium">
            Total Active Assignments: {allAssignments.length}
          </p>
        </div>
      )}

      {/* Display all assignments in a table */}
      {allAssignments.length > 0 ? (
        <div className="mt-6">
          <h3 className="text-xl font-medium text-[#043755] mb-4">
            {t("upcomingRequest")} - All Active Assignments
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200">
              <thead className="bg-[#043755] text-white">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-normal uppercase tracking-wider">
                    Driver
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-normal uppercase tracking-wider">
                    {t("pickup")}
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-normal uppercase tracking-wider">
                    {t("destination")}
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-normal uppercase tracking-wider">
                    {t("requester")}
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-normal uppercase tracking-wider">
                    {t("department")}
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-normal uppercase tracking-wider">
                    {t("passengers")}
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-normal uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-normal uppercase tracking-wider">
                    {t("kmBefore")}
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-normal uppercase tracking-wider">
                    {t("kmAfter")}
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-normal uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {allAssignments.map((assignment) => (
                  <tr key={assignment.assignment_id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-[#043755]">
                      {assignment.driver_name || "N/A"}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-[#043755]">
                      {assignment.pickup}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-[#043755]">
                      {assignment.destination}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-[#043755]">
                      {assignment.requester?.name || "N/A"}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-[#043755]">
                      {assignment.requester?.department || "N/A"}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-[#043755]">
                      {assignment.trip_details?.passenger_count || assignment.passenger || "N/A"}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-[#043755]">
                      <span className={`px-2 py-1 rounded text-xs ${
                        assignment.assignment_status === "Accepted by Driver"
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}>
                        {assignment.assignment_status}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm">
                      <input
                        type="number"
                        className="w-24 border border-gray-300 rounded px-2 py-1 text-sm text-black font-medium bg-white focus:outline-none focus:ring-2 focus:ring-[#043755] disabled:bg-gray-100 disabled:text-black"
                        value={
                          assignment.assignment_status === "Accepted by Driver" &&
                          assignment.trip_details?.start_mileage !== undefined
                            ? assignment.trip_details.start_mileage
                            : kmBeforeMap[assignment.assignment_id] || ""
                        }
                        onChange={(e) =>
                          setKmBeforeMap((prev) => ({
                            ...prev,
                            [assignment.assignment_id]: e.target.value,
                          }))
                        }
                        disabled={
                          assignment.assignment_status === "Accepted by Driver"
                        }
                        placeholder="KM"
                      />
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm">
                      <input
                        type="number"
                        className="w-24 border border-gray-300 rounded px-2 py-1 text-sm text-black font-medium bg-white focus:outline-none focus:ring-2 focus:ring-[#043755] disabled:bg-gray-100 disabled:text-black"
                        value={kmAfterMap[assignment.assignment_id] || ""}
                        onChange={(e) =>
                          setKmAfterMap((prev) => ({
                            ...prev,
                            [assignment.assignment_id]: e.target.value,
                          }))
                        }
                        disabled={
                          assignment.assignment_status !== "Accepted by Driver"
                        }
                        placeholder="KM"
                      />
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm">
                      <div className="flex gap-2">
                        {assignment.assignment_status === "Accepted by Driver" ? (
                          <button
                            onClick={() => handleSubmit(assignment)}
                            disabled={submitLoading}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs flex items-center"
                          >
                            {submitLoading ? (
                              <CircularProgress size={14} color="inherit" />
                            ) : (
                              t("submit")
                            )}
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={() => handleAccept(assignment)}
                              disabled={acceptLoading}
                              className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs flex items-center"
                            >
                              {acceptLoading ? (
                                <CircularProgress size={14} color="inherit" />
                              ) : (
                                t("accept")
                              )}
                            </button>
                            <button
                              onClick={() => {
                                setSelectedAssignment(assignment);
                                setShowDeclineModal(true);
                              }}
                              className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-xs"
                            >
                              {t("decline")}
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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

      {/* Decline Modal */}
      {showDeclineModal && selectedAssignment && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 px-4"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.05)" }}
        >
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h3 className="text-xl font-semibold text-[#043755] mb-4">
              {t("declineRequest")}
            </h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("reasonForDecline")}
              </label>
              <textarea
                className="w-full border border-gray-300 rounded px-3 py-2 text-[#043755]"
                rows="4"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder={t("enterReason")}
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowDeclineModal(false);
                  setRejectionReason("");
                  setSelectedAssignment(null);
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
                disabled={declineLoading}
              >
                {t("cancel")}
              </button>
              <button
                onClick={() => handleDecline(selectedAssignment)}
                disabled={declineLoading}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded flex items-center justify-center min-w-[100px]"
              >
                {declineLoading ? (
                  <CircularProgress size={20} color="inherit" />
                ) : (
                  t("confirmDecline")
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mt-6">
        <h3 className="text-xl font-medium text-[#043755] mb-4">
          {t("completedTrips")}
        </h3>
        {completedTripsLoading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#043755]"></div>
          </div>
        ) : completedTrips?.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200">
              <thead className="bg-[#043755] text-white">
                <tr>
                  <th className="px-3 py-3 text-left text-sm font-normal uppercase tracking-wider">
                    Driver
                  </th>
                  <th className="px-3 py-3 text-left text-sm font-normal uppercase tracking-wider">
                    {t("pickup")}
                  </th>
                  <th className="px-3 py-3 text-left text-sm font-normal uppercase tracking-wider">
                    {t("destination")}
                  </th>
                  <th className="px-3 py-3 text-left text-sm font-normal uppercase tracking-wider">
                    {t("purpose")}
                  </th>
                  <th className="px-3 py-3 text-left text-sm font-normal uppercase tracking-wider">
                    {t("passengers")}
                  </th>
                  <th className="px-3 py-3 text-left text-sm font-normal uppercase tracking-wider">
                    {t("startMileage")}
                  </th>
                  <th className="px-3 py-3 text-left text-sm font-normal uppercase tracking-wider">
                    {t("endMileage")}
                  </th>
                  <th className="px-3 py-3 text-left text-sm font-normal uppercase tracking-wider">
                    {t("requester")}
                  </th>
                  <th className="px-3 py-3 text-left text-sm font-normal uppercase tracking-wider">
                    {t("requesterPhone")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {completedTrips.map((trip, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-[#043755]">
                      {trip.driver_name || "N/A"}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-[#043755]">
                      {trip.trip_details?.pickup}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-[#043755]">
                      {trip.trip_details?.destination}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-[#043755]">
                      {trip.purpose}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-[#043755]">
                      {trip.passengers}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-[#043755]">
                      {trip.trip_details?.start_mileage}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-[#043755]">
                      {trip.trip_details?.end_mileage}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-[#043755]">
                      {trip.requester?.name}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-[#043755]">
                      {trip.requester?.phone}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-gray-50 p-4 rounded-lg shadow-sm">
            <p className="text-[#043755]">{t("noCompletedTrips")}</p>
          </div>
        )}
      </div>
    </div>
  );
}



