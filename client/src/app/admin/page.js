import React from "react";
import RequestTable from "@/components/admin/requestTable"; // Ensure this path is correct
import CarsTable from "@/components/admin/carsTable"; // Ensure this path is correct	

export default function Page() {
  return (
    <div className="max-w-7xl xxl:max-w-[1600px] w-full mx-auto py-6 bg-white my-4">
      <h2 className="text-2xl font-semibold text-[#043755]">Requests</h2>
      <RequestTable />

      <h2 className="text-2xl font-semibold text-[#043755] mt-8">Cars</h2>
      <CarsTable />
    </div>
  );
}
