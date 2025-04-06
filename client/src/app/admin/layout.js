import React from "react";
import Navbar from "@/components/admin/common/navbar"; // Ensure this path is correct

export default function AdminLayout({ children }) {
  return (
    <>
      <Navbar />
      <div className="">{children}</div>
    </>
  );
}
