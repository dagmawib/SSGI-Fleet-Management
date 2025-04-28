"use client";
import React, { useState } from "react";
import VehicleAssignmentModal from "@/components/admin/vehicleAssignementModal"; 
import { useTranslations } from "next-intl"; 
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
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const t = useTranslations("RequestTable"); 

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

  const openModal = (request, action) => {
    setSelectedRequest({...request, action});
    setModalOpen(true);
  };

  const resetFilters = () => {
    setSearchTerm("");
    setSelectedStatus("");
  };

  // Filter requests based on search term and selected status
  const filteredRequests = requests.filter(request => {
    const matchesSearch = Object.values(request).some(value => 
      String(value).toLowerCase().includes(searchTerm.toLowerCase())
    );
    const matchesStatus = !selectedStatus || request.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-4">
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
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full text-[#043755] px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#043755]"
          >
            <option value="">{t("status")}</option>
            <option value="pending">{t("statusLabels.pending")}</option>
            <option value="assigned">{t("statusLabels.assigned")}</option>
            <option value="rejected">{t("statusLabels.rejected")}</option>
          </select>
          <button
            onClick={resetFilters}
            className="px-4 py-2 bg-[#043755] text-white rounded-lg hover:bg-[#032b42] transition-colors"
          >
            {t("clear")}
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
            {filteredRequests.map((request) => (
              <tr
                key={request.id}
                className={`border-t text-[#043755] border-gray-100 hover:bg-gray-50 ${
                  request.status === "pending" ? "cursor-pointer" : "cursor-default"
                }`}
              >
                <td className="py-3 px-4">{request.requester}</td>
                <td className="py-3 px-4">{request.approver}</td>
                <td className="py-3 px-4">{request.pickup}</td>
                <td className="py-3 px-4">{request.destination}</td>
                <td className="py-3 px-4">{request.date}</td>
                <td className="py-3 px-4">
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-sm px-3 py-1 rounded-full font-medium ${
                        statusColors[request.status] || "bg-gray-200 text-gray-800"
                      }`}
                    >
                      {t(`statusLabels.${request.status}`)}
                    </span>
                    {request.status === "pending" && (
                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => openModal(request, 'assign')}
                          className="px-3 py-1 bg-[#043755] text-white rounded-lg hover:bg-[#032b42] transition-colors text-sm flex items-center gap-1"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
                          </svg>
                          {t("assign")}
                        </button>
                        <button
                          onClick={() => openModal(request, 'reject')}
                          className="px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm flex items-center gap-1"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                          {t("reject")}
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
