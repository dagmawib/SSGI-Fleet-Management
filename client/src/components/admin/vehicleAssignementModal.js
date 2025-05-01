"use client";
import { Dialog, Transition } from '@headlessui/react';
import { Fragment, useState, useEffect } from 'react';
import { useTranslations } from "next-intl";
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const VehicleAssignmentModal = ({
  open,
  selectedRequest,
  onClose,
  onAssign,
  onReject,
}) => {
  const t = useTranslations("assignModal");
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [note, setNote] = useState('');

  console.log(selectedRequest);

  useEffect(() => {
    const fetchAvailableVehicles = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/get_vehicles');
        if (!response.ok) {
          throw new Error('Failed to fetch available vehicles');
        }
        const data = await response.json();
        const availableVehicles = data.filter(vehicle => vehicle.status === 'available');
        setVehicles(availableVehicles);
      } catch (error) {
        console.error('Error fetching available vehicles:', error);
        toast.error('Failed to fetch available vehicles');
      } finally {
        setIsLoading(false);
      }
    };

    if (open) {
      fetchAvailableVehicles();
    }
  }, [open]);

  const handleAction = async () => {
    if (selectedRequest.action === 'assign') {
      if (!selectedVehicle) {
        toast.error('Please select a vehicle');
        return;
      }
      try {
        setIsLoading(true);
        const response = await fetch('/api/admin/assign', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            request_id: selectedRequest.request_id,
            vehicle_id: selectedVehicle,
            note: note.trim()
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to assign vehicle');
        }

        toast.success('Vehicle assigned successfully');
        onAssign(selectedRequest.request_id, selectedVehicle);
        onClose();
      } catch (error) {
        console.error('Error assigning vehicle:', error);
        toast.error('Failed to assign vehicle');
      } finally {
        setIsLoading(false);
      }
    } else {
      if (!note.trim()) {
        toast.error('Please provide a reason for rejection');
        return;
      }
      try {
        setIsLoading(true);
        const response = await fetch('/api/admin/reject', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            request_id: selectedRequest.request_id,
            note: note.trim()
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to reject request');
        }

        toast.success('Request rejected successfully');
        onReject(selectedRequest.request_id);
        onClose();
      } catch (error) {
        console.error('Error rejecting request:', error);
        toast.error('Failed to reject request');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const isAssignAction = selectedRequest?.action === 'assign';

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
                  {isAssignAction ? t("assignTitle") : t("rejectTitle")}
                </Dialog.Title>

                <div className="text-sm text-gray-600 mb-4">
                  {isAssignAction
                    ? t("assignConfirmation")
                    : t("rejectConfirmation")}
                </div>

                {selectedRequest && (
                  <div className="text-[#043755] space-y-2 text-sm">
                    <p><strong>{t("requester")}:</strong> {selectedRequest.requester_name}</p>
                    <p><strong>{t("approver")}:</strong> {selectedRequest.approver_name}</p>
                    <p><strong>{t("pickup")}:</strong> {selectedRequest.pickup_location}</p>
                    <p><strong>{t("destination")}:</strong> {selectedRequest.destination}</p>
                    <p><strong>{t("date")}:</strong> {new Date(selectedRequest.created_at).toLocaleDateString()}</p>

                    {isAssignAction ? (
                      <>
                        <div className="mt-4">
                          <label className="block text-sm font-medium text-[#043755] mb-2">
                            {t("comment")}
                          </label>
                          <textarea
                            className="w-full border border-gray-300 rounded px-3 py-2 text-[#043755] focus:ring-2 focus:ring-[#043755]"
                            rows="3"
                            placeholder={t("commentPlaceholder")}
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            disabled={isLoading}
                          />
                        </div>

                        <label className="block mt-4 text-sm font-medium">
                          {t("selectVehicleLabel")}
                        </label>
                        <select
                          className="w-full border border-gray-300 rounded px-3 py-2"
                          value={selectedVehicle}
                          onChange={(e) => setSelectedVehicle(e.target.value)}
                          disabled={isLoading}
                        >
                          <option value="">{t("selectPlaceholder")}</option>
                          {vehicles.map((vehicle) => (
                            <option key={vehicle.id} value={vehicle.id}>
                              {vehicle.make} {vehicle.model} - {vehicle.license_plate}
                            </option>
                          ))}
                        </select>
                      </>
                    ) : (
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-[#043755] mb-2">
                          {t("rejectReason")}
                        </label>
                        <textarea
                          className="w-full border border-gray-300 rounded px-3 py-2 text-[#043755] focus:ring-2 focus:ring-[#043755]"
                          rows="3"
                          placeholder={t("rejectReasonPlaceholder")}
                          value={note}
                          onChange={(e) => setNote(e.target.value)}
                          disabled={isLoading}
                        />
                      </div>
                    )}
                  </div>
                )}

                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    className="inline-flex justify-center rounded-md border border-transparent bg-gray-100 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2"
                    onClick={onClose}
                    disabled={isLoading}
                  >
                    {t("cancel")}
                  </button>
                  <button
                    type="button"
                    className={`${isAssignAction
                      ? "bg-green-600 hover:bg-green-700"
                      : "bg-red-600 hover:bg-red-700"
                      } text-white px-4 py-2 rounded`}
                    onClick={handleAction}
                    disabled={isLoading}
                  >
                    {isLoading ? 'Processing...' : (isAssignAction ? t("assign") : t("reject"))}
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

export default VehicleAssignmentModal;