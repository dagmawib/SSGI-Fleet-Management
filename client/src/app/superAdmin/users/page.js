"use client";
import { useState, useEffect, useRef, use } from "react";
import { useTranslations } from "next-intl";
import EditUserModal from "@/components/superAdmin/editModal";
import DeleteConfirmModal from "@/components/superAdmin/removeUserModal";
import CircularProgress from "@mui/material/CircularProgress";
import { Icon } from "@iconify/react";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';


const capitalizeFirstLetters = (str) => {
  if (!str) return '';
  return str
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

export default function SuperAdminUsersPage() {
  const t = useTranslations("regeisteredUsers");
  const [currentPage, setCurrentPage] = useState(1);
  const [usersData, setUsersData] = useState([]); // full user list
  const [paginatedUsers, setPaginatedUsers] = useState([]); // current page users
  const [totalPages, setTotalPages] = useState(
    Math.ceil(usersData.length / 10)
  );
  const [loading, setLoading] = useState(false);
  const [editLoadingId, setEditLoadingId] = useState(null);
  const [deleteLoadingId, setDeleteLoadingId] = useState(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const [openMenu, setOpenMenu] = useState(null);
  const buttonRef = useRef(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [department, setDepartment] = useState([])

  const toggleMenu = (userId, event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setMenuPosition({ top: rect.bottom + 8, left: rect.right });
    setOpenMenu(openMenu === userId ? null : userId);
  };

  // handlers
  const handleEdit = (user) => {
    setSelectedUser(user);
    setEditModalOpen(true);
  };

  const confirmDelete = async (userId) => {
    setDeleteLoadingId(userId); 
  
    try {
      const res = await fetch("/api/removeUser", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: userId }), // ✅ use userId passed to the function
      });
  
      if (res.ok) {
        setUsersData((prev) => prev.filter((u) => u.id !== userId)); // ✅ filter using userId
        toast.success("User deleted successfully!", {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
      } else {
        const error = await res.json();
        toast.error(error.message || "Failed to delete user!", {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error("Something went wrong while deleting the user!", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    } finally {
      setDeleteLoadingId(null);
      setDeleteModalOpen(false);
    }
  };
  



  const usersPerPage = 10; // Number of users per page

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const response = await fetch("/api/get_all_users");
        if (!response.ok) throw new Error("Failed to fetch users");
        const data = await response.json();
        setUsersData(data);
        setTotalPages(Math.ceil(data.length / usersPerPage));
      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  useEffect(() => {
    const fetchDepartment = async () => {
      setLoading(true);
      try {
        const response = await fetch("/api/get_departments");
        if (!response.ok) throw new Error("Failed to fetch users");
        const data = await response.json();
        setDepartment(data);
      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDepartment();
  }, []);

  // Paginate the users
  useEffect(() => {
    const offset = (currentPage - 1) * usersPerPage;
    const paginated = usersData.slice(offset, offset + usersPerPage);
    setPaginatedUsers(paginated);
  }, [currentPage, usersData]);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-2">
      <ToastContainer />
      <h1 className="text-2xl font-bold text-[#043755] mt-6">{t("title")}</h1>
      <div className="bg-white rounded-lg shadow mt-4">
        <div className="overflow-x-auto rounded-lg">
          <table className="w-full table-auto border-collapse rounded-lg">
            <thead className="bg-[#043755] text-white">
              <tr>
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
                  Departemtn
                </th>
                <th className="px-4 py-2 text-left font-semibold border-b">
                  {t("role")}
                </th>
                <th className="px-4 py-2 text-left font-semibold border-b">
                  {t("action")}
                </th>
              </tr>
            </thead>
            {loading ? (
              <tbody>
                <tr>
                  <td colSpan="6" className="text-center py-4">
                    <CircularProgress size={24} color="inherit" />
                  </td>
                </tr>
              </tbody>
            ) : (
              <tbody>
                {paginatedUsers.map((user) => (
                  <tr key={user.id} className="border-b">
                    <td className="px-4 py-2 text-[#043755]">{user.email}</td>
                    <td className="px-4 py-2 text-[#043755]">
                      {capitalizeFirstLetters(user.first_name)}
                    </td>
                    <td className="px-4 py-2 text-[#043755]">
                      {capitalizeFirstLetters(user.last_name)}
                    </td>
                    <td className="px-4 py-2 text-[#043755]">
                      {capitalizeFirstLetters(user.department?.name) || ""}
                    </td>
                    <td className="px-4 py-2 text-[#043755]">{capitalizeFirstLetters(user.role)}</td>
                    {/* Action Dropdown */}
                    <td className="px-4 py-2 text-[#043755]">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(user)}
                          disabled={editLoadingId === user.id}
                          className="p-1 text-[#043755] hover:bg-gray-100 rounded-full transition-colors flex items-center justify-center min-w-[32px] min-h-[32px]"
                          title={t("edit")}
                        >
                          {editLoadingId === user.id ? (
                            <CircularProgress size={20} color="inherit" />
                          ) : (
                            <Icon icon="mdi:pencil" width={20} height={20} />
                          )}
                        </button>
                        <button
                          variant="destructive"
                          size="icon"
                          onClick={() => confirmDelete(user.id)}

                          disabled={deleteLoadingId === user.id}
                          className="p-1 text-red-600 hover:bg-red-50 rounded-full transition-colors flex items-center justify-center min-w-[32px] min-h-[32px]"
                        >
                          {deleteLoadingId === user.id ? (
                            <CircularProgress size={20} color="inherit" />
                          ) : (
                            <Icon
                              icon="mdi:delete"
                              width={20}
                              height={20}
                            />
                          )}
                        </button>

                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            )}
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="my-4 flex flex-row items-center text-[#043755] justify-center space-x-4">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1 || loading}
            className="border border-[#043755] cursor-pointer px-4 py-2 rounded flex items-center justify-center min-w-[100px] disabled:opacity-50"
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
            disabled={currentPage === totalPages || loading}
            className="border border-[#043755] cursor-pointer px-4 py-2 rounded flex items-center justify-center min-w-[100px] disabled:opacity-50"
          >

            {t("next")}

          </button>
        </div>
      </div>
      <EditUserModal
        user={selectedUser}
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        departments={department}
        onSave={async (updatedUser) => {
          setEditLoadingId(selectedUser.id);
          try {
            const res = await fetch(`/api/updateUserData`, {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                ...updatedUser,
                id: selectedUser.id,
                department: updatedUser.department,
              }),
            });

            if (res.ok) {
              const updated = await res.json();
              setUsersData((prev) =>
                prev.map((user) =>
                  user.id === selectedUser.id ? { ...user, ...updated } : user
                )
              );
              toast.success("User updated successfully!", {
                position: "top-right",
                autoClose: 3000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
              });
              setEditModalOpen(false);
            } else {
              const error = await res.json();
              toast.error(error.message || "Failed to update user!", {
                position: "top-right",
                autoClose: 3000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
              });
              console.error("Update failed:", error);
            }
          } catch (err) {
            toast.error("Something went wrong while updating the user!", {
              position: "top-right",
              autoClose: 3000,
              hideProgressBar: false,
              closeOnClick: true,
              pauseOnHover: true,
              draggable: true,
            });
            console.error("Error updating user:", err);
          } finally {
            setEditLoadingId(null);
          }
        }}
      />


      <DeleteConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
