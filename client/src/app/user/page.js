"use client";
import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";
import MapComponent from "@/components/map/MapComponent";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { getCookie } from 'cookies-next';
import DirectorDashboard from "@/components/user/director";


// Zod validation schema
const formSchema = z.object({
  pickupLocation: z.string().min(1, "Pickup Location is required"),
  destination: z.string().min(1, "Destination is required"),
  startDate: z.string().min(1, "Start date and time is required"),
  endDate: z.string().min(1, "End date and time is required"),
  passengers: z.array(z.object({
    name: z.string().min(1, "Passenger name is required")
  })).min(1, "At least one passenger is required"),
  reason: z.string().min(1, "Reason is required"),
  urgency: z.string().min(1, "Urgency Level is required"),
}).refine((data) => {
  const start = new Date(data.startDate);
  const end = new Date(data.endDate);
  return end > start;
}, {
  message: "End date must be after start date",
  path: ["endDate"],
});

export default function Page() {
  const [isDirector, setIsDirector] = useState(false);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const t = useTranslations("vehicleRequest");

  useEffect(() => {
    const role = getCookie('role');
    if (role === 'director') {
      setIsDirector(true);
      fetchPendingRequests();
    }
  }, []);

  const fetchPendingRequests = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/pending_requests_for_director');

      if (!response.ok) {
        throw new Error('Failed to fetch pending requests');
      }

      const data = await response.json();
      setPendingRequests(data.requests || []);
    } catch (error) {
      console.error('Error fetching pending requests:', error);
      toast.error(t("fetchError"), {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (request) => {
    try {
      const response = await fetch('/api/approve_request', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: request.request_id }),
      });

      if (!response.ok) {
        throw new Error('Failed to approve request');
      }

      toast.success(t("requestApproved"), {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });

      // Refresh the pending requests list
      fetchPendingRequests();
    } catch (error) {
      console.error('Error approving request:', error);
      toast.error(t("approveError"), {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    }
  };

  const handleReject = async (request) => {
    try {
      const response = await fetch('/api/directoral_reject', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: request.request_id }),
      });

      if (!response.ok) {
        throw new Error('Failed to reject request');
      }

      toast.success(t("requestRejected"), {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });

      // Refresh the pending requests list
      fetchPendingRequests();
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast.error(t("rejectError"), {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    }
  };

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      passengers: [{ name: "" }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "passengers",
  });

  const onSubmit = async (data) => {
    try {
      const passengerCount = data.passengers.filter(passenger => passenger.name.trim() !== '').length;

      // Get all non-empty passenger names
      const passengerNames = data.passengers
        .filter(passenger => passenger.name.trim() !== '')
        .map(passenger => passenger.name.trim());

      const requestData = {
        pickup_location: data.pickupLocation,
        destination: data.destination,
        start_dateTime: data.startDate,
        end_dateTime: data.endDate,
        passenger_count: passengerCount,
        passenger_names: passengerNames, // Add passenger names array
        purpose: data.reason,
        urgency: data.urgency,
      };

      const response = await fetch('/api/vehicle_request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit request');
      }

      const result = await response.json();

      // Show success toast
      toast.success(t("requestSubmitted"), {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });

      // Reset form after successful submission
      reset();

    } catch (error) {
      console.error('Error submitting request:', error);

      // Show error toast
      toast.error(t("submitError") + ": " + error.message, {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
    }
  };

  return (
    <div className="max-w-7xl xxl:max-w-[1600px] w-full py-4 mx-auto">
      {/* Director Dashboard */}
      {isDirector && (
        <DirectorDashboard
          isDirector={isDirector}
          requests={pendingRequests}
          loading={loading}
          handleApprove={handleApprove}
          handleReject={handleReject}
        />
      )}
      <ToastContainer />
      <div className="justify-between flex flex-col sm:flex-row bg-white px-4 md:px-0 space-y-6 sm:space-y-0 sm:space-x-8">
        {/* Form Section */}
        <div className="w-full sm:w-1/2 px-6 py-2 ring-1 ring-[#043755] rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold text-[#043755] mb-2 text-center">
            {t("title")}
          </h2>
          <p className="text-[#043755] text-center mb-2">{t("description")}</p>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Pickup Location */}
            <div className="mb-2">
              <label className="block text-[#043755] mb-2">
                {t("pickupLocation")}
                <span className="text-red-500">*</span>
              </label>
              <input
                {...register("pickupLocation")}
                type="text"
                className="w-full px-4 py-2 border rounded-lg text-[#043755] focus:ring-2 focus:ring-[#043755]"
                placeholder="Enter pickup location"
              />
              {errors.pickupLocation && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.pickupLocation.message}
                </p>
              )}
            </div>

            {/* Destination */}
            <div className="mb-2">
              <label className="block text-[#043755] mb-2">
                {t("dropoffLocation")}
                <span className="text-red-500">*</span>
              </label>
              <input
                {...register("destination")}
                type="text"
                className="w-full px-4 py-2 border rounded-lg text-[#043755] focus:ring-2 focus:ring-[#043755]"
                placeholder="Enter destination"
              />
              {errors.destination && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.destination.message}
                </p>
              )}
            </div>

            {/* Duration */}
            <div className="mb-2">
              <label className="block text-[#043755] mb-2">
                {t("Duration")}
                <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-[#043755] mb-1">
                    {t("startDateTime")}
                  </label>
                  <input
                    {...register("startDate")}
                    type="datetime-local"
                    className="w-full px-4 py-2 border rounded-lg text-[#043755] focus:ring-2 focus:ring-[#043755]"
                  />
                  {errors.startDate && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.startDate.message}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm text-[#043755] mb-1">
                    {t("endDateTime")}
                  </label>
                  <input
                    {...register("endDate")}
                    type="datetime-local"
                    className="w-full px-4 py-2 border rounded-lg text-[#043755] focus:ring-2 focus:ring-[#043755]"
                  />
                  {errors.endDate && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.endDate.message}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Name of Passengers */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-[#043755] text-base font-medium">
                  {t("passangers")}
                  <span className="text-red-500">*</span>
                </label>

                <button
                  type="button"
                  onClick={() => append({ name: "" })}
                  className="w-8 h-8 rounded-full bg-[#043755] text-white flex items-center justify-center hover:bg-opacity-90"
                >
                  +
                </button>
              </div>

              <div className="space-y-2">
                {fields.map((field, index) => (
                  <div key={field.id} className="flex gap-2">
                    <input
                      {...register(`passengers.${index}.name`)}
                      type="text"
                      placeholder={`${t("passanger")} ${index + 1}`}
                      className="w-full px-4 py-2 border rounded-lg text-[#043755] focus:ring-2 focus:ring-[#043755]"
                    />
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      className="w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-opacity-90"
                    >
                      -
                    </button>
                  </div>
                ))}
              </div>
              {errors.passengers && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.passengers.message}
                </p>
              )}
            </div>

            {/* Reason */}
            <div className="mb-2">
              <label className="block text-[#043755] mb-2">
                {t("Reason")}
                <span className="text-red-500">*</span>
              </label>
              <input
                {...register("reason")}
                type="text"
                className="w-full px-4 py-2 border rounded-lg text-[#043755] focus:ring-2"
                placeholder="Enter reason"
              />
              {errors.reason && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.reason.message}
                </p>
              )}
            </div>

            {/* Urgency Level */}
            <div className="mb-4">
              <label className="block text-[#043755] mb-2">
                {t("urgency")}
                <span className="text-red-500">*</span>
              </label>
              <select
                {...register("urgency")}
                className="w-full px-4 py-2 border rounded-lg text-[#043755] focus:ring-2"
              >
                <option value="">{t("selectUrgency")}</option>
                <option value="Regular">{t("regular")}</option>
                <option value="Priority">{t("priority")}</option>
                <option value="Emergency">{t("emergency")}</option>
              </select>
              {errors.urgency && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.urgency.message}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full bg-[#043755] text-white py-2 rounded-lg hover:bg-opacity-90 transition"
            >
              {t("submit")}
            </button>
          </form>
        </div>

        {/* Map Section */}
        <MapComponent />
      </div>
    </div>
  );
}
