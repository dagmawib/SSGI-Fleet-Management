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
  const t = useTranslations("assignModal");

  const handleAction = () => {
    if (selectedRequest.action === 'assign') {
      if (!selectedCarId) return alert("Please select a car.");
      onAssign(selectedRequest.id, selectedCarId);
    } else {
      onReject(selectedRequest.id);
    }
    onClose();
  };

  const isAssignAction = selectedRequest?.action === 'assign';

  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="w-full max-w-md bg-white rounded-lg shadow p-6 space-y-4">
          <Dialog.Title className="text-lg font-semibold text-[#043755]">
            {isAssignAction ? t("assignTitle") : t("rejectTitle")}
          </Dialog.Title>

          <div className="text-sm text-gray-600 mb-4">
            {isAssignAction 
              ? t("assignConfirmation")
              : t("rejectConfirmation")}
          </div>

          {selectedRequest && (
            <div className="text-[#043755] space-y-2 text-sm">
              <p><strong>{t("requester")}:</strong> {selectedRequest.requester}</p>
              <p><strong>{t("approver")}:</strong> {selectedRequest.approver}</p>
              <p><strong>{t("pickup")}:</strong> {selectedRequest.pickup}</p>
              <p><strong>{t("destination")}:</strong> {selectedRequest.destination}</p>
              <p><strong>{t("date")}:</strong> {selectedRequest.date}</p>

              {isAssignAction && (
                <>
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-[#043755] mb-2">
                      {t("comment")}
                    </label>
                    <textarea
                      className="w-full border border-gray-300 rounded px-3 py-2 text-[#043755] focus:ring-2 focus:ring-[#043755]"
                      rows="3"
                      placeholder={t("commentPlaceholder")}
                    />
                  </div>

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
                </>
              )}
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
              className={`${
                isAssignAction 
                  ? "bg-green-600 hover:bg-green-700" 
                  : "bg-red-600 hover:bg-red-700"
              } text-white px-4 py-2 rounded`}
              onClick={handleAction}
            >
              {isAssignAction ? t("assign") : t("reject")}
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};

export default VehicleAssignmentModal;
