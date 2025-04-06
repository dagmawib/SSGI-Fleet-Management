const mockHistory = [
    {
      id: 1,
      assignedDate: '2025-04-01',
      requester: 'Liya Mekonnen',
      vehicle: 'Toyota Corolla - AB1234',
      driver: 'Tsegaye Assefa',
      approver: 'Daniel Kebede',
      department: 'Finance',
    },
    {
      id: 2,
      assignedDate: '2025-04-03',
      requester: 'Samuel Getachew',
      vehicle: 'Hyundai Tucson - CD5678',
      driver: 'Mulugeta Yohannes',
      approver: 'Marta Alemu',
      department: 'HR',
    },
  ];
  
  export default function HistoryTable() {
    return (
      <div className="overflow-auto bg-white rounded-lg shadow border max-w-7xl xxl:max-w-[1600px] w-full mx-auto">
        <table className="min-w-full table-auto text-sm">
          <thead className="bg-[#043755] text-white">
            <tr>
              <th className="px-4 py-3 text-left">Assigned Date</th>
              <th className="px-4 py-3 text-left">Requester</th>
              <th className="px-4 py-3 text-left">Vehicle</th>
              <th className="px-4 py-3 text-left">Driver</th>
              <th className="px-4 py-3 text-left">Approver</th>
              <th className="px-4 py-3 text-left">Department</th>
            </tr>
          </thead>
          <tbody>
            {mockHistory.map((entry) => (
              <tr
                key={entry.id}
                className="border-t hover:bg-gray-50 transition text-[#043755]"
              >
                <td className="px-4 py-3">{entry.assignedDate}</td>
                <td className="px-4 py-3">{entry.requester}</td>
                <td className="px-4 py-3">{entry.vehicle}</td>
                <td className="px-4 py-3">{entry.driver}</td>
                <td className="px-4 py-3">{entry.approver}</td>
                <td className="px-4 py-3">{entry.department}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
  