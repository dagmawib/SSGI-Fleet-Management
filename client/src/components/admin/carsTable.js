"use client";

import React from "react";

const mockCars = [
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
  available: "text-green-600 bg-green-100",
  on_work: "text-blue-600 bg-blue-100",
  maintenance: "text-yellow-600 bg-yellow-100",
  accident: "text-red-600 bg-red-100",
};

export default function CarsTable() {
  return (
    <div className="overflow-auto bg-white rounded-lg shadow border mx-2 md:mx-0">
      <table className="min-w-full table-auto text-sm">
        <thead className="bg-[#043755] text-white">
          <tr>
            <th className="px-4 py-2 text-left">License Plate</th>
            <th className="px-4 py-2 text-left">Make</th>
            <th className="px-4 py-2 text-left">Model</th>
            <th className="px-4 py-2 text-left">Year</th>
            <th className="px-4 py-2 text-left">Color</th>
            <th className="px-4 py-2 text-left">Type</th>
            <th className="px-4 py-2 text-left">Capacity</th>
            <th className="px-4 py-2 text-left">Current Mileage</th>
            <th className="px-4 py-2 text-left">Last Maintenance</th>
            <th className="px-4 py-2 text-left">Next Maintenance Mileage</th>
            <th className="px-4 py-2 text-left">Fuel Type</th>
            <th className="px-4 py-2 text-left">Fuel Efficiency (km/l)</th>
            <th className="px-4 py-2 text-left">Status</th>
          </tr>
        </thead>
        <tbody>
          {mockCars.map((car) => (
            <tr
              key={car.vehicle_id}
              className="border-t hover:bg-gray-50 transition text-[#043755]"
            >
              <td className="px-4 py-2">{car.license_plate}</td>
              <td className="px-4 py-2">{car.make}</td>
              <td className="px-4 py-2">{car.model}</td>
              <td className="px-4 py-2">{car.year}</td>
              <td className="px-4 py-2">{car.color}</td>
              <td className="px-4 py-2">{car.vehicle_type}</td>
              <td className="px-4 py-2">{car.capacity}</td>
              <td className="px-4 py-2">{car.current_mileage}</td>
              <td className="px-4 py-2">{car.last_maintenance_date}</td>
              <td className="px-4 py-2">{car.next_maintenance_mileage}</td>
              <td className="px-4 py-2">{car.fuel_type}</td>
              <td className="px-4 py-2">{car.fuel_efficiency}</td>
              <td className="px-4 py-2">
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    statusColors[car.status] || "bg-gray-100 text-gray-600"
                  }`}
                >
                  {car.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
