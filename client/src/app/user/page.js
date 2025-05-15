"use client";
import { useState, useEffect, useCallback } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";
import MapComponent from "@/components/map/MapComponent";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { getCookie } from 'cookies-next';
import DirectorDashboard from "@/components/user/director";
import CircularProgress from "@mui/material/CircularProgress";
import axios from "axios";
import LocationOnIcon from '@mui/icons-material/LocationOn';


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
  const [submitLoading, setSubmitLoading] = useState(false);
  const [addPassengerLoading, setAddPassengerLoading] = useState(false);
  const [removePassengerLoading, setRemovePassengerLoading] = useState(false);
  const [approvingRequests, setApprovingRequests] = useState({});
  const [rejectingRequests, setRejectingRequests] = useState({});


  // Suggestions
  const [pickupSuggestions, setPickupSuggestions] = useState([]);
  const [destinationSuggestions, setDestinationSuggestions] = useState([]);
  const [pickupLoading, setPickupLoading] = useState(false);
  const [destinationLoading, setDestinationLoading] = useState(false);
  const [pickupCoords, setPickupCoords] = useState(null); // { lat: number, lng: number } or null
  const [destinationCoords, setDestinationCoords] = useState(null); // { lat: number, lng: number } or null
  const [pickupLocation, setPickupLocation] = useState(""); // Store location name
  const [destination, setDestination] = useState(""); // Store location name

  const [geolocationStatus, setGeolocationStatus] = useState('idle'); // 'idle', 'loading', 'success', 'error'


  const t = useTranslations("vehicleRequest");
  const now = new Date();
  const localISOTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16); // Format: "YYYY-MM-DDTHH:MM"

    const {
      register,
      handleSubmit,
      control,
      setValue,
      reset,
      formState: { errors },
    } = useForm({
      resolver: zodResolver(formSchema),
      defaultValues: {
        passengers: [{ name: "" }],
      },
    });
  
    
    const getCurrentLocation = useCallback(() => {
      setGeolocationStatus('loading');
      
      if (!navigator.geolocation) {
        setGeolocationStatus('error');
        toast.error(t("geolocationNotSupported"), {
          position: "top-right",
          autoClose: 5000,
        });
        return;
      }
    
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            
            // Reverse geocode to get address
            const response = await axios.get('https://nominatim.openstreetmap.org/reverse', {
              params: {
                lat: latitude,
                lon: longitude,
                format: 'json',
                addressdetails: 1,
              },
              headers: {
                'User-Agent': 'VehicleRequestApp/1.0 (your.email@example.com)',
              },
            });
    
            const address = response.data.display_name;
            
            // Update form values
            setValue('pickupLocation', address);
            setPickupLocation(address);
            setPickupCoords({ lat: latitude, lng: longitude });
            
            setGeolocationStatus('success');
            toast.success("Location Set Successfully", {
              position: "top-right",
              autoClose: 3000,
            });
          } catch (error) {
            console.error('Reverse geocoding error:', error);
            setGeolocationStatus('error');
            toast.error("Address Lookup Failed", {
              position: "top-right",
              autoClose: 5000,
            });
          }
        },
        (error) => {
          console.error('Geolocation error:', error);
          setGeolocationStatus('error');
          toast.error("Location Access Denied", {
            position: "top-right",
            autoClose: 5000,
          });
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        }
      );
    }, [setValue, t]);

    const fetchNominatimSuggestions = async (input, type) => {
      if (input.length < 3) {
        type === 'pickup' ? setPickupSuggestions([]) : setDestinationSuggestions([]);
        return;
      }
      try {
        type === 'pickup' ? setPickupLoading(true) : setDestinationLoading(true);
        const response = await axios.get('https://nominatim.openstreetmap.org/search', {
          params: {
            q: input,
            format: 'json',
            limit: 5,
            addressdetails: 1,  
            countrycodes: 'ET'
          },
          headers: {
            'User-Agent': 'VehicleRequestApp/1.0 (your.email@example.com)', // Replace with your app name and email
          },
        });
        const suggestions = response.data.map(item => ({
          id: item.place_id,
          description: item.display_name,
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon),

        }));
        type === 'pickup' ? setPickupSuggestions(suggestions) : setDestinationSuggestions(suggestions);
      } catch (error) {
        console.error(`Error fetching ${type} suggestions:`, error);
        toast.error(t("autocompleteError"), {
          position: "top-right",
          autoClose: 5000,
        });
      } finally {
        type === 'pickup' ? setPickupLoading(false) : setDestinationLoading(false);
      }
    };
  
    // Debounce function to limit API calls
    const debounce = (func, wait) => {
      let timeout;
      return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
      };
    };
  
    const debouncedFetchSuggestions = useCallback(
      debounce(fetchNominatimSuggestions, 300),
      []
    );
  




  const fetchPendingRequests = useCallback(async () => {
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
      });
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    const role = getCookie('role');
    if (role === 'director') {
      setIsDirector(true);
      fetchPendingRequests();
    }
    if (!pickupCoords && setValue) {
      getCurrentLocation();
    }
  }, [fetchPendingRequests, getCurrentLocation, pickupCoords]);


  const handleApprove = async (request) => {
    try {
      setApprovingRequests(prev => ({ ...prev, [request.request_id]: true }));

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
    } finally {
      setApprovingRequests(prev => ({ ...prev, [request.request_id]: false }));
    }
  };

  const handleReject = async (request) => {
    try {
      setRejectingRequests(prev => ({ ...prev, [request.request_id]: true }));

      const response = await fetch('/api/directoral_reject', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          request_id: request.request_id,
          reason: request.rejection_reason
        }),
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
    } finally {
      setRejectingRequests(prev => ({ ...prev, [request.request_id]: false }));
    }
  };

 



  const { fields, append, remove } = useFieldArray({
    control,
    name: "passengers",
  });

  const onSubmit = async (data) => {
    setSubmitLoading(true);
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
        passenger_names: passengerNames,
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

      toast.success(t("requestSubmitted"), {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });

      reset();

    } catch (error) {
      console.error('Error submitting request:', error);
      toast.error(t("submitError") + ": " + error.message, {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
    } finally {
      setSubmitLoading(false);
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
          approvingRequests={approvingRequests}
          rejectingRequests={rejectingRequests}
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
              <div className="relative">
                <input
                  {...register("pickupLocation")}
                  type="text"
                  className="w-full px-4 py-2 border rounded-lg text-[#043755] focus:ring-2 focus:ring-[#043755]"
                  placeholder={
                    geolocationStatus === 'loading' 
                      ? "Detecting Location" 
                      : "Pickup Location"
                  }
                  disabled={geolocationStatus === 'loading'}
                  onChange={(e) => {
                    setValue("pickupLocation", e.target.value);
                    setPickupLocation(e.target.value);
                    debouncedFetchSuggestions(e.target.value, 'pickup');
                  }}
                />
                {/* After the pickup location input */}
                  <div className="flex items-center mt-2">
                    <button
                      type="button"
                      onClick={getCurrentLocation}
                      disabled={geolocationStatus === 'loading'}
                      className="flex items-center text-sm text-[#043755] hover:underline"
                    >
                      {geolocationStatus === 'loading' ? (
                        <>
                          <CircularProgress size={16} className="mr-1" />
                          {"Detecting Location"}
                        </>
                      ) : (
                        <>
                          <LocationOnIcon fontSize="small" className="mr-1" />
                          {"Use Current Location"}
                        </>
                      )}
                    </button>
                    {geolocationStatus === 'error' && (
                      <span className="text-red-500 text-sm ml-2">{"Location Error"}</span>
                    )}
                  </div>
                {pickupSuggestions.length > 0 && (
                    <div className="absolute w-full bg-white border border-gray-300 rounded-md shadow-lg z-10 max-h-60 overflow-y-auto">
                      {pickupLoading ? (
                        <div className="px-4 py-2 text-gray-500">Loading...</div>
                      ) : (
                        pickupSuggestions.map((suggestion) => (
                          <div
                            key={suggestion.id}
                            className="px-4 py-2 text-sm text-gray-800 cursor-pointer hover:bg-blue-100"
                            onClick={() => {
                              setValue("pickupLocation", suggestion.description);
                              setPickupCoords({ lat: suggestion.lat, lng: suggestion.lng });
                              setPickupSuggestions([]);
                            }}
                          >
                            {suggestion.description}
                          </div>
                        ))
                      )}
                        </div>
                      )}
              </div>
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
              <div className="relative">
                <input
                  {...register("destination")}
                  type="text"
                  className="w-full px-4 py-2 border rounded-lg text-[#043755] focus:ring-2 focus:ring-[#043755]"
                  placeholder={t("destinationPlaceholder")}
                  onChange={(e) => {
                    setValue("destination", e.target.value);
                    setDestination(e.target.value);
                    debouncedFetchSuggestions(e.target.value, 'destination');
                  }}
                />
                {destinationSuggestions.length > 0 && (
                  <div className="absolute w-full bg-white border border-gray-300 rounded-md shadow-lg z-10 max-h-60 overflow-y-auto">
                    {destinationLoading ? (
                        <div className="px-4 py-2 text-gray-500">Loading...</div>
                      ) : (
                        destinationSuggestions.map((suggestion) => (
                          <div
                            key={suggestion.id}
                            className="px-4 py-2 text-sm text-gray-800 cursor-pointer hover:bg-blue-100"
                            onClick={() => {
                              setValue("destination", suggestion.description);
                              setDestinationCoords({ lat: suggestion.lat, lng: suggestion.lng });
                              setDestinationSuggestions([]);
                            }}
                          >
                            {suggestion.description}
                          </div>
                        ))
                      )}
                  </div>
                )}
              </div>
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
                    min={localISOTime}
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
                    min={localISOTime}
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
                  onClick={() => {
                    setAddPassengerLoading(true);
                    append({ name: "" });
                    setAddPassengerLoading(false);
                  }}
                  disabled={addPassengerLoading}
                  className="w-8 h-8 rounded-full bg-[#043755] text-white flex items-center justify-center hover:bg-opacity-90 min-w-[32px] min-h-[32px]"
                >
                  {addPassengerLoading ? (
                    <CircularProgress size={16} color="inherit" />
                  ) : (
                    "+"
                  )}
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
                      onClick={() => {
                        setRemovePassengerLoading(true);
                        remove(index);
                        setRemovePassengerLoading(false);
                      }}
                      disabled={removePassengerLoading}
                      className="w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-opacity-90 min-w-[32px] min-h-[32px]"
                    >
                      {removePassengerLoading ? (
                        <CircularProgress size={16} color="inherit" />
                      ) : (
                        "-"
                      )}
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
                placeholder={t("reasonPlaceholder")}
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
              disabled={submitLoading}
              className="w-full bg-[#043755] text-white py-2 rounded-lg hover:bg-opacity-90 transition flex items-center justify-center min-h-[40px]"
            >
              {submitLoading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                t("submit")
              )}
            </button>
          </form>
        </div>

        {/* Map Section */}
        <MapComponent
          pickupCoords={pickupCoords}
          destinationCoords={destinationCoords}
          pickupLocation={pickupLocation}
          destination={destination}
        />
      </div>
    </div>
  );
}
