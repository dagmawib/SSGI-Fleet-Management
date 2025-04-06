"use client";
import { Dialog } from "@headlessui/react";
import { useTranslations } from "next-intl";

const VehicleAssignmentModal = ({
  open,
  selectedRequest,
  cars,
  onClose,
  onAssign,
  onReject,
  selectedCarId,
  setSelectedCarId,
}) => {
  const handleAssign = () => {
    if (!selectedCarId) return alert("Please select a car.");
    onAssign(selectedRequest.id, selectedCarId);
    onClose();
  };

  const handleReject = () => {
    onReject(selectedRequest.id);
    onClose();
  };

  const t = useTranslations("assignModal");

  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="w-full max-w-md bg-white rounded-lg shadow p-6 space-y-4">
          <Dialog.Title className="text-lg font-semibold text-[#043755]">
            {t("title")}
          </Dialog.Title>

          {selectedRequest && (
            <div className="text-[#043755] space-y-2 text-sm">
              <p><strong>{t("requester")}:</strong> {selectedRequest.requester}</p>
              <p><strong>{t("approver")}:</strong> {selectedRequest.approver}</p>
              <p><strong>{t("pickup")}:</strong> {selectedRequest.pickup}</p>
              <p><strong>{t("destination")}:</strong> {selectedRequest.destination}</p>
              <p><strong>{t("date")}:</strong> {selectedRequest.date}</p>

              <label className="block mt-4 text-sm font-medium">
                {t("selectVehicleLabel")}
              </label>
              <select
                className="w-full border border-gray-300 rounded px-3 py-2"
                value={selectedCarId}
                onChange={(e) => setSelectedCarId(e.target.value)}
              >
                <option value="">{t("selectPlaceholder")}</option>
                {cars.map((car) => (
                  <option key={car.vehicle_id} value={car.vehicle_id}>
                    {car.make} {car.model} - {car.license_plate}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <button
              className="bg-gray-200 hover:bg-gray-300 text-[#043755] px-4 py-2 rounded"
              onClick={onClose}
            >
              {t("cancel")}
            </button>
            <button
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
              onClick={handleReject}
            >
              {t("reject")}
            </button>
            <button
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
              onClick={handleAssign}
            >
              {t("assign")}
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};

export default VehicleAssignmentModal;
