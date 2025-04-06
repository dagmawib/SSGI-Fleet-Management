"use client";
import React, { useState } from "react";
import VehicleAssignmentModal from "@/components/admin/vehicleAssignementModal"; // Ensure this path is correct

const requests = [
  {
    id: 1,
    requester: "John Doe",
    pickup: "Addis Ababa",
    destination: "Adama",
    date: "2025-04-06",
    approver: "Sarah Johnson",
    status: "pending",
  },
  {
    id: 2,
    requester: "Mimi Tesfaye",
    pickup: "Bahir Dar",
    destination: "Gondar",
    date: "2025-04-07",
    approver: "Michael Asfaw",
    status: "assigned",
  },
  {
    id: 3,
    requester: "Abel Haile",
    pickup: "Hawassa",
    destination: "Shashemene",
    date: "2025-04-05",
    approver: "Liya Alemu",
    status: "rejected",
  },
];

const cars = [
  {
    vehicle_id: 1,
    license_plate: "ABC-1234",
    make: "Toyota",
    model: "Corolla",
    year: 2020,
    color: "Silver",
    vehicle_type: "Sedan",
    capacity: 5,
    status: "available",
    current_mileage: 45000.5,
    last_maintenance_date: "2024-12-01",
    next_maintenance_mileage: 50000,
    fuel_type: "Petrol",
    fuel_efficiency: 15.2,
  },
  {
    vehicle_id: 2,
    license_plate: "XYZ-5678",
    make: "Hyundai",
    model: "Santa Fe",
    year: 2018,
    color: "White",
    vehicle_type: "SUV",
    capacity: 7,
    status: "maintenance",
    current_mileage: 88000.75,
    last_maintenance_date: "2025-01-15",
    next_maintenance_mileage: 95000,
    fuel_type: "Diesel",
    fuel_efficiency: 12.4,
  },
];

const statusColors = {
  pending: "bg-yellow-100 text-yellow-800",
  assigned: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
};

export default function RequestTable() {
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [selectedCarId, setSelectedCarId] = useState("");
  const [modalOpen, setModalOpen] = useState(false);

  const handleAssign = () => {
    // Implement actual logic for assignment
    console.log("Assigned Car ID: ", selectedCarId, "to Request ID: ", selectedRequest.id);
    closeModal();
  };

  const handleReject = () => {
    // Implement actual logic for rejection
    console.log("Rejected Request ID: ", selectedRequest.id);
    closeModal();
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedRequest(null);
    setSelectedCarId("");
  };

  const openModal = (request) => {
    setSelectedRequest(request);
    setModalOpen(true);
  };

  return (
    <div className="overflow-x-auto rounded-lg shadow mx-2 md:mx-0">
      <table className="min-w-full bg-white border border-gray-200 rounded-lg shadow-md">
        <thead className="bg-[#043755] text-white text-left">
          <tr>
            <th className="py-3 px-4">Requester</th>
            <th className="py-3 px-4">Approver</th>
            <th className="py-3 px-4">Pickup</th>
            <th className="py-3 px-4">Destination</th>
            <th className="py-3 px-4">Date</th>
            <th className="py-3 px-4">Status</th>
          </tr>
        </thead>
        <tbody>
          {requests.map((request) => (
            <tr
              key={request.id}
              className={`border-t text-[#043755] border-gray-100 hover:bg-gray-50 ${
                request.status === "pending" ? "cursor-pointer" : "cursor-default"
              }`}
              onClick={() =>
                request.status === "pending" ? openModal(request) : null
              }
            >
              <td className="py-3 px-4">{request.requester}</td>
              <td className="py-3 px-4">{request.approver}</td>
              <td className="py-3 px-4">{request.pickup}</td>
              <td className="py-3 px-4">{request.destination}</td>
              <td className="py-3 px-4">{request.date}</td>
              <td className="py-3 px-4">
                <span
                  className={`text-sm px-3 py-1 rounded-full font-medium ${
                    statusColors[request.status] || "bg-gray-200 text-gray-800"
                  }`}
                >
                  {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <VehicleAssignmentModal
        open={modalOpen}
        selectedRequest={selectedRequest}
        cars={cars}
        onClose={closeModal}
        onAssign={handleAssign}
        onReject={handleReject}
        selectedCarId={selectedCarId}
        setSelectedCarId={setSelectedCarId}
      />
    </div>
  );
}
