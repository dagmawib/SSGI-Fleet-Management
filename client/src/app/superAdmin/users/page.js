"use client";
import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";

// Static users data defined directly inside the component
const usersData = [
  {
    id: 1,
    username: "user1",
    email: "user1@example.com",
    firstName: "John",
    lastName: "Doe",
    role: "admin",
  },
  {
    id: 2,
    username: "user2",
    email: "user2@example.com",
    firstName: "Jane",
    lastName: "Smith",
    role: "user",
  },
  {
    id: 3,
    username: "user3",
    email: "user3@example.com",
    firstName: "Tom",
    lastName: "Johnson",
    role: "driver",
  },
  {
    id: 4,
    username: "user4",
    email: "user4@example.com",
    firstName: "Alice",
    lastName: "Williams",
    role: "employee",
  },
  {
    id: 5,
    username: "user5",
    email: "user5@example.com",
    firstName: "Bob",
    lastName: "Brown",
    role: "admin",
  },
  {
    id: 6,
    username: "user6",
    email: "user6@example.com",
    firstName: "Charlie",
    lastName: "Davis",
    role: "user",
  },
  {
    id: 7,
    username: "user7",
    email: "user7@example.com",
    firstName: "David",
    lastName: "Miller",
    role: "employee",
  },
  {
    id: 8,
    username: "user8",
    email: "user8@example.com",
    firstName: "Eve",
    lastName: "Wilson",
    role: "driver",
  },
  {
    id: 9,
    username: "user9",
    email: "user9@example.com",
    firstName: "Frank",
    lastName: "Moore",
    role: "admin",
  },
  {
    id: 10,
    username: "user10",
    email: "user10@example.com",
    firstName: "Grace",
    lastName: "Taylor",
    role: "user",
  },
];

export default function SuperAdminUsersPage() {
  const t = useTranslations("regeisteredUsers");
  const [users, setUsers] = useState(usersData);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(
    Math.ceil(usersData.length / 10)
  );
  const [loading, setLoading] = useState(false);
  const [openMenu, setOpenMenu] = useState(null);

  const handleEdit = (user) => {
    console.log("Edit", user);
    // Add your edit logic here
  };

  const handleRemove = (userId) => {
    console.log("Remove", userId);
    // Add your remove logic here
  };

  const toggleMenu = (userId) => {
    setOpenMenu(openMenu === userId ? null : userId); // Toggle menu visibility
  };

  const usersPerPage = 10; // Number of users per page

  // Paginate the users
  useEffect(() => {
    setLoading(true);
    const offset = (currentPage - 1) * usersPerPage;
    const paginatedUsers = usersData.slice(offset, offset + usersPerPage);
    setUsers(paginatedUsers);
    setLoading(false);
  }, [currentPage]);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-2">
      <h1 className="text-2xl font-bold text-[#043755] mt-6">{t("title")}</h1>
      <div className="bg-white rounded-lg shadow mt-4">
        {loading ? (
          <div className="text-center text-gray-500">{t("loading")}</div>
        ) : (
          <div className="overflow-x-auto rounded-lg">
            <table className="w-full table-auto border-collapse rounded-lg">
              <thead className="bg-[#043755] text-white">
                <tr>
                  <th className="px-4 py-2 text-left font-semibold border-b">
                    {t("username")}
                  </th>
                  <th className="px-4 py-2 text-left font-semibold border-b">
                    {t("email")}
                  </th>
                  <th className="px-4 py-2 text-left font-semibold border-b">
                    {t("firstName")}
                  </th>
                  <th className="px-4 py-2 text-left font-semibold border-b">
                    {t("lastName")}
                  </th>
                  <th className="px-4 py-2 text-left font-semibold border-b">
                    {t("role")}
                  </th>
                  <th className="px-4 py-2 text-left font-semibold border-b">
                    {t("action")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b">
                    <td className="px-4 py-2 text-[#043755]">
                      {user.username}
                    </td>
                    <td className="px-4 py-2 text-[#043755]">{user.email}</td>
                    <td className="px-4 py-2 text-[#043755]">
                      {user.firstName}
                    </td>
                    <td className="px-4 py-2 text-[#043755]">
                      {user.lastName}
                    </td>
                    <td className="px-4 py-2 text-[#043755]">{user.role}</td>

                    {/* Action Dropdown */}
                    <td className="px-4 py-2 text-[#043755]">
                      <div className="relative inline-block text-left">
                        <button
                          type="button"
                          onClick={() => toggleMenu(user.id)}
                          className="inline-flex justify-center w-full rounded-md border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none"
                          id="menu-button"
                          aria-expanded={
                            openMenu === user.id ? "true" : "false"
                          }
                          aria-haspopup="true"
                        >
                          <span className="sr-only">Open options</span>
                          {/* Vertical Dots */}
                          <svg
                            className="w-5 h-5 text-gray-600"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M6 12h12M6 6h12M6 18h12"
                            />
                          </svg>
                        </button>

                        {/* Dropdown Menu (conditionally rendered) */}
                        {openMenu === user.id && (
                          <div
                            className="origin-top-right absolute z-50 right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none"
                            role="menu"
                            aria-orientation="vertical"
                            aria-labelledby="menu-button"
                          >
                            <div className="py-1" role="none">
                              <button
                                onClick={() => handleEdit(user)}
                                className="text-gray-700 block px-4 py-2 text-sm"
                                role="menuitem"
                              >
                                {t("edit")}
                              </button>
                              <button
                                onClick={() => handleRemove(user.id)}
                                className="text-gray-700 block px-4 py-2 text-sm"
                                role="menuitem"
                              >
                                {t("remove")}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {/* Pagination Controls */}
        <div className="my-4 flex flex-row items-center text-[#043755] justify-center space-x-4">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="border border-[#043755] cursor-pointer px-4 py-2 rounded disabled:opacity-50"
          >
            {t("previous")}
          </button>
          <div className="flex items-center space-x-2">
            <span>
              {t("page")} {currentPage} {t("of")} {totalPages}
            </span>
          </div>
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="border border-[#043755] cursor-pointer px-4 py-2 rounded disabled:opacity-50"
          >
            {t("next")}
          </button>
        </div>
      </div>
    </div>
  );
}
