import React from "react";
import Navbar from "@/components/superAdmin/common/Navbar";

export default function SuperAdminLayout({ children }) {
  return (
    <>
      <Navbar />
      <div className="">{children}</div>
    </>
  );
}
