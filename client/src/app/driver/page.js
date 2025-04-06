"use client";
import React, { useState } from "react";

export default function Page() {
  const [hasUpcomingRequest, setHasUpcomingRequest] = useState(true);
  const [accepted, setAccepted] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [kmBefore, setKmBefore] = useState("");
  const [kmAfter, setKmAfter] = useState("");

  const upcomingRequest = {
    pickupLocation: "Addis Ababa",
    destination: "Adama",
    requester: {
      name: "John Doe",
      department: "IT",
      phone: "+251912345678",
    },
    passengers: 3,
  };

  const handleAccept = () => {
    if (!kmBefore) {
      alert("Please enter the kilometer before start.");
      return;
    }
    setAccepted(true);
  };

  const handleDecline = () => {
    setHasUpcomingRequest(false);
    setAccepted(false);
    setKmBefore("");
    setKmAfter("");
  };

  const handleSubmit = () => {
    if (!kmAfter) {
      alert("Please enter the kilometer after trip.");
      return;
    }

    // Do something with the data
    console.log("Trip submitted:", {
      kmBefore,
      kmAfter,
      request: upcomingRequest,
    });

    // Reset states or navigate
    setSubmitted(true);
  };

  return (
    <div className="max-w-7xl xxl:max-w-[1600px] w-full mx-auto p-6 bg-white shadow-md rounded-lg my-4">
      <h2 className="text-2xl font-semibold text-[#043755]">
        Driver Dashboard
      </h2>
      <p className="text-[#043755]">Manage your driver profile and trips.</p>

      {hasUpcomingRequest && !submitted ? (
        <div className="mt-6 bg-blue-50 p-4 rounded-lg shadow-sm border border-blue-200">
          <h3 className="text-xl font-medium text-[#043755] mb-4">
            Upcoming Request
          </h3>
          <div className="space-y-2 text-[#043755]">
            <p>
              <strong>Pickup:</strong> {upcomingRequest.pickupLocation}
            </p>
            <p>
              <strong>Destination:</strong> {upcomingRequest.destination}
            </p>
            <p>
              <strong>Requester:</strong> {upcomingRequest.requester.name}
            </p>
            <p>
              <strong>Department:</strong>{" "}
              {upcomingRequest.requester.department}
            </p>
            <p>
              <strong>Phone:</strong> {upcomingRequest.requester.phone}
            </p>
            <p>
              <strong>Passengers:</strong> {upcomingRequest.passengers}
            </p>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block mb-1 text-sm font-medium">
                  Kilo Meter Before Start
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
                  Kilo Meter After Trip
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
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
                  >
                    Accept
                  </button>
                  <button
                    onClick={handleDecline}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
                  >
                    Decline
                  </button>
                </>
              ) : (
                <button
                  onClick={handleSubmit}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
                >
                  Submit
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-6">
          <h3 className="text-xl font-medium text-[#043755] mb-4">
            Upcoming Trips
          </h3>
          <div className="bg-gray-50 p-4 rounded-lg shadow-sm mb-4">
            <p className="text-[#043755]">No upcoming trips scheduled.</p>
          </div>
        </div>
      )}

      <div className="mt-6">
        <h3 className="text-xl font-medium text-[#043755] mb-4">
          Completed Trips
        </h3>
        <div className="bg-gray-50 p-4 rounded-lg shadow-sm mb-4">
          <p className="text-[#043755]">No completed trips yet.</p>
        </div>
      </div>
    </div>
  );
}
