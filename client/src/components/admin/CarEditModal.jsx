import React, { useState } from "react";
import Modal from "@mui/material/Modal";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import CircularProgress from "@mui/material/CircularProgress";
import useSWR from "swr";
import Autocomplete from "@mui/material/Autocomplete";

const fetcher = (url) => fetch(url).then((res) => res.json());

export default function CarEditModal({
  open,
  onClose,
  car,
  onEdit,
  onDelete,
  loading,
}) {
  const [form, setForm] = useState(car || {});
  const [driverSearch, setDriverSearch] = useState("");

  const {
    data: drivers = [],
    isLoading,
    error,
    mutate,
  } = useSWR("/api/get_all_drivers", fetcher);

  React.useEffect(() => {
    setForm(car || {});
  }, [car]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleEdit = () => {
    const payload = {
      ...form,
      driver_id: form.assigned_driver ? form.assigned_driver.id : null,
    };
    delete payload.assigned_driver;

    onEdit(payload, "edit");
  };

  const handleDelete = () => {
    onDelete(car.id, "delete");
  };

  // Filter drivers by search
  const filteredDrivers = Array.isArray(drivers)
    ? drivers.filter((driver) =>
        (driver.first_name + " " + driver.last_name)
          .toLowerCase()
          .includes(driverSearch.toLowerCase())
      )
    : [];

  if (!drivers) return null;

  return (
    <Modal open={open} onClose={onClose}>
      <Box
        className="absolute top-1/2 left-1/2 bg-white p-6 rounded-lg shadow-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto"
        style={{ transform: "translate(-50%, -50%)" }}
      >
        <h2 className="text-xl font-semibold mb-4 text-center text-black">
          Edit Vehicle
        </h2>

        {/* Grid for two-column layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-black">
          <TextField
            label="License Plate"
            name="license_plate"
            value={form.license_plate || ""}
            onChange={handleChange}
            fullWidth
          />
          <TextField
            label="Make"
            name="make"
            value={form.make || ""}
            onChange={handleChange}
            fullWidth
          />
          <TextField
            label="Model"
            name="model"
            value={form.model || ""}
            onChange={handleChange}
            fullWidth
          />
          <TextField
            label="Year"
            name="year"
            value={form.year || ""}
            onChange={handleChange}
            fullWidth
          />
          <div>
            <label className="block text-sm font-medium mb-1">Category</label>
            <select
              name="category"
              value={form.category || ""}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded px-3 py-2"
            >
              <option value="field">Field</option>
              <option value="pool">Pool</option>
            </select>
          </div>
          <TextField
            label="Capacity"
            name="capacity"
            value={form.capacity || ""}
            onChange={handleChange}
            fullWidth
          />
          <TextField
            label="Current Mileage"
            name="current_mileage"
            value={form.current_mileage || ""}
            onChange={handleChange}
            fullWidth
          />
          <TextField
            label="Last Maintenance"
            name="last_service_date"
            value={form.last_service_date || ""}
            onChange={handleChange}
            fullWidth
          />
          <TextField
            label="Next Maintenance Mileage"
            name="next_service_mileage"
            value={form.next_service_mileage || ""}
            onChange={handleChange}
            fullWidth
          />
          <TextField
            label="Fuel Type"
            name="fuel_type"
            value={form.fuel_type || ""}
            onChange={handleChange}
            fullWidth
          />
          <TextField
            label="Fuel Efficiency"
            name="fuel_efficiency"
            value={form.fuel_efficiency || ""}
            onChange={handleChange}
            fullWidth
          />
          {/* Driver Dropdown */}
          <div>
            <label className="block text-sm font-medium mb-1">Driver</label>
            <Autocomplete
              options={drivers}
              getOptionLabel={(driver) =>
                driver ? `${driver.first_name} ${driver.last_name}` : ""
              }
              value={form.assigned_driver || null}
              onChange={(e, newValue) => {
                setForm({ ...form, assigned_driver: newValue });
              }}
              isOptionEqualToValue={(option, value) => option.id === value?.id}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Driver"
                  placeholder="Search driver"
                  size="small"
                />
              )}
              fullWidth
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <Button onClick={onClose} variant="outlined">
            Cancel
          </Button>
          <Button
            onClick={handleDelete}
            color="error"
            variant="contained"
            disabled={loading === "delete"}
          >
            {loading === "delete" ? <CircularProgress size={18} /> : "Delete"}
          </Button>
          <Button
            onClick={handleEdit}
            color="primary"
            variant="contained"
            disabled={loading === "edit"}
          >
            {loading === "edit" ? <CircularProgress size={18} /> : "Edit"}
          </Button>
        </div>
      </Box>
    </Modal>
  );
}
