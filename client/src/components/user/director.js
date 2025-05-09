import { useState } from "react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useTranslations } from "next-intl";
import CircularProgress from "@mui/material/CircularProgress";

const formatDateTime = (dateTimeString) => {
  if (!dateTimeString) return '';
  const date = new Date(dateTimeString);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};

const DirectorDashboard = ({
  isDirector,
  requests,
  loading,
  handleApprove,
  handleReject,
  approvingRequests,
  rejectingRequests,
  rejectLoading,
  approveLoading,
}) => {
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const t = useTranslations("vehicleRequest");

  if (!isDirector) return null;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <CircularProgress />
      </div>
    );
  }

  const handleRejectClick = (request) => {
    setSelectedRequest(request);
    setShowRejectModal(true);
  };

  const handleConfirmReject = async () => {
    if (!rejectionReason.trim()) {
      return; // Don't proceed if reason is empty
    }
    try {
      await handleReject({ ...selectedRequest, rejection_reason: rejectionReason });
      setShowRejectModal(false);
      setRejectionReason("");
    } catch (error) {
      console.error('Error rejecting request:', error);
    }
  };

  return (
    <div className="max-w-7xl xxl:max-w-[1600px] w-full py-4 mx-auto px-4 md:px-0">
      {isDirector && (
        <div className="mb-6">
          {/* Incoming Requests */}
          <div className="space-y-4">
            {requests.map((request, index) => (
              <Dialog key={index}>
                <DialogTrigger asChild>
                  <div
                    onClick={() => setSelectedRequest(request)}
                    className="cursor-pointer p-4 bg-white shadow-md rounded-lg border border-[#043755] hover:bg-gray-50 transition"
                  >
                    <div>
                      <p className="text-[#043755] font-semibold">
                        Pickup: {request.pickup_location}
                      </p>
                      <p className="text-[#043755] font-semibold">
                        Destination: {request.destination}
                      </p>
                    </div>
                    <div className="flex justify-end gap-2 mt-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleApprove(request);
                        }}
                        disabled={approvingRequests[request.request_id]}
                        className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 flex items-center justify-center min-w-[100px]"
                      >
                        {approvingRequests[request.request_id] ? (
                          <CircularProgress size={20} color="inherit" />
                        ) : (
                          t("approve")
                        )}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRejectClick(request);
                        }}
                        disabled={rejectingRequests[request.request_id]}
                        className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 flex items-center justify-center min-w-[100px]"
                      >
                        {rejectingRequests[request.request_id] ? (
                          <CircularProgress size={20} color="inherit" />
                        ) : (
                          t("reject")
                        )}
                      </button>
                    </div>
                  </div>
                </DialogTrigger>

                <DialogContent>
                  <DialogTitle className="text-[#043755]">
                    Request Details
                  </DialogTitle>
                  {selectedRequest && (
                    <DialogDescription asChild>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[#043755]">
                          <div className="bg-[#9EC6F3] px-3 py-2 font-semibold rounded">
                            Pickup
                          </div>
                          <div className="py-2">
                            {selectedRequest.pickup_location}
                          </div>

                          <div className="bg-[#9EC6F3] px-3 py-2 font-semibold rounded">
                            Destination
                          </div>
                          <div className="py-2">
                            {selectedRequest.destination}
                          </div>

                          <div className="bg-[#9EC6F3] px-3 py-2 font-semibold rounded">
                            Start Time
                          </div>
                          <div className="py-2">
                            {formatDateTime(selectedRequest.start_dateTime)}
                          </div>

                          <div className="bg-[#9EC6F3] px-3 py-2 font-semibold rounded">
                            End Time
                          </div>
                          <div className="py-2">
                            {formatDateTime(selectedRequest.end_dateTiem)}
                          </div>

                          <div className="bg-[#9EC6F3] px-3 py-2 font-semibold rounded">
                            Requester
                          </div>
                          <div className="py-2">
                            {selectedRequest.requester?.full_name}
                          </div>

                          <div className="bg-[#9EC6F3] px-3 py-2 font-semibold rounded">
                            Reason
                          </div>
                          <div className="py-2">{selectedRequest.purpose}</div>

                          <div className="bg-[#9EC6F3] px-3 py-2 font-semibold rounded">
                            Urgency
                          </div>
                          <div className="py-2">{selectedRequest.urgency}</div>
                        </div>

                        <div className="flex flex-row justify-end gap-2 pt-4">
                          <button
                            onClick={() => handleApprove(selectedRequest)}
                            disabled={approvingRequests[selectedRequest.request_id]}
                            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 flex items-center justify-center min-w-[100px]"
                          >
                            {approvingRequests[selectedRequest.request_id] ? (
                              <CircularProgress size={20} color="inherit" />
                            ) : (
                              t("approve")
                            )}
                          </button>
                          <button
                            onClick={() => handleRejectClick(selectedRequest)}
                            disabled={rejectingRequests[selectedRequest.request_id]}
                            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 flex items-center justify-center min-w-[100px]"
                          >
                            {rejectingRequests[selectedRequest.request_id] ? (
                              <CircularProgress size={20} color="inherit" />
                            ) : (
                              t("reject")
                            )}
                          </button>
                        </div>
                      </div>
                    </DialogDescription>
                  )}
                </DialogContent>
              </Dialog>
            ))}
          </div>
        </div>
      )}

      {/* Reject Confirmation Modal */}
      <Dialog open={showRejectModal} onOpenChange={setShowRejectModal}>
        <DialogContent>
          <DialogTitle className="text-[#043755]">Confirm Rejection</DialogTitle>
          <DialogDescription>
            <div className="space-y-4">
              <p>Are you sure you want to reject this request?</p>
              <div>
                <label className="block text-[#043755] mb-2">
                  Rejection Reason *
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full p-2 border rounded-lg text-[#043755]"
                  rows="3"
                  placeholder="Enter reason for rejection"
                  required
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => {
                    setShowRejectModal(false);
                    setRejectionReason("");
                  }}
                  className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmReject}
                  disabled={!rejectionReason.trim() || rejectLoading}
                  className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center min-w-[100px]"
                >
                  {rejectLoading ? (
                    <CircularProgress size={20} color="inherit" />
                  ) : (
                    "Confirm Reject"
                  )}
                </button>
              </div>
            </div>
          </DialogDescription>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DirectorDashboard;
