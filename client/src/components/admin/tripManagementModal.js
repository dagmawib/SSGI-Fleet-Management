"use client";
import { Dialog, Transition } from "@headlessui/react";
import { Fragment, useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import CircularProgress from "@mui/material/CircularProgress";

const TripManagementModal = ({ open, assignment, onClose, mutate }) => {
  const t = useTranslations("tripManagement");
  const [kmBefore, setKmBefore] = useState("");
  const [kmAfter, setKmAfter] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [action, setAction] = useState(""); // "accept" or "complete"

  useEffect(() => {
    if (assignment) {
      // Determine action based on assignment status
      if (assignment.assignment_status === "Pending" || assignment.driver_status === "pending") {
        setAction("accept");
        setKmBefore("");
      } else if (assignment.assignment_status === "Accepted by Driver" || assignment.trip_id) {
        setAction("complete");
        setKmAfter("");
        // Pre-fill start mileage if available
        if (assignment.trip_details?.start_mileage) {
          setKmBefore(assignment.trip_details.start_mileage.toString());
        }
      }
    }
  }, [assignment]);

  const handleAccept = async () => {
    if (!kmBefore) {
      toast.error("Please enter the kilometer before start.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/driver/accept_requests`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          assignment_id: assignment.assignment_id,
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
      toast.success(data.message || "Assignment accepted successfully!");
      onClose();
      await mutate();
    } catch (error) {
      console.error("Error accepting request:", error);
      toast.error(error.message || "Failed to accept request");
    } finally {
      setIsLoading(false);
    }
  };

  const handleComplete = async () => {
    if (!kmAfter) {
      toast.error("Please enter the kilometer after trip.");
      return;
    }

    if (!assignment.trip_id) {
      toast.error("No active trip found. Please try again.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/driver/complete_trip`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          trip_id: assignment.trip_id,
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
            errorData.details.errors.end_mileage
          ) {
            errorMsg = errorData.details.errors.end_mileage[0];
          } else {
            errorMsg = errorData.error || errorData.message || errorMsg;
          }
        } catch {}
        toast.error(errorMsg);
        return;
      }

      const result = await response.json();
      toast.success(result.message || "Trip completed successfully!");
      onClose();
      await mutate();
    } catch (error) {
      console.error("Error submitting trip:", error);
      toast.error(error.message || "Failed to submit trip");
    } finally {
      setIsLoading(false);
    }
  };

  if (!assignment) return null;

  const isAcceptAction = action === "accept";

  return (
    <Transition appear show={open} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title
                  as="h3"
                  className="text-lg font-medium leading-6 text-gray-900"
                >
                  {isAcceptAction ? "Accept Assignment" : "Complete Trip"}
                </Dialog.Title>

                <div className="text-sm text-gray-600 mb-4">
                  {isAcceptAction
                    ? "Enter the starting mileage to accept this assignment."
                    : "Enter the ending mileage to complete this trip."}
                </div>

                <div className="text-[#043755] space-y-2 text-sm mb-4">
                  <p>
                    <strong>Requester:</strong> {assignment.requester?.name || assignment.requester_name}
                  </p>
                  <p>
                    <strong>Pickup:</strong> {assignment.pickup || assignment.pickup_location}
                  </p>
                  <p>
                    <strong>Destination:</strong> {assignment.destination}
                  </p>
                  <p>
                    <strong>Vehicle:</strong> {assignment.vehicle?.license_plate || assignment.vehicle_plate}
                  </p>
                  {assignment.driver && (
                    <p>
                      <strong>Driver:</strong> {assignment.driver.first_name} {assignment.driver.last_name}
                    </p>
                  )}
                </div>

                {isAcceptAction ? (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-[#043755] mb-2">
                      Kilometer Before Start *
                    </label>
                    <input
                      type="number"
                      className="w-full border border-gray-300 rounded px-3 py-2 text-[#043755] focus:ring-2 focus:ring-[#043755]"
                      value={kmBefore}
                      onChange={(e) => setKmBefore(e.target.value)}
                      placeholder="Enter starting mileage"
                      disabled={isLoading}
                      required
                    />
                  </div>
                ) : (
                  <div className="mt-4 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-[#043755] mb-2">
                        Start Mileage
                      </label>
                      <input
                        type="number"
                        className="w-full border border-gray-300 rounded px-3 py-2 text-[#043755] bg-gray-100"
                        value={kmBefore}
                        disabled
                        readOnly
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#043755] mb-2">
                        Kilometer After Trip *
                      </label>
                      <input
                        type="number"
                        className="w-full border border-gray-300 rounded px-3 py-2 text-[#043755] focus:ring-2 focus:ring-[#043755]"
                        value={kmAfter}
                        onChange={(e) => setKmAfter(e.target.value)}
                        placeholder="Enter ending mileage"
                        disabled={isLoading}
                        required
                      />
                    </div>
                  </div>
                )}

                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    className="inline-flex justify-center rounded-md border border-transparent bg-gray-100 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2"
                    onClick={onClose}
                    disabled={isLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className={`${
                      isAcceptAction
                        ? "bg-green-600 hover:bg-green-700"
                        : "bg-blue-600 hover:bg-blue-700"
                    } text-white px-4 py-2 rounded flex items-center justify-center min-w-[100px]`}
                    onClick={isAcceptAction ? handleAccept : handleComplete}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <CircularProgress size={18} color="inherit" />
                    ) : isAcceptAction ? (
                      "Accept"
                    ) : (
                      "Complete"
                    )}
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default TripManagementModal;

