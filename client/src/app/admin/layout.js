"use client";
import React, { useEffect } from "react";
import Navbar from "@/components/admin/common/navbar"; // Ensure this path is correct
import { isAuthenticated } from "@/utils/auth";
import { useRouter } from "next/navigation";

export default function AdminLayout({ children }) {
  const router = useRouter();
  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/");
    }
  }, [router]);

  return (
    <>
      <Navbar />
      <div className="">{children}</div>
    </>
  );
}
