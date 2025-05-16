"use client";
import React, { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import CircularProgress from "@mui/material/CircularProgress";
import useSWR from "swr";

const fetcher = (url) => fetch(url).then((res) => res.json());

export default function Page() {
  const [accepted, setAccepted] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [kmBefore, setKmBefore] = useState("");
  const [kmAfter, setKmAfter] = useState("");
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [tripId, setTripId] = useState(null);
  const [acceptLoading, setAcceptLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [declineLoading, setDeclineLoading] = useState(false);
  const t = useTranslations("driverDashboard");

  const {
    data: upcomingRequest,
    error: requestError,
    isLoading: loading,
  } = useSWR("/api/driver/get_requests", fetcher);
  const hasUpcomingRequest =
    upcomingRequest && Array.isArray(upcomingRequest)
      ? upcomingRequest.length > 0
      : !!upcomingRequest;

  const {
    data: completedTripsData,
    error: completedTripsError,
    isLoading: completedTripsLoading,
    mutate: refetchCompletedTrips,
  } = useSWR("/api/driver/completed_trips", fetcher);
  const completedTrips = completedTripsData?.trips || [];

  const handleAccept = async () => {
    if (!kmBefore) {
      toast.error("Please enter the kilometer before start.");
      return;
    }

    setAcceptLoading(true);
    try {
      const response = await fetch("/api/driver/accept_requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          assignment_id: upcomingRequest.assignment_id,
          start_mileage: parseFloat(kmBefore),
        }),
      });

      if (!response.ok) {
        let errorMsg = "Failed to accept request";
        try {
          const errorData = await response.json();
          if (
            errorData.details &&
            errorData.details.errors &&
            errorData.details.errors.start_mileage
          ) {
            errorMsg = errorData.details.errors.start_mileage[0];
          } else {
            errorMsg = errorData.error || errorData.message || errorMsg;
          }
        } catch {}
        toast.error(errorMsg);
        return;
      }

      const data = await response.json();
      setTripId(data.trip_id);
      setAccepted(true);
      toast.success(data.message || "Request accepted successfully!");
    } catch (error) {
      console.error("Error accepting request:", error);
      toast.error(error.message || "Failed to accept request");
    } finally {
      setAcceptLoading(false);
    }
  };

  const handleDecline = async () => {
    if (!rejectionReason.trim()) {
      toast.error("Please enter a reason for declining the request");
      return;
    }
    setDeclineLoading(true);
    try {
      const response = await fetch("/api/driver/decline_request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          assignment_id: upcomingRequest.assignment_id,
          rejection_reason: rejectionReason,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to decline request");
      }
      setAccepted(false);
      setKmBefore("");
      setKmAfter("");
      setShowDeclineModal(false);
      setRejectionReason("");
      toast.success("Request declined successfully!");
    } catch (error) {
      console.error("Error declining request:", error);
      toast.error(error.message || "Failed to decline request");
    } finally {
      setDeclineLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!kmAfter) {
      toast.error("Please enter the kilometer after trip.");
      return;
    }

    if (!tripId) {
      toast.error("No active trip found. Please try again.");
      return;
    }

    setSubmitLoading(true);
    try {
      const response = await fetch("/api/driver/complete_trip", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          trip_id: tripId,
          end_mileage: parseFloat(kmAfter),
        }),
      });

      if (!response.ok) {
        let errorMsg = "Failed to submit trip";
        try {
          const errorData = await response.json();
          if (
            errorData.details &&
            errorData.details.errors &&
            errorData.details.errors.start_mileage
          ) {
            errorMsg = errorData.details.errors.start_mileage[0];
          } else {
            errorMsg = errorData.error || errorData.message || errorMsg;
          }
        } catch {}
        toast.error(errorMsg);
        return;
      }

      const result = await response.json();
      setSubmitted(true);
      setAccepted(false);
      setKmBefore("");
      setKmAfter("");
      setTripId(null);
      toast.success(result.message || "Trip completed successfully!");

      await refetchCompletedTrips();
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
        autoClose={3000}
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
            {t("title")}
          </h2>
          <p className="text-[#043755]">{t("description")}</p>
        </div>
      </div>

      {hasUpcomingRequest && !submitted && upcomingRequest ? (
        <div className="mt-6 bg-blue-50 p-4 rounded-lg shadow-sm border border-blue-200">
          <h3 className="text-xl font-medium text-[#043755] mb-4">
            {t("upcomingRequest")}
          </h3>
          <div className="space-y-2 text-[#043755]">
            <p>
              <strong>{t("pickup")}:</strong> {upcomingRequest.pickup}
            </p>
            <p>
              <strong>{t("destination")}:</strong> {upcomingRequest.destination}
            </p>
            <p>
              <strong>{t("requester")}:</strong>{" "}
              {upcomingRequest.requester?.name}
            </p>
            <p>
              <strong>{t("department")}:</strong>{" "}
              {upcomingRequest.requester?.department}
            </p>
            <p>
              <strong>{t("phone")}:</strong> {upcomingRequest.requester?.phone}
            </p>
            <p>
              <strong>{t("passengers")}:</strong> {upcomingRequest.passenger}
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
                    disabled={acceptLoading}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded flex items-center justify-center min-w-[100px]"
                  >
                    {acceptLoading ? (
                      <CircularProgress size={20} color="inherit" />
                    ) : (
                      t("accept")
                    )}
                  </button>
                  <button
                    onClick={() => setShowDeclineModal(true)}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
                  >
                    {t("decline")}
                  </button>
                </>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={submitLoading}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center justify-center min-w-[100px]"
                >
                  {submitLoading ? (
                    <CircularProgress size={20} color="inherit" />
                  ) : (
                    t("submit")
                  )}
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

      {/* Decline Modal */}
      {showDeclineModal && (
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
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
                disabled={declineLoading}
              >
                {t("cancel")}
              </button>
              <button
                onClick={handleDecline}
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
