"use client";
import { useState } from "react";
import { Icon } from "@iconify/react";
import Image from "next/image";

const userData = {
  user_id: 1,
  username: "johndoe",
  email: "johndoe@example.com",
  first_name: "John",
  last_name: "Doe",
  phone_number: "+1234567890",
  department: "IT",
  role: "admin",
  is_active: true,
  password: "johndoe123",
};

export default function ProfilePage() {
  const [passwordVisible, setPasswordVisible] = useState(false);

  return (
    <div className="max-w-7xl xxl:max-w-[1600px] w-full mx-auto p-6 bg-white shadow-md rounded-lg my-4">
      <h2 className="text-2xl font-semibold text-[#043755]">Account</h2>
      <p className="text-[#043755]">Manage your profile information.</p>

      <div className="mt-4 flex items-center space-x-4">
        <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center">
          <Image
            src="/images/profile2.jpg"
            alt="User profile"
            width={80}
            height={80}
            className="object-cover rounded-full"
          />
        </div>
        <div>
          <button className="text-[#043755]">Upload new picture</button>
          <button className="text-red-500 ml-4">Delete</button>
        </div>
      </div>

      <div className="mt-6">
        <label className="text-[#043755]">Full Name</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-1">
          <input
            type="text"
            value={userData.first_name}
            className="border text-[#043755] p-2 rounded w-full"
            readOnly
          />
          <input
            type="text"
            value={userData.last_name}
            className="border text-[#043755] p-2 rounded w-full"
            readOnly
          />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-[#043755]">Username</label>
          <input
            type="text"
            value={userData.username}
            className="border text-[#043755] p-2 rounded w-full mt-1"
            readOnly
          />
        </div>
        <div>
          <label className="text-[#043755]">Email</label>
          <div className="flex items-center border text-[#043755] p-2 rounded mt-1">
            <Icon icon="mdi:email-outline" className="text-[#043755] mr-2" />
            <input
              type="email"
              value={userData.email}
              className="w-full text-[#043755]"
              readOnly
            />
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-[#043755]">Phone Number</label>
          <input
            type="text"
            value={userData.phone_number}
            className="border text-[#043755] p-2 rounded w-full mt-1"
            readOnly
          />
        </div>
        <div>
          <label className="text-[#043755]">Department</label>
          <input
            type="text"
            value={userData.department}
            className="border text-[#043755] p-2 rounded w-full mt-1"
            readOnly
          />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-[#043755]">Role</label>
          <input
            type="text"
            value={userData.role}
            className="border text-[#043755] p-2 rounded w-full mt-1"
            readOnly
          />
        </div>
        <div>
          <label className="text-[#043755]">Account Status</label>
          <input
            type="text"
            value={userData.is_active ? "Active" : "Inactive"}
            className="border text-[#043755] p-2 rounded w-full mt-1"
            readOnly
          />
        </div>
      </div>

      <div className="mt-6">
        <label className="text-[#043755]">Password</label>
        <div className="flex items-center border text-[#043755] p-2 rounded mt-1">
          <input
            type={passwordVisible ? "text" : "password"}
            value={userData.password}
            className="w-full text-[#043755]"
            readOnly
          />
          <button onClick={() => setPasswordVisible(!passwordVisible)}>
            <Icon
              icon={passwordVisible ? "mdi:eye-off-outline" : "mdi:eye-outline"}
              className="text-[#043755] ml-2"
            />
          </button>
        </div>
      </div>

      <div className="mt-6 flex justify-end space-x-4">
        <button
          type="submit"
          className="w-full bg-[#043755] text-white py-2 rounded-lg hover:bg-opacity-90 transition"
        >
          Update profile
        </button>
      </div>
    </div>
  );
}
