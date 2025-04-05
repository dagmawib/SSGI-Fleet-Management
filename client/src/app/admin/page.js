import React from "react";

export function DriverPage() {
  return (
    <div className="max-w-7xl xxl:max-w-[1600px] w-full mx-auto p-6 bg-white shadow-md rounded-lg my-4">
      <h2 className="text-2xl font-semibold text-[#043755]">
        Driver Dashboard
      </h2>
      <p className="text-[#043755]">Manage your driver profile and trips.</p>

      <div className="mt-6">
        <h3 className="text-xl font-medium text-[#043755] mb-4">
          Upcoming Trips
        </h3>
        {/* Here you can map through upcoming trips data */}
        <div className="bg-gray-50 p-4 rounded-lg shadow-sm mb-4">
          <p className="text-[#043755]">No upcoming trips scheduled.</p>
        </div>
      </div>

      <div className="mt-6">
        <h3 className="text-xl font-medium text-[#043755] mb-4">
          Completed Trips
        </h3>
        {/* Here you can map through completed trips data */}
        <div className="bg-gray-50 p-4 rounded-lg shadow-sm mb-4">
          <p className="text-[#043755]">No completed trips yet.</p>
        </div>
      </div>
    </div>
  );
}
