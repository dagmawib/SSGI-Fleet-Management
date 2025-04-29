import { useState } from "react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

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
  handleApprove,
  handleReject,
}) => {
  const [selectedRequest, setSelectedRequest] = useState(null);

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
                    <div className="flex flex-wrap justify-start sm:justify-end gap-2 my-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleApprove(request);
                        }}
                        className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                      >
                        Approve
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleReject(request);
                        }}
                        className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                      >
                        Reject
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
                            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleReject(selectedRequest)}
                            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                          >
                            Reject
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
    </div>
  );
};

export default DirectorDashboard;
