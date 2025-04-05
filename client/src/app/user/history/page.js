"use client";

const requests = [
  { id: "#001", date: "11 Feb, 2024", requester: "John Doe", vehicle: "Sedan", driver: "Michael Smith", pickup: "Location A", destination: "Location B", reason: "Business Trip", status: "Accepted" },
  { id: "#002", date: "13 Feb, 2024", requester: "Alice Johnson", vehicle: "SUV", driver: "Robert Brown", pickup: "Location C", destination: "Location D", reason: "Conference", status: "Pending" },
  { id: "#003", date: "15 Feb, 2024", requester: "David Lee", vehicle: "Truck", driver: "William Davis", pickup: "Location E", destination: "Location F", reason: "Cargo Transport", status: "Declined" },
  { id: "#004", date: "17 Feb, 2024", requester: "John Doe", vehicle: "Sedan", driver: "Michael Smith", pickup: "Location A", destination: "Location B", reason: "Business Trip", status: "Accepted" },
  { id: "#005", date: "19 Feb, 2024", requester: "Alice Johnson", vehicle: "SUV", driver: "Robert Brown", pickup: "Location C", destination: "Location D", reason: "Conference", status: "Accepted" },
  { id: "#006", date: "21 Feb, 2024", requester: "David Lee", vehicle: "Truck", driver: "William Davis", pickup: "Location E", destination: "Location F", reason: "Cargo Transport", status: "Declined" }
];

export default function RequestTrackingPage() {
  return (
    <div className="max-w-7xl w-full mx-auto py-6 px-4">
      <h2 className="text-2xl font-semibold text-[#043755]">Request Tracking</h2>
      <p className="text-gray-500 mb-4">Monitor your vehicle requests.</p>
      
      {/* Stats Containers */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6 md:w-2/3">
        <div className="bg-white text-[#043755] p-4 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold">Total Requests</h3>
          <p className="text-2xl font-bold">{requests.length}</p>
        </div>
        <div className="bg-green-100 text-[#043755] p-4 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold">Accepted Requests</h3>
          <p className="text-2xl font-bold">{requests.filter(r => r.status === "Accepted").length}</p>
        </div>
        <div className="bg-red-100 text-[#043755] p-4 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold">Declined Requests</h3>
          <p className="text-2xl font-bold">{requests.filter(r => r.status === "Declined").length}</p>
        </div>
      </div>
      
      {/* Requests Table */}
      <div className="bg-white p-6 rounded-lg shadow-md overflow-x-auto">
        <table className="w-full min-w-[800px] border-collapse">
          <thead>
            <tr className="bg-gray-100 text-left text-[#043755]">
              <th className="p-2">Request ID</th>
              <th className="p-2">Date</th>
              <th className="p-2">Requester</th>
              <th className="p-2">Vehicle</th>
              <th className="p-2">Driver</th>
              <th className="p-2">Pickup</th>
              <th className="p-2">Destination</th>
              <th className="p-2">Reason</th>
              <th className="p-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((req) => (
              <tr key={req.id} className="border-t text-[#043755]">
                <td className="p-2">{req.id}</td>
                <td className="p-2">{req.date}</td>
                <td className="p-2">{req.requester}</td>
                <td className="p-2">{req.vehicle}</td>
                <td className="p-2">{req.driver}</td>
                <td className="p-2">{req.pickup}</td>
                <td className="p-2">{req.destination}</td>
                <td className="p-2">{req.reason}</td>
                <td className="p-2 font-semibold">
                  <span className={
                    req.status === "Accepted" ? "text-green-600" 
                    : req.status === "Declined" ? "text-red-600" 
                    : "text-yellow-500"
                  }>
                    {req.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
